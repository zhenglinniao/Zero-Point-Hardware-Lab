import * as T from 'three';
import type { DigitalLevel, DigitalPart } from './catalogue.ts';
import type { ModelTools } from '../hardware.ts';
import type { Vec3 } from '../layout.ts';

/** CFI-10xx topology reconstructed from iFixit's 2020 step 10 photographs.
 * The bends and component locations are photo estimates, not Delta factory CAD. */
export const psuOutline: [number, number][] = [
  [-31, -85],
  [31, -85],
  [31, -4],
  [7, 32],
  [7, 85],
  [-25, 85],
  [-25, 20],
  [-31, 8],
];
export const psuMounts: [number, number][] = [
  [-26, -77],
  [26, -77],
  [-20, 76],
  [2, 76],
];
export const finBanks = [
  { x0: -65, x1: -8, z0: -74, z1: -11, y0: 3, y1: 24, count: 32 },
  { x0: 8, x1: 65, z0: -74, z1: -11, y0: 3, y1: 24, count: 32 },
  { x0: 13, x1: 65, z0: 10, z1: 73, y0: 3, y1: 24, count: 30 },
];

export function ps5HeatpipeCurves() {
  return Array.from({ length: 6 }, (_, i) => {
    const left = i < 3,
      z = left ? -59 + i * 19 : i === 3 ? -49 : 28 + (i - 4) * 24;
    const start = new T.Vector3(-37 + i * 6, 26, 28 + i * 6);
    // Independent height lanes preserve clearance in the central spine.
    // The last lane can reuse the first height because their Z intervals differ.
    const y = [21, 17.2, 13.4, 9.6, 5.8, 21][i],
      sign = left ? -1 : 1;
    const p = new T.CurvePath<T.Vector3>();
    const a = new T.Vector3(0, y, start.z),
      b = new T.Vector3(0, y, z + Math.sign(start.z - z) * 5),
      c = new T.Vector3(sign * 6, y, z);
    p.add(new T.QuadraticBezierCurve3(start, new T.Vector3(0, 26, start.z), a));
    p.add(new T.LineCurve3(a, b));
    p.add(new T.QuadraticBezierCurve3(b, new T.Vector3(0, y, z), c));
    p.add(new T.LineCurve3(c, new T.Vector3(sign * 68, y, z)));
    return p;
  });
}

function outline(inset = 0) {
  // A parallel inset of this simple orthogonal/diagonal reconstruction.
  const s = new T.Shape();
  const points = psuOutline.map(([x, z]) => [
    x + (x < -10 ? inset : -inset),
    z + (z < 0 ? inset : -inset),
  ]);
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, z] of points.slice(1)) s.lineTo(x, z);
  s.closePath();
  return s;
}

/** Millimetre-space parts reused unchanged by the root PS5 and subsystem. */
export function ps5RebuildGeometry(
  level: DigitalLevel,
  part: DigitalPart,
  tools: ModelTools,
): T.Group | null {
  if (level !== 'ps5-power' && level !== 'ps5cooling') return null;
  if (
    level === 'ps5-power' &&
    ![
      'housing',
      'cover',
      'pcb',
      'bulk',
      'input',
      'secondary',
      'output',
      'insulator',
    ].includes(part.id)
  )
    return null;
  const g = new T.Group(),
    id = part.id;
  const mat = (color: string, metal = 0.3) => tools.material(color, metal, 0.5);
  const put = <O extends T.Object3D>(
    o: O,
    pos: Vec3 = [0, 0, 0],
    name = '',
  ) => {
    o.position.set(...pos);
    o.name = name;
    g.add(o);
    return o;
  };
  const box = (size: Vec3, color: string, pos: Vec3, name = '') =>
    put(tools.box(size, color, 0.35, Math.min(...size) * 0.08), pos, name);
  const circle = (x: number, z: number, r: number) =>
    new T.Path().absarc(x, z, r, 0, Math.PI * 2, false);
  const slab = (
    s: T.Shape,
    h: number,
    color: string,
    pos: Vec3 = [0, 0, 0],
    name = '',
  ) => {
    const geo = new T.ExtrudeGeometry(s, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 12,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, h / 2, 0);
    return put(new T.Mesh(geo, mat(color)), pos, name);
  };
  const cyl = (
    r: number,
    h: number,
    color: string,
    pos: Vec3,
    axis: 'y' | 'z' = 'y',
    name = '',
  ) => {
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, h, 40), mat(color));
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    return put(mesh, pos, name);
  };
  if (level === 'ps5-power') {
    if (id === 'housing') {
      slab(outline(), 1.4, '#20282d', [0, -31.3, 0], 'psu-floor');
      for (let i = 0; i < psuOutline.length; i++) {
        const a = psuOutline[i],
          b = psuOutline[(i + 1) % psuOutline.length];
        const dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz);
        const wall = new T.Shape();
        wall.moveTo(-length / 2, -32.3);
        wall.lineTo(length / 2, -32.3);
        wall.lineTo(length / 2, 32.3);
        wall.lineTo(-length / 2, 32.3);
        wall.closePath();
        if (length > 40)
          for (let u = -length / 2 + 6; u < length / 2 - 5; u += 6)
            for (const y of [-8, 0, 8]) wall.holes.push(circle(u, y, 1.7));
        const geo = new T.ExtrudeGeometry(wall, {
          depth: 1.4,
          bevelEnabled: false,
          curveSegments: 10,
        });
        geo.translate(0, 0, -0.7);
        const mesh = put(
          new T.Mesh(geo, mat('#222b31')),
          [
            (a[0] + b[0]) / 2 - (dz / length) * 0.7,
            1.7,
            (a[1] + b[1]) / 2 + (dx / length) * 0.7,
          ],
          'perforated-side-wall',
        );
        mesh.rotation.y = -Math.atan2(dz, dx);
      }
      for (const [x, z] of psuMounts) {
        const s = new T.Shape().absarc(0, 0, 2.3, 0, Math.PI * 2, false);
        s.holes.push(circle(0, 0, 1));
        slab(s, 6.2, '#424d51', [x, -26.9, z], 'pcb-standoff');
      }
    } else if (id === 'cover') {
      const shape = outline();
      // Perforations stay inside the two regions; no rectangle bridges the bend.
      for (let z = -76; z <= -12; z += 6)
        for (let x = -23; x <= 23; x += 6)
          shape.holes.push(
            circle(x + (Math.round(z / 6) % 2 ? 1.5 : 0), z, 1.7),
          );
      for (let z = 40; z <= 76; z += 6)
        for (let x = -19; x <= 1; x += 6) shape.holes.push(circle(x, z, 1.5));
      slab(shape, 2, '#30383e', [0, 0, 0], 'vented-boot-cover');
    } else if (id === 'pcb' || id === 'insulator') {
      const shape = outline(2.4);
      for (const [x, z] of psuMounts)
        shape.holes.push(circle(x, z, id === 'pcb' ? 1.15 : 2.5));
      slab(
        shape,
        part.size[1],
        id === 'pcb' ? '#31584b' : '#b8ac83',
        [0, 0, 0],
        id === 'pcb' ? 'single-boot-pcb' : 'dielectric-sheet',
      );
    } else if (id === 'bulk') {
      for (const x of [-11.5, 11.5]) {
        cyl(10.4, 34, '#78605c', [x, 0, 0], 'z', 'horizontal-bulk-capacitor');
        cyl(9.7, 0.3, '#b6b6b0', [x, 0, 17.2], 'z');
        for (const dx of [-2.8, 2.8]) {
          const curve = new T.CatmullRomCurve3(
            [
              [x + dx, 0, -17.2],
              [x + dx, -3, -18],
              [x + dx, -11.7, -18],
            ].map((p) => new T.Vector3(...p)),
          );
          put(
            new T.Mesh(
              new T.TubeGeometry(curve, 12, 0.35, 6, false),
              mat('#bfc2b7', 0.7),
            ),
          );
        }
      }
    } else if (id === 'input') {
      // Components sit on the one common PCB; no duplicate helper board.
      const core = new T.Mesh(
        new T.TorusGeometry(7, 2, 10, 36),
        mat('#4e5950'),
      );
      core.rotation.x = Math.PI / 2;
      put(core, [-10, -3, 0]);
      for (let i = 0; i < 18; i++) {
        const a = (i * Math.PI) / 9,
          points = Array.from({ length: 17 }, (_, j) => {
            const b = (j * Math.PI) / 8,
              radius = 7 + 2.5 * Math.cos(b);
            return new T.Vector3(
              -10 + radius * Math.cos(a),
              -3 + 2.5 * Math.sin(b),
              radius * Math.sin(a),
            );
          });
        put(
          new T.Mesh(
            new T.TubeGeometry(
              new T.CatmullRomCurve3(points),
              20,
              0.38,
              5,
              false,
            ),
            mat('#b67d38', 0.7),
          ),
        );
      }
      for (const x of [6, 15]) box([7, 17, 12], '#477bc2', [x, -2, 4]);
      box([11, 9, 8], '#a56b48', [11, -5, -9]);
      for (const x of [-16, -4, 7, 16]) cyl(0.4, 4, '#c1bca9', [x, -11, 0]);
    } else if (id === 'secondary') {
      for (const x of [-6, 6])
        for (const z of [-9, 2, 13]) {
          cyl(3.6, 17, '#353d42', [x, -3, z]);
          cyl(3.2, 0.2, '#adb5b5', [x, 5.6, z]);
          cyl(0.35, 2, '#b9bcaf', [x, -12.5, z]);
        }
      box([21, 1, 32], '#aab1b2', [0, -12, 0]);
      box([22, 19, 0.8], '#9ba6ab', [0, 0, -18]);
      for (let i = 0; i < 6; i++)
        box([0.65, 19, 3], '#9ba6ab', [(i - 2.5) * 3.8, 0, -16]);
    } else if (id === 'output') {
      box([18, 14, 10], '#1d252b', [0, 0, 0]);
      for (const x of [-4, 4]) box([2.4, 7, 1.4], '#b7ab76', [x, 1, 5.8]);
    }
    return g;
  }
  const curves = ps5HeatpipeCurves();
  if (id === 'pipes') {
    for (const curve of curves)
      put(
        new T.Mesh(
          new T.TubeGeometry(curve, 112, 1.6, 12, false),
          mat('#b77a46', 0.8),
        ),
        [0, 0, 0],
        'continuous-heatpipe',
      );
  } else if (id === 'fins') {
    for (const b of finBanks)
      for (let i = 0; i < b.count; i++) {
        const x = b.x0 + ((b.x1 - b.x0) * i) / (b.count - 1),
          s = new T.Shape();
        // Shape coordinates are (z,y); ends are stepped rather than full blocks.
        const notch = i < 4 || i > b.count - 5 ? 4 : 0;
        s.moveTo(b.z0 + notch, b.y0);
        s.lineTo(b.z1 - 2, b.y0);
        s.lineTo(b.z1, b.y0 + 3);
        s.lineTo(b.z1, b.y1 - 2);
        s.lineTo(b.z1 - 2, b.y1);
        s.lineTo(b.z0 + notch, b.y1);
        s.closePath();
        for (const curve of curves) {
          const pts = curve.getPoints(224);
          for (let j = 1; j < pts.length; j++) {
            const a = pts[j - 1],
              c = pts[j];
            if ((a.x - x) * (c.x - x) > 0 || Math.abs(c.x - a.x) < 1e-8)
              continue;
            const t = (x - a.x) / (c.x - a.x),
              z = T.MathUtils.lerp(a.z, c.z, t),
              y = T.MathUtils.lerp(a.y, c.y, t);
            if (
              z > b.z0 + notch + 3 &&
              z < b.z1 - 3 &&
              y > b.y0 + 2.5 &&
              y < b.y1 - 2.5
            )
              s.holes.push(circle(z, y, 2.25));
          }
        }
        const geo = new T.ExtrudeGeometry(s, {
          depth: 0.36,
          bevelEnabled: false,
          curveSegments: 10,
        });
        // (shape x=z, shape y=y, extrusion z=x) -> right-handed local frame.
        geo.applyMatrix4(
          new T.Matrix4().set(
            0,
            0,
            -1,
            x + 0.18,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
          ),
        );
        put(new T.Mesh(geo, mat('#a3aaab', 0.75)), [0, 0, 0], 'pierced-fin');
      }
  } else if (id === 'base' || id === 'brackets') {
    if (id === 'base') {
      const s = new T.Shape();
      s.moveTo(-70, -80);
      s.lineTo(70, -80);
      s.lineTo(70, 80);
      s.lineTo(8, 80);
      s.lineTo(8, 12);
      s.lineTo(-70, 12);
      s.closePath();
      for (const [x, z] of [
        [-66, -77],
        [66, -77],
        [66, 77],
        [12, 77],
      ])
        s.holes.push(circle(x, z, 1.6));
      slab(s, 2, '#a76c43');
    } else
      for (const [x, z] of [
        [-66, -77],
        [66, -77],
        [66, 77],
        [12, 77],
      ]) {
        const s = new T.Shape().absarc(0, 0, 3, 0, Math.PI * 2, false);
        s.holes.push(circle(0, 0, 1.6));
        slab(s, 1, '#bd8355', [x, 1.6, z], 'mounting-eye');
      }
  } else if (id === 'coldplate')
    box(part.size, '#b1a38c', [0, 0, 0], 'apu-coldplate');
  else if (id === 'interface')
    box(part.size, '#c2c8c7', [0, 0, 0], 'liquid-metal-contact');
  else if (id === 'foam') {
    const s = new T.Shape();
    s.moveTo(-17.5, -18.5);
    s.lineTo(17.5, -18.5);
    s.lineTo(17.5, 18.5);
    s.lineTo(-17.5, 18.5);
    s.closePath();
    const window = new T.Path();
    window.moveTo(-13, -14);
    window.lineTo(13, -14);
    window.lineTo(13, 14);
    window.lineTo(-13, 14);
    window.closePath();
    s.holes.push(window);
    slab(s, 1.1, '#292e30', [0, 0, 0], 'foam-window');
  } else if (id === 'duct') {
    for (const x of [-71, 71]) box([1.5, 27, 150], '#252c31', [x, -0.5, 0]);
  } else return null;
  return g;
}
