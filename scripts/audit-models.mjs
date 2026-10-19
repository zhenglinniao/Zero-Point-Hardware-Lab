import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { installGamepadAsset } from '../lib/digital/gamepad-asset.ts';
import { preparePowertrainSolids } from '../lib/powertrain/cast-solids.ts';
await preparePowertrainSolids();
import { levelIds, systemRoot } from '../lib/levels.ts';
import { byId } from '../lib/manifest.ts';
import { buildModel } from '../lib/models.ts';
import {
  disposeModelResources,
  posedModelBounds,
  prepareModelInventory,
  applyPiecePose,
  ModelStageScratch,
} from '../lib/model-stage.ts';

// Geometry-only audit. Canvas pixels and appearance are verified separately in
// a browser; this canvas stub does not pretend to validate visual fidelity.
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () =>
        new Proxy(
          {},
          {
            get: (_, key) => {
              if (key === 'createImageData')
                return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
              if (key === 'measureText')
                return (value) => ({ width: String(value).length * 9 });
              if (
                key === 'createLinearGradient' ||
                key === 'createRadialGradient'
              )
                return () => ({ addColorStop() {} });
              return () => {};
            },
          },
        ),
    }),
  },
});
const bytes = readFileSync(
  new URL('../public/models/dualsense/dualsense.glb', import.meta.url),
);
await installGamepadAsset(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  true,
);
const totals = { levels: 0, poses: 0, pieces: 0, systems: {} };
for (const level of levelIds) {
  const model = buildModel(level);
  try {
    assert.ok(model.pieces.length > 0, level);
    prepareModelInventory(model, level, 1.5);
    for (const piece of model.pieces) {
      assert.ok(
        byId[piece.concept],
        `${level}: anonymous selectable component`,
      );
      let vertices = 0;
      (piece.batch ?? piece.object).traverse((object) => {
        if (!(object instanceof T.Mesh)) return;
        const attribute = object.geometry.getAttribute('position');
        assert.ok(attribute && attribute.count > 0, `${level}: empty mesh`);
        assert.ok(
          attribute.array.every(Number.isFinite),
          `${level}: invalid mesh coordinates`,
        );
        vertices += attribute.count;
      });
      assert.ok(vertices > 0, `${level}: ${piece.concept} contains no mesh`);
    }
    for (const amount of [0, 0.5, 1]) {
      for (const piece of model.pieces)
        applyPiecePose(piece, level, amount, new ModelStageScratch());
      const bounds = posedModelBounds(model, level, amount);
      assert.ok(
        !bounds.isEmpty() &&
          [...bounds.min.toArray(), ...bounds.max.toArray()].every(
            Number.isFinite,
          ),
        `${level}: invalid pose ${amount}`,
      );
      totals.poses++;
    }
    const scratch = new ModelStageScratch();
    for (const piece of model.pieces) {
      applyPiecePose(piece, level, 0, scratch);
      assert.ok(
        piece.object.position.distanceTo(piece.base) < 1e-7,
        `${level}: failed assembly reset`,
      );
    }
    totals.levels++;
    totals.pieces += model.pieces.length;
    const root = systemRoot(level);
    totals.systems[root] = (totals.systems[root] ?? 0) + 1;
  } finally {
    disposeModelResources(model);
  }
}
console.log(JSON.stringify(totals, null, 2));
