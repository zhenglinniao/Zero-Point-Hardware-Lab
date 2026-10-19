import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fitCameraToBounds } from '../lib/stage-runtime.ts';

await test('narrow-screen exploded models can settle beyond the previous orbit limit and remain inside the frustum', () => {
  for (const aspect of [0.39, 0.65, 1.5]) {
    const camera = new T.PerspectiveCamera(32, aspect, 0.1, 200),
      position = new T.Vector3(),
      look = new T.Vector3(),
      controls = { maxDistance: 100 };
    const bounds = new T.Box3(
      new T.Vector3(-8, -5, -15),
      new T.Vector3(8, 10, 20),
    );
    fitCameraToBounds(
      bounds,
      camera,
      position,
      look,
      new T.Vector3(1.2, 0.8, 1.5),
      new T.Vector3(),
      1.1,
      6,
      controls,
    );
    const distance = position.distanceTo(look);
    assert.ok(controls.maxDistance > distance);
    if (aspect < 1)
      assert.ok(
        distance > 100,
        'regression must exercise the former orbit clamp',
      );
    camera.position.copy(position);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new T.Vector3(x, y, z).project(camera);
          assert.ok(
            Math.abs(point.x) < 1 &&
              Math.abs(point.y) < 1 &&
              point.z < 1 &&
              point.z > -1,
            'fitted corner was clipped',
          );
        }
  }
});
