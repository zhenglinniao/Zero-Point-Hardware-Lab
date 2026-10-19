import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import {
  digitalDefinitions,
  type DigitalLevel,
  type DigitalPart,
} from './catalogue.ts';
import type { Vec3 } from '../layout.ts';
import { gamepadExterior } from './gamepad-asset.ts';
import { cameraExterior } from './camera-exterior.ts';

export const mechanicalLevels = [
  'ps5-fan',
  'phone-haptic',
  'phone-speaker',
  'camera-finder',
  'camera-display',
  'gamepad-triggers',
  'gamepad-right-trigger',
  'gamepad-leftstick',
  'gamepad-rightstick',
] as const;

/** Native-mm solids, with actual cavities and mechanical clearances. */
export function mechanicalGeometry(
  level: DigitalLevel,
  part: DigitalPart,
  tools: ModelTools,
): T.Group | null {
  if (!(mechanicalLevels as readonly string[]).includes(level)) return null;
  if (level === 'camera-finder' || level === 'camera-display')
    return cameraExterior(
      { ...part, id: level === 'camera-finder' ? 'finder' : 'display' },
      tools,
      part.id,
    );
  const g = new T.Group(),
    id = part.id;
  const materials = new Map<string, T.MeshStandardMaterial>();
  const mat = (color = part.color, metal = 0.25) => {
    const key = `${color}/${metal}`;
    if (!materials.has(key))
      materials.set(key, tools.material(color, metal, 0.62));
    return materials.get(key)!;
  };
  const put = <O extends T.Object3D>(o: O, p: Vec3 = [0, 0, 0]) => {
    o.position.set(...p);
    g.add(o);
    return o;
  };
  const box = (s: Vec3, p: Vec3 = [0, 0, 0], color = part.color) => {
    const o = tools.box(s, color, 0.2, Math.min(...s) * 0.12);
    o.material = mat(color);
    return put(o, p);
  };
  const cylinder = (
    r: number,
    h: number,
    p: Vec3 = [0, 0, 0],
    color = part.color,
    inner = 0,
    axis: 'x' | 'y' | 'z' = 'y',
  ) => {
    const geo = inner
      ? new T.LatheGeometry(
          [
            [inner, -h / 2],
            [r, -h / 2],
            [r, h / 2],
            [inner, h / 2],
            [inner, -h / 2],
          ].map(([x, y]) => new T.Vector2(x, y)),
          64,
        )
      : new T.CylinderGeometry(r, r, h, 64);
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    if (axis === 'z') geo.rotateX(Math.PI / 2);
    return put(new T.Mesh(geo, mat(color, 0.55)), p);
  };
  const tube = (points: Vec3[], radius: number, color = part.color) =>
    put(
      new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(
            points.map((p) => new T.Vector3(...p)),
            false,
            'centripetal',
            0.5,
          ),
          Math.max(32, points.length * 3),
          radius,
          8,
          false,
        ),
        mat(color, 0.55),
      ),
    );
  const helix = (
    radius: number,
    length: number,
    turns: number,
    wire: number,
    axis: 'x' | 'y' = 'y',
    color = part.color,
  ) => {
    const points: Vec3[] = [];
    for (let i = 0; i <= turns * 24; i++) {
      const a = i / (turns * 24),
        t = a * turns * Math.PI * 2;
      points.push(
        axis === 'x'
          ? [
              a * length - length / 2,
              Math.cos(t) * radius,
              Math.sin(t) * radius,
            ]
          : [
              Math.cos(t) * radius,
              a * length - length / 2,
              Math.sin(t) * radius,
            ],
      );
    }
    return tube(points, wire, color);
  };
  const frame = (
    w: number,
    h: number,
    d: number,
    wall: number,
    y = 0,
    color = part.color,
  ) => {
    box([w, wall, d], [0, y - h / 2 + wall / 2, 0], color);
    for (const x of [-1, 1])
      box([wall, h - wall, d], [(x * (w - wall)) / 2, y + wall / 2, 0], color);
    for (const z of [-1, 1])
      box(
        [w - 2 * wall, h - wall, wall],
        [0, y + wall / 2, (z * (d - wall)) / 2],
        color,
      );
  };
  // Oval rings have a real opening; no hidden filled disk occupies the voice coil.
  const oval = (
    rx: number,
    rz: number,
    h: number,
    wall: number,
    y: number,
    color = part.color,
  ) => {
    const shape = new T.Shape();
    shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
    const hole = new T.Path();
    hole.absellipse(0, 0, rx - wall, rz - wall, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 48,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, h / 2 + y, 0);
    return put(new T.Mesh(geo, mat(color)));
  };
  if (level === 'ps5-fan') {
    if (id === 'housing' || id === 'rear') {
      if (id === 'housing') cylinder(60, 45, [0, 0, 0], part.color, 56, 'x');
      const x = id === 'housing' ? 21.8 : -21.8;
      cylinder(58.5, 1, [x, 0, 0], part.color, 54.8, 'x');
      cylinder(7.5, 1, [x, 0, 0], part.color, 2.3, 'x');
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.35,
          o = box([1, 48, 3], [x, Math.cos(a) * 31, Math.sin(a) * 31]);
        o.rotation.x = a;
      }
    } else if (id === 'rotor') {
      cylinder(19, 39, [0, 0, 0], part.color, 12, 'x');
      for (let i = 0; i < 23; i++) {
        const s = new T.Shape();
        s.moveTo(20, -1);
        s.bezierCurveTo(31, -3, 45, 1, 54.5, 11);
        s.lineTo(53.4, 12);
        s.bezierCurveTo(42, 3, 30, -1, 20, 1);
        s.closePath();
        const geo = new T.ExtrudeGeometry(s, {
          depth: 39,
          bevelEnabled: false,
          curveSegments: 16,
        });
        geo.translate(0, 0, -19.5);
        geo.rotateY(Math.PI / 2);
        const o = put(new T.Mesh(geo, mat()));
        o.rotation.x = (i * Math.PI * 2) / 23;
      }
    } else if (id === 'stator') {
      cylinder(7.8, 20, [0, 0, 0], '#50595b', 3, 'x');
      for (let i = 0; i < 9; i++) {
        const a = (i * Math.PI * 2) / 9;
        for (let turn = 0; turn < 7; turn++) {
          const o = cylinder(
            2.1,
            0.3,
            [-7 + turn * 2.2, Math.cos(a) * 9.1, Math.sin(a) * 9.1],
            '#b77a42',
            1,
            'x',
          );
          o.userData.fanWinding = true;
        }
      }
    } else {
      cylinder(2, 40, [0, 0, 0], '#adb8be', 0, 'x');
      for (const x of [-16, 16]) cylinder(6, 2, [x, 0, 0], '#8f9b9f', 2.1, 'x');
    }
  } else if (level === 'phone-haptic') {
    if (id === 'housing') frame(28, 3.5, 13, 0.22);
    else if (id === 'lid') box(part.size);
    else if (id === 'mass') {
      box([18, 2.3, 7], [0, 0, 0], '#718087');
      for (const x of [-5, 5]) box([4, 0.12, 6], [x, 1.21, 0], '#3c444b');
    } else if (id === 'coil') {
      for (let i = 0; i < 12; i++) {
        // Rectangular windings surround a 19 × 8 mm free moving cavity.
        const y = -1.1 + i * 0.2;
        tube(
          [
            [-9, y, -4.5],
            [9, y, -4.5],
            [9.7, y, -4.2],
            [10, y, -3.5],
            [10, y, 3.5],
            [9.7, y, 4.2],
            [9, y, 4.5],
            [-9, y, 4.5],
            [-9.7, y, 4.2],
            [-10, y, 3.5],
            [-10, y, -3.5],
            [-9.7, y, -4.2],
            [-9, y, -4.5],
          ],
          0.095,
          '#b98148',
        );
      }
    } else if (id === 'springs') {
      for (const x of [-1, 1])
        for (const z of [-1, 1])
          tube(
            [
              [x * 9.1, 0, z * 3.2],
              [x * 11, 0, z * 4.3],
              [x * 12, 0, z * 3.1],
              [x * 13.3, 0, z * 4.8],
            ],
            0.12,
            '#b4bfc0',
          );
    } else {
      box(part.size);
      for (let i = 0; i < 4; i++)
        box([0.55, 0.02, 2], [(i - 1.5) * 1.05, 0.105, 0], '#d1b56d');
    }
  } else if (level === 'phone-speaker') {
    if (id === 'chamber') frame(21, 3.4, 14, 0.3);
    else if (id === 'cover') {
      // Hollow outline and grille bars instead of a solid plate through the diaphragm.
      oval(9.9, 6.3, 0.3, 0.9, 0);
      for (let i = -4; i <= 4; i++) box([0.22, 0.25, 8], [i * 1.6, 0, 0]);
    } else if (id === 'diaphragm') {
      const o = cylinder(1, 0.12, [0, 0, 0], '#87999d');
      o.scale.set(6.6, 1, 3.6);
      oval(7, 4, 0.12, 0.35, 0, '#273136');
    } else if (id === 'voice-coil') {
      for (let i = 0; i < 5; i++)
        oval(5, 2, 0.09, 0.12, -0.25 + i * 0.12, '#bd8247');
    } else if (id === 'magnet') {
      box([12, 0.25, 6], [0, -0.575, 0], '#8b969a');
      box([8, 1.0, 2], [0, 0.05, 0], '#454f59');
      for (const z of [-1, 1]) box([12, 0.9, 0.45], [0, 0, z * 2.7], '#6e7f87');
    } else {
      oval(10.2, 6.5, 0.15, 0.4, 0);
      for (const x of [-7, 7]) box([2, 0.18, 1.2], [x, 0, 0], '#d3b76f');
    }
  } else if (
    level === 'gamepad-triggers' ||
    level === 'gamepad-right-trigger'
  ) {
    if (id === 'caps') {
      const root = digitalDefinitions
        .find((d) => d.id === 'gamepad')!
        .parts.find(
          (p) =>
            p.id ===
            (level === 'gamepad-triggers' ? 'triggers' : 'right-trigger'),
        )!;
      g.add(gamepadExterior(root)!);
    } else if (id === 'base') {
      box(part.size);
      for (const x of [-7, 7]) cylinder(1.8, 4, [x, 2, -5], '#3e4b51', 0.8);
    } else if (id === 'motor') {
      cylinder(4.3, 10, [0, 0, 0], '#aab3b5', 0, 'x');
      cylinder(1, 1.8, [5.9, 0, 0], '#c7cecf', 0, 'x');
      for (const z of [-2, 2]) box([0.4, 1, 1], [-5.3, 0, z], '#bd9e64');
    } else if (id === 'worm') {
      cylinder(1.05, 9.5, [0, 0, 0], '#bac1c0', 1.02, 'x');
      helix(1.25, 8.8, 8, 0.15, 'x', '#d9ceb3');
    } else if (id === 'gear') {
      cylinder(4.1, 1.6, [0, 0, 0], '#d1c5a9', 0.8);
      for (let i = 0; i < 28; i++) {
        const a = (i * Math.PI * 2) / 28,
          o = box(
            [0.55, 1.6, 0.65],
            [Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2],
            '#d1c5a9',
          );
        o.rotation.y = -a;
      }
      box([2, 1.2, 5], [0, 1.4, -2], '#b4a88c');
    } else if (id === 'spring') {
      helix(1.7, 2.3, 4, 0.18, 'x');
      tube(
        [
          [-1.2, 1.7, 0],
          [-2, 3, 0],
          [-4, 3, 0],
        ],
        0.18,
      );
      tube(
        [
          [1.2, 1.7, 0],
          [2, 3, 0],
          [3, 4, 0],
        ],
        0.18,
      );
    } else {
      box(part.size);
      for (let i = 0; i < 5; i++)
        box([0.5, 0.03, 2], [(i - 2) * 0.9, 0.12, 2.8], '#c7b06f');
    }
  } else {
    if (id === 'cap') {
      const root = digitalDefinitions
        .find((d) => d.id === 'gamepad')!
        .parts.find(
          (p) =>
            p.id ===
            (level === 'gamepad-leftstick' ? 'leftstick' : 'rightstick'),
        )!;
      g.add(gamepadExterior(root)!);
    } else if (id === 'gimbal') {
      for (const x of [-6, 6]) box([1.2, 6, 12], [x, 0, 0]);
      for (const z of [-5.5, 5.5]) box([10, 1.2, 1.2], [0, 2.4, z]);
      for (const x of [-6.3, 6.3])
        cylinder(1.5, 2, [x, 0, 0], '#9ba8a8', 0.8, 'x');
      for (const z of [-6.3, 6.3])
        cylinder(1.5, 2, [0, 0, z], '#9ba8a8', 0.8, 'z');
      cylinder(2.2, 10, [0, 1.5, 0], '#f0e6c9', 0.9);
    } else if (id === 'pot-x' || id === 'pot-y') {
      const body = box(id === 'pot-x' ? [1.2, 7, 12] : [12, 7, 1.2]);
      body.position.set(
        id === 'pot-x' ? -0.9 : 0,
        0,
        id === 'pot-y' ? -0.9 : 0,
      );
      const axis = id === 'pot-x' ? 'x' : 'z';
      cylinder(2.6, 0.45, [0, 0, 0], '#3c3f3a', 1.1, axis);
      cylinder(1, 0.65, [0, 0, 0], '#bdb6a2', 0, axis);
      for (let i = -1; i <= 1; i++)
        box(
          [0.45, 2, 0.45],
          id === 'pot-x' ? [0, -4.2, i * 3.5] : [i * 3.5, -4.2, 0],
          '#b8bfc1',
        );
    } else if (id === 'spring') {
      helix(2.6, 3.4, 5, 0.24, 'y');
      cylinder(3.5, 0.3, [0, -1.9, 0], '#b9bcb2', 1.6);
    } else {
      box([6, 2, 6]);
      cylinder(1.5, 1, [0, 1.5, 0], '#343c42');
      for (const x of [-2, 2])
        for (const z of [-2, 2]) box([0.5, 2, 0.5], [x, -2, z], '#b5bec0');
    }
  }
  if (
    (level === 'gamepad-right-trigger' && id !== 'caps') ||
    (level === 'gamepad-rightstick' && id !== 'cap')
  )
    g.scale.x = -1;
  g.userData.mechanicalRevision = 1;
  return g;
}
