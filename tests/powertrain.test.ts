import './model-assets.ts';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { buildModel } from '../lib/models.ts';
import {
  digitalDefinitions,
  type DigitalLevel,
} from '../lib/digital/catalogue.ts';
import {
  GX,
  LEAF,
  radialAirGap,
  pistonPinHeight,
  gxRingAngles,
  gxCoverBolts,
  leafWirePoint,
  gxPushrodTopY,
  gxPushrodBottomY,
} from '../lib/powertrain/dimensions.ts';
import { powertrainDefinitions } from '../lib/powertrain/catalogue.ts';
import {
  disposeModelResources,
  applyPiecePose,
  ModelStageScratch,
} from '../lib/model-stage.ts';
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
function separate(a: T.BufferGeometry, b: T.BufferGeometry, label: string) {
  const tree = new MeshBVH(a);
  (b as T.BufferGeometry & { boundsTree: MeshBVH }).boundsTree = new MeshBVH(b);
  assert.equal(tree.intersectsGeometry(b, new T.Matrix4()), false, label);
  a.dispose();
  b.dispose();
}
await test('published GX160 and LEAF dimension anchors stay consistent', () => {
  assert.ok(
    Math.abs((((Math.PI * GX.bore ** 2) / 4) * GX.stroke) / 1000 - 163.4256) <
      0.001,
  );
  assert.ok(Math.abs(radialAirGap - 0.495) < 1e-10);
  assert.equal(LEAF.slots / (LEAF.poles * LEAF.phases), 2);
  assert.equal(GX.camTeeth / GX.crankTeeth, 2);
  assert.ok(GX.pistonDiameter < GX.bore && GX.pistonDiameter >= 67.985);
  assert.ok(GX.pinDiameter >= 17.994 && GX.pinDiameter <= 18);
  assert.ok(
    GX.rodBore - GX.crankpinDiameter >= 0.04 &&
      GX.rodBore - GX.crankpinDiameter <= 0.063,
  );
  for (let i = 0; i < 360; i++) {
    const y = pistonPinHeight((i * Math.PI) / 180);
    assert.ok(Number.isFinite(y));
  }
  assert.equal(pistonPinHeight(0) - pistonPinHeight(Math.PI), 45);
});
await test('powertrain models use explicit selectable parts and per-model evidence boundaries', () => {
  for (const d of powertrainDefinitions) {
    assert.ok(d.accuracy?.includes('重建'));
    assert.ok(d.parts.length >= 2);
    for (const p of d.parts) {
      assert.ok(p.description.length >= 10);
      assert.ok(p.purpose.length >= 10);
    }
  }
  const s = powertrainDefinitions.find((d) => d.id === 'ev-stator')!;
  for (const prefix of ['liner-', 'wedge-', 'conductor-'])
    assert.equal(s.parts.filter((p) => p.id.startsWith(prefix)).length, 48);
  assert.equal(s.parts.filter((p) => p.id.startsWith('endturn-')).length, 24);
});
await test('actual rotor and stator surfaces leave an open working air gap', () => {
  const rotor = surface('ev-rotor', 'core'),
    stator = surface('ev-stator', 'core');
  rotor.computeBoundingBox();
  stator.computeBoundingBox();
  assert.ok(Math.abs(rotor.boundingBox!.max.x - LEAF.rotorOD / 2) < 0.0001);
  assert.ok(Math.abs(stator.boundingBox!.max.x - LEAF.statorOD / 2) < 0.0001);
  assert.ok(
    Math.abs(rotor.boundingBox!.getSize(new T.Vector3()).z - LEAF.rotorStack) <
      0.0001,
  );
  separate(rotor, stator, 'rotor iron intersects the stator bore');
});
await test('pins, guides and bearing rolling elements fit their actual surrounding surfaces', () => {
  separate(
    surface('engine-piston', 'piston'),
    surface('engine-piston', 'pin'),
    'piston pin crosses piston material',
  );
  for (const i of [0, 1])
    separate(
      surface('engine-head', `valve-${i}`),
      surface('engine-head', `guide-${i}`),
      'valve stem crosses guide',
    );
  for (let i = 1; i <= 10; i++)
    for (const ring of ['inner', 'outer', 'cage'])
      separate(
        surface('ev-bearing', `ball-${i}`),
        surface('ev-bearing', ring),
        `ball ${i} crosses ${ring}`,
      );
});
await test('slot conductors, insulation and wedges occupy separate solids', () => {
  for (const i of [1, 7, 13, 25, 48]) {
    separate(
      surface('ev-stator', `conductor-${i}`),
      surface('ev-stator', 'core'),
      `slot ${i} copper crosses iron`,
    );
    separate(
      surface('ev-stator', `conductor-${i}`),
      surface('ev-stator', `liner-${i}`),
      `slot ${i} copper crosses insulation`,
    );
    separate(
      surface('ev-stator', `wedge-${i}`),
      surface('ev-stator', 'core'),
      `slot ${i} wedge crosses iron`,
    );
  }
});
await test('rotor extraction finishes before sideways stator movement begins', () => {
  const model = models.get('evmotor')!,
    scratch = new ModelStageScratch();
  const rotor = model.pieces.find((p) => p.concept === 'ev-rotor')!,
    stator = model.pieces.find((p) => p.concept === 'ev-stator')!;
  for (const amount of [0.2, 0.35, 0.5, 0.55, 0.7, 0]) {
    applyPiecePose(rotor, 'evmotor', amount, scratch);
    applyPiecePose(stator, 'evmotor', amount, scratch);
    if (amount <= 0.55) assert.ok(Math.abs(stator.object.position.y) < 1e-9);
    if (amount >= 0.35) assert.ok(rotor.object.position.z * 40 >= 310);
  }
  assert.ok(rotor.object.position.length() < 1e-9);
});

await test('dual-layer magnet groups fit the actual cut-outs in the rotor iron', () => {
  const definition = powertrainDefinitions.find((d) => d.id === 'ev-rotor')!;
  assert.equal(
    definition.parts.filter((p) => p.id.startsWith('magnet-')).length,
    32,
  );
  for (let i = 1; i <= 32; i++)
    separate(
      surface('ev-rotor', 'core'),
      surface('ev-rotor', `magnet-${i}`),
      `magnet group ${i} crosses iron`,
    );
});
await test('axial extraction keeps the assembled motor core and water jacket apart', () => {
  const model = models.get('evmotor')!,
    scratch = new ModelStageScratch();
  // Geometry uses native mm. Sample translation differences on both trees,
  // including all instanced copper strands, before the inventory layout begins.
  for (const [left, right] of [
    ['ev-rotor', 'ev-stator'],
    ['ev-housing', 'ev-stator'],
  ] as const) {
    const a = surface('evmotor', left),
      b = surface('evmotor', right),
      tree = new MeshBVH(a);
    (b as T.BufferGeometry & { boundsTree: MeshBVH }).boundsTree = new MeshBVH(
      b,
    );
    const pa = model.pieces.find((p) => p.concept === left)!,
      pb = model.pieces.find((p) => p.concept === right)!;
    for (let percent = 0; percent <= 70; percent += 2) {
      applyPiecePose(pa, 'evmotor', percent / 100, scratch);
      applyPiecePose(pb, 'evmotor', percent / 100, scratch);
      const relative = pb.object.position
        .clone()
        .sub(pb.base)
        .sub(pa.object.position.clone().sub(pa.base))
        .multiplyScalar(40);
      assert.equal(
        tree.intersectsGeometry(
          b,
          new T.Matrix4().makeTranslation(relative.x, relative.y, relative.z),
        ),
        false,
        `${left}/${right} at ${percent}%`,
      );
    }
    applyPiecePose(pa, 'evmotor', 0, scratch);
    applyPiecePose(pb, 'evmotor', 0, scratch);
    a.dispose();
    b.dispose();
  }
});

await test('engine chamber and cylinder clear their installed rotating and sliding parts', () => {
  separate(
    surface('engine-crank', 'crankshaft'),
    surface('engine-crank', 'rod'),
    'crankshaft crosses the connecting rod',
  );
  separate(
    surface('engine-crank', 'crankshaft'),
    surface('engine-crank', 'cap'),
    'crankshaft crosses the big-end cap',
  );
  separate(
    surface('engine-block', 'case'),
    surface('engine-crank', 'crankshaft'),
    'crankshaft crosses the crankcase',
  );
  separate(
    surface('engine-block', 'case'),
    surface('engine-timing', 'cam-gear'),
    'timing gear crosses crankcase',
  );
  separate(
    surface('engine-cylinder', 'liner'),
    surface('engine-piston', 'piston').translate(0, GX.pinY, 0),
    'piston skirt crosses liner',
  );
  for (const i of [0, 1])
    separate(
      surface('engine-cylinder', 'barrel'),
      surface('engine-timing', `pushrod-${i}`),
      'pushrod crosses barrel or cooling fins',
    );
});

await test('review regressions: valves and stator slot parts clear their surrounding solids throughout sampled extraction', () => {
  const scratch = new ModelStageScratch();
  const pairs: [DigitalLevel, string, string][] = [
    ['engine-head', 'head', 'valve-0'],
    ['engine-head', 'head', 'valve-1'],
    ...[1, 13, 25, 37].flatMap((i) =>
      ['conductor', 'liner', 'endturn'].map(
        (prefix) =>
          [
            'ev-stator',
            'core',
            prefix + '-' + (prefix === 'endturn' ? Math.floor(i / 2) + 1 : i),
          ] as [DigitalLevel, string, string],
      ),
    ),
  ];
  for (const [level, left, right] of pairs) {
    const a = surface(level, left),
      b = surface(level, right),
      tree = new MeshBVH(a);
    (b as T.BufferGeometry & { boundsTree: MeshBVH }).boundsTree = new MeshBVH(
      b,
    );
    const model = models.get(level)!,
      pa = model.pieces.find((p) => p.concept === level + '-' + left)!,
      pb = model.pieces.find((p) => p.concept === level + '-' + right)!;
    for (let percent = 0; percent <= 70; percent += 2) {
      applyPiecePose(pa, level, percent / 100, scratch);
      applyPiecePose(pb, level, percent / 100, scratch);
      const d = pb.object.position
        .clone()
        .sub(pb.base)
        .sub(pa.object.position.clone().sub(pa.base))
        .multiplyScalar(digitalDefinitions.find((x) => x.id === level)!.unit);
      assert.equal(
        tree.intersectsGeometry(
          b,
          new T.Matrix4().makeTranslation(d.x, d.y, d.z),
        ),
        false,
        `${level}/${left}/${right} at ${percent}%`,
      );
    }
    applyPiecePose(pa, level, 0, scratch);
    applyPiecePose(pb, level, 0, scratch);
    a.dispose();
    b.dispose();
  }
});

await test('GX deck, oil rail gaps and registered cover holes follow the shared assembly datums', () => {
  const piston = surface('engine-piston', 'piston');
  piston.computeBoundingBox();
  assert.ok(
    Math.abs(
      GX.deckY - (piston.boundingBox!.max.y + GX.pinY) - GX.deckClearance,
    ) < 1e-5,
  );
  piston.dispose();
  assert.ok(
    ((gxRingAngles.oilLower - gxRingAngles.oilUpper) * GX.pistonDiameter) / 2 >=
      10,
  );
  const cover = powertrainDefinitions.find((d) => d.id === 'engine-cover')!;
  for (let i = 0; i < gxCoverBolts.length; i++)
    assert.deepEqual(
      cover.parts.find((p) => p.id === `cover-bolt-${i + 1}`)!.pos.slice(0, 2),
      gxCoverBolts[i],
    );
});

await test('integral short block uses section viewing instead of dragging the piston through the barrel', () => {
  const model = models.get('engine')!,
    scratch = new ModelStageScratch();
  for (const id of [
    'engine-block',
    'engine-cylinder',
    'engine-crank',
    'engine-timing',
  ]) {
    const part = model.pieces.find((p) => p.concept === id)!;
    applyPiecePose(part, 'engine', 0.45, scratch);
    assert.ok(part.object.position.distanceTo(part.base) < 1e-9);
    if (id === 'engine-block' || id === 'engine-cylinder')
      assert.equal(part.object.visible, false);
    applyPiecePose(part, 'engine', 0, scratch);
    assert.equal(part.object.visible, true);
  }
});

await test('coolant ports penetrate the outer wall and retain the isolated inner liner', () => {
  const jacket = models
    .get('ev-housing')!
    .pieces.find((p) => p.concept === 'ev-housing-jacket')!;
  models.get('ev-housing')!.root.updateMatrixWorld(true);
  const ray = new T.Raycaster();
  for (const z of [-55, 55]) {
    ray.set(new T.Vector3(0, 135 / 30, z / 30), new T.Vector3(0, -1, 0));
    const hits = ray.intersectObject(jacket.object, true);
    assert.ok(hits.length > 0);
    assert.ok(
      hits[0].point.y < 0,
      'port is blocked by the positive-Y jacket wall',
    );
  }
  const shell = models
    .get('ev-housing')!
    .pieces.find((p) => p.concept === 'ev-housing-shell')!;
  ray.set(new T.Vector3(0, 107 / 30, -55 / 30), new T.Vector3(0, -1, 0));
  assert.ok(
    ray.intersectObject(shell.object, true)[0].point.y > 100 / 30,
    'coolant would leak into the stator bore',
  );
});

await test('winding endpoints reuse the same physical slot coordinates as the straight copper strands', () => {
  for (const coil of powertrainDefinitions
    .find((d) => d.id === 'ev-stator')!
    .parts.filter((p) => p.id.startsWith('conductor-'))) {
    const slot = Number(coil.id.split('-')[1]) - 1;
    for (const hand of [0, 10, 19])
      for (const turn of [0, 5]) {
        const a = leafWirePoint(slot, hand, turn, -LEAF.statorStack / 2),
          b = leafWirePoint(slot, hand, turn, LEAF.statorStack / 2);
        assert.equal(a[0], b[0]);
        assert.equal(a[1], b[1]);
        assert.equal(b[2] - a[2], LEAF.statorStack);
      }
  }
});

await test('pushrod ball ends meet the tappet and rocker contact datums in the installed head', () => {
  for (const i of [0, 1]) {
    const rod = surface('engine-timing', `pushrod-${i}`),
      tappet = surface('engine-timing', `tappet-${i}`),
      rocker = surface('engine-head', `rocker-${i}`);
    rod.computeBoundingBox();
    tappet.computeBoundingBox();
    rocker.computeBoundingBox();
    assert.ok(Math.abs(rod.boundingBox!.min.y - (gxPushrodBottomY - 3)) < 1e-4);
    assert.ok(
      Math.abs(rod.boundingBox!.min.y - tappet.boundingBox!.max.y) < 1e-4,
      'lower ball end floats above the tappet',
    );
    assert.ok(Math.abs(rod.boundingBox!.max.y - (gxPushrodTopY + 3)) < 1e-4);
    assert.ok(
      Math.abs(
        rod.boundingBox!.max.y -
          (rocker.boundingBox!.min.y + GX.deckY + GX.headGasket),
      ) < 1e-4,
      'upper ball end misses the installed rocker',
    );
    rod.dispose();
    tappet.dispose();
    rocker.dispose();
  }
});
