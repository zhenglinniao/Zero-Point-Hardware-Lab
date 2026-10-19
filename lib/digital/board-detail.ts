import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import {
  digitalDefinitions,
  type DigitalLevel,
  type DigitalPart,
} from './catalogue.ts';

/** Board-level visual construction, not a recovered schematic/netlist. Large
 * selectable packages define keepouts; small passive banks are representative. */
export function decorateBoard(
  parent: T.Group,
  outline: T.Shape,
  width: number,
  depth: number,
  height: number,
  level: DigitalLevel,
  part: DigitalPart,
  tools: ModelTools,
) {
  const points = outline.getPoints(40);
  const holes = outline.holes.map((hole) => hole.getPoints(24));
  const inside = (x: number, z: number, polygon: T.Vector2[]) => {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a.y > z !== b.y > z &&
        x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
      )
        result = !result;
    }
    return result;
  };
  const onBoard = (x: number, z: number, margin = 0) =>
    [
      [x, z],
      [x - margin, z - margin],
      [x + margin, z + margin],
    ].every(
      ([a, b]) =>
        inside(a, b, points) && !holes.some((hole) => inside(a, b, hole)),
    );
  const definition = digitalDefinitions.find((item) => item.id === level)!;
  const packages =
    part.id === 'pcb' || part.id === 'carrier'
      ? definition.parts.filter(
          (item) =>
            item !== part && !['shield', 'screws', 'flex'].includes(item.shape),
        )
      : [];
  const free = (x: number, z: number, side: number) =>
    onBoard(x, z, 0.8) &&
    !packages.some(
      (item) =>
        (item.pos[1] - part.pos[1]) * side >= 0 &&
        Math.abs(x - (item.pos[0] - part.pos[0])) < item.size[0] / 2 + 1.8 &&
        Math.abs(z - (item.pos[2] - part.pos[2])) < item.size[2] / 2 + 1.8,
    );

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.max(256, Math.round((1024 * depth) / width));
  const c = canvas.getContext('2d')!;
  const sx = canvas.width / width,
    sz = canvas.height / depth;
  const px = (x: number) => (x + width / 2) * sx,
    pz = (z: number) => (z + depth / 2) * sz;
  c.fillStyle = level.startsWith('phone') ? '#253e38' : '#23583f';
  c.fillRect(0, 0, canvas.width, canvas.height);
  // Copper pours, 45-degree fan-outs, via stitching, reference designators.
  for (let row = 0; row < 16; row++)
    for (let col = 0; col < 18; col++) {
      const x = (col / 18 - 0.47) * width,
        z = (row / 16 - 0.47) * depth;
      if (!onBoard(x, z, 1)) continue;
      c.strokeStyle = (row + col) % 3 ? '#3e7753' : '#8c9964';
      c.lineWidth = Math.max(0.6, sx * 0.07);
      for (let lane = 0; lane < 4; lane++) {
        const offset = lane * 0.22;
        c.beginPath();
        c.moveTo(px(x + offset), pz(z));
        c.lineTo(px(x + offset), pz(z + depth * 0.016));
        c.lineTo(
          px(x + width * 0.012 + offset),
          pz(z + depth * 0.016 + width * 0.012),
        );
        c.lineTo(
          px(x + width * 0.035 + offset),
          pz(z + depth * 0.016 + width * 0.012),
        );
        c.stroke();
      }
      c.fillStyle = '#b3a778';
      c.beginPath();
      c.arc(px(x), pz(z), Math.max(1, sx * 0.17), 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#142d29';
      c.beginPath();
      c.arc(px(x), pz(z), Math.max(0.5, sx * 0.075), 0, Math.PI * 2);
      c.fill();
      if ((row + col) % 4 === 0) {
        c.fillStyle = '#bbceac';
        c.font = `${Math.max(6, sx * 0.65)}px monospace`;
        c.fillText(`C${row * 18 + col + 101}`, px(x + 0.6), pz(z - 0.5));
      }
    }
  c.strokeStyle = '#baa775';
  c.lineWidth = sx * 0.45;
  c.beginPath();
  points.forEach((p, i) =>
    i
      ? c.lineTo(px(p.x * 0.976), pz(p.y * 0.976))
      : c.moveTo(px(p.x * 0.976), pz(p.y * 0.976)),
  );
  c.closePath();
  c.stroke();
  c.fillStyle = '#c1cbb7';
  c.font = `${Math.max(8, sx * 1.2)}px monospace`;
  c.fillText('ZP / HARDWARE STUDY', px(-width * 0.35), pz(depth * 0.44));
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  const artwork = new T.ShapeGeometry(outline, 40);
  artwork.rotateX(Math.PI / 2);
  const position = artwork.getAttribute('position'),
    uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = position.getX(i) / width + 0.5;
    uv[i * 2 + 1] = 0.5 - position.getZ(i) / depth;
  }
  artwork.setAttribute('uv', new T.BufferAttribute(uv, 2));
  for (const side of [-1, 1]) {
    const surface = new T.Mesh(
      artwork.clone(),
      new T.MeshStandardMaterial({
        map: texture,
        color: '#ffffff',
        roughness: 0.63,
        metalness: 0.12,
        side: T.DoubleSide,
      }),
    );
    surface.position.y = side * (height / 2 + 0.025);
    parent.add(surface);
  }
  artwork.dispose();

  const length = Math.max(0.55, Math.min(1.65, width * 0.028)),
    breadth = length * 0.5;
  const bodies: T.Matrix4[] = [],
    terminals: T.Matrix4[] = [];
  const matrix = (
    x: number,
    y: number,
    z: number,
    a: number,
    b: number,
    d: number,
  ) =>
    new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion(),
      new T.Vector3(a, b, d),
    );
  // Paired-ended 0402/0603-like packages. Four lanes around large ICs, with
  // apertures, notches, screw holes and both board faces respected.
  for (const side of [-1, 1])
    for (let row = 0; row < 20; row++)
      for (let col = 0; col < 18; col++) {
        const x = (col / 18 - 0.472) * width,
          z = (row / 20 - 0.475) * depth;
        if (
          !free(x, z, side) ||
          !((row % 7 < 4 && col % 6 < 4) || col % 7 === 1)
        )
          continue;
        const y = side * (height / 2 + 0.22);
        bodies.push(matrix(x, y, z, length, 0.32, breadth));
        for (const sign of [-1, 1])
          terminals.push(
            matrix(
              x + sign * length * 0.43,
              y,
              z,
              length * 0.2,
              0.35,
              breadth * 1.02,
            ),
          );
      }
  for (const [matrices, material] of [
    [bodies, tools.material('#ffffff', 0.1, 0.75)],
    [terminals, tools.material('#acb6b3', 0.72, 0.3)],
  ] as const) {
    if (!matrices.length) continue;
    const mesh = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      material,
      matrices.length,
    );
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    if (matrices === bodies)
      matrices.forEach((_, i) =>
        mesh.setColorAt(
          i,
          new T.Color(['#91866a', '#343d3f', '#aba08a', '#5a6662'][i % 4]),
        ),
      );
    mesh.userData.detailKind =
      matrices === bodies ? 'passive-bodies' : 'passive-terminals';
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
  }
}
