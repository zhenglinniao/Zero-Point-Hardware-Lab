// Read-only audit probe; reproduces selected findings, not a passing regression test.
import '../../tests/model-assets.ts';
import { after } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { buildModel } from '../../lib/models.ts';
import {
  digitalDefinitions,
  type DigitalLevel,
} from '../../lib/digital/catalogue.ts';
import { powertrainDefinitions } from '../../lib/powertrain/catalogue.ts';
import {
  disposeModelResources,
  applyPiecePose,
  ModelStageScratch,
} from '../../lib/model-stage.ts';
const previous = globalThis.document;
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
const models = new Map(
  powertrainDefinitions.map((d) => [d.id, buildModel(d.id)]),
);
after(() => {
  models.forEach(disposeModelResources);
  globalThis.document = previous;
});
function surface(level: DigitalLevel, id: string) {
  const model = models.get(level)!;
  model.root.updateMatrixWorld(true);
  const p = model.pieces.find(
    (p) => p.concept === id || p.concept === `${level}-${id}`,
  )!;
  assert.ok(p, id);
  const unit = digitalDefinitions.find((d) => d.id === level)!.unit,
    geometries: T.BufferGeometry[] = [];
  p.object.traverse((o) => {
    if (!(o instanceof T.Mesh) || o.material instanceof T.MeshBasicMaterial)
      return;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', o.geometry.getAttribute('position').clone());
    if (o.geometry.index) geo.setIndex(o.geometry.index.clone());
    if (o instanceof T.InstancedMesh) {
      const m = new T.Matrix4();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        geometries.push(
          geo
            .clone()
            .applyMatrix4(m)
            .applyMatrix4(o.matrixWorld)
            .scale(unit, unit, unit),
        );
      }
      geo.dispose();
    } else {
      geo.applyMatrix4(o.matrixWorld).scale(unit, unit, unit);
      geometries.push(geo);
    }
  });
  const normalized = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const geometry = mergeGeometries(normalized)!;
  normalized.forEach((g) => {
    if (!geometries.includes(g)) g.dispose();
  });
  geometries.forEach((g) => g.dispose());
  return geometry;
}

const audit = [];
const scratch = new ModelStageScratch();
for (const [level, aId, bId] of [
  ['ev-stator', 'core', 'conductor-1'],
  ['ev-stator', 'core', 'liner-1'],
  ['ev-stator', 'core', 'endturn-1'],
  ['ev-rotor', 'core', 'magnet-1'],
  ['engine-head', 'head', 'valve-0'],
  ['engine-head', 'head', 'valve-1'],
] as [DigitalLevel, string, string][]) {
  const model = models.get(level)!,
    a = surface(level, aId),
    b = surface(level, bId),
    tree = new MeshBVH(a);
  (b as T.BufferGeometry & { boundsTree: MeshBVH }).boundsTree = new MeshBVH(b);
  const pa = model.pieces.find((p) => p.concept === level + '-' + aId)!,
    pb = model.pieces.find((p) => p.concept === level + '-' + bId)!;
  const collisions = [];
  for (let percent = 0; percent <= 70; percent += 5) {
    applyPiecePose(pa, level, percent / 100, scratch);
    applyPiecePose(pb, level, percent / 100, scratch);
    const delta = pb.object.position
      .clone()
      .sub(pb.base)
      .sub(pa.object.position.clone().sub(pa.base))
      .multiplyScalar(digitalDefinitions.find((d) => d.id === level)!.unit);
    if (
      tree.intersectsGeometry(
        b,
        new T.Matrix4().makeTranslation(delta.x, delta.y, delta.z),
      )
    )
      collisions.push(percent);
  }
  applyPiecePose(pa, level, 0, scratch);
  applyPiecePose(pb, level, 0, scratch);
  a.dispose();
  b.dispose();
  audit.push({ level, aId, bId, collisions });
}
console.log(JSON.stringify(audit, null, 2));
