import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { horizontalSection } from './mesh-section.ts';

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

/** Continuous front/body shell, open at the rear. Local origin is the front
 * assembly origin (installed at world Z +6 mm). Battery clearance uses the
 * NP-FZ100's 22.7 x 51.7 x 38.7 mm installed orientation. */
export function cameraFrontField(x: number, y: number, z: number) {
  const body = roundedBox(x + 10, y, z + 8.25, 54, 40, 25.25, 6);
  const grip = blend(
    roundedBox(x - 46, y + 5, z + 3.75, 16.5, 37, 29.75, 8),
    capsule(x, y, z, 46, -24, 17, 43, 20, 21, 11),
    4,
  );
  const outer = blend(body, grip, 5);
  const interior = Math.min(
    roundedBox(x + 10, y, z + 11, 51, 37, 25, 3),
    roundedBox(x - 46, y + 6, z + 5.75, 12, 33, 29.75, 1.2),
  );
  const mount = Math.hypot(x + 8, y) - 27.5;
  return Math.max(outer, -interior, -mount, y - 35.4, -40.4 - y);
}

export function cameraFrontShell() {
  return surface('camera-front-continuous-v2', [68, 44, 39], cameraFrontField);
}

export function earbudOuterField(x: number, y: number, z: number) {
  const head = (Math.hypot(x / 8.2, (y - 5) / 7.5, (z + 0.8) / 8.3) - 1) * 7.5;
  const stem = capsule((x - 2.3) * 1.2, y, z, 0, -15.5, 5, 0, 3, 5, 2.7);
  const neck = capsule(x, y, z, 0, 6, -7, 0, 6, -9.8, 2.8);
  return blend(blend(head, stem, 2.5), neck, 1);
}
export function earbudShell(open: boolean, cap = false) {
  const sectionKey = `earbud-section-v4-${cap}`;
  if (open && cache.has(sectionKey)) return cache.get(sectionKey)!.clone();
  const whole = surface(
    'earbud-whole-v4',
    [12, 20, 15],
    (x, y, z) => {
      // A swollen acoustic head joins a short, flattened stem without a seam of
      // intersecting boxes. Cavity opens towards the driver on the service side.
      const body = earbudOuterField(x, y, z);
      let shell = Math.max(body, -(body + 1.0));
      const bore = Math.max(Math.hypot(x, y - 6) - 2.0, z + 7.5);
      shell = Math.max(shell, -bore);
      return shell;
    },
    128,
  );
  if (!open) return whole;
  const section = horizontalSection(whole, cap ? 7.25 : 7.2, cap);
  whole.dispose();
  cache.set(sectionKey, section);
  return section.clone();
}

export function chargingCase(
  lid: boolean,
  width: number,
  height: number,
  depth: number,
) {
  // Both parts are sections of ONE 45.2 mm body. Analytic rings preserve the
  // 1.2 mm wall and clean seam; a voxel grid cannot resolve this thin rim.
  const total = 45.2,
    wall = 1.2,
    seam = lid ? 9.5 : 9.3;
  const centre = lid ? seam + height / 2 : seam - height / 2;
  const positions: number[] = [],
    indices: number[] = [];
  const segments = 192,
    steps = 56;
  function ring(y: number, inside: boolean) {
    const inset = inside ? wall : 0;
    const radius = 10 - inset,
      halfY = total / 2 - inset;
    const q = Math.max(0, Math.abs(y) - (halfY - radius));
    const r = Math.sqrt(Math.max(0.000001, radius * radius - q * q));
    const a = width / 2 - inset - radius,
      b = depth / 2 - inset - radius;
    for (let i = 0; i < segments; i++) {
      const quadrant = Math.floor(i / 48);
      const theta = ((quadrant + (i % 48) / 47) * Math.PI) / 2;
      const sx = quadrant === 1 || quadrant === 2 ? -1 : 1;
      const sz = quadrant >= 2 ? -1 : 1;
      positions.push(
        sx * a + r * Math.cos(theta),
        y - centre,
        sz * b + r * Math.sin(theta),
      );
    }
  }
  const extreme = lid ? total / 2 : -total / 2;
  for (let k = 0; k <= steps; k++)
    ring(extreme + ((seam - extreme) * k) / steps, false);
  for (let k = 0; k <= steps; k++)
    ring(seam + ((extreme - (lid ? wall : -wall) - seam) * k) / steps, true);
  const rings = 2 * (steps + 1);
  for (let k = 0; k < rings - 1; k++)
    for (let i = 0; i < segments; i++) {
      const a = k * segments + i,
        b = k * segments + ((i + 1) % segments),
        c = b + segments,
        d = a + segments;
      if (lid) indices.push(a, b, c, a, c, d);
      else indices.push(a, c, b, a, d, c);
    }
  // The ends are planar, tiny rounded rectangles; close both floor surfaces.
  for (const [row, flip] of [
    [0, lid],
    [rings - 1, !lid],
  ] as const) {
    const centerIndex = positions.length / 3;
    positions.push(0, positions[row * segments * 3 + 1], 0);
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i,
        b = row * segments + ((i + 1) % segments);
      if (flip) indices.push(centerIndex, b, a);
      else indices.push(centerIndex, a, b);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
