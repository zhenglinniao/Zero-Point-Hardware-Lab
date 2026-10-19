import './model-assets.ts';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { buildModel, type Piece } from '../lib/models.ts';
import {
  applyPiecePose,
  disposeModelResources,
  ModelStageScratch,
} from '../lib/model-stage.ts';
import type { LevelId } from '../lib/levels.ts';

const oldDocument = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, key) =>
            key === 'createImageData'
              ? (w: number, h: number) => ({
                  data: new Uint8ClampedArray(w * h * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
after(() => {
  globalThis.document = oldDocument;
});

function surfaces(pieces: Piece[]) {
  const result: {
    piece: Piece;
    mesh: T.Mesh;
    geometry: T.BufferGeometry;
    tree: MeshBVH;
    licensed: boolean;
  }[] = [];
  for (const piece of pieces)
    piece.object.traverse((mesh) => {
      if (
        !(mesh instanceof T.Mesh) ||
        mesh.material instanceof T.MeshBasicMaterial
      )
        return;
      let geometry = new T.BufferGeometry();
      geometry.setAttribute(
        'position',
        mesh.geometry.getAttribute('position').clone(),
      );
      if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index.clone());
      if (mesh instanceof T.InstancedMesh) {
        const instances: T.BufferGeometry[] = [],
          matrix = new T.Matrix4();
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, matrix);
          instances.push(geometry.clone().applyMatrix4(matrix));
        }
        geometry.dispose();
        geometry = mergeGeometries(instances)!;
        instances.forEach((g) => g.dispose());
      }
      const tree = new MeshBVH(geometry);
      (geometry as T.BufferGeometry & { boundsTree: MeshBVH }).boundsTree =
        tree;
      result.push({
        piece,
        mesh,
        geometry,
        tree,
        licensed: mesh.userData.assetAuthor === 'Taohid Animation',
      });
    });
  return result;
}

await test('controller shells, internals and expanded SMT instances stay separate during staged extraction', () => {
  for (const level of [
    'gamepad',
    'gamepad-leftstick',
    'gamepad-rightstick',
    'gamepad-triggers',
    'gamepad-right-trigger',
  ] as LevelId[]) {
    const model = buildModel(level);
    model.root.updateMatrixWorld(true);
    const shapes = surfaces(model.pieces),
      scratch = new ModelStageScratch(),
      matrix = new T.Matrix4();
    try {
      for (
        let percentage = 0;
        percentage <= 70;
        percentage += level === 'gamepad' ? 1 : 2
      ) {
        for (const piece of model.pieces)
          applyPiecePose(piece, level, percentage / 100, scratch);
        model.root.updateMatrixWorld(true);
        for (let i = 0; i < shapes.length; i++)
          for (let j = i + 1; j < shapes.length; j++) {
            const a = shapes[i],
              b = shapes[j];
            if (a.piece === b.piece) continue;
            // The licensed exterior contains pre-existing contacting seams,
            // wells and key caps. Never exempt an independently built internal.
            if (a.licensed && b.licensed) continue;
            matrix
              .copy(a.mesh.matrixWorld)
              .invert()
              .multiply(b.mesh.matrixWorld);
            assert.ok(
              !a.tree.intersectsGeometry(b.geometry, matrix),
              `${level} ${percentage}%: ${a.piece.concept}/${a.mesh.name || 'internal'} crosses ${b.piece.concept}/${b.mesh.name || 'internal'}`,
            );
          }
      }
    } finally {
      shapes.forEach((s) => s.geometry.dispose());
      disposeModelResources(model);
    }
  }
});

await test('input caps clear their apertures before sideways withdrawal and the rear tilt reverses exactly', () => {
  const model = buildModel('gamepad'),
    scratch = new ModelStageScratch();
  try {
    const back = model.pieces.find((p) => p.concept === 'gamepad-back')!,
      top = model.pieces.find((p) => p.concept === 'gamepad-top')!;
    for (const id of ['gamepad-buttons', 'gamepad-touch']) {
      const piece = model.pieces.find((p) => p.concept === id)!;
      applyPiecePose(piece, 'gamepad', 0.1, scratch);
      assert.equal(piece.object.position.z, piece.base.z);
      assert.ok(piece.object.position.y - piece.base.y > 20 / 18);
      applyPiecePose(piece, 'gamepad', 0.2, scratch);
      assert.ok(Math.abs(piece.object.position.z - piece.base.z) > 60 / 18);
    }
    applyPiecePose(top, 'gamepad', 0.2, scratch);
    assert.ok(top.object.position.equals(top.base));
    const rest = back.object.quaternion.clone();
    applyPiecePose(back, 'gamepad', 0.16, scratch);
    assert.ok(back.object.quaternion.angleTo(rest) > 1.5);
    applyPiecePose(back, 'gamepad', 0, scratch);
    assert.ok(back.object.position.distanceTo(back.base) < 1e-9);
    assert.ok(back.object.quaternion.angleTo(rest) < 1e-9);
  } finally {
    disposeModelResources(model);
  }
});
