import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { DigitalPart } from './catalogue.ts';
import type { Vec3 } from '../layout.ts';
import { cameraFrontShell } from './molded-shells.ts';

/** ILCE-7M4 exterior landmarks, reconstructed from Sony's front/rear/top
 * diagrams. Native millimetres; the installer converts the legacy X axis. */
export function cameraExterior(part: DigitalPart, tools: ModelTools) {
  if (
    !['front', 'back', 'display', 'finder', 'top', 'dial', 'base'].includes(
      part.id,
    )
  )
    return null;
  const g = new T.Group(),
    black = '#17191b',
    rubber = '#101213';
  const mat = (color = black, metal = 0.03, rough = 0.72) => {
    const m = tools.material(color, metal, rough).clone();
    m.roughnessMap = null;
    m.bumpScale = color === rubber ? 0.16 : 0.07;
    m.envMapIntensity = 0.4;
    return m;
  };
  const put = <O extends T.Object3D>(o: O, p: Vec3 = [0, 0, 0]) => {
    o.position.set(...p);
    g.add(o);
    return o;
  };
  const box = (s: Vec3, p: Vec3, color = black, r = 0.7) => {
    const m = tools.box(s, color, 0.03, r);
    m.material = mat(color);
    return put(m, p);
  };
  const cylinder = (
    r: number,
    h: number,
    p: Vec3,
    color = black,
    axis: 'y' | 'z' | 'x' = 'y',
  ) => {
    const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 64), mat(color));
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    return put(m, p);
  };
  const decal = (
    value: string,
    width: number,
    p: Vec3,
    face: 'front' | 'back' | 'top' = 'front',
    color = '#e2e1da',
  ) => {
    const label = new T.Group();
    const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d')!;
    const font = `${value === 'SONY' ? '700' : '500'} 96px ${value === 'SONY' ? 'Georgia' : 'Arial'}`;
    ctx.font = font;
    const measured = ctx.measureText(value)?.width ?? value.length * 58;
    canvas.width = Math.ceil(measured + 24);
    canvas.height = 144;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, canvas.width / 2, 72);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const maximumHeight = value === 'SONY' ? 5 : value === 'α' ? 7 : 2.7;
    const actualWidth = Math.min(width, (canvas.width * maximumHeight) / 96);
    const plane = new T.Mesh(
      new T.PlaneGeometry(actualWidth, (actualWidth * 144) / canvas.width),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    plane.userData.cameraDecal = value;
    label.add(plane);
    if (face === 'back') label.rotation.y = Math.PI;
    if (face === 'top') label.rotation.x = -Math.PI / 2;
    put(label, p);
    return label;
  };
  const rect = (w: number, h: number, r: number, cx = 0, cy = 0) => {
    const s = new T.Shape(),
      x = cx - w / 2,
      y = cy - h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  const panel = (shape: T.Shape, depth: number, color = black) => {
    const geom = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 32,
    });
    geom.translate(0, 0, -depth / 2);
    return put(new T.Mesh(geom, mat(color)));
  };
  const wheel = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    axis: 'y' | 'z' = 'y',
  ) => {
    cylinder(r, h, [x, y, z], black, axis);
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30;
      if (axis === 'y') {
        const tooth = box(
          [0.35, h * 0.8, 0.45],
          [x + Math.cos(a) * r, y, z + Math.sin(a) * r],
          '#343638',
          0.08,
        );
        tooth.rotation.y = -a;
      } else {
        const tooth = box(
          [0.35, 0.45, h * 0.8],
          [x + Math.cos(a) * r, y + Math.sin(a) * r, z],
          '#353739',
          0.06,
        );
        tooth.rotation.z = a;
      }
    }
  };
  if (part.id === 'front') {
    const shell = put(
      new T.Mesh(cameraFrontShell(), mat('#222426', 0.025, 0.77)),
    );
    shell.userData.cameraBodyShell = true;
    decal('α', 11, [-47, 23, 17.1]);
    decal('7 IV', 12, [-47, 14.5, 17.1]);
    decal('E-mount', 13, [-8, -33, 17.1], 'front', '#777a78');
    cylinder(2.1, 1.1, [24, 25, 17.4], '#3d2218', 'z');
    cylinder(3.8, 2, [27, -18, 17.5], black, 'z');
    // Front command wheel on the upper grip, not a silver button on a slab.
    const command = cylinder(5.7, 9, [47, 28, 24], black, 'x');
    command.name = 'sony-front-command-dial';
    for (let i = 0; i < 44; i++) {
      const a = (i * Math.PI) / 22;
      box(
        [8, 0.35, 0.35],
        [47, 28 + Math.cos(a) * 5.7, 24 + Math.sin(a) * 5.7],
        '#37393a',
        0.08,
      );
    }
    for (const y of [-21, -9, 4]) box([1, 9, 17], [-64, y, -8], '#181a1b', 1.2);
    for (const x of [-64, 64]) {
      const lug = new T.Mesh(
        new T.TorusGeometry(2.2, 0.65, 10, 32),
        mat('#74777a', 0.7, 0.4),
      );
      lug.rotation.y = Math.PI / 2;
      put(lug, [x, 28, -8]);
    }
  } else if (part.id === 'back') {
    const shape = rect(126, 77, 4);
    shape.holes.push(new T.Path(rect(72, 47, 1.5, -17, -8).getPoints(32)));
    const shell = panel(shape, 2.4);
    shell.name = 'sony-rear-shell';
    // Rubber thumb rest, joystick, Fn, control wheel, playback and delete.
    box([17, 31, 3.5], [51, 17, -2.6], rubber, 4);
    cylinder(3.2, 2.6, [32, 16, -3], rubber, 'z');
    wheel(39, -12, -2.3, 9.1, 2, 'z');
    cylinder(3.3, 2.5, [39, -12, -3.6], black, 'z');
    decal('DISP', 9, [39, -0.5, -3.7], 'back', '#b7b8b2');
    for (const [x, y, label] of [
      [-49, 29, 'C3'],
      [-31, 29, 'MENU'],
      [27, 29, 'AF-ON'],
      [49, 29, 'AEL'],
      [31, 4, 'Fn'],
      [29, -31, '▶'],
      [48, -31, 'C4'],
    ] as const) {
      const button = box(
        [label === 'MENU' ? 11 : 8, 4, 1.7],
        [x, y, -2.2],
        '#242628',
        1.8,
      );
      button.name = `sony-button-${label}`;
      decal(label, label === 'MENU' ? 9 : 7, [x, y + 4, -3.1], 'back');
    }
    for (const [x, y] of [
      [-59, 33],
      [59, 33],
      [-59, -33],
      [59, -33],
    ])
      cylinder(0.8, 0.3, [x, y, -1.4], '#535659', 'z');
  } else if (part.id === 'display') {
    const frame = box([75.6, 52.5, 4.4], [0, 0, 0], '#171a1b', 1.6);
    frame.name = 'sony-articulating-monitor';
    box([66.6, 43.2, 0.12], [0, 1.4, -2.27], '#10191d', 0.6);
    decal('SONY', 14, [0, -23.2, -2.29], 'back', '#9c9e98');
    decal('M   1/125   F4.0   ISO 100', 58, [0, 20.4, -2.4], 'back', '#aab5b1');
    for (const x of [-10, 10])
      for (const y of [-6, 6]) {
        box([3.5, 0.18, 0.02], [x, y, -2.36], '#789b80', 0.01);
        box(
          [0.18, 2.8, 0.02],
          [x + (x < 0 ? -1.7 : 1.7), y + (y < 0 ? 1.3 : -1.3), -2.36],
          '#789b80',
          0.01,
        );
      }
    cylinder(1.8, 40, [-39.3, 0, 1], rubber);
  } else if (part.id === 'finder') {
    const positions: number[] = [],
      indices: number[] = [],
      rings = [
        [-10.4, 44, 41, -1],
        [-1.5, 38, 37, -2],
        [8, 27, 25, -4],
      ];
    const n = 96;
    for (const [y, w, d, z] of rings) {
      const points = rect(w, d, 3, 0, z).getSpacedPoints(n).slice(0, -1);
      for (const p of points) positions.push(p.x, y, p.y);
    }
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < n; i++) {
        const a = row * n + i,
          b = row * n + ((i + 1) % n),
          c = b + n,
          d = a + n;
        indices.push(a, c, b, a, d, c);
      }
    for (const [row, reverse] of [
      [0, false],
      [2, true],
    ] as const) {
      const center = positions.length / 3;
      positions.push(0, rings[row][0], rings[row][3]);
      for (let i = 0; i < n; i++) {
        const a = row * n + i,
          b = row * n + ((i + 1) % n);
        indices.push(center, reverse ? b : a, reverse ? a : b);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const housing = put(new T.Mesh(geo, mat()));
    housing.name = 'sony-evf-hump';
    const logo = decal('SONY', 23, [0, 0.5, 15.05]);
    logo.rotation.x = -Math.atan(8 / 9.5);
    box([27, 17, 16], [0, -1, -25], rubber, 3);
    const cup = panel(rect(34, 23, 5), 4, rubber);
    cup.position.set(0, -1, -34);
    const eye = box([23, 14, 0.15], [0, -1, -36.1], '#070d12', 2);
    eye.name = 'sony-evf-eyepiece';
    box([20.4, 11.2, 0.04], [0, -1, -36.21], '#25323a', 1.5);
    cylinder(2.2, 2, [18, -1, -27], black, 'x');
    box([19, 1.1, 20], [0, 9.1, -5], '#36393b', 0.4);
    for (const x of [-9, 9]) box([1.7, 2, 20], [x, 10.5, -5], '#858a8c', 0.25);
    box([15.5, 0.5, 15], [0, 9.9, -5], '#202426', 0.2);
    for (let i = 0; i < 12; i++)
      box([0.45, 0.15, 1.7], [(i - 5.5) * 1.05, 10.25, 3], '#c2b28a', 0.04);
  } else if (part.id === 'top') {
    const shape = new T.Shape();
    shape.moveTo(-62, -26);
    shape.lineTo(60, -26);
    shape.quadraticCurveTo(63, -26, 63, -22);
    shape.lineTo(63, 23);
    shape.bezierCurveTo(63, 35, 41, 35, 36, 28);
    shape.lineTo(28, 20);
    shape.lineTo(-59, 20);
    shape.quadraticCurveTo(-63, 20, -63, 16);
    shape.lineTo(-63, -22);
    shape.quadraticCurveTo(-63, -26, -62, -26);
    shape.holes.push(new T.Path(rect(38, 30, 2, -8, -3).getPoints(32)));
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 5,
      bevelEnabled: true,
      bevelSize: 0.5,
      bevelThickness: 0.5,
      bevelSegments: 3,
      curveSegments: 24,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 2.5, 0);
    put(new T.Mesh(geo, mat()));
    wheel(44, 4, -12, 6, 3);
    wheel(58, 3, -16, 4.3, 2.5);
    cylinder(6.8, 2, [49, 3, 23], '#25282a');
    cylinder(4.7, 1.8, [49, 4.5, 23], '#6b6d6d');
    decal('ON   OFF', 11, [49, 5, 31], 'top');
    cylinder(3.1, 1.2, [35, 3.4, 15]);
    cylinder(1.8, 0.2, [35, 4.1, 15], '#a53027');
    box([7, 1, 5], [22, 3.2, 17], black, 2);
    decal('C2', 5, [22, 3.8, 17], 'top');
    decal('α', 5, [-48, 2.85, 0], 'top', '#777a76');
  } else if (part.id === 'dial') {
    wheel(0, -1, 0, 10, 4);
    wheel(0, 2, 0, 9.7, 3.4);
    cylinder(2.1, 1, [0, 4.1, 0]);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      decal(
        ['P', 'A', 'S', 'M', '1', '2', '3', 'AUTO'][i],
        3.8,
        [Math.sin(a) * 6.6, 3.8, Math.cos(a) * 6.6],
        'top',
      );
    }
    decal('S&Q', 5, [0, -3, 10.2]);
  } else if (part.id === 'base') {
    box([123, 3, 44], [0, 0, 0], black, 2);
    cylinder(3, 1, [-8, -1.8, 0], '#73777a');
    cylinder(1.6, 1.1, [-8, -2.1, 0], rubber);
    box([24, 0.4, 34], [46, -1.6, 0], '#202324', 2);
    decal('ILCE-7M4', 24, [-33, -1.8, 0], 'top', '#7b7e7b');
  }
  return g;
}
