import * as T from 'three';
import type { powertrainSolids } from './solids.generated.ts';
type Solid = { position: Int16Array; normal: Int8Array; index: Uint16Array };
let solids: Map<keyof typeof powertrainSolids, Solid> | null = null;
let pending: Promise<void> | null = null;
export async function preparePowertrainSolids() {
  if (solids) return;
  if (!pending)
    pending = import('./solids.generated.ts')
      .then(async (module) => {
        const entries = await Promise.all(
          Object.entries(module.powertrainSolids).map(async ([id, data]) => {
            const bytes = Uint8Array.from(atob(data.data), (c) =>
              c.charCodeAt(0),
            );
            const stream = new Blob([bytes])
              .stream()
              .pipeThrough(new DecompressionStream('deflate'));
            const buffer = await new Response(stream).arrayBuffer();
            const p = data.positionBytes,
              n = data.normalBytes;
            return [
              id as keyof typeof powertrainSolids,
              {
                position: new Int16Array(buffer.slice(0, p)),
                normal: new Int8Array(buffer.slice(p, p + n)),
                index: new Uint16Array(buffer.slice(p + n)),
              },
            ] as const;
          }),
        );
        solids = new Map(entries);
      })
      .catch((error) => {
        pending = null;
        throw new Error(
          `动力模型资源加载失败：${error instanceof Error ? error.message : String(error)}`,
        );
      });
  await pending;
}

/** Baked closed boolean surfaces. Each owner receives disposable attributes. */
export function castSolid(id: keyof typeof powertrainSolids) {
  if (!solids) throw new Error('动力模型资源尚未加载，请先准备铸件资源。');
  const data = solids.get(id)!;
  const positions = Float32Array.from(data.position, (v) => v / 100);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  geometry.setAttribute(
    'normal',
    new T.Float32BufferAttribute(
      Float32Array.from(data.normal, (v) => v / 127),
      3,
    ),
  );
  geometry.setAttribute(
    'uv',
    new T.Float32BufferAttribute(
      new Float32Array((positions.length / 3) * 2),
      2,
    ),
  );
  geometry.setIndex(new T.BufferAttribute(data.index.slice(), 1));
  return geometry;
}
