import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel } from '../lib/models.ts';
import { disposeModelResources } from '../lib/model-stage.ts';
const previous = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, k) =>
            k === 'createImageData'
              ? (w: number, h: number) => ({
                  data: new Uint8ClampedArray(w * h * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
after(() => {
  globalThis.document = previous;
});

await test('TUF 5090 final cooler and backplate fit 348 × 146 × 72 mm rather than testing a nominal depth constant', () => {
  const m = buildModel('card'),
    mm = 348 / 8.93;
  try {
    m.root.updateMatrixWorld(true);
    const body = new T.Box3(),
      complete = new T.Box3();
    for (const p of m.pieces) {
      const bounds = new T.Box3().setFromObject(p.object);
      complete.union(bounds);
      if (p.concept === 'shroud' || p.concept === 'backplate')
        body.union(bounds);
    }
    const b = body.getSize(new T.Vector3()).multiplyScalar(mm),
      c = complete.getSize(new T.Vector3()).multiplyScalar(mm);
    assert.ok(Math.abs(b.x - 348) < 1, `cooler length ${b.x}`);
    assert.ok(Math.abs(b.z - 146) < 1.1, `cooler width ${b.z}`);
    assert.ok(Math.abs(b.y - 72) < 0.1, `cooler thickness ${b.y}`);
    assert.ok(Math.abs(c.y - 72) < 0.1, `other parts exceed thickness: ${c.y}`);
    // Separate mounting tabs / PCIe fingers from the manufacturer's body envelope.
    assert.ok(c.x < 354 && c.z < 154, `bracket/fingers ${c.toArray().join(",")}`);
  } finally {
    disposeModelResources(m);
  }
});

