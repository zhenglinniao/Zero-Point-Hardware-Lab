import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { DigitalLevel, DigitalPart } from './catalogue.ts';
import type { Vec3 } from '../layout.ts';
import { decorateBoard } from './board-detail.ts';

const scales = new Set([
  'phone-display',
  'ps5-power',
  'ps5-drive',
  'camera-board',
  'camera-shutter',
  'gamepad-haptics',
  'gamepad-right-haptic',
  'earbudunit-processor',
  'earbuds-board',
]);

/** Dedicated mechanical builders. All local coordinates are millimetres. */
export function precisionGeometry(
  level: DigitalLevel,
  part: DigitalPart,
  tools: ModelTools,
): T.Group | null {
  if (!scales.has(level)) return null;
  const [w, h, d] = part.size,
    id = part.id,
    g = new T.Group();
  const material = (color: string, metal = 0.25, rough = 0.55) =>
    tools.material(color, metal, rough);
  const put = <O extends T.Object3D>(o: O, pos: Vec3 = [0, 0, 0]) => {
    o.position.set(...pos);
    g.add(o);
    return o;
  };
  const box = (size: Vec3, color = part.color, metal = 0.25) =>
    tools.box(size, color, metal, Math.min(...size) * 0.12);
  const rounded = (width: number, depth: number, radius = 1) => {
    const s = new T.Shape(),
      x = -width / 2,
      z = -depth / 2,
      r = Math.min(radius, width / 2, depth / 2);
    s.moveTo(x + r, z);
    s.lineTo(-x - r, z);
    s.quadraticCurveTo(-x, z, -x, z + r);
    s.lineTo(-x, -z - r);
    s.quadraticCurveTo(-x, -z, -x - r, -z);
    s.lineTo(x + r, -z);
    s.quadraticCurveTo(x, -z, x, -z - r);
    s.lineTo(x, z + r);
    s.quadraticCurveTo(x, z, x + r, z);
    return s;
  };
  const hole = (width: number, depth: number, x = 0, z = 0, r = 1) =>
    new T.Path(
      rounded(width, depth, r)
        .getPoints(20)
        .map((p) => p.add(new T.Vector2(x, z))),
    );
  const plate = (
    width: number,
    height: number,
    depth: number,
    color = part.color,
    holes: T.Path[] = [],
    radius = 1,
  ) => {
    const shape = rounded(width, depth, radius);
    shape.holes.push(...holes);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 20,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, height / 2, 0);
    return new T.Mesh(
      geo,
      material(color, color.startsWith('#a') ? 0.65 : 0.2),
    );
  };
  const cylinder = (
    r: number,
    length: number,
    color: string,
    inner = 0,
    axis: 'y' | 'z' | 'x' = 'y',
  ) => {
    const geo = inner
      ? new T.LatheGeometry(
          [
            [inner, -length / 2],
            [r, -length / 2],
            [r, length / 2],
            [inner, length / 2],
            [inner, -length / 2],
          ].map(([x, y]) => new T.Vector2(x, y)),
          64,
        )
      : new T.CylinderGeometry(r, r, length, 64);
    if (axis === 'z') geo.rotateX(Math.PI / 2);
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    return new T.Mesh(geo, material(color, 0.55, 0.45));
  };
  const screw = (x: number, y: number, z: number, r = 0.7) => {
    put(cylinder(r, 0.3, '#a9b0b0'), [x, y, z]);
    put(box([r * 1.2, 0.03, r * 0.18], '#252b30'), [x, y + 0.17, z]);
  };
  const winding = (
    radius: number,
    length: number,
    axis: 'y' | 'z',
    turns = 28,
  ) => {
    const points = [];
    for (let i = 0; i <= turns * 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        t = i / (turns * 16);
      points.push(
        axis === 'z'
          ? new T.Vector3(
              Math.cos(a) * radius,
              Math.sin(a) * radius,
              (t - 0.5) * length,
            )
          : new T.Vector3(
              Math.cos(a) * radius,
              (t - 0.5) * length,
              Math.sin(a) * radius,
            ),
      );
    }
    put(
      new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(points),
          turns * 16,
          Math.min(0.12, (length / turns) * 0.3),
          6,
          false,
        ),
        material('#bd8246', 0.7, 0.4),
      ),
    );
  };

  if (level === 'phone-display') {
    if (id === 'seal')
      put(plate(w, h, d, '#303638', [hole(w - 1.1, d - 1.1, 0, 0, 8.3)], 8.8));
    else if (id === 'flex') {
      put(plate(w, h, d, '#a26c2a', [], 0.6));
      for (let i = 0; i < 24; i++)
        put(box([0.12, 0.012, d * 0.85], '#d0a65a', 0.65), [
          ((i - 11.5) * w) / 27,
          h / 2 + 0.008,
          0,
        ]);
      put(box([w * 0.9, 0.1, 1.4], '#171e25'), [0, 0.09, d / 2 - 1]);
    } else {
      const apertures = id === 'backplate' ? [hole(22, 6, 0, -62.5, 3)] : [];
      const pane = put(
        plate(w, h, d, id === 'glass' ? '#121a20' : part.color, apertures, 8.5),
      );
      if (id === 'glass') {
        pane.material = new T.MeshPhysicalMaterial({
          color: '#101c23',
          roughness: 0.18,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
        });
        put(
          plate(
            w - 2,
            0.008,
            d - 2,
            '#20303a',
            [hole(20, 5, 0, -62.5, 2.5)],
            7.5,
          ),
          [0, h / 2 + 0.005, 0],
        );
        put(plate(20, 0.009, 5, '#030608', [], 2.5), [0, h / 2 + 0.006, -62.5]);
      }
      if (id === 'backplate')
        for (const x of [-w * 0.46, w * 0.46])
          for (const z of [-d * 0.45, d * 0.45])
            screw(x, h / 2 + 0.02, z, 0.32);
    }
    return g;
  }
  if (level === 'gamepad-haptics' || level === 'gamepad-right-haptic') {
    if (id === 'sleeve') put(cylinder(7.5, 24, '#969fa2', 6.2, 'z'));
    else if (id === 'magnet') {
      put(cylinder(4.5, 10, '#4c5358', 1.6, 'z'));
      put(cylinder(1.3, 20, '#a8adaf', 0, 'z'));
    } else if (id === 'mass') put(cylinder(6, 12, '#7d878e', 5.4, 'z'));
    else if (id === 'coil') {
      put(cylinder(5.15, 11, '#955f2d', 4.7, 'z'));
      winding(5.2, 10, 'z', 34);
    } else {
      put(cylinder(7.5, 0.8, '#a6adb1', 1.5, 'z'));
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3,
          leaf = box([0.55, 7, 0.15], '#737f85', 0.65);
        leaf.rotation.z = a;
        put(leaf, [Math.sin(a) * 3, Math.cos(a) * 3, 0]);
      }
    }
    return g;
  }
  if (level === 'ps5-drive') {
    const yzPlate = (
      width: number,
      height: number,
      depth: number,
      color: string,
      holes: T.Path[] = [],
    ) => {
      const mesh = plate(height, width, depth, color, holes, 3);
      mesh.rotation.z = Math.PI / 2;
      return mesh;
    };
    if (id === 'chassis') {
      put(yzPlate(1.2, h, d, '#879398'), [-9.4, 0, 0]);
      for (const z of [-d / 2 + 0.6, d / 2 - 0.6])
        put(box([w, h, 1.2], '#879398', 0.7), [0, 0, z]);
      for (const y of [-h / 2 + 0.6, h / 2 - 0.6])
        put(box([w, 1.2, d - 2.4], '#879398', 0.7), [0, y, 0]);
      for (const y of [-h * 0.43, h * 0.43])
        for (const z of [-d * 0.42, d * 0.42])
          put(cylinder(3, 2, '#252c30', 1.1, 'x'), [-7.5, y, z]);
    } else if (id === 'cover') {
      put(yzPlate(w, h, d, '#a4adb1'));
      put(cylinder(16, 0.5, '#8c989f', 3, 'x'), [0.75, 8, 7]);
    } else if (id === 'spindle') {
      put(cylinder(15, 4, '#232b32', 0, 'x'));
      put(cylinder(8, 7, '#9aa4a7', 0, 'x'));
      put(cylinder(2, 10, '#bdc4c4', 0, 'x'));
    } else if (id === 'rails') {
      for (const z of [-17, 17]) put(cylinder(1.1, h, '#b6bec0'), [0, 0, z]);
      put(cylinder(0.85, h, '#8a949a'), [2, 0, 13]);
    } else if (id === 'pickup') {
      put(box([5, h, d], '#434d54', 0.4));
      put(cylinder(5.6, 4, '#263c50', 0, 'x'), [3, 0, 0]);
      for (const z of [-d * 0.4, d * 0.4])
        put(box([6, 4, 2], '#a7afb0', 0.6), [0, 0, z]);
    } else if (id === 'loader') {
      put(cylinder(4, 100, '#2a3138', 1.2, 'z'));
      for (const z of [-53, 53]) {
        put(cylinder(7.5, 3, '#d9d7ca', 2, 'z'), [0, 0, z]);
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12,
            t = box([1.2, 1.2, 2.7], '#d9d7ca');
          t.rotation.z = a;
          put(t, [Math.sin(a) * 8, Math.cos(a) * 8, z]);
        }
      }
    } else {
      put(yzPlate(0.8, h, d, '#315a48'));
      put(box([1.5, 10, 12], '#232c33'), [1.3, 0, 0]);
      for (const y of [-h * 0.35, h * 0.35])
        put(box([2.5, 2.5, d * 0.75], '#b39a63'), [1.8, y, 0]);
    }
    return g;
  }
  if (level === 'ps5-power') {
    if (id === 'housing') {
      put(plate(w, 1.4, d, '#222b31', [], 5), [0, -h / 2 + 0.7, 0]);
      for (const x of [-w / 2 + 0.7, w / 2 - 0.7])
        put(box([1.4, h - 1.4, d], '#222b31'), [x, 0.7, 0]);
      for (const z of [-d / 2 + 0.7, d / 2 - 0.7])
        put(box([w - 2.8, h - 1.4, 1.4], '#222b31'), [0, 0.7, z]);
      for (const x of [-w * 0.4, w * 0.4])
        for (const z of [-d * 0.43, d * 0.43])
          put(cylinder(2.4, 8, '#404b50', 1), [x, -h / 2 + 5, z]);
    } else if (id === 'cover') {
      const vents = [];
      for (let i = 0; i < 28; i++)
        vents.push(hole(w - 12, 2, 0, (i - 13.5) * 5, 0.7));
      put(plate(w, h, d, '#30383e', vents, 5));
    } else if (id === 'bulk') {
      put(cylinder(w / 2, h, '#30393e'));
      put(cylinder(w * 0.45, 0.3, '#a7b0b3'), [0, h / 2 + 0.16, 0]);
      put(box([w * 0.7, 0.05, 0.5], '#4e585c'), [0, h / 2 + 0.34, 0]);
      put(box([0.5, 0.05, w * 0.7], '#4e585c'), [0, h / 2 + 0.34, 0]);
      for (const x of [-3, 3])
        put(cylinder(0.5, 2, '#b5b7ad'), [x, -h / 2 - 1, 0]);
    } else if (id === 'transformer') {
      put(box([w * 0.8, h * 0.86, d * 0.8], '#363d42'));
      put(box([w * 0.66, h * 0.65, d * 0.92], '#bda35a'));
      for (const y of [-h * 0.43, h * 0.43])
        put(box([w, h * 0.14, d], '#2f373d'), [0, y, 0]);
      for (let i = 0; i < 16; i++)
        put(box([w * 0.69, h * 0.5, 0.24], '#b2763c', 0.6), [
          0,
          0,
          (i - 7.5) * d * 0.035,
        ]);
    } else if (id === 'input') {
      put(box([w, 2, d], '#305445'), [0, -h / 2 + 1, 0]);
      put(cylinder(9, 8, '#4f5854', 5), [-8, -3, 0]);
      for (let i = 0; i < 18; i++) {
        const a = (i * Math.PI) / 9;
        put(cylinder(0.5, 9, '#ba844c'), [
          -8 + Math.sin(a) * 7,
          -3,
          Math.cos(a) * 7,
        ]);
      }
      put(box([12, 16, 10], '#b7ac76'), [11, -3, 5]);
      put(box([12, 11, 8], '#1e272d'), [11, -4, -8]);
    } else if (id === 'secondary') {
      put(box([w, 1, d], '#315748'), [0, -h / 2 + 0.5, 0]);
      for (const x of [-12, 0, 12]) put(cylinder(4, 15, '#424b50'), [x, -3, 7]);
      for (let i = 0; i < 8; i++)
        put(box([1, 18, 13], '#a3acb0', 0.7), [(i - 3.5) * 4, 0, -5]);
      for (const x of [-12, 12]) put(box([6, 4, 7], '#222b31'), [x, -7, -5]);
    } else if (id === 'pcb') {
      const shape = rounded(w, d, 2);
      shape.holes.push(hole(w * 0.65, 1.1, 0, 31, 0.3));
      put(plate(w, h, d, part.color, shape.holes, 2));
      decorateBoard(g, shape, w, d, h, level, part, tools);
    } else return null;
    return g;
  }
  if (level === 'camera-shutter') {
    if (id === 'frame') {
      put(plate(w, h, d, '#363f45', [hole(36.6, 24.6, 0, 0, 0.3)], 1.5));
      for (const x of [-w * 0.45, w * 0.45])
        for (const z of [-d * 0.43, d * 0.43]) screw(x, h / 2, z, 0.55);
    } else if (id === 'first' || id === 'second') {
      for (let i = 0; i < 5; i++) {
        const leaf = plate(
          w,
          0.035,
          d / 5 + 0.3,
          i % 2 ? '#41494f' : '#292f36',
          [],
          0.08,
        );
        put(leaf, [0, (i - 2) * 0.04, ((i - 2) * d) / 5]);
      }
    } else if (id === 'drive') {
      put(box([w, h, d], '#30383e'));
      for (const z of [-d * 0.34, d * 0.34])
        put(cylinder(1.1, 0.5, '#a4acae'), [0, h / 2 + 0.25, z]);
      put(box([0.45, 0.2, d * 0.65], '#a3a8a9'), [0, h / 2 + 0.6, 0]);
    } else {
      put(plate(w, h, d, '#b47b34', [], 0.3));
      for (let i = 0; i < 12; i++)
        put(box([0.12, 0.01, d * 0.85], '#d7ac65'), [
          ((i - 5.5) * w) / 14,
          h / 2 + 0.01,
          0,
        ]);
    }
    return g;
  }
  if (part.shape === 'board') {
    const shape = rounded(w, d, Math.min(w, d) * 0.04);
    if (level === 'camera-board')
      shape.holes.push(hole(16, 7, -27, -d / 2 + 3.6, 0.5));
    const geo = new T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 20,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, h / 2, 0);
    put(new T.Mesh(geo, material(part.color, 0.15, 0.75)));
    decorateBoard(g, shape, w, d, h, level, part, tools);
    return g;
  }
  if (id === 'shield' && level === 'camera-board') {
    put(plate(w, h, d, '#a4adb1', [], 1.3));
    for (const x of [-w / 2 + 0.15, w / 2 - 0.15])
      put(box([0.3, 1.7, d], '#a4adb1', 0.65), [x, -1.025, 0]);
    for (const z of [-d / 2 + 0.15, d / 2 - 0.15])
      put(box([w - 0.6, 1.7, 0.3], '#a4adb1', 0.65), [0, -1.025, z]);
    return g;
  }
  if (part.shape === 'connector') {
    const count = w > 10 ? 4 : 1,
      actualW = count === 1 ? w : w * 0.18,
      actualD = count === 1 ? d : Math.min(2, d * 0.1);
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 0 : (i - (count - 1) / 2) * w * 0.25,
        z = count === 1 ? 0 : (i % 2 ? 1 : -1) * d * 0.42;
      put(
        plate(
          actualW,
          h,
          actualD,
          '#a0aaa9',
          [hole(actualW * 0.8, actualD * 0.65, 0, 0, 0.08)],
          0.1,
        ),
        [x, 0, z],
      );
      for (let pin = 0; pin < 12; pin++)
        put(box([actualW / 25, h * 0.18, actualD * 0.45], '#c0a064', 0.7), [
          x + ((pin - 5.5) * actualW) / 15,
          0,
          z,
        ]);
    }
    return g;
  }
  return null; // Existing dedicated BGA package builder supplies small chips.
}
