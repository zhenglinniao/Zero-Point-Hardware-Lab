import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import {
  airflowLevels,
  airflowShown,
  airflowStrength,
  hasAirflow,
} from '../lib/airflow.ts';
import { initialState } from '../lib/explorer-state.ts';
import { levelIds, type LevelId } from '../lib/levels.ts';

// The same canvas stub the geometry tests use: the builders draw their labels
// through it, and none of this needs a WebGL context.
const previousDocument = globalThis.document;
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
  globalThis.document = previousDocument;
});

const models = new Map(levelIds.map((level) => [level, buildModel(level)]));

type Tick = (seconds: number, strength: number) => void;

/** Every airflow group in a model, including any inside an installed assembly. */
function airflowGroups(root: T.Object3D) {
  const groups: T.Object3D[] = [];
  root.traverse((object) => {
    if (object.userData.airflowTick) groups.push(object);
  });
  return groups;
}

function run(group: T.Object3D, seconds: number, strength: number) {
  (group.userData.airflowTick as Tick)(seconds, strength);
}

/** Where every chevron is, and which way it points, in world space. */
function chevrons(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const found: { position: T.Vector3; forward: T.Vector3 }[] = [];
  for (const group of airflowGroups(root))
    for (const mesh of group.children) {
      if (!(mesh instanceof T.InstancedMesh)) continue;
      const matrix = new T.Matrix4();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        matrix.premultiply(mesh.matrixWorld);
        found.push({
          position: new T.Vector3().setFromMatrixPosition(matrix),
          forward: new T.Vector3(0, 0, 1).transformDirection(matrix),
        });
      }
    }
  return found;
}

/** What the named parts of a scale occupy, ignoring scenery. */
function machineBounds(pieces: Piece[]) {
  const bounds = new T.Box3();
  for (const p of pieces) {
    const centre = p.base.clone().add(p.center),
      half = p.extent.clone().multiplyScalar(0.5);
    bounds.expandByPoint(centre.clone().add(half));
    bounds.expandByPoint(centre.clone().sub(half));
  }
  return bounds;
}

await test('every scale with a fan shows where its air goes, and no other scale does', () => {
  const drawn = levelIds.filter(
    (level) => airflowGroups(models.get(level)!.root).length > 0,
  );
  // The stage tools disable the control from `airflowLevels`, so a scale that
  // grows a fan without being listed would offer a button that does nothing.
  assert.deepEqual([...drawn].sort(), [...airflowLevels].sort());
  for (const level of levelIds)
    assert.equal(
      hasAirflow(level),
      drawn.includes(level),
      level + ' disagrees about whether it moves air',
    );
});

await test('the installed graphics card brings its own airflow into the tower', () => {
  // The card is the one part whose air is not authored by `machine.ts`: it is
  // installed as the complete card assembly, turned over, and its streams turn
  // over with it. Losing that would quietly leave the card not breathing.
  const card = models.get('card')!;
  const pc = models.get('pc')!;
  assert.equal(airflowGroups(card.root).length, 1);
  assert.equal(airflowGroups(pc.root).length, 2, 'the tower and the card');
  const installed = pc.pieces.find((p) => p.concept === 'graphicscard')!;
  assert.equal(
    airflowGroups(installed.object).length,
    1,
    'the card assembly kept its airflow',
  );
});

await test('airflow is scenery: never a part, and never answers the cursor', () => {
  for (const level of airflowLevels) {
    const { root, pieces } = models.get(level)!;
    const groups = airflowGroups(root);
    const owned = new Set<T.Object3D>();
    for (const p of pieces) owned.add(p.object);
    for (const group of groups) {
      assert.equal(
        group.userData.contextFrame,
        true,
        level + ': airflow must be marked as scenery',
      );
      assert.ok(
        !owned.has(group),
        level + ': airflow is registered as a selectable part',
      );
      run(group, 0, 1);
      for (const mesh of group.children) {
        if (!(mesh instanceof T.InstancedMesh)) continue;
        // Fired straight down the middle of the stream, from far enough out to
        // cross every chevron on it.
        const matrix = new T.Matrix4();
        mesh.getMatrixAt(0, matrix);
        const at = new T.Vector3().setFromMatrixPosition(matrix);
        const hits: T.Intersection[] = [];
        for (const axis of [
          new T.Vector3(1, 0, 0),
          new T.Vector3(0, 1, 0),
          new T.Vector3(0, 0, 1),
        ]) {
          const from = at.clone().addScaledVector(axis, 500);
          mesh.raycast(
            new T.Raycaster(from, axis.clone().negate(), 0, 1000),
            hits,
          );
        }
        assert.equal(
          hits.length,
          0,
          level + ': an airflow chevron can be pointed at',
        );
      }
    }
  }
});

await test('the machine you arrive at is quiet, and every other scale is not', () => {
  // What a viewer meets first: a sealed tower, undisturbed.
  assert.equal(
    airflowShown(initialState.airflow, initialState.level),
    false,
    'the explorer opens with airflow drawn over the assembled machine',
  );
  for (const level of levelIds)
    assert.equal(
      airflowShown('auto', level),
      hasAirflow(level) && level !== 'pc',
      level + ' disagrees about what it should do on its own',
    );
  // Having said either way, that holds wherever there is air to show.
  for (const level of airflowLevels) {
    assert.equal(airflowShown('on', level), true, level);
    assert.equal(airflowShown('off', level), false, level);
  }
  // And says nothing where there is none: asking for it on the motherboard
  // must not switch on a control that has nothing to draw.
  assert.equal(airflowShown('on', 'motherboard'), false);
});

await test('the arrows leave as soon as the machine opens', () => {
  assert.equal(airflowStrength(0), 1, 'assembled, airflow is fully shown');
  assert.equal(airflowStrength(0.1), 0, 'a tenth open, it is gone');
  assert.equal(airflowStrength(1), 0);
  assert.ok(
    airflowStrength(0.04) > 0 && airflowStrength(0.04) < 1,
    'it fades rather than switching',
  );
  let previous = 1;
  for (let i = 0; i <= 100; i++) {
    const strength = airflowStrength(i / 100);
    assert.ok(strength <= previous + 1e-9, 'airflow never comes back');
    assert.ok(strength >= 0 && strength <= 1);
    previous = strength;
  }
});

await test('chevrons march along their path, and stop dead when told to', () => {
  for (const level of airflowLevels) {
    const { root } = models.get(level)!;
    const groups = airflowGroups(root);
    for (const group of groups) run(group, 0, 1);
    const start = chevrons(root).map((c) => c.position.clone());
    for (const group of groups) run(group, 2.4, 1);
    const later = chevrons(root);
    assert.ok(start.length > 0, level + ': nothing to animate');
    assert.ok(
      start.every((p, i) => p.distanceTo(later[i].position) > 1e-6),
      level + ': the chevrons are not moving',
    );
    for (const { position, forward } of later) {
      assert.ok(
        Number.isFinite(position.x + position.y + position.z),
        level + ': a chevron went somewhere impossible',
      );
      assert.ok(
        Math.abs(forward.length() - 1) < 1e-3,
        level + ': a chevron points nowhere',
      );
    }
    for (const group of groups) {
      run(group, 3, 0);
      assert.equal(group.visible, false, level + ': airflow refused to hide');
      run(group, 3, 1);
      assert.equal(group.visible, true);
    }
  }
});

await test('air stays with the hardware it is describing', () => {
  // A stream deliberately starts outside the part, in front of an intake or
  // past an exhaust, so this is a sanity bound rather than a tight one: it is
  // here to catch a path authored in the wrong units or along the wrong axis,
  // which lands an order of magnitude away rather than a little outside.
  for (const level of airflowLevels) {
    const { root, pieces } = models.get(level)!;
    for (const group of airflowGroups(root)) run(group, 0.7, 1);
    const bounds = machineBounds(pieces);
    const size = bounds.getSize(new T.Vector3());
    const margin = Math.max(size.x, size.y, size.z) * 0.75;
    const allowed = bounds.clone().expandByScalar(margin);
    for (const { position } of chevrons(root))
      assert.ok(
        allowed.containsPoint(position),
        level +
          ': a chevron at ' +
          position.toArray().map((n) => n.toFixed(2)).join(', ') +
          ' is nowhere near the hardware',
      );
  }
});

await test("the tower's air enters at the front and leaves at the back", () => {
  const { root, pieces } = models.get('pc' as LevelId)!;
  const bounds = machineBounds(pieces);
  // Over a full cycle rather than one instant: at any one moment the ends of a
  // path may sit between two chevrons, and what is being claimed here is about
  // the path, not about a frame.
  const marks: { position: T.Vector3; forward: T.Vector3 }[] = [];
  for (let seconds = 0; seconds < 8.4; seconds += 0.6) {
    for (const group of airflowGroups(root)) run(group, seconds, 1);
    marks.push(...chevrons(root));
  }
  // +X is the front of the case, −X the rear panel.
  const ahead = marks.filter((c) => c.position.x > bounds.max.x);
  const behind = marks.filter((c) => c.position.x < bounds.min.x);
  assert.ok(ahead.length >= 3, 'no air is arriving at the front intakes');
  assert.ok(behind.length >= 2, 'no air is leaving at the back');
  for (const { forward } of ahead)
    assert.ok(
      forward.x < -0.5,
      'air outside the front panel is not heading into the machine',
    );
  for (const { forward } of behind)
    assert.ok(
      forward.x < -0.2,
      'air outside the rear panel is not heading away from the machine',
    );
});
