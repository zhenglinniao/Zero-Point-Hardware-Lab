import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

type Field = (x: number, y: number, z: number) => number;
const cache = new Map<string, T.BufferGeometry>();
const blend = (a: number, b: number, k: number) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
};
function roundedBox(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number,
  r: number,
) {
  const qx = Math.abs(x) - a + r,
    qy = Math.abs(y) - b + r,
    qz = Math.abs(z) - c + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
    Math.min(Math.max(qx, qy, qz), 0) -
    r
  );
}
function capsule(
  x: number,
  y: number,
  z: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  r: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    dz = bz - az;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) /
        (dx * dx + dy * dy + dz * dz),
    ),
  );
  return Math.hypot(x - ax - dx * t, y - ay - dy * t, z - az - dz * t) - r;
}

/** Static, closed, thin-wall mouldings. The field is sampled only once per
 * shape; clones have independent GPU ownership. No live marching-cube object
 * or field buffer is retained in the rendered model. Millimetre coordinates. */
function surface(
  key: string,
  bounds: [number, number, number],
  field: Field,
  resolution = 88,
) {
  const cached = cache.get(key);
  if (cached) return cached.clone();
  const material = new T.MeshBasicMaterial();
  const marching = new MarchingCubes(
    resolution,
    material,
    false,
    false,
    160000,
  );
  marching.isolation = 0;
  for (let z = 0; z < resolution; z++)
    for (let y = 0; y < resolution; y++)
      for (let x = 0; x < resolution; x++)
        marching.field[x + y * resolution + z * resolution * resolution] =
          -field(
            ((x / resolution) * 2 - 1) * bounds[0],
            ((y / resolution) * 2 - 1) * bounds[1],
            ((z / resolution) * 2 - 1) * bounds[2],
          );
  marching.update();
  if (marching.count >= 160000 * 3)
    throw new Error(`Moulding buffer exceeded: ${key}`);
  const geometry = new T.BufferGeometry();
  for (const name of ['position', 'normal']) {
    const attr = marching.geometry.getAttribute(name);
    geometry.setAttribute(
      name,
      new T.Float32BufferAttribute(
        Array.from(attr.array.slice(0, marching.count * 3)),
        3,
      ),
    );
  }
  geometry.scale(...bounds);
  const p = geometry.getAttribute('position');
  const normals = new Float32Array(p.count * 3);
  const normal = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      e = 0.015;
    normal
      .set(
        field(x + e, y, z) - field(x - e, y, z),
        field(x, y + e, z) - field(x, y - e, z),
        field(x, y, z + e) - field(x, y, z - e),
      )
      .normalize();
    normal.toArray(normals, i * 3);
  }
  geometry.setAttribute('normal', new T.BufferAttribute(normals, 3));
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / (bounds[0] * 2) + 0.5;
    uv[i * 2 + 1] = p.getZ(i) / (bounds[2] * 2) + 0.5;
  }
  geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
  geometry.computeBoundingBox();
  marching.geometry.dispose();
  material.dispose();
  cache.set(key, geometry);
  return geometry.clone();
}

export function cameraGrip() {
  return surface('camera-grip', [19, 43, 28], (x, y, z) => {
    const outer = blend(
      roundedBox(x, y + 2, z + 2, 14.5, 37, 17, 9),
      capsule(x, y, z, -1, -23, 11, -3, 22, 15, 10),
      5,
    );
    const cavity = roundedBox(x, y + 4, z + 3, 10.7, 29, 12, 4);
    return Math.max(outer, -cavity, -z - 16);
  });
}

export function earbudShell(open: boolean, cap = false) {
  return surface(`earbud-${open}-${cap}`, [12, 18, 12], (x, y, z) => {
    // A swollen acoustic head joins a short, flattened stem without a seam of
    // intersecting boxes. Cavity opens towards the driver on the service side.
    const head =
      (Math.hypot(x / 8.2, (y - 5) / 7.5, (z + 0.8) / 8.3) - 1) * 7.5;
    const stem = capsule(x * 1.2, y, z, 2.3, -12, 5, 2.3, 3, 5, 2.7);
    const body = blend(head, stem, 2.5);
    let shell = Math.max(body, -(body + 1.0));
    if (open) shell = Math.max(shell, cap ? 7.25 - y : y - 7.2);
    return shell;
  });
}

export function chargingCase(
  lid: boolean,
  width: number,
  height: number,
  depth: number,
) {
  return surface(
    `case-${lid}-${width}-${height}`,
    [width / 2 + 2, height / 2 + 2, depth / 2 + 2],
    (x, y, z) => {
      const r = Math.min(9, height / 2 - 0.3, depth / 2 - 0.3);
      const outer = roundedBox(x, y, z, width / 2, height / 2, depth / 2, r);
      const inner = roundedBox(
        x,
        y + (lid ? -1.8 : 1.8),
        z,
        width / 2 - 1.5,
        height / 2,
        depth / 2 - 1.5,
        Math.max(1, r - 1.3),
      );
      return Math.max(outer, -inner);
    },
  );
}
