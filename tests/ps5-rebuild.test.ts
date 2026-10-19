import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import type { ModelTools } from '../lib/hardware.ts';
import { digitalDefinitions } from '../lib/digital/catalogue.ts';
import { ps5RebuildGeometry, finBanks } from '../lib/digital/ps5-rebuild.ts';
import { disposeModelResources } from '../lib/model-stage.ts';

const tools = {
  material: (c: string, m = 0.3, r = 0.5) =>
    new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r }),
  box: (s: [number, number, number], c: string) =>
    new T.Mesh(
      new T.BoxGeometry(...s),
      new T.MeshStandardMaterial({ color: c }),
    ),
} as unknown as ModelTools;
const definition = (id: string) => digitalDefinitions.find((d) => d.id === id)!;
function build(level: 'ps5-power' | 'ps5cooling', id: string) {
  const p = definition(level).parts.find((p) => p.id === id)!;
  const object = ps5RebuildGeometry(level, p, tools)!;
  object.position.set(...p.pos);
  object.updateMatrixWorld(true);
  return object;
}
const dispose = (root: T.Group) => disposeModelResources({ root, pieces: [] });
function meshes(root: T.Group) {
  const out: T.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof T.Mesh) out.push(o);
  });
  return out;
}

await test('PS5 power housing, board and dielectric share a bent silhouette and registered supports', () => {
  const roots = ['housing', 'pcb', 'insulator'].map((id) =>
    build('ps5-power', id),
  );
  try {
    const pcb = roots[1];
    const hit = (x: number, z: number) =>
      new T.Raycaster(
        new T.Vector3(x, 50, z),
        new T.Vector3(0, -1, 0),
      ).intersectObject(pcb, true).length;
    assert.ok(hit(-10, 60) > 0, 'narrow end of PCB missing');
    assert.equal(hit(20, 60), 0, 'legacy rectangular corner still present');
    assert.equal(hit(-26, -77), 0, 'support hole is filled');
    const supports = meshes(roots[0]).filter((m) => m.name === 'pcb-standoff');
    assert.equal(supports.length, 4);
    for (const s of supports)
      assert.ok(
        Math.abs(new T.Box3().setFromObject(s).max.y - -25.8) < 1e-4,
        'PCB must rest on standoff, not float',
      );
    assert.ok(
      new T.Box3().setFromObject(roots[2]).max.y <
        new T.Box3().setFromObject(pcb).min.y,
    );
  } finally {
    roots.forEach(dispose);
  }
});

await test('PS5 cover vents are empty through holes and large capacitors are horizontal', () => {
  const cover = build('ps5-power', 'cover'),
    bulk = build('ps5-power', 'bulk');
  try {
    const ray = (x: number, z: number) =>
      new T.Raycaster(
        new T.Vector3(x, 60, z),
        new T.Vector3(0, -1, 0),
      ).intersectObject(cover, true);
    assert.equal(ray(-23, -70).length, 0, 'vent is covered by a solid face');
    assert.ok(ray(-30, -70).length > 0, 'cover perimeter missing');
    assert.equal(
      meshes(bulk).filter((m) => m.name === 'horizontal-bulk-capacitor').length,
      2,
    );
    const b = new T.Box3().setFromObject(bulk).getSize(new T.Vector3());
    assert.ok(b.z > b.y, 'capacitors are still upright');
  } finally {
    dispose(cover);
    dispose(bulk);
  }
});

await test('all 94 PS5 fin sheets have clearance around the six actual heatpipe surfaces', () => {
  const fins = build('ps5cooling', 'fins'),
    pipes = build('ps5cooling', 'pipes');
  try {
    assert.equal(
      meshes(fins).length,
      finBanks.reduce((n, b) => n + b.count, 0),
    );
    assert.equal(meshes(pipes).length, 6);
    const matrix = new T.Matrix4();
    for (const fin of meshes(fins)) {
      const tree = new MeshBVH(fin.geometry);
      for (const pipe of meshes(pipes)) {
        matrix.copy(fin.matrixWorld).invert().multiply(pipe.matrixWorld);
        assert.ok(
          !tree.intersectsGeometry(pipe.geometry, matrix),
          'a pipe passes through an uncut fin surface',
        );
      }
    }
  } finally {
    dispose(fins);
    dispose(pipes);
  }
});

await test('PS5 heatpipes do not cross each other on their way to the fin banks', () => {
  const pipes = build('ps5cooling', 'pipes');
  try {
    const list = meshes(pipes),
      matrix = new T.Matrix4();
    for (let i = 0; i < list.length; i++) {
      const a = list[i],
        tree = new MeshBVH(a.geometry);
      for (let j = i + 1; j < list.length; j++) {
        matrix.copy(a.matrixWorld).invert().multiply(list[j].matrixWorld);
        assert.ok(
          !tree.intersectsGeometry(list[j].geometry, matrix),
          `heatpipes ${i + 1}/${j + 1} intersect`,
        );
      }
    }
  } finally {
    dispose(pipes);
  }
});

await test('welded cooling stays assembled; power components lift clear before lateral separation', () => {
  for (const id of ['base', 'fins', 'pipes', 'coldplate', 'brackets'])
    assert.deepEqual(
      definition('ps5cooling').parts.find((p) => p.id === id)!.delta,
      [0, 0, 0],
      id,
    );
  for (const id of ['input', 'bulk', 'transformer', 'secondary', 'output']) {
    const path = definition('ps5-power').parts.find((p) => p.id === id)!.path!;
    assert.ok(path.length >= 4, id);
    assert.deepEqual(
      path[2].offset.slice(0, 1),
      [0],
      `${id} moves sideways before clearing wall`,
    );
    assert.ok(path[2].offset[1] >= 65, id);
  }
});
