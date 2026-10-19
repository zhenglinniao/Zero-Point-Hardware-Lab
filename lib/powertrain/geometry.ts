import * as T from 'three';
import type { DigitalLevel, DigitalPart } from '../digital/catalogue.ts';
import type { ModelTools } from '../hardware.ts';
import type { Vec3 } from '../layout.ts';
import {
  GX,
  LEAF,
  leafMagnetBars,
  leafCoils,
  gxRingAngles,
  leafWirePoint,
  gxPushrodBottomY,
  gxPushrodTopY,
} from './dimensions.ts';
import { castSolid } from './cast-solids.ts';

/** All geometry here is millimetres. Installed assemblies reuse these exact solids. */
export function powertrainGeometry(
  level: DigitalLevel,
  part: DigitalPart,
  tools: ModelTools,
): T.Group | null {
  if (!level.startsWith('engine') && !level.startsWith('ev')) return null;
  const g = new T.Group(),
    id = part.id,
    steel = '#a3adb5',
    iron = '#46545f',
    copper = '#b9783f',
    black = '#30393d',
    white = '#e0dfd2';
  const material = (color = part.color, metal = 0.58, rough = 0.42) =>
    tools.material(color, metal, rough);
  const mesh = (geo: T.BufferGeometry, color = part.color, metal = 0.58) =>
    new T.Mesh(geo, material(color, metal));
  const cast = (
    name: Parameters<typeof castSolid>[0],
    metal = 0.48,
    rough = 0.68,
  ) => new T.Mesh(castSolid(name), material(part.color, metal, rough));
  const put = (
    o: T.Object3D,
    pos: Vec3 = [0, 0, 0],
    rotation: Vec3 = [0, 0, 0],
  ) => {
    o.position.set(...pos);
    o.rotation.set(...rotation);
    g.add(o);
    return o;
  };
  const box = (
    size: Vec3,
    pos: Vec3 = [0, 0, 0],
    color = part.color,
    r = 0.5,
  ) => put(tools.box(size, color, 0.45, r), pos);
  const circle = (radius: number, x = 0, y = 0) => {
    const p = new T.Path();
    p.absarc(x, y, radius, 0, Math.PI * 2, true);
    return p;
  };
  const extrude = (
    shape: T.Shape,
    depth: number,
    color = part.color,
    segments = 72,
  ) => {
    const geo = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: segments,
    });
    geo.translate(0, 0, -depth / 2);
    return mesh(geo, color);
  };
  const plate = (
    w: number,
    h: number,
    d: number,
    holes: { x: number; y: number; r: number }[] = [],
    color = part.color,
  ) => {
    const s = new T.Shape(),
      r = Math.min(w, h, 18) * 0.25;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    s.closePath();
    holes.forEach((h) => s.holes.push(circle(h.r, h.x, h.y)));
    return extrude(s, d, color);
  };
  const ring = (
    outer: number,
    inner: number,
    depth: number,
    color = part.color,
    segments = 96,
  ) => {
    const s = new T.Shape();
    s.absarc(0, 0, outer, 0, 2 * Math.PI, false);
    if (inner) s.holes.push(circle(inner));
    return extrude(s, depth, color, segments);
  };
  const cylinder = (r: number, h: number, color = part.color) =>
    mesh(new T.CylinderGeometry(r, r, h, 64), color);
  const axisRing = (
    r: number,
    inner: number,
    h: number,
    pos: Vec3 = [0, 0, 0],
    color = part.color,
  ) => put(ring(r, inner, h, color), pos, [Math.PI / 2, 0, 0]);
  const tube = (
    points: Vec3[],
    r: number,
    color = part.color,
    closed = false,
    steps = 80,
  ) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
      closed,
      'centripetal',
    );
    return put(mesh(new T.TubeGeometry(curve, steps, r, 8, closed), color));
  };
  const profile = (points: number[][], color = part.color) =>
    mesh(
      new T.LatheGeometry(
        points.map((p) => new T.Vector2(p[0], p[1])),
        96,
      ),
      color,
    );
  const bolt = (r = 3, length = 18) => {
    put(cylinder(r, length, steel), [0, 0, -length / 2], [Math.PI / 2, 0, 0]);
    put(
      mesh(new T.CylinderGeometry(r * 1.65, r * 1.65, r * 1.2, 6), steel),
      [0, 0, r * 0.6],
      [Math.PI / 2, 0, 0],
    );
    put(ring(r * 1.9, r * 1.04, 0.8, steel), [0, 0, -0.5]);
    const pts: Vec3[] = [];
    for (let i = 0; i <= length * 12; i++) {
      const t = i / (length * 12);
      pts.push([
        r * Math.cos(t * length * 5),
        r * Math.sin(t * length * 5),
        -t * length,
      ]);
    }
    tube(pts, 0.18, iron, false, Math.ceil(length * 25));
  };
  const spring = (
    radius: number,
    height: number,
    turns: number,
    wire: number,
    color = part.color,
    axis: 'y' | 'z' = 'y',
  ) => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= turns * 32; i++) {
      const t = i / (turns * 32),
        a = t * turns * Math.PI * 2;
      pts.push(
        axis === 'y'
          ? [radius * Math.cos(a), (t - 0.5) * height, radius * Math.sin(a)]
          : [radius * Math.cos(a), radius * Math.sin(a), (t - 0.5) * height],
      );
    }
    tube(pts, wire, color, false, turns * 48);
  };
  const gear = (
    teeth: number,
    module: number,
    width: number,
    bore: number,
    color = part.color,
  ) => {
    // Involute flanks around a 20° pressure-angle base circle.
    const rp = (teeth * module) / 2,
      rb = rp * Math.cos(Math.PI / 9),
      root = rp - 1.25 * module,
      tip = rp + module;
    const inv = (r: number) => {
      const t = Math.sqrt(Math.max(0, (r / rb) ** 2 - 1));
      return t - Math.atan(t);
    };
    const s = new T.Shape();
    let first = true;
    const at = (r: number, a: number) => {
      const x = r * Math.cos(a),
        y = r * Math.sin(a);
      if (first) {
        s.moveTo(x, y);
        first = false;
      } else s.lineTo(x, y);
    };
    for (let n = 0; n < teeth; n++) {
      const a = (n * Math.PI * 2) / teeth,
        half = Math.PI / (2 * teeth) + inv(rp);
      at(root, a - half - 0.018);
      for (let j = 0; j <= 5; j++) {
        const r = Math.max(root, rb) + ((tip - Math.max(root, rb)) * j) / 5;
        at(r, a - half + inv(r));
      }
      for (let j = 5; j >= 0; j--) {
        const r = Math.max(root, rb) + ((tip - Math.max(root, rb)) * j) / 5;
        at(r, a + half - inv(r));
      }
      at(root, a + half + 0.018);
    }
    s.closePath();
    s.holes.push(circle(bore));
    return extrude(s, width, color);
  };
  const rectangularShell = (
    w: number,
    h: number,
    d: number,
    wall: number,
    color = part.color,
  ) => {
    const result = new T.Group();
    const sides: [Vec3, Vec3][] = [
      [
        [w, h, wall],
        [0, 0, -(d - wall) / 2],
      ],
      [
        [wall, h, d - wall],
        [-(w - wall) / 2, 0, wall / 2],
      ],
      [
        [wall, h, d - wall],
        [(w - wall) / 2, 0, wall / 2],
      ],
      [
        [w - 2 * wall, wall, d - wall],
        [0, -(h - wall) / 2, wall / 2],
      ],
      [
        [w - 2 * wall, wall, d - wall],
        [0, (h - wall) / 2, wall / 2],
      ],
    ];
    sides.forEach(([size, p]) => {
      const o = tools.box(size, color, 0.35, 0.7);
      o.position.set(...p);
      result.add(o);
    });
    return result;
  };
  const roundedOutline = (w: number, h: number, r: number) => {
    const shape = new T.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    shape.closePath();
    return shape;
  };
  const outlinedWall = (
    w: number,
    h: number,
    r: number,
    wall: number,
    depth: number,
  ) => {
    const s = roundedOutline(w, h, r),
      inner = roundedOutline(w - 2 * wall, h - 2 * wall, r - wall);
    const path = new T.Path(inner.getPoints(32).reverse());
    s.holes.push(path);
    return extrude(s, depth);
  };
  const endNumber = () => Number(id.match(/(\d+)$/)?.[1] ?? 0);
  if (
    level === 'engine-block' ||
    level === 'engine-cylinder' ||
    level === 'engine-cover'
  ) {
    if (id === 'case') {
      put(cast('gx-case'));
      // Cast witness ribs tie the main bearing boss into the rear bulkhead.
      for (const a of [0.3, 1.1, 2.1, 2.9, 3.8, 5.1]) {
        const rib = box([44, 3, 4], [43 * Math.cos(a), 38 * Math.sin(a), -49]);
        rib.rotation.z = a;
      }
    } else if (id === 'barrel') {
      const length = GX.deckY - 55;
      axisRing(40, 36.1, length);
      for (let i = 0; i < 12; i++) {
        const y = -length / 2 + 1 + (i * (length - 2)) / 11;
        const w = 106 - (8 * Math.abs(i - 5.5)) / 5.5;
        put(
          plate(w, 88, 1.6, [
            { x: 0, y: 0, r: 40 },
            { x: -45, y: -14, r: 3.8 },
            { x: -45, y: 14, r: 3.8 },
            ...[-39, 39].flatMap((x) =>
              [-32, 32].map((y) => ({ x, y, r: 4.6 })),
            ),
          ]),
          [0, y, 0],
          [Math.PI / 2, 0, 0],
        );
      }
      for (const z of [-14, 14]) axisRing(5.2, 3.8, length, [-45, 0, z]);
    } else if (id === 'liner') axisRing(36, 34, GX.deckY - 55);
    else if (id.startsWith('bearing')) {
      put(ring(26, 21.5, 15));
      put(ring(17, 12.5, 15));
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        put(mesh(new T.SphereGeometry(2.2, 20, 12)), [
          19.25 * Math.cos(a),
          19.25 * Math.sin(a),
          0,
        ]);
      }
    } else if (id === 'cover') {
      put(cast('gx-cover'));
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI) / 3.5;
        const rib = box([27, 3, 5], [42 * Math.cos(a), 34 * Math.sin(a), 6]);
        rib.rotation.z = a;
      }
    } else if (id === 'gasket') {
      put(cast('gx-gasket', 0, 0.9));
    } else if (id.startsWith('seal')) {
      put(ring(20.5, 12.5, 6));
      put(ring(15, 12.5, 2, iron), [0, 0, 0.2]);
    } else if (id.startsWith('foot')) {
      put(
        plate(34, 24, 7, [{ x: 0, y: 0, r: 4.5 }]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
      for (const z of [-7, 7]) box([8, 38, 3], [0, 19, z]);
    } else if (id === 'dipstick') {
      put(cylinder(9, 8), [0, 0, 0], [Math.PI / 2, 0, 0]);
      box([2, 2, 48], [0, -6, -22], steel, 0.2);
    } else if (id === 'drain') bolt(5, 12);
    else bolt();
  } else if (level === 'engine-crank') {
    if (id === 'crankshaft') {
      for (const z of [-54.5, 54.5]) put(ring(12.5, 0, 56), [0, 0, z]);
      for (const z of [-20, 20]) {
        put(ring(30, 0, 10), [0, 0, z]);
        const weight = plate(65, 35, 13, [], iron);
        put(weight, [0, -18, z]);
      }
      put(ring(GX.crankpinDiameter / 2, 0, 28), [0, 22.5, 0]);
      for (const z of [-56, 56]) put(ring(16, 12.5, 5), [0, 0, z]);
    } else if (id === 'rod' || id === 'cap') {
      const s = new T.Shape();
      const bigY = id === 'rod' ? -35 : 0;
      if (id === 'rod') {
        // One continuous outline for the open split big end. A hole touching
        // the outer contour cannot be triangulated reliably as a Shape hole.
        s.moveTo(-22, -35);
        s.quadraticCurveTo(-22, -14, -11, -13);
        s.lineTo(-9, 26);
        s.quadraticCurveTo(-13, 31, -12, 35);
        s.absarc(0, 35, 12, Math.PI, 0, true);
        s.quadraticCurveTo(12, 29, 9, 26);
        s.lineTo(11, -13);
        s.quadraticCurveTo(22, -14, 22, -35);
        s.lineTo(GX.rodBore / 2, -35);
        s.absarc(0, -35, GX.rodBore / 2, 0, Math.PI, false);
        s.closePath();
        s.holes.push(circle(9.006, 0, 35));
      } else {
        s.moveTo(-22, 0);
        s.absarc(0, 0, 22, Math.PI, Math.PI * 2, false);
        s.lineTo(GX.rodBore / 2, 0);
        s.absarc(0, 0, GX.rodBore / 2, 0, Math.PI, true);
        s.lineTo(-22, 0);
        s.closePath();
      }
      put(extrude(s, 12));
      if (id === 'rod') {
        for (const z of [-6.5, 6.5]) box([4, 38, 1.8], [0, 0, z], iron, 0.2);
        put(ring(11, 9.006, 11, '#c5a36f'), [0, 35, 0]);
      }
      for (const x of [-20, 20]) box([9, 9, 14], [x, bigY - 1, 0]);
    } else if (id === 'dipper') {
      box([4, 30, 2], [0, -8, 0]);
      box([12, 3, 13], [0, -22, 5]);
    } else {
      bolt(3, 15);
      g.rotation.x = Math.PI / 2;
    }
  } else if (level === 'engine-piston') {
    if (id === 'piston') {
      // Grooved crown/ring belt. Pin bosses and relieved skirt leave both pin bores open.
      const R = GX.pistonDiameter / 2;
      put(
        profile([
          [28, 2],
          [R, 2],
          [R, 7.5],
          [32.7, 7.5],
          [32.7, 10.5],
          [R, 10.5],
          [R, 12.25],
          [32.7, 12.25],
          [32.7, 13.35],
          [R, 13.35],
          [R, 15.3],
          [32.7, 15.3],
          [32.7, 16.3],
          [R, 16.3],
          [R, 20],
          [0, 20],
          [0, 16],
          [28, 16],
          [28, 2],
        ]),
      );
      for (const a of [0, Math.PI]) {
        const geo = new T.LatheGeometry(
          [
            new T.Vector2(29, -24),
            new T.Vector2(R, -24),
            new T.Vector2(R, 2),
            new T.Vector2(29, 2),
            new T.Vector2(29, -24),
          ],
          48,
          a + 0.55,
          Math.PI - 1.1,
        );
        put(mesh(geo));
      }
      for (const z of [-22, 22]) put(ring(13, 9.004, 11), [0, -12, z]);
    } else if (id === 'pin') put(ring(GX.pinDiameter / 2, 5.6, 55));
    else if (id.startsWith('clip')) {
      const r = 9.5;
      const pts: Vec3[] = [];
      for (let i = 0; i <= 72; i++) {
        const a = 0.3 + (i / 72) * (Math.PI * 2 - 0.6);
        pts.push([r * Math.cos(a), r * Math.sin(a), 0]);
      }
      tube(pts, 0.55);
    } else if (id === 'oil-expander') {
      const pts: Vec3[] = [];
      for (let i = 0; i <= 384; i++) {
        const a = (i * Math.PI) / 192,
          r = 33.25 + 0.27 * Math.cos(32 * a);
        pts.push([r * Math.cos(a), 0.32 * Math.sin(32 * a), r * Math.sin(a)]);
      }
      tube(pts, 0.16, copper, true, 640);
    } else {
      const h = id.startsWith('oil') ? 0.22 : 0.94,
        r = 33.999,
        start =
          id === 'top-ring'
            ? gxRingAngles.top
            : id === 'second-ring'
              ? gxRingAngles.second
              : id === 'oil-upper'
                ? gxRingAngles.oilUpper
                : gxRingAngles.oilLower;
      const geo = new T.LatheGeometry(
        [
          [32.9, -h / 2],
          [r, -h / 2],
          [r, h / 2],
          [32.9, h / 2],
          [32.9, -h / 2],
        ].map((p) => new T.Vector2(...(p as [number, number]))),
        128,
        start,
        Math.PI * 2 - 0.009,
      );
      put(mesh(geo));
    }
  } else if (level === 'engine-head') {
    if (id === 'head') {
      put(cast('gx-head'));
      for (let i = 0; i < 6; i++) {
        // The fin plates share all ports/fastener bores with the cast body.
        const holes = [
          { x: 8, y: 0, r: i < 1 ? GX.chamberRadius : 5 },
          ...[-14, 14].map((z) => ({ x: 0, y: z, r: i < 2 ? 13 : 4.6 })),
          ...[-14, 14].map((z) => ({ x: -37, y: z, r: 4 })),
          ...[-39, 39].flatMap((x) =>
            [-32, 32].map((z) => ({ x: x + 8, y: z, r: 4.6 })),
          ),
        ];
        if (i >= 2)
          put(
            plate(113, 88, 1.2, holes),
            [-8, 12 + i * 5.2, 0],
            [Math.PI / 2, 0, 0],
          );
      }
      // Rocker chamber has an open top and a machined sealing rim.
      const rim = outlinedWall(99, 74, 9, 2.5, 23);
      put(rim, [-15, 53, 0], [Math.PI / 2, 0, 0]);
    } else if (id === 'stem-seal') {
      put(
        profile(
          [
            [5.2, -2.5],
            [5.2, 2.5],
            [2.78, 2.5],
            [2.78, -0.4],
            [4.55, -0.4],
            [4.55, -2.5],
            [5.2, -2.5],
          ],
          black,
        ),
      );
      axisRing(5.5, 4.5, 1.2, [0, 2, 0], steel);
    } else if (id === 'pushrod-guide') {
      put(
        plate(
          20,
          42,
          1.2,
          [-14, 14].map((z) => ({ x: 0, y: z, r: 3.4 })),
        ),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
    } else if (id === 'rotator') {
      axisRing(5.4, 2.78, 3);
      axisRing(6.4, 4.9, 0.7, [0, -1, 0], iron);
    } else if (id.startsWith('dowel')) axisRing(4, 2.8, 12);
    else if (id === 'gasket')
      put(
        plate(100, 86, 0.8, [
          { x: 0, y: 0, r: 34.2 },
          ...[-39, 39].flatMap((x) =>
            [-32, 32].map((z) => ({ x, y: z, r: 4.5 })),
          ),
          { x: -45, y: 14, r: 3.8 },
          { x: -45, y: -14, r: 3.8 },
        ]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
    else if (id === 'cover') {
      put(cast('gx-rocker-cover', 0.7, 0.3), [0, 0, 0], [Math.PI / 2, 0, 0]);
      tools.label(g, 'OHV', [0, 15.7, 0], 40, '#535b60');
    } else if (id === 'cover-gasket') {
      const pts = roundedOutline(101, 75, 6)
        .getPoints(32)
        .map((v) => [v.x, 0, v.y] as Vec3);
      tube(pts, 1.1, black, true, 96);
    } else if (id.startsWith('valve')) {
      const i = endNumber(),
        r = (i ? GX.exhaustDiameter : GX.intakeDiameter) / 2;
      put(
        profile([
          [0, -13],
          [r - 1, -13],
          [r, -12],
          [r - 1, -10],
          [4, -8],
          [(i ? GX.exhaustStem : GX.intakeStem) / 2, -5],
          [(i ? GX.exhaustStem : GX.intakeStem) / 2, 49],
          [0, 49],
          [0, -13],
        ]),
      );
    } else if (id.startsWith('guide')) axisRing(4.5, GX.valveGuideBore / 2, 25);
    else if (id.startsWith('spring')) spring(6.3, 22, 7, 0.8, iron);
    else if (id.startsWith('retainer')) {
      axisRing(9, 2.9, 2.4);
      axisRing(9.5, 7.8, 1, [0, -1, 0]);
    } else if (id.startsWith('rocker')) {
      put(
        plate(45, 8, 6, [{ x: 0, y: 0, r: 3.2 }]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
      for (const x of [-18, 18]) axisRing(4, 0, 3, [x, -3, 0]);
    } else if (id.startsWith('pivot')) {
      put(cylinder(3, 22));
      put(mesh(new T.CylinderGeometry(5.5, 5.5, 4, 6)), [0, 6, 0]);
    } else if (id === 'plug') {
      put(
        profile(
          [
            [0, -14],
            [3, -14],
            [3, 0],
            [6, 0],
            [6, 10],
            [4, 10],
            [4, 33],
            [2, 35],
            [0, 35],
            [0, -14],
          ],
          white,
        ),
      );
      put(mesh(new T.CylinderGeometry(8, 8, 7, 6), steel), [0, 8, 0]);
      spring(5.7, 13, 12, 0.26, steel);
      box([1.1, 5, 1.1], [3, -15, 0], steel);
      box([3, 1.1, 1.1], [1.5, -17, 0], steel);
    } else {
      bolt(4, 57);
      g.rotation.x = -Math.PI / 2;
    }
  } else if (level === 'engine-timing') {
    if (id === 'crank-gear') put(gear(20, GX.gearModule, 7, 12.6));
    else if (id === 'cam-gear') put(gear(40, GX.gearModule, 7, 7.05));
    else if (id === 'camshaft') {
      put(ring(GX.camJournal / 2, 0, 76));
      for (const [i, z] of [-14, 14].entries()) {
        const s = new T.Shape();
        for (let j = 0; j <= 96; j++) {
          const a = (j * Math.PI) / 48,
            r = 10.5 + 3.2 * Math.max(0, Math.cos(a - i * 1.7)) ** 3;
          if (j === 0) s.moveTo(r, 0);
          else s.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        s.closePath();
        put(extrude(s, 9), [0, 0, z]);
      }
    } else if (id === 'governor') {
      put(gear(20, 1.2, 5, 3.2));
      for (const x of [-8, 8]) {
        box([5, 9, 5], [x, 0, 6], steel);
        put(ring(2, 0, 7), [x, 0, 9]);
      }
      put(ring(5, 3.2, 12), [0, 0, 8]);
    } else if (id === 'governor-arm') {
      put(ring(3, 0, 70));
      box([4, 28, 3], [0, 12, 35]);
    } else if (id.startsWith('tappet')) {
      put(cylinder(7, 3), [0, -12, 0]);
      put(cylinder(3.5, 23));
    } else {
      const half = (gxPushrodTopY - gxPushrodBottomY) / 2;
      put(cylinder(2.4, half * 2));
      for (const y of [-half, half])
        put(mesh(new T.SphereGeometry(3, 16, 12)), [0, y, 0]);
    }
  } else if (level === 'engine-induction') {
    if (id === 'tank') {
      put(cast('gx-tank', 0.05, 0.34), [0, 0, 0]);
      put(ring(13, 11, 7), [-27, 61, -15], [Math.PI / 2, 0, 0]);
      for (const x of [-60, 15])
        put(
          plate(16, 20, 3, [{ x: 0, y: 0, r: 3.5 }]),
          [x, -58, 0],
          [Math.PI / 2, 0, 0],
        );
    } else if (id === 'cap') {
      put(cylinder(15, 7));
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        box([2, 7, 2], [14 * Math.cos(a), 0, 14 * Math.sin(a)]);
      }
    } else if (id === 'carb') {
      put(
        plate(40, 35, 28, [
          { x: 0, y: 0, r: 9.5 },
          { x: -15, y: 0, r: 3 },
          { x: 15, y: 0, r: 3 },
        ]),
      );
      put(cylinder(18, 19), [0, -24, 0]);
      put(cylinder(4, 5), [0, -36, 0]);
      box([5, 9, 7], [23, -2, 0]);
    } else if (id === 'throttle') {
      put(ring(8.8, 0, 1.2));
      put(ring(1.7, 0, 36), [0, 0, 0], [0, Math.PI / 2, 0]);
    } else if (id === 'tank-bracket') {
      put(
        plate(103, 18, 3, [
          { x: -37, y: 0, r: 3.5 },
          { x: 37, y: 0, r: 3.5 },
        ]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
      for (const x of [-37, 37]) {
        box([15, 34, 3], [x, -17, 8], iron);
        box([15, 3, 25], [x, -33, 20], iron);
      }
    } else if (id === 'filter-base' || id === 'insulator') {
      put(
        plate(
          id === 'filter-base' ? 61 : 35,
          id === 'filter-base' ? 64 : 32,
          5,
          [
            { x: 0, y: 0, r: 10 },
            { x: -15, y: 0, r: 3 },
            { x: 15, y: 0, r: 3 },
          ],
        ),
      );
      if (id === 'filter-base') put(ring(11, 9.5, 8), [0, 0, 0]);
    } else if (id === 'intake-gasket') {
      put(
        plate(
          34,
          31,
          0.7,
          [
            { x: 0, y: 0, r: 9 },
            { x: -15, y: 0, r: 3 },
            { x: 15, y: 0, r: 3 },
          ],
          '#716452',
        ),
      );
    } else if (id.startsWith('mount-stud')) {
      put(ring(2.8, 0, 75), [0, 0, 0]);
      put(
        mesh(new T.CylinderGeometry(5, 5, 4, 6)),
        [0, 0, -35],
        [Math.PI / 2, 0, 0],
      );
    } else if (id === 'fuel-line') {
      tube(
        [
          [0, 0, 0],
          [28, -15, -5],
          [61, -27, -30],
          [92, -29, -62],
        ],
        2.3,
        black,
      );
      for (const p of [
        [0, 0, 0],
        [92, -29, -62],
      ] as Vec3[])
        put(ring(3, 1.6, 4, steel), p, [Math.PI / 2, 0, 0]);
    } else if (id === 'filter') {
      put(ring(28, 12, 4, white), [0, 0, -11]);
      put(ring(28, 12, 4, white), [0, 0, 11]);
      for (let i = 0; i < 64; i++) {
        const a = (i * Math.PI) / 32;
        const fold = box(
          [7, 1, 19],
          [23 * Math.cos(a), 23 * Math.sin(a), 0],
          white,
          0.1,
        );
        fold.rotation.z = a;
      }
      put(ring(14, 12, 20, iron));
    } else if (id === 'filter-cover') {
      put(cast('gx-filter-cover', 0.02, 0.65));
      for (let i = 0; i < 6; i++) box([43, 2, 1.5], [0, i * 7 - 17, -22], iron);
    } else if (id === 'intake') {
      // Annular cross-sections along a bent centreline, with actual open ends.
      const curve = new T.CatmullRomCurve3(
        [
          [0, 0, 0],
          [0, 0, 6],
          [0, 0, 12],
          [0, 0, 18],
        ].map((v) => new T.Vector3(...v)),
      );
      const outer = new T.TubeGeometry(curve, 48, 10.5, 32, false),
        inner = new T.TubeGeometry(curve, 48, 8.8, 32, false);
      put(mesh(outer));
      const im = mesh(inner);
      (im.material as T.MeshStandardMaterial).side = T.DoubleSide;
      put(im);
    } else if (id === 'muffler') {
      put(rectangularShell(48, 64, 70, 2));
      put(plate(48, 64, 2, [{ x: 0, y: -12, r: 8 }]), [0, 0, 34]);
      put(ring(9, 7, 28), [0, -12, -46]);
      for (const z of [-12, 12])
        put(
          plate(
            43,
            59,
            1.2,
            Array.from({ length: 20 }, (_, i) => ({
              x: ((i % 4) - 1.5) * 9,
              y: (Math.floor(i / 4) - 2) * 9,
              r: 2,
            })),
          ),
          [0, 0, z],
        );
    } else {
      const s = new T.Shape();
      s.moveTo(-35, -36);
      s.lineTo(35, -36);
      s.lineTo(35, 36);
      s.lineTo(-35, 36);
      s.closePath();
      for (let i = 0; i < 35; i++)
        s.holes.push(
          circle(2.6, ((i % 5) - 2) * 11, (Math.floor(i / 5) - 3) * 9),
        );
      put(extrude(s, 1.2), [0, 0, 0], [0, Math.PI / 2, 0]);
    }
  } else if (level === 'engine-starter') {
    if (id === 'blower') {
      put(cast('gx-blower', 0.08, 0.42));
    } else if (id === 'pawl-0' || id === 'pawl-1') {
      put(plate(16, 7, 3, [{ x: -4, y: 0, r: 1.8 }]), [0, 0, 0]);
    } else if (id === 'flywheel') {
      put(ring(72, 12.6, 30));
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        box([18, 4, 5], [49 * Math.cos(a), 49 * Math.sin(a), -17]);
      }
      put(ring(23, 12.6, 9), [0, 0, -18]);
    } else if (id === 'fan') {
      put(ring(68, 15, 2));
      put(ring(24, 15, 11), [0, 0, -5]);
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        const s = new T.Shape();
        s.moveTo(26, 0);
        s.quadraticCurveTo(43, -8, 67, -1);
        s.lineTo(67, 1);
        s.quadraticCurveTo(43, -5, 26, 2);
        s.closePath();
        put(extrude(s, 10), [0, 0, -6], [0, 0, a]);
      }
    } else if (id === 'magnet') box([5, 27, 20]);
    else if (id === 'coil') {
      box([16, 27, 15], [0, 0, 0], black);
      for (const y of [-21, 21]) box([18, 10, 12], [-5, y, 0], iron);
      box([5, 52, 12], [6, 0, 0], iron);
      tube(
        [
          [0, 0, 10],
          [12, 8, 20],
          [16, 32, 12],
          [30, 50, 5],
        ],
        2.3,
        black,
      );
    } else if (id === 'cup') put(ring(28, 25, 17));
    else if (id === 'pulley') {
      put(ring(34, 9, 4), [0, 0, -5]);
      put(ring(34, 9, 4), [0, 0, 5]);
      put(ring(29, 9, 9));
      for (const x of [-18, 18]) box([12, 5, 3], [x, 0, 9]);
    } else if (id === 'spring') {
      const pts: Vec3[] = [];
      for (let i = 0; i <= 640; i++) {
        const t = i / 640,
          a = t * 8 * Math.PI * 2,
          r = 9 + t * 25;
        pts.push([r * Math.cos(a), r * Math.sin(a), 0]);
      }
      tube(pts, 0.5, steel, false, 900);
    } else if (id === 'rope') {
      const pts: Vec3[] = [];
      for (let i = 0; i <= 160; i++) {
        const a = (i * Math.PI) / 32;
        pts.push([31 * Math.cos(a), 31 * Math.sin(a), 0]);
      }
      pts.push([-48, 48, 0], [-70, 60, 0]);
      tube(pts, 1.6, '#c5baa1', false, 200);
      put(plate(36, 17, 12, [{ x: 0, y: 0, r: 3 }], black), [-77, 65, 0]);
    } else if (id === 'housing') {
      put(cast('gx-recoil-cover', 0.12, 0.36));
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        put(ring(7, 3.3, 4), [76 * Math.cos(a), 76 * Math.sin(a), 12]);
      }
      const badge = new T.Group();
      badge.rotation.x = -Math.PI / 2;
      tools.label(badge, 'GX160', [0, 8.5, 0], 42, '#eee8de');
      g.add(badge);
    } else bolt(6, 7);
  } else if (level === 'ev-stator') {
    const step = (2 * Math.PI) / 48;
    if (id === 'core') {
      const s = new T.Shape();
      s.absarc(0, 0, 99.02, 0, Math.PI * 2, false);
      const h = new T.Path();
      let first = true;
      for (let i = 47; i >= 0; i--) {
        const a = i * step;
        for (const [r, t] of [
          [65.48, step / 2],
          [65.48, 0.018],
          [69, 0.041],
          [89, 0.045],
          [89, -0.045],
          [69, -0.041],
          [65.48, -0.018],
          [65.48, -step / 2],
        ]) {
          const x = r * Math.cos(a + t),
            y = r * Math.sin(a + t);
          if (first) {
            h.moveTo(x, y);
            first = false;
          } else h.lineTo(x, y);
        }
      }
      h.closePath();
      s.holes.push(h);
      put(extrude(s, LEAF.statorStack));
      // Shallow lamination witness lines, kept outside the working bore/slots.
      for (let i = 0; i < 45; i++)
        put(ring(99.06, 99.02, 0.11, '#49565f', 96), [0, 0, -74 + i * 3.35]);
    } else if (id.startsWith('endturn')) {
      const i = endNumber() - 1,
        start = leafCoils[i].from,
        a = start * step,
        b = a + 5 * step,
        layer = i % 6;
      for (const side of [-1, 1])
        for (let hand = 0; hand < 20; hand++)
          for (let turn = 0; turn < 6; turn++) {
            const z0 = (side * LEAF.statorStack) / 2;
            if (side > 0 && turn === 5) continue;
            const first = leafWirePoint(
              start,
              hand,
              side > 0 ? turn + 1 : turn,
              z0,
            );
            // Opposite end joins successive turns; the last end remains an
            // accessible coil lead. Electrical phase grouping is representative.
            const last = leafWirePoint(leafCoils[i].to, hand, turn, z0);
            const z1 = side * (83.5 + layer * 1.7 + turn * 0.6);
            const pts: Vec3[] = [first, [first[0], first[1], z0 + side * 3]];
            for (let j = 0; j <= 12; j++) {
              const t = j / 12,
                aa = a + (b - a) * t;
              const r = 74 + hand * 0.7 + (turn - 2.5) * 0.12;
              pts.push([
                r * Math.cos(aa),
                r * Math.sin(aa),
                z1 + side * 3 * Math.sin(t * Math.PI),
              ]);
            }
            pts.push([last[0], last[1], z0 + side * 3], last);
            const curve = new T.CatmullRomCurve3(
              pts.map((p) => new T.Vector3(...p)),
            );
            put(mesh(new T.TubeGeometry(curve, 24, 0.39, 5, false), copper));
          }
      for (let hand = 0; hand < 20; hand++)
        for (const [slot, turn] of [
          [start, 0],
          [leafCoils[i].to, 5],
        ]) {
          const first = leafWirePoint(slot, hand, turn, LEAF.statorStack / 2);
          tube(
            [
              first,
              [first[0], first[1], 80],
              [first[0] * 1.025, first[1] * 1.025, 86],
            ],
            0.39,
            copper,
            false,
            8,
          );
        }
      // Insulating tie wraps are separate from the copper, as in the teardown.
      for (const side of [-1, 1]) {
        const aa = (a + b) / 2,
          z = side * (87 + layer * 1.7);
        const pts: Vec3[] = [];
        for (let j = 0; j <= 32; j++) {
          const angle = (j * Math.PI) / 16,
            r = 81 + 8 * Math.cos(angle);
          pts.push([
            r * Math.cos(aa),
            r * Math.sin(aa),
            z + 2.4 * Math.sin(angle),
          ]);
        }
        tube(pts, 0.5, '#e6dbbc', true, 32);
      }
    } else {
      const i = endNumber() - 1,
        a = i * step;
      if (id.startsWith('conductor')) {
        const geo = new T.CylinderGeometry(0.4, 0.4, LEAF.statorStack, 8);
        geo.rotateX(Math.PI / 2);
        const wires = new T.InstancedMesh(
            geo,
            material(part.color, 0.7, 0.32),
            120,
          ),
          m = new T.Matrix4();
        for (let j = 0; j < 120; j++) {
          m.makeTranslation(...leafWirePoint(i, Math.floor(j / 6), j % 6, 0));
          wires.setMatrixAt(j, m);
        }
        wires.instanceMatrix.needsUpdate = true;
        put(wires);
      } else if (id.startsWith('liner')) {
        const s = new T.Shape();
        const points = [
          [69.5, -0.04],
          [88.5, -0.044],
          [88.5, 0.044],
          [69.5, 0.04],
          [69.5, 0.036],
          [87.8, 0.04],
          [87.8, -0.04],
          [69.5, -0.036],
        ];
        points.forEach(([r, t], j) => {
          const x = r * Math.cos(a + t),
            y = r * Math.sin(a + t);
          if (j === 0) s.moveTo(x, y);
          else s.lineTo(x, y);
        });
        s.closePath();
        put(extrude(s, 152.4));
      } else {
        const wedge = box(
          [1.35, 1.5, 152],
          [67.9 * Math.cos(a), 67.9 * Math.sin(a), 0],
          part.color,
          0.12,
        );
        wedge.rotation.z = a;
      }
    }
  } else if (level === 'ev-rotor') {
    if (id === 'core') {
      const s = new T.Shape();
      s.absarc(0, 0, 64.94, 0, Math.PI * 2, false);
      s.holes.push(circle(22.27));
      for (const bar of leafMagnetBars) {
        const h = new T.Path(),
          w = bar.width / 2 + 0.12,
          t = bar.thickness / 2 + 0.12;
        [
          [-t, -w],
          [t, -w],
          [t, w],
          [-t, w],
        ].forEach(([x, y], i) => {
          const xx = bar.x + x * Math.cos(bar.angle) - y * Math.sin(bar.angle),
            yy = bar.y + x * Math.sin(bar.angle) + y * Math.cos(bar.angle);
          if (!i) h.moveTo(xx, yy);
          else h.lineTo(xx, yy);
        });
        h.closePath();
        s.holes.push(h);
      }
      put(extrude(s, LEAF.rotorStack));
      for (let i = 0; i < 42; i++)
        put(ring(64.985, 64.94, 0.09, '#48515a'), [0, 0, -74 + i * 3.6]);
    } else if (id === 'shaft') {
      // A single stepped lathe, rotated so the powertrain axis is Z.
      const pts = [
        [0, -165],
        [12, -165],
        [12, -145],
        [18, -145],
        [18, -125],
        [22.225, -125],
        [22.225, -96],
        [22.225, -96],
        [22.225, -83],
        [22.225, -83],
        [22.225, 83],
        [25, 83],
        [25, 96],
        [22.225, 96],
        [22.225, 126],
        [17, 126],
        [17, 168],
        [0, 168],
        [0, -165],
      ];
      put(profile(pts), [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        const b = box(
          [1.3, 1.8, 29],
          [17.3 * Math.cos(a), 17.3 * Math.sin(a), 150],
          steel,
          0.15,
        );
        b.rotation.z = a;
      }
    } else if (id.startsWith('plate')) {
      const s = new T.Shape();
      s.absarc(0, 0, 64.5, 0, Math.PI * 2, false);
      s.holes.push(circle(25.1));
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        s.holes.push(circle(4, 40 * Math.cos(a), 40 * Math.sin(a)));
      }
      put(extrude(s, 3));
    } else if (id.startsWith('magnet')) {
      const bar = leafMagnetBars[endNumber() - 1];
      for (let segment = 0; segment < 18; segment++)
        put(
          tools.box([bar.thickness, bar.width, 8.15], part.color, 0.55, 0.05),
          [bar.x, bar.y, -70.55 + segment * 8.3],
          [0, 0, bar.angle],
        );
    } else box([1.1, 3, 90], [0, 0, 0]);
  } else if (level === 'ev-bearing') {
    if (id === 'outer')
      put(
        profile([
          [42, -9],
          [42, 9],
          [37, 9],
          [36, 5],
          [36.6, 0],
          [36, -5],
          [37, -9],
          [42, -9],
        ]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
    else if (id === 'inner')
      put(
        profile([
          [22.225, -9],
          [27.5, -9],
          [28.2, -5],
          [27.6, 0],
          [28.2, 5],
          [27.5, 9],
          [22.225, 9],
          [22.225, -9],
        ]),
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
      );
    else if (id === 'cage') {
      for (const z of [-5.5, 5.5]) put(ring(34, 30, 0.8), [0, 0, z]);
      for (let i = 0; i < 10; i++) {
        const a = ((i + 0.5) * Math.PI) / 5;
        const b = box(
          [3, 3, 10],
          [32 * Math.cos(a), 32 * Math.sin(a), 0],
          part.color,
          0.3,
        );
        b.rotation.z = a;
      }
    } else if (id.startsWith('ball'))
      put(mesh(new T.SphereGeometry(4.2, 24, 16), steel));
    else put(ring(40.2, 23.6, 0.55, black));
  } else if (level === 'ev-housing') {
    if (id === 'shell') {
      put(cast('leaf-sleeve'));
      for (let i = 0; i < 9; i++) {
        // Alternating bypass windows connect the annular jacket chambers.
        const shape = new T.Shape();
        const a = (i % 2) * Math.PI + 0.23;
        shape.absarc(0, 0, 108.15, a, a + Math.PI * 2 - 0.46, false);
        shape.absarc(0, 0, 102.01, a + Math.PI * 2 - 0.46, a, true);
        shape.closePath();
        put(extrude(shape, 2), [0, 0, -80 + i * 20]);
      }
    } else if (id === 'jacket') {
      put(cast('leaf-jacket'));
      for (let i = 0; i < 12; i++) {
        if (i === 3) continue; // Keep the radial coolant ports free of cast ribs.
        const a = (i * Math.PI) / 6;
        const rib = box([5, 3, 158], [112 * Math.cos(a), 112 * Math.sin(a), 0]);
        rib.rotation.z = a;
      }
    } else if (id.startsWith('bell')) {
      put(mesh(castSolid('leaf-bell')));
    } else if (id.startsWith('oring'))
      put(mesh(new T.TorusGeometry(105.6, 1.6, 10, 128), black));
    else if (id === 'inlet' || id === 'outlet') {
      put(ring(8.5, 6.5, 23), [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (const y of [-7, 7]) axisRing(9.2, 8, 1, [0, y, 0]);
    } else bolt(3, 245);
  } else if (level === 'ev-terminal') {
    if (id === 'base') {
      put(cast('leaf-terminal-shell', 0, 0.62));
      for (const x of [-30, -10, 10, 30]) box([2, 17, 27], [x, 12, 0]);
    } else if (id === 'cover') {
      put(rectangularShell(84, 36, 19, 2), [0, 0, 0], [Math.PI / 2, 0, 0]);
    } else if (id.startsWith('bus')) {
      put(
        plate(13, 24, 2, [{ x: 0, y: 0, r: 3.4 }]),
        [0, 3, 0],
        [Math.PI / 2, 0, 0],
      );
      box([13, 18, 2], [0, -5, 11], copper, 0.2);
      box([13, 2, 15], [0, -14, 17], copper, 0.2);
    } else {
      bolt(3, 15);
      g.rotation.x = -Math.PI / 2;
    }
  } else if (level === 'evmotor') {
    if (id.startsWith('phase-lead-')) {
      const i = endNumber(),
        slot = [12, 10, 8][i];
      const start = leafWirePoint(slot, 10, 0, 86),
        x = (i - 1) * 20;
      tube(
        [start, [start[0], start[1], 94 + i * 2], [x, 91, 97], [x, 91, 104]],
        2.4,
        ['#b98d46', '#a45e43', '#be9255'][i],
        false,
        32,
      );
      put(ring(4.4, 2.5, 7, black), [x, 91, 101]);
    } else if (id.startsWith('housing-bolt')) bolt(3, 212);
    else if (id.startsWith('endbell')) {
      const bell = mesh(
        castSolid(id.endsWith('1') ? 'leaf-bell-front' : 'leaf-bell'),
      );
      if (id.endsWith('0')) bell.rotation.y = Math.PI;
      put(bell);
    } else if (id === 'resolver-stator') {
      put(ring(40, 26, 12, iron));
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const tooth = box(
          [8, 6, 10],
          [29.5 * Math.cos(a), 29.5 * Math.sin(a), 0],
          iron,
          0.2,
        );
        tooth.rotation.z = a;
        for (let j = 0; j < 5; j++)
          put(ring(2.5, 1.5, 0.7, copper), [
            33 * Math.cos(a),
            33 * Math.sin(a),
            j * 1.3 - 2.6,
          ]);
      }
    } else {
      const s = new T.Shape();
      for (let i = 0; i <= 96; i++) {
        const a = (i * Math.PI) / 48,
          r = 22.7 + 1.1 * Math.cos(2 * a);
        if (i === 0) s.moveTo(r, 0);
        else s.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      s.closePath();
      s.holes.push(circle(18.1));
      put(extrude(s, 9));
    }
  } else throw new Error(`Missing powertrain geometry: ${level}/${id}`);
  g.userData.referenceModel = 'public-dimension-constrained-reconstruction';
  return g;
}
