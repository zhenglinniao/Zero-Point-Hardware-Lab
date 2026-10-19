import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { Vec3 } from '../layout.ts';
import type { DigitalLevel, DigitalPart } from './catalogue.ts';

/** Authored, photo-referenced geometry in native millimetres. No remote textures,
 * mesh downloads, opaque fake internal blocks, or random component placement. */
export function detailedGeometry(
  level: DigitalLevel,
  part: DigitalPart,
  unit: number,
  tools: ModelTools,
): T.Group {
  const g = new T.Group();
  const [w, h, d] = part.size;
  const ink = '#171c23',
    silver = '#9da5aa',
    copper = '#b78343';
  const mat = (color: string, metal = 0.25, rough = 0.5) =>
    tools.material(color, metal, rough);
  const put = <O extends T.Object3D>(
    object: O,
    pos: Vec3 = [0, 0, 0],
    parent: T.Group = g,
  ): O => {
    object.position.set(...pos);
    parent.add(object);
    return object;
  };
  const box = (
    size: Vec3,
    color = part.color,
    metal = 0.25,
    radius = Math.min(...size) * 0.12,
  ) => tools.box(size, color, metal, radius);
  const disk = (
    r: number,
    height: number,
    color = silver,
    inner = 0,
    segments = 48,
  ) => {
    if (!inner)
      return new T.Mesh(
        new T.CylinderGeometry(r, r, height, segments),
        mat(color, 0.5),
      );
    const s = new T.Shape();
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    const hole = new T.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return new T.Mesh(extrusion(s, height), mat(color, 0.55));
  };
  function rounded(
    width: number,
    depth: number,
    radius: number,
    cx = 0,
    cz = 0,
  ) {
    const x = cx - width / 2,
      z = cz - depth / 2,
      r = Math.min(radius, width / 2, depth / 2);
    const s = new T.Shape();
    s.moveTo(x + r, z);
    s.lineTo(x + width - r, z);
    s.quadraticCurveTo(x + width, z, x + width, z + r);
    s.lineTo(x + width, z + depth - r);
    s.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth);
    s.lineTo(x + r, z + depth);
    s.quadraticCurveTo(x, z + depth, x, z + depth - r);
    s.lineTo(x, z + r);
    s.quadraticCurveTo(x, z, x + r, z);
    return s;
  }
  function extrusion(shape: T.Shape, height: number, bevel = 0) {
    const geom = new T.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      curveSegments: 24,
    });
    geom.rotateX(Math.PI / 2);
    geom.translate(0, height / 2, 0);
    return geom;
  }
  const plate = (
    width: number,
    height: number,
    depth: number,
    color = part.color,
    radius = 2,
    holes: T.Path[] = [],
  ) => {
    const s = rounded(width, depth, radius);
    s.holes.push(...holes);
    return new T.Mesh(extrusion(s, height), mat(color, 0.3));
  };
  const circleHole = (x: number, z: number, r: number) => {
    const hole = new T.Path();
    hole.absarc(x, z, r, 0, Math.PI * 2, true);
    return hole;
  };
  const rectHole = (
    x: number,
    z: number,
    width: number,
    depth: number,
    radius = 1,
  ) => new T.Path(rounded(width, depth, radius, x, z).getPoints(16));
  const text = (
    value: string,
    pos: Vec3,
    width: number,
    color = '#cad0c9',
    parent = g,
  ) => tools.label(parent, value, pos, width, color);
  const screw = (pos: Vec3, radius = 1, parent = g) => {
    put(disk(radius, 0.45, silver), pos, parent);
    put(
      box([radius * 1.3, 0.08, radius * 0.19], ink),
      [pos[0], pos[1] + 0.26, pos[2]],
      parent,
    );
    put(
      box([radius * 0.19, 0.08, radius * 1.3], ink),
      [pos[0], pos[1] + 0.26, pos[2]],
      parent,
    );
  };
  const tube = (points: Vec3[], radius: number, color: string, parent = g) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
    );
    put(
      new T.Mesh(
        new T.TubeGeometry(
          curve,
          Math.max(12, points.length * 8),
          radius,
          8,
          false,
        ),
        mat(color, 0.45),
      ),
      [0, 0, 0],
      parent,
    );
  };
  const flex = (points: Vec3[], width: number, parent = g) => {
    // A ribbon with finite width, not a copper-coloured opaque brick.
    const positions: number[] = [];
    const indices: number[] = [];
    points.forEach(([x, y, z]) =>
      positions.push(x - width / 2, y, z, x + width / 2, y, z),
    );
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    const m = mat('#a86d28', 0.45, 0.6).clone();
    m.side = T.DoubleSide;
    put(new T.Mesh(geom, m), [0, 0, 0], parent);
    for (const offset of [-0.3, 0, 0.3])
      tube(
        points.map(([x, y, z]) => [x + offset * width, y + 0.035, z]),
        0.035,
        '#d0a65b',
        parent,
      );
    const end = points[points.length - 1];
    put(
      box([width, 0.25, 1.6], '#e6d8b5'),
      [end[0], end[1] + 0.15, end[2]],
      parent,
    );
  };
  const chip = (size: Vec3, pos: Vec3, label = '', parent = g) => {
    put(box(size, ink, 0.12), pos, parent);
    for (const x of [-size[0] / 2, size[0] / 2])
      for (let i = 0; i < 6; i++)
        put(
          box([0.35, 0.2, 0.35], silver, 0.65),
          [pos[0] + x, pos[1] - 0.1, pos[2] + ((i - 2.5) * size[2]) / 7],
          parent,
        );
    if (label)
      text(
        label,
        [pos[0], pos[1] + size[1] / 2 + 0.025, pos[2]],
        size[0] * 0.85,
        '#8f9998',
        parent,
      );
  };
  const connector = (size: Vec3, pos: Vec3, parent = g) => {
    const [a, b, c] = size;
    put(
      plate(a, b, c, silver, Math.min(b / 2, 1), [
        rectHole(0, 0, a * 0.74, c * 0.8, 0.5),
      ]),
      pos,
      parent,
    );
    put(box([a * 0.65, Math.min(0.5, b * 0.2), c * 0.7], ink), pos, parent);
    for (let i = 0; i < 8; i++)
      put(
        box([a * 0.045, 0.12, c * 0.38], copper, 0.6),
        [pos[0] + (i - 3.5) * a * 0.08, pos[1] + 0.4, pos[2]],
        parent,
      );
  };
  function pcb(width = w, depth = d, height = h, vertical = false) {
    let shape = rounded(width, depth, Math.min(width, depth) * 0.06);
    if (level === 'ps5board') {
      // Notch for the upper-side fan, observed on the original EDM-010 board.
      shape = new T.Shape();
      shape.moveTo(-width / 2, -depth / 2);
      shape.lineTo(width / 2, -depth / 2);
      shape.lineTo(width / 2, depth / 2);
      shape.lineTo(-5, depth / 2);
      shape.quadraticCurveTo(-10, 55, -width / 2, 55);
      shape.closePath();
    } else if (level === 'phoneboard') {
      const x = width / 2,
        z = depth / 2;
      shape = new T.Shape();
      shape.moveTo(-x, -z);
      shape.lineTo(x * 0.65, -z);
      shape.lineTo(x, -z + 8);
      shape.lineTo(x, z - 9);
      shape.lineTo(x * 0.4, z - 9);
      shape.lineTo(x * 0.4, z);
      shape.lineTo(-x, z);
      shape.lineTo(-x, -z + 14);
      shape.closePath();
    } else if (level === 'gamepadboard') {
      const x = width / 2,
        z = depth / 2;
      shape = new T.Shape();
      shape.moveTo(-x, -z);
      shape.lineTo(x, -z);
      shape.lineTo(x, z - 10);
      shape.lineTo(37, z - 10);
      shape.quadraticCurveTo(28, 3, 17, z);
      shape.lineTo(-17, z);
      shape.quadraticCurveTo(-28, 3, -37, z - 10);
      shape.lineTo(-x, z - 10);
      shape.closePath();
    }
    for (const x of [-0.4, 0.4])
      for (const z of [-0.38, 0.38])
        shape.holes.push(
          circleHole(width * x, depth * z, Math.min(width, depth) * 0.025),
        );
    put(
      new T.Mesh(
        extrusion(shape, height),
        mat(
          level.startsWith('phone') || level.startsWith('earbud')
            ? '#243b36'
            : '#27583e',
          0.15,
          0.7,
        ),
      ),
    );
    // Geometric surface traces remain separate from modelled electrical claims.
    const vertices: number[] = [];
    for (let i = 0; i < 26; i++) {
      const x = (i / 25 - 0.5) * width * 0.75,
        z = ((i % 7) / 7 - 0.5) * depth * 0.7;
      vertices.push(
        x,
        height / 2 + 0.015,
        z,
        x * 0.8,
        height / 2 + 0.015,
        z + depth * 0.035,
        x * 0.8,
        height / 2 + 0.015,
        z + depth * 0.035,
        x * 0.8 + width * 0.08,
        height / 2 + 0.015,
        z + depth * 0.09,
      );
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    put(
      new T.LineSegments(
        geo,
        new T.LineBasicMaterial({
          color: '#75926a',
          transparent: true,
          opacity: 0.45,
        }),
      ),
    );
    for (const x of [-0.4, 0.4])
      for (const z of [-0.38, 0.38])
        put(
          disk(
            Math.min(width, depth) * 0.038,
            0.08,
            copper,
            Math.min(width, depth) * 0.025,
          ),
          [width * x, height / 2 + 0.06, depth * z],
        );
    // Dense deterministic passive banks on free edge lanes, not a random scatter.
    for (let i = 0; i < 40; i++) {
      const x = (i % 2 ? 1 : -1) * width * 0.42,
        z = (Math.floor(i / 2) / 19 - 0.5) * depth * 0.65;
      const size: Vec3 = [
        Math.max(0.35, width * 0.022),
        0.35,
        Math.max(0.45, depth * 0.012),
      ];
      put(box(size, i % 3 ? '#bba97d' : '#414b49'), [x, height / 2 + 0.2, z]);
      for (const sign of [-1, 1])
        put(box([size[0] * 0.22, 0.38, size[2]], silver, 0.6), [
          x + sign * size[0] * 0.4,
          height / 2 + 0.2,
          z,
        ]);
    }
    if (vertical) g.rotation.x = Math.PI / 2;
  }
  function battery() {
    put(plate(w, h, d, part.color, Math.min(w, d) * 0.08));
    put(plate(w * 0.96, 0.1, d * 0.96, '#252a2d', 1), [0, h / 2 + 0.06, 0]);
    for (const x of [-1, 1])
      put(box([0.3, h * 0.55, d * 0.93], '#565d60'), [x * w * 0.48, 0, 0]);
    flex(
      [
        [w * 0.25, 0, -d / 2],
        [w * 0.25, 0.3, -d / 2 - 1.2],
        [w * 0.25, 0.6, -d / 2 - 2],
      ],
      Math.min(3, w * 0.15),
    );
    text(
      level === 'phone'
        ? 'Li-ion  |  3.87V'
        : level === 'gamepad'
          ? 'RECHARGEABLE  3.65V'
          : 'Li-ion',
      [0, h / 2 + 0.15, d * 0.2],
      w * 0.8,
      '#9ca4a1',
    );
    for (let i = 0; i < 4; i++)
      put(box([w * 0.65, 0.03, d * 0.008], '#8c9591'), [
        0,
        h / 2 + 0.13,
        d * (0.28 + i * 0.04),
      ]);
    if (level === 'phone')
      for (const x of [-w * 0.3, w * 0.3]) {
        put(box([4, 0.1, 6], '#dedbd0'), [x, -h / 2 - 0.1, d / 2 - 1]);
        text('− +', [0, h / 2 + 0.14, -d * 0.28], w * 0.35);
      }
  }
  function lens(radius: number, height: number, parent = g) {
    put(disk(radius, height, '#252c32', radius * 0.72), [0, 0, 0], parent);
    put(
      disk(radius * 0.96, 0.6, silver, radius * 0.78),
      [0, height / 2, 0],
      parent,
    );
    const glass = new T.Mesh(
      new T.SphereGeometry(
        radius * 0.71,
        40,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      ),
      new T.MeshPhysicalMaterial({
        color: '#233b54',
        metalness: 0.48,
        roughness: 0.13,
        clearcoat: 1,
      }),
    );
    glass.scale.y = 0.12;
    put(glass, [0, height * 0.25, 0], parent);
    put(
      disk(radius * 0.42, 0.08, '#080f19'),
      [0, height * 0.28 + 0.15, 0],
      parent,
    );
    put(
      disk(radius * 0.18, 0.04, '#315663'),
      [0, height * 0.28 + 0.22, 0],
      parent,
    );
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      put(
        box([0.25, height * 0.45, 0.5], '#62696d'),
        [Math.sin(a) * radius * 0.94, 0, Math.cos(a) * radius * 0.94],
        parent,
      );
    }
  }
  function shellController(top: boolean) {
    const shape = new T.Shape();
    shape.moveTo(-67, -41);
    shape.bezierCurveTo(-82, -28, -80, 15, -69, 40);
    shape.bezierCurveTo(-60, 60, -44, 50, -33, 23);
    shape.quadraticCurveTo(0, 12, 33, 23);
    shape.bezierCurveTo(44, 50, 60, 60, 69, 40);
    shape.bezierCurveTo(80, 15, 82, -28, 67, -41);
    shape.quadraticCurveTo(0, -52, -67, -41);
    shape.closePath();
    if (top) {
      shape.holes.push(
        circleHole(-28, 17, 10),
        circleHole(28, 17, 10),
        rectHole(0, -22, 53, 29, 5),
      );
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          shape.holes.push(
            circleHole(
              side * 46 + Math.sin(a) * 7.5,
              -18 + Math.cos(a) * 7.5,
              4.1,
            ),
          );
        }
    } else {
      for (const x of [-52, 52])
        for (const z of [-25, 27]) shape.holes.push(circleHole(x, z, 1.1));
    }
    const shellGeometry = extrusion(shape, h, 1.3);
    const vertices = shellGeometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getZ(i);
      const bulge = Math.max(0, 3 * (1 - (x / 82) ** 2) * (1 - (z / 62) ** 2));
      vertices.setY(i, vertices.getY(i) + (top ? bulge : -bulge));
    }
    shellGeometry.computeVertexNormals();
    put(new T.Mesh(shellGeometry, mat(part.color, 0.08, 0.64)));
    if (!top) {
      const wall = shape.clone();
      wall.holes = [];
      wall.holes.push(
        new T.Path(
          shape.getPoints(32).map((p) => new T.Vector2(p.x * 0.94, p.y * 0.92)),
        ),
      );
      put(
        new T.Mesh(extrusion(wall, 36), mat(part.color, 0.08, 0.6)),
        [0, 18, 0],
      );
    }
    for (const x of [-52, 52])
      for (const z of [-25, 27]) {
        put(disk(2.3, 5, '#c4c9c9', 1), [x, top ? -4 : 4, z]);
        screw([x, top ? -6.7 : 6.7, z], 1.2);
      }
    for (const sign of [-1, 1])
      for (let i = 0; i < 4; i++)
        put(box([1.2, 3, 13], '#adb5b5'), [
          sign * (49 + i * 3),
          top ? -3 : 3,
          23 + i * 2,
        ]);
    if (top) {
      const trim = plate(82, 0.7, 29, '#20272c', 12, [
        circleHole(-28, 0, 10),
        circleHole(28, 0, 10),
      ]);
      put(trim, [0, h / 2 + 0.1, 17]);
    }
  }
  function trigger() {
    put(plate(w, 2, d, '#30383c', 3), [0, -h * 0.35, 0]);
    const motor = disk(4.3, 14, silver);
    motor.rotation.z = Math.PI / 2;
    put(motor, [-w * 0.2, 0, 1]);
    // Helical worm and meshing gear are visible, individually shaped elements.
    const curve: Vec3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 12;
      curve.push([
        -w * 0.2 + (i / 96) * 14,
        Math.sin(a) * 1.4,
        1 + Math.cos(a) * 1.4,
      ]);
    }
    tube(curve, 0.32, '#e1d5ae');
    put(disk(6, 2, '#d9d9ce', 1), [4, 1, 0]);
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const tooth = box([1.3, 2, 1.4], '#d9d9ce');
      tooth.rotation.y = a;
      put(tooth, [4 + Math.sin(a) * 6, 1, Math.cos(a) * 6]);
    }
    put(plate(w * 0.85, 4, 9, ink, 3), [0, h * 0.35, -d * 0.35]);
    tube(
      [
        [-7, 1, -6],
        [-8, 4, -9],
        [6, 5, -9],
        [8, 2, -6],
      ],
      0.5,
      silver,
    );
    flex(
      [
        [0, -2, 8],
        [0, -5, 12],
        [0, -6, 17],
      ],
      5,
    );
    for (const x of [-w * 0.4, w * 0.4])
      screw([x, -h * 0.35 + 1.4, d * 0.35], 0.8);
  }
  function budShell(parent = g, shell = true) {
    const shape = new T.Shape();
    shape.absellipse(0, 0, 8.1, 8.8, 0, Math.PI * 2, false, 0);
    if (shell) {
      const hole = new T.Path();
      hole.absellipse(0, 0, 6.8, 7.5, 0, Math.PI * 2, true, 0);
      shape.holes.push(hole);
    }
    const body = new T.Mesh(extrusion(shape, 8, 1), mat('#e9edeb', 0.08, 0.3));
    body.rotation.x = 0.35;
    put(body, [0, 6, 0], parent);
    put(plate(5.5, 18, 5.8, '#e9edeb', 2.4), [2, -4, 5], parent);
    const vent = plate(5, 0.3, 2.5, '#151d20', 1);
    vent.rotation.x = 0.5;
    put(vent, [-5, 11, -3], parent);
    put(plate(3, 0.2, 5, '#20292a', 1), [4, 6, 5], parent);
    for (const x of [1, 3])
      put(box([0.65, 0.3, 3], copper, 0.6), [x, -13.1, 5], parent);
    if (!shell) {
      const cap = new T.Mesh(
        new T.SphereGeometry(8, 32, 20),
        mat('#e9edeb', 0.08, 0.3),
      );
      cap.scale.set(1, 0.7, 1.05);
      put(cap, [0, 7, -1], parent);
    }
  }

  const id = part.id;
  let handled = true;
  if (level === 'ps5' && part.shape === 'wing') {
    // Thin doubly curved surface with a disc-side swelling. Grid topology keeps
    // thickness and curvature, rather than a side-view profile extruded flat.
    const geo = new T.PlaneGeometry(d, h, 28, 42);
    const a = geo.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      const z = a.getX(i),
        y = a.getY(i);
      const flare =
        5 * Math.pow(Math.abs(y) / (h / 2), 2) +
        3 * Math.sin((z / d) * Math.PI);
      const bulge =
        id === 'right-cover'
          ? 11 *
            Math.exp(-Math.pow((y + 60) / 105, 2) - Math.pow((z - 30) / 95, 2))
          : 0;
      const taper = 0.88 + 0.1 * Math.cos((y / h) * Math.PI);
      const sweep = d * 0.09 * Math.sin((y / h) * Math.PI);
      a.setXYZ(
        i,
        (id === 'left-cover' ? -1 : 1) * (flare + bulge),
        y,
        z * taper + sweep,
      );
    }
    geo.computeVertexNormals();
    const m = mat(part.color, 0.05, 0.62).clone();
    m.side = T.DoubleSide;
    put(new T.Mesh(geo, m));
    const inner = geo.clone();
    const vertices = inner.getAttribute('position');
    for (let i = 0; i < vertices.count; i++)
      vertices.setX(i, vertices.getX(i) + (id === 'left-cover' ? 2.6 : -2.6));
    inner.computeVertexNormals();
    put(new T.Mesh(inner, mat('#cdd2d1', 0.05, 0.65)));
    const edgeIndices: number[] = [];
    const boundary: number[] = [];
    for (let c = 0; c < 29; c++) boundary.push(c);
    for (let r = 1; r <= 42; r++) boundary.push(r * 29 + 28);
    for (let c = 27; c >= 0; c--) boundary.push(42 * 29 + c);
    for (let r = 41; r > 0; r--) boundary.push(r * 29);
    const edgeVertices: number[] = [];
    for (const i of boundary)
      edgeVertices.push(
        a.getX(i),
        a.getY(i),
        a.getZ(i),
        vertices.getX(i),
        vertices.getY(i),
        vertices.getZ(i),
      );
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      edgeIndices.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1);
    }
    const edgeGeometry = new T.BufferGeometry();
    edgeGeometry.setAttribute(
      'position',
      new T.Float32BufferAttribute(edgeVertices, 3),
    );
    edgeGeometry.setIndex(edgeIndices);
    edgeGeometry.computeVertexNormals();
    put(new T.Mesh(edgeGeometry, mat(part.color, 0.05, 0.62)));
    const edge = box([2, h * 0.95, 2], part.color);
    put(edge, [1, 0, -d * 0.48]);
    for (let i = 0; i < 6; i++)
      put(box([4, 6, 3], '#c5ccca'), [-2, (i - 2.5) * 52, d * 0.3]);
  } else if (level === 'ps5' && id === 'frame') {
    // Skeleton in the YZ plane, leaving the cooling and electronics visible.
    for (const x of [-w * 0.46, w * 0.46]) {
      const rail = plate(h, 3, d, ink, 18, [
        rectHole(0, 0, h - 20, d - 16, 16),
      ]);
      rail.rotation.z = Math.PI / 2;
      put(rail, [x, 0, 0]);
    }
    for (const y of [-h * 0.46, h * 0.46])
      put(box([w, 8, d * 0.7], ink), [0, y, 0]);
    for (const x of [-w * 0.48, w * 0.48])
      for (let i = 0; i < 38; i++)
        put(box([4, 3, 11], ink), [x, (i - 18.5) * 8.1, -d * 0.48]);
    const front = plate(w, 3, h, ink, 12, [
      rectHole(29, 20, 3, 130, 1),
      rectHole(-27, -87, 10, 16, 2),
      rectHole(-27, -60, 6, 12, 2),
    ]);
    front.rotation.x = Math.PI / 2;
    put(front, [0, 0, d / 2]);
    const vents: T.Path[] = [];
    for (let i = 0; i < 37; i++)
      vents.push(rectHole(0, (i - 18) * 8, w * 0.72, 2.2, 0.8));
    const back = plate(w, 3, h, ink, 12, vents);
    back.rotation.x = Math.PI / 2;
    put(back, [0, 0, -d / 2]);
    for (const x of [-w * 0.44, w * 0.44])
      put(box([1.1, 80, 1], '#416e9b'), [x, 110, d / 2 + 1.6]);
  } else if (level === 'ps5' && id === 'fan') {
    const rotor = new T.Group();
    put(disk(60, 45, '#20262b', 54), [0, 0, 0], rotor);
    put(disk(19, 41, '#3e464d'), [0, 0, 0], rotor);
    for (let i = 0; i < 23; i++) {
      const a = (i * Math.PI * 2) / 23;
      const curve: Vec3[] = [];
      for (let j = 0; j < 5; j++) {
        const r = 24 + j * 7,
          theta = a + j * 0.07;
        curve.push([Math.sin(theta) * r, 0, Math.cos(theta) * r]);
      }
      const ribbon = new T.Shape();
      ribbon.moveTo(0, -20);
      ribbon.lineTo(1, -20);
      ribbon.lineTo(1, 20);
      ribbon.lineTo(0, 20);
      const blade = new T.Mesh(
        new T.ExtrudeGeometry(ribbon, {
          steps: 12,
          bevelEnabled: false,
          extrudePath: new T.CatmullRomCurve3(
            curve.map((p) => new T.Vector3(...p)),
          ),
        }),
        mat('#58616a', 0.3),
      );
      rotor.add(blade);
    }
    for (const y of [-23, 23]) {
      put(disk(61, 1, silver, 53), [0, y, 0], rotor);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const arm = box([42, 1, 3], silver);
        arm.rotation.y = a;
        put(arm, [Math.cos(a) * 35, y, Math.sin(a) * 35], rotor);
      }
    }
    text('DC BRUSHLESS', [0, 21, 0], 29, '#c2c6c7', rotor);
    rotor.rotation.z = Math.PI / 2;
    g.add(rotor);
  } else if (level === 'ps5' && id === 'drive') {
    put(box([w, h, d], silver, 0.65, 3));
    const cover = new T.Group();
    put(disk(53, 0.8, '#b8bfc0', 8), [0, 0, 0], cover);
    cover.rotation.z = Math.PI / 2;
    put(cover, [w / 2 + 0.1, 0, 0]);
    for (const y of [-h * 0.4, h * 0.4])
      for (const z of [-d * 0.4, d * 0.4]) {
        const s = disk(2.3, 1, ink);
        s.rotation.z = Math.PI / 2;
        put(s, [w / 2 + 0.7, y, z]);
      }
    put(box([w * 0.8, 2, d * 0.78], ink), [0, h * 0.45, 0]);
    flex(
      [
        [0, -h * 0.3, d * 0.48],
        [2, -h * 0.3, d * 0.6],
        [10, -h * 0.3, d * 0.65],
      ],
      12,
    );
  } else if (level === 'ps5' && id === 'power') {
    put(plate(w, h, d, ink, 9));
    for (let i = 0; i < 11; i++)
      for (let j = 0; j < 4; j++)
        put(box([2, 3, 4], '#060a0e'), [
          (i - 5) * 4,
          h / 2 + 0.1,
          (j - 1.5) * 15,
        ]);
    connector([17, 9, 12], [0, -h * 0.2, -d * 0.48]);
    text('AC INPUT  |  PSU', [0, h / 2 + 0.4, 0], w * 0.8);
  } else if (level === 'camerasensor' && id === 'filter') {
    put(
      new T.Mesh(
        extrusion(rounded(w, d, 0.4), h),
        new T.MeshPhysicalMaterial({
          color: '#8293b4',
          metalness: 0.25,
          roughness: 0.15,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
          clearcoat: 1,
        }),
      ),
    );
  } else if (level === 'phone' && id === 'back') {
    put(
      plate(w, h, d, part.color, 9, [
        circleHole(-24, -57, 7),
        circleHole(-10, -43, 8),
      ]),
    );
    put(
      plate(34, 1, 35, part.color, 7, [
        circleHole(-7, -7, 7),
        circleHole(7, 7, 8),
      ]),
      [-17, 1, -50],
    );
    for (const [x, z, r] of [
      [-24, -57, 7],
      [-10, -43, 8],
    ])
      put(disk(r, 0.8, silver, r - 0.7), [x, 1.6, z]);
    put(disk(2, 0.3, '#e3e6cf'), [-7, 1.8, -60]);
  } else if (level === 'phone' && id === 'frame') {
    put(plate(w, h, d, part.color, 10, [rectHole(0, 0, w - 4, d - 4, 8)]));
    for (const x of [-31, 31])
      for (let i = 0; i < 7; i++)
        put(disk(1.2, 1.3, silver, 0.5), [x, 2, (i - 3) * 20]);
    for (const x of [-34.9, 34.9]) put(box([1, 2, 17], silver), [x, 0, -17]);
    for (const x of [-24, -20, -16, -12, 12, 16, 20, 24])
      put(box([1.4, 1.2, 1.1], ink), [x, 0, 73.6]);
    connector([10, 3, 4], [0, 0, 72.8]);
    put(
      plate(65, 0.45, 128, '#9b9d9a', 6, [
        rectHole(-10, 8, 42, 86, 4),
        rectHole(-17, -50, 32, 32, 4),
      ]),
      [0, -2, 0],
    );
  } else if (level === 'phone' && id === 'truedepth') {
    put(plate(w, h, d, silver, 1));
    for (const x of [-8, 0, 8]) {
      const optic = new T.Group();
      lens(x === 0 ? 2.5 : 2, 2, optic);
      put(optic, [x, h / 2, 0]);
    }
  } else if (
    level === 'phone' &&
    ['speaker', 'top-speaker', 'haptic'].includes(id)
  ) {
    put(plate(w, h, d, id === 'haptic' ? silver : ink, 2));
    if (id === 'haptic')
      text('TAPTIC', [0, h / 2 + 0.1, 0], w * 0.8, '#30383b');
    else
      for (let i = 0; i < 8; i++)
        put(box([w * 0.045, 0.2, d * 0.5], '#657071'), [
          (i - 3.5) * w * 0.09,
          h / 2 + 0.1,
          0,
        ]);
    for (const x of [-w * 0.4, w * 0.4])
      screw([x, h / 2 + 0.15, d * 0.3], 0.75);
  } else if (level === 'camera' && id === 'front') {
    const shape = rounded(109, 78, 8, -9, 0);
    shape.holes.push(circleHole(-8, 0, 28));
    const mesh = new T.Mesh(extrusion(shape, 4), mat(ink, 0.12, 0.75));
    mesh.rotation.x = Math.PI / 2;
    put(mesh, [0, 0, 17]);
    put(
      plate(29, 76, 37, '#252a2e', 8, [rectHole(0, 0, 22, 29, 5)]),
      [46, -3, 5],
    );
    for (const x of [-53, 28])
      for (const y of [-31, 31]) {
        const post = disk(2.1, 10, silver, 0.8);
        post.rotation.x = Math.PI / 2;
        put(post, [x, y, 12]);
      }
  } else if (level === 'camera' && id === 'back') {
    const shell = plate(w, 3, h, ink, 7, [rectHole(-10, 0, 70, 45, 2)]);
    shell.rotation.x = Math.PI / 2;
    put(shell);
    const controls = new T.Group();
    put(disk(10, 2, ink, 6), [42, 1, -2], controls);
    for (let i = 0; i < 6; i++)
      put(
        disk(2.2, 1, '#424a4d'),
        [37 + (i % 2) * 13, 1.6, -22 + Math.floor(i / 2) * 19],
        controls,
      );
    controls.rotation.x = -Math.PI / 2;
    g.add(controls);
  } else if (level === 'camera' && id === 'board') {
    pcb();
    chip([22, 2, 22], [-12, 2, 0], 'PROCESSOR');
    chip([16, 2, 18], [14, 2, 0], 'MEMORY');
    for (const x of [-30, 30])
      for (const z of [-21, 21]) connector([10, 1.4, 4], [x, 2, z]);
    put(plate(30, 0.6, 23, silver, 2), [-8, 3.5, -16]);
  } else if (level === 'camera' && id === 'finder') {
    put(plate(w, h, d, ink, 4));
    const eyecup = plate(32, 4, 23, '#11171c', 5, [rectHole(0, 0, 23, 15, 2)]);
    eyecup.rotation.x = Math.PI / 2;
    put(eyecup, [0, 0, -d / 2]);
    const optic = new T.Group();
    lens(8, 7, optic);
    optic.rotation.x = Math.PI / 2;
    put(optic, [0, 0, 0]);
    flex(
      [
        [0, -h / 2, 0],
        [0, -h / 2 - 5, 1],
        [0, -h / 2 - 9, 6],
      ],
      8,
    );
  } else if (level === 'camera' && id === 'top') {
    put(plate(w, h, d, ink, 6, [rectHole(-8, -4, 31, 25, 3)]));
    put(plate(21, 2, 18, silver, 1), [-8, h / 2 + 1, 0]);
    for (const x of [-16, 0]) put(box([2, 2, 18], ink), [x, h / 2 + 2, 0]);
    for (const x of [-43]) {
      put(disk(9, 4, ink), [x, h / 2 + 2, 0]);
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        put(box([0.6, 3, 0.6], '#596164'), [
          x + Math.sin(a) * 8.5,
          h / 2 + 2,
          Math.cos(a) * 8.5,
        ]);
      }
    }
    put(disk(5, 2, silver), [48, h / 2 + 4, 14]);
  } else if (level === 'gamepad' && (id === 'top' || id === 'back'))
    shellController(id === 'top');
  else if (level === 'gamepad' && (id === 'triggers' || id === 'right-trigger'))
    trigger();
  else if (level === 'gamepad' && (id === 'haptics' || id === 'right-haptic')) {
    const motor = new T.Group();
    put(disk(9, 31, silver), [0, 0, 0], motor);
    put(disk(7.8, 2, ink), [0, 16, 0], motor);
    put(disk(7, 1, copper), [0, -16, 0], motor);
    motor.rotation.x = Math.PI / 2;
    g.add(motor);
    for (const [x, c] of [
      [-2, '#8f3d36'],
      [2, '#24292d'],
    ] as const)
      tube(
        [
          [x, 4, -12],
          [x, 5, -18],
          [x + 8, 5, -23],
        ],
        0.4,
        c,
      );
  } else if (level === 'gamepad' && id === 'buttons') {
    // Cross pad is a single moulding, right-side action keys are independent caps.
    for (const [a, b, c] of [
      [20, 5, 6],
      [6, 5, 20],
    ] as Vec3[])
      put(box([a, b, c], '#c7cecd'), [-46, 0, 0]);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const x = 46 + Math.sin(a) * 8,
        z = Math.cos(a) * 8;
      put(disk(4, 5, '#e4e9e8'), [x, 0, z]);
      text(['△', '○', '×', '□'][i], [x, 2.6, z], 5, '#717f83');
    }
  } else if (level === 'earbuds' && id === 'case') {
    put(plate(w, h, d, '#e6eae7', 10, [rectHole(0, 0, w - 3, d - 3, 8)]));
    put(plate(w - 2, 1.4, d - 2, '#e6eae7', 9), [0, -h / 2 + 0.7, 0]);
    put(disk(0.7, 0.2, '#8d9b6c'), [0, 0, d / 2 + 0.1]);
  } else if (level === 'earbuds' && id === 'lid') {
    put(plate(w, h, d, '#e8edeb', 10, [rectHole(0, 0, w - 4, d - 4, 7)]));
    put(plate(w - 1, 1.5, d - 1, '#eef0ed', 9), [0, h / 2 - 0.6, 0]);
    put(
      plate(w - 7, 1, d - 5, '#f7f8f2', 7, [
        circleHole(-14, 0, 7),
        circleHole(14, 0, 7),
      ]),
      [0, -h / 2, 0],
    );
  } else if (level === 'earbuds' && id === 'tray') {
    put(
      plate(w, h, d, '#eaefec', 8, [
        circleHole(-14, 0, 7.7),
        circleHole(14, 0, 7.7),
      ]),
    );
    for (const x of [-14, 14]) {
      put(disk(8.5, 13, '#d6dedb', 7.5), [x, -5, 0]);
      for (const offset of [-1, 1])
        put(disk(0.7, 2, copper), [x + offset * 1.5, -9, 3]);
    }
  } else if (level === 'earbuds' && id === 'left') budShell(g, false);
  else if (level === 'earbudunit' && id === 'shell') budShell();
  else if (level === 'earbudunit' && id === 'tip') {
    const points = [
      [2.5, -2.5],
      [3.5, -2.5],
      [5.8, -0.8],
      [6, 1],
      [5.5, 2.5],
      [4.8, 2.5],
      [4.4, 1],
      [3.8, 0],
      [2.5, 0],
      [2.5, -2.5],
    ].map(([x, y]) => new T.Vector2(x, y));
    put(new T.Mesh(new T.LatheGeometry(points, 48), mat('#dce3df', 0.02, 0.8)));
  } else if (level === 'earbudunit' && id === 'battery') {
    put(disk(4.5, 5, silver));
    put(disk(3.8, 0.25, '#b8aa8d'), [0, 2.65, 0]);
    text('Li-ion', [0, 2.9, 0], 6, '#343c3d');
  } else handled = false;

  if (!handled)
    switch (part.shape) {
      case 'battery':
        battery();
        break;
      case 'board':
        pcb();
        if (id === 'vrm')
          for (let i = 0; i < 10; i++) {
            put(box([7, 4, 6], '#69716e'), [0, 3, (i - 4.5) * 8]);
            chip([4, 1, 4], [6, 2, (i - 4.5) * 8]);
          }
        else if (!['pcb', 'carrier'].includes(id)) {
          chip([w * 0.3, 1, d * 0.2], [0, h / 2 + 1, 0]);
          for (let i = 0; i < 3; i++)
            connector(
              [w * 0.15, 0.7, 2],
              [(i - 1) * w * 0.27, h / 2 + 0.5, d * 0.36],
            );
        }
        break;
      case 'chip':
        if (level === 'ps5board' && id === 'apu') {
          put(box([w, h, d], '#314c40'));
          put(box([25, 0.7, 28], '#9ca7a9', 0.85), [0, h / 2 + 0.4, 0]);
          for (let i = 0; i < 32; i++) {
            const a = (i * Math.PI) / 16;
            put(box([1.6, 0.4, 1], silver), [
              Math.sin(a) * 22,
              h / 2 + 0.3,
              Math.cos(a) * 22,
            ]);
          }
        } else
          chip(
            part.size,
            [0, 0, 0],
            id === 'soc'
              ? 'A16 BIONIC'
              : id.startsWith('memory')
                ? 'GDDR6'
                : id.startsWith('nand')
                  ? 'NAND'
                  : id.toUpperCase(),
          );
        break;
      case 'screen': {
        put(plate(w, h, d, ink, Math.min(w, d) * 0.06));
        const face = plate(
          w - 2,
          0.1,
          d - 2,
          '#101c22',
          Math.min(w, d) * 0.055,
        );
        put(face, [0, h / 2 + 0.07, 0]);
        if (level === 'phone') {
          put(plate(20, 0.12, 5, '#02070b', 2.5), [0, h / 2 + 0.15, -d * 0.43]);
        } else {
          text('LIVE VIEW', [0, h / 2 + 0.18, 0], w * 0.5, '#66828a');
        }
        flex(
          [
            [w * 0.2, -h / 2, d * 0.2],
            [w * 0.2, -h / 2 - 2, d * 0.35],
            [w * 0.1, -h / 2 - 3, d * 0.45],
          ],
          w * 0.12,
        );
        break;
      }
      case 'lens':
        lens(Math.min(w, d) / 2, h);
        break;
      case 'ring':
        put(disk(Math.min(w, d) / 2, h, part.color, Math.min(w, d) * 0.34));
        break;
      case 'mount': {
        if (level === 'earbuds') {
          put(box(part.size, silver));
          for (const x of [-w * 0.35, w * 0.35]) {
            const axis = disk(1.7, w * 0.2, ink);
            axis.rotation.z = Math.PI / 2;
            put(axis, [x, 0, 0]);
          }
          break;
        }
        put(disk(w / 2, h, silver, w * 0.38));
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          screw(
            [Math.sin(a) * w * 0.44, h / 2 + 0.2, Math.cos(a) * w * 0.44],
            0.9,
          );
        }
        for (let i = 0; i < 10; i++) {
          const a = 2.1 + i * 0.08;
          put(disk(0.6, 0.8, copper), [
            Math.sin(a) * w * 0.37,
            h / 2 + 0.5,
            Math.cos(a) * w * 0.37,
          ]);
        }
        break;
      }
      case 'connector':
        if (id === 'ports')
          for (let i = 0; i < 4; i++)
            connector([w * 0.18, h, d], [(i - 1.5) * w * 0.25, 0, 0]);
        else if (id === 'connectors')
          for (let i = 0; i < 5; i++)
            connector([w * 0.8, h, 4], [0, 0, (i - 2) * d * 0.2]);
        else if (id === 'slots')
          for (const x of [-w * 0.24, w * 0.24])
            connector([w * 0.44, h, d], [x, 0, 0]);
        else if (id === 'm2-slot') {
          connector([w, 4, 8], [0, 0, -d * 0.43]);
          for (const z of [-5, 20, 35]) put(disk(2, 3, silver, 0.8), [0, 0, z]);
        } else connector(part.size, [0, 0, 0]);
        break;
      case 'flex':
        if (level === 'gamepad')
          for (const sign of [-1, 1]) {
            flex(
              [
                [sign * w * 0.4, 0, -d * 0.4],
                [sign * w * 0.24, 1, -d * 0.25],
                [sign * w * 0.18, 2, d * 0.1],
              ],
              7,
            );
            tube(
              [
                [sign * w * 0.45, 0, d * 0.4],
                [sign * w * 0.3, 2, d * 0.2],
                [sign * w * 0.1, 2, 0],
              ],
              0.5,
              '#7d3936',
            );
          }
        else
          for (let i = 0; i < (w > 35 ? 3 : 2); i++)
            flex(
              [
                [(i - 0.5) * w * 0.35, 0, -d * 0.4],
                [(i - 0.5) * w * 0.35, 1, 0],
                [(i - 0.5) * w * 0.25, 2, d * 0.4],
              ],
              Math.min(8, w * 0.24),
            );
        break;
      case 'screws':
        for (const x of [
          -(level === 'ps5' ? h : w) * 0.45,
          (level === 'ps5' ? h : w) * 0.45,
        ])
          for (let i = 0; i < 7; i++)
            screw(
              [x, 0, (i - 3) * d * 0.14],
              Math.max(0.6, Math.min(w, d) * 0.013),
            );
        if (level === 'ps5') g.rotation.z = Math.PI / 2;
        break;
      case 'shield': {
        const holes = [rectHole(-w * 0.06, 0, w * 0.4, d * 0.3, 3)];
        for (const x of [-w * 0.42, w * 0.42])
          for (let i = 0; i < 5; i++)
            holes.push(
              circleHole(x, (i - 2) * d * 0.17, Math.min(w, d) * 0.018),
            );
        put(plate(w, h, d, silver, Math.min(w, d) * 0.05, holes));
        for (let i = 0; i < 4; i++)
          put(box([w * 0.65, 0.35, 0.6], silver, 0.6), [
            0,
            h / 2 + 0.15,
            (i - 1.5) * d * 0.2,
          ]);
        for (const x of [-w * 0.43, w * 0.43])
          for (const z of [-d * 0.4, d * 0.4])
            screw([x, h / 2 + 0.25, z], Math.max(0.5, w * 0.012));
        break;
      }
      case 'frame':
        put(
          plate(w, h, d, part.color, Math.min(w, d) * 0.09, [
            rectHole(0, 0, w - 3, d - 3, Math.min(w, d) * 0.07),
          ]),
        );
        for (const x of [-w * 0.4, w * 0.4])
          for (const z of [-d * 0.4, d * 0.4])
            screw([x, h / 2 + 0.2, z], Math.min(w, d) * 0.025);
        break;
      case 'fins':
        for (let i = 0; i < 44; i++)
          put(box([0.5, h, d], part.color, 0.75), [(i / 43 - 0.5) * w, 0, 0]);
        put(box([w, 1, d], silver), [0, -h / 2, 0]);
        break;
      case 'pipes':
        for (let i = 0; i < 6; i++)
          tube(
            [
              [((i - 2.5) * w) / 6, 0, -d * 0.45],
              [((i - 2.5) * w) / 7, 1, -d * 0.1],
              [((i - 2.5) * w) / 5, 1, d * 0.2],
              [((i - 2.5) * w) / 6, 0, d * 0.45],
            ],
            1.6,
            copper,
          );
        break;
      case 'coil':
        for (let i = 0; i < 12; i++)
          put(
            disk(
              Math.min(w, d) * (0.22 + i * 0.018),
              Math.max(0.08, h * 0.25),
              copper,
              Math.min(w, d) * (0.213 + i * 0.018),
            ),
          );
        if (level === 'phone') {
          put(disk(w * 0.52, 0.3, '#c8c9bf', w * 0.47), [0, -0.2, 0]);
          put(box([9, 0.3, 5], '#b9bcb4'), [0, -0.2, w * 0.64]);
        }
        break;
      case 'sensor':
        put(plate(w, h, d, '#29453f', 1));
        put(plate(w * 0.91, 0.15, d * 0.9, '#b4aba1', 0.3), [
          0,
          h / 2 + 0.12,
          0,
        ]);
        put(plate(w * 0.84, 0.1, d * 0.82, part.color, 0.1), [
          0,
          h / 2 + 0.26,
          0,
        ]);
        for (let i = 0; i < 10; i++)
          put(box([w * 0.82, 0.02, 0.09], '#a18baf'), [
            0,
            h / 2 + 0.32,
            (i - 4.5) * d * 0.065,
          ]);
        break;
      case 'shutter':
        if (level === 'cameralens') {
          put(disk(w / 2, h, ink, w * 0.4));
          for (let i = 0; i < 9; i++) {
            const a = (i * Math.PI * 2) / 9;
            const shape = new T.Shape();
            shape.moveTo(3, -2);
            shape.quadraticCurveTo(15, -17, 22, -10);
            shape.lineTo(19, 3);
            shape.quadraticCurveTo(8, 1, 3, -2);
            const blade = new T.Mesh(
              extrusion(shape, 0.12),
              mat('#7c8585', 0.7),
            );
            blade.rotation.y = a;
            put(blade, [0, (i - 4) * 0.13, 0]);
          }
        } else {
          put(plate(w, h, d, ink, 2, [rectHole(0, 0, w * 0.8, d * 0.75, 0.5)]));
          for (let i = 0; i < 6; i++)
            put(
              box(
                [w * 0.83, 0.12, d * 0.14],
                i % 2 ? '#424b4f' : '#252d33',
                0.5,
              ),
              [0, h / 2 + 0.2, (i - 2.5) * d * 0.125],
            );
        }
        break;
      case 'actuator':
        put(plate(w, h, d, silver, 3, [rectHole(0, 0, w * 0.78, d * 0.75, 1)]));
        for (const x of [-w * 0.43, w * 0.43]) {
          put(box([3, 2, d * 0.48], ink), [x, h / 2, 0]);
          for (let i = 0; i < 12; i++)
            put(box([0.25, 0.4, d * 0.44], copper), [
              x - 1.5 + i * 0.26,
              h / 2 + 1.2,
              0,
            ]);
        }
        break;
      case 'stick': {
        put(box([w * 0.8, h * 0.4, d * 0.8], silver), [0, -h * 0.25, 0]);
        for (const x of [-w * 0.42, w * 0.42])
          put(box([3, h * 0.45, d * 0.68], '#4a8362'), [x, -h * 0.2, 0]);
        put(disk(2.5, h * 0.5, ink), [0, h * 0.05, 0]);
        put(disk(w * 0.43, h * 0.16, ink, w * 0.32), [0, h * 0.43, 0]);
        put(disk(w * 0.32, 0.6, '#242c30'), [0, h * 0.49, 0]);
        break;
      }
      case 'tray':
        put(
          plate(w, h, d, part.color, 3, [rectHole(0, 0, w * 0.8, d * 0.8, 3)]),
        );
        for (const x of [-w * 0.42, w * 0.42])
          put(box([2, 8, d * 0.8], part.color), [x, -3, 0]);
        break;
      case 'diaphragm': {
        const dome = new T.Mesh(
          new T.SphereGeometry(
            w * 0.48,
            40,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ),
          mat(part.color, 0.55, 0.3),
        );
        dome.scale.y = 0.12;
        g.add(dome);
        break;
      }
      default:
        put(plate(w, h, d, part.color, Math.min(w, d) * 0.08));
        if (id === 'base' && level === 'camera')
          for (const x of [-w * 0.36, w * 0.36])
            for (const z of [-d * 0.36, d * 0.36])
              screw([x, h / 2 + 0.2, z], 0.8);
    }
  g.userData.detailRevision = 2;
  const native = new T.Group();
  native.scale.setScalar(1 / unit);
  native.add(g);
  // Stage posing changes the selectable root; scale/rotation stay below it.
  const result = new T.Group();
  result.add(native);
  return result;
}
