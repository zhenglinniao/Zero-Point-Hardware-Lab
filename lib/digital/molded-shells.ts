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

/** Photo-referenced silhouette; curvature and wall offsets are illustrative,
 * not measurements from manufacturing CAD. */
export function controllerDistance(x: number, y: number, z: number) {
  const centre = roundedBox(x, y, z + 6, 60, 17.5, 40, 14);
  const handle = capsule(Math.abs(x), y, z, 52, -1, 0, 62, -5, 33, 16.5);
  return blend(centre, handle, 10);
}
export function controllerShell(top: boolean) {
  return surface(
    `controller-${top}`,
    [87, 28, 58],
    (x, y, z) => {
      const body = controllerDistance(x, y, z);
      let shell = Math.max(body, -(body + 1.9), top ? -y + 0.18 : y + 0.18);
      if (top) {
        for (const side of [-1, 1]) {
          shell = Math.max(shell, -(Math.hypot(x - side * 28, z - 12) - 10.4));
          // D-pad opening is a cross; action keys have separate circular bores.
          if (side < 0)
            shell = Math.max(
              shell,
              -Math.min(
                roundedBox(x + 46, 0, z + 18, 11, 50, 3.5, 1),
                roundedBox(x + 46, 0, z + 18, 3.5, 50, 11, 1),
              ),
            );
          else
            for (let i = 0; i < 4; i++) {
              const a = (i * Math.PI) / 2;
              shell = Math.max(
                shell,
                -(
                  Math.hypot(
                    x - 46 - Math.sin(a) * 8,
                    z + 18 - Math.cos(a) * 8,
                  ) - 4.25
                ),
              );
            }
        }
        shell = Math.max(shell, -roundedBox(x, 0, z + 22, 26.5, 50, 14.5, 4));
      }
      return Math.max(
        shell,
        -roundedBox(Math.abs(x) - 54, y, z + 41, 13, 30, 8, 3),
      );
    },
    128,
  );
}

/** Surface-following black centre fascia, with pierced thumbstick openings. */
export function controllerFascia() {
  const cached = cache.get('fascia-smooth');
  if (cached) return cached.clone();
  const shape = new T.Shape();
  shape.moveTo(-40, -9);
  shape.lineTo(40, -9);
  shape.lineTo(40, 20);
  shape.quadraticCurveTo(40, 23, 37, 25);
  shape.lineTo(14, 31);
  shape.quadraticCurveTo(0, 33, -14, 31);
  shape.lineTo(-37, 25);
  shape.quadraticCurveTo(-40, 23, -40, 20);
  shape.closePath();
  for (const side of [-1, 1]) {
    const hole = new T.Path();
    hole.absarc(side * 28, 12, 10.4, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const flat = new T.ShapeGeometry(shape, 64).toNonIndexed();
  const source = flat.getAttribute('position');
  const positions: number[] = [],
    uv: number[] = [],
    normals: number[] = [];
  const normal = new T.Vector3();
  const vertex = (x: number, z: number) => {
    let lo = 0,
      hi = 30;
    for (let n = 0; n < 18; n++) {
      const y = (lo + hi) / 2;
      if (controllerDistance(x, y, z) < 0) lo = y;
      else hi = y;
    }
    const y = (lo + hi) / 2,
      e = 0.01;
    positions.push(x, y + 0.28, z);
    uv.push(x / 80 + 0.5, z / 45);
    normal
      .set(
        controllerDistance(x + e, y, z) - controllerDistance(x - e, y, z),
        controllerDistance(x, y + e, z) - controllerDistance(x, y - e, z),
        controllerDistance(x, y, z + e) - controllerDistance(x, y, z - e),
      )
      .normalize();
    normals.push(...normal.toArray());
  };
  const split = (a: T.Vector2, b: T.Vector2, c: T.Vector2, iteration = 0) => {
    const lengths = [
      a.distanceToSquared(b),
      b.distanceToSquared(c),
      c.distanceToSquared(a),
    ];
    const longest = Math.max(...lengths);
    if (longest > 5 && iteration < 14) {
      const edge = lengths.indexOf(longest);
      const [p, q, r] =
        edge === 0 ? [a, b, c] : edge === 1 ? [b, c, a] : [c, a, b];
      const m = p.clone().add(q).multiplyScalar(0.5);
      split(p, m, r, iteration + 1);
      split(m, q, r, iteration + 1);
    } else {
      vertex(a.x, a.y);
      vertex(c.x, c.y);
      vertex(b.x, b.y);
    }
  };
  for (let i = 0; i < source.count; i += 3)
    split(
      new T.Vector2(source.getX(i), source.getY(i)),
      new T.Vector2(source.getX(i + 1), source.getY(i + 1)),
      new T.Vector2(source.getX(i + 2), source.getY(i + 2)),
    );
  flat.dispose();
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  cache.set('fascia-smooth', geo);
  return geo.clone();
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

export function earbudShell(open: boolean) {
  return surface(`earbud-${open}`, [12, 18, 12], (x, y, z) => {
    // A swollen acoustic head joins a short, flattened stem without a seam of
    // intersecting boxes. Cavity opens towards the driver on the service side.
    const head =
      (Math.hypot(x / 8.2, (y - 5) / 7.5, (z + 0.8) / 8.3) - 1) * 7.5;
    const stem = capsule(x * 1.2, y, z, 2.3, -12, 5, 2.3, 3, 5, 2.7);
    const body = blend(head, stem, 2.5);
    let shell = Math.max(body, -(body + 1.0));
    if (open) shell = Math.max(shell, y - 7.2);
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
