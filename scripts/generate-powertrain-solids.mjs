/** Offline CSG bake. No boolean evaluator or external CAD request in the viewer.
 * Sources and reconstructed boundaries: docs/POWERTRAIN-REBUILD.md.
 * Run: node --experimental-strip-types scripts/generate-powertrain-solids.mjs
 */
import * as T from 'three';
import { Brush, Evaluator, ADDITION, SUBTRACTION } from 'three-bvh-csg';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { MeshoptSimplifier } from 'meshoptimizer';
import { GX, gxCoverBolts } from '../lib/powertrain/dimensions.ts';

const evaluator = new Evaluator();
evaluator.attributes = ['position', 'normal'];
evaluator.useGroups = false;
const mat = new T.MeshStandardMaterial();
await MeshoptSimplifier.ready;
const assets = {};
const brush = (geo) => {
  geo.deleteAttribute('uv');
  const b = new Brush(geo, mat);
  b.updateMatrixWorld(true);
  return b;
};
function op(a, b, operation = SUBTRACTION) {
  const result = evaluator.evaluate(a, b, operation);
  a.geometry.dispose();
  b.geometry.dispose();
  result.updateMatrixWorld(true);
  return result;
}
const box = (x, y, z, pos = [0, 0, 0]) =>
  brush(new T.BoxGeometry(x, y, z).translate(...pos));
function cylinder(
  radius,
  length,
  pos = [0, 0, 0],
  axis = 'z',
  top = radius,
  segments = 48,
) {
  const geo = new T.CylinderGeometry(top, radius, length, segments);
  if (axis === 'z') geo.rotateX(Math.PI / 2);
  if (axis === 'x') geo.rotateZ(-Math.PI / 2);
  return brush(geo.translate(...pos));
}
function extrude(shape, depth, z = 0, bevel = 0, segments = 24) {
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    steps: 1,
    curveSegments: segments,
  });
  return brush(g.translate(0, 0, z - depth / 2));
}
function rounded(w, h, r, cx = 0, cy = 0) {
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
  s.closePath();
  return s;
}
function addHole(s, r, x = 0, y = 0) {
  const p = new T.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  s.holes.push(p);
}
function add(a, b) {
  return op(a, b, ADDITION);
}
function save(id, b) {
  b.updateMatrixWorld(true);
  const g = mergeVertices(
    b.geometry.clone().applyMatrix4(b.matrixWorld),
    0.0001,
  );
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  const positions = new Int16Array(p.count * 3),
    normals = new Int8Array(n.count * 3);
  for (let i = 0; i < p.count; i++)
    for (let k = 0; k < 3; k++) {
      positions[i * 3 + k] = Math.round(p.array[i * 3 + k] * 100);
      normals[i * 3 + k] = Math.round(n.array[i * 3 + k] * 127);
    }
  // Quantization may collapse tiny boolean fragments to a line. Such faces
  // render no area and confuse triangle intersection predicates; remove them.
  const clean = [];
  for (let i = 0; i < g.index.count; i += 3) {
    const ids = [g.index.getX(i), g.index.getX(i + 1), g.index.getX(i + 2)];
    const v = ids.map((k) => Array.from(positions.slice(k * 3, k * 3 + 3)));
    const u = v[1].map((x, k) => x - v[0][k]),
      w = v[2].map((x, k) => x - v[0][k]);
    const cross = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    if (cross.some((x) => x !== 0)) clean.push(...ids);
  }
  const q = Float32Array.from(positions, (v) => v / 100);
  const [simplified, error] = MeshoptSimplifier.simplify(
    new Uint32Array(clean),
    q,
    3,
    Math.floor((clean.length * 0.25) / 3) * 3,
    0.002 / MeshoptSimplifier.getScale(q, 3),
    ['LockBorder'],
  );
  const [remap, count] = MeshoptSimplifier.compactMesh(simplified);
  if (count > 65535) throw new Error(`Asset ${id} needs wider indices`);
  const compactPositions = new Int16Array(count * 3),
    compactNormals = new Int8Array(count * 3);
  for (let i = 0; i < remap.length; i++)
    if (remap[i] !== 0xffffffff) {
      compactPositions.set(positions.subarray(i * 3, i * 3 + 3), remap[i] * 3);
      compactNormals.set(normals.subarray(i * 3, i * 3 + 3), remap[i] * 3);
    }
  const indices = new Uint16Array(simplified);
  assets[id] = {
    positionBytes: compactPositions.byteLength,
    normalBytes: compactNormals.byteLength,
    data: deflateSync(
      Buffer.concat([
        Buffer.from(compactPositions.buffer),
        Buffer.from(compactNormals.buffer),
        Buffer.from(indices.buffer),
      ]),
      { level: 9 },
    ).toString('base64'),
  };
  console.log(
    id,
    count,
    'vertices',
    indices.length / 3,
    'triangles',
    'simplification error mm',
    error * MeshoptSimplifier.getScale(q, 3),
  );
  g.dispose();
  b.geometry.dispose();
}

// Asymmetric cast crankcase: open PTO face, machined rear bearing bore,
// integral feet, cylinder opening and offset camshaft pocket.
const caseOutline = () => {
  const s = new T.Shape();
  s.moveTo(-91, -34);
  s.quadraticCurveTo(-93, -54, -73, -57);
  s.lineTo(51, -57);
  s.quadraticCurveTo(77, -55, 79, -28);
  s.lineTo(75, 15);
  s.quadraticCurveTo(70, 45, 44, 54);
  s.lineTo(-43, 56);
  s.quadraticCurveTo(-88, 39, -91, -6);
  s.closePath();
  return s;
};
let crankcase = extrude(caseOutline(), 94, -2, 1.5);
const cavity = new T.Shape();
cavity.moveTo(-82, -27);
cavity.quadraticCurveTo(-84, -45, -66, -47);
cavity.lineTo(44, -47);
cavity.quadraticCurveTo(66, -43, 67, -20);
cavity.lineTo(65, 15);
cavity.quadraticCurveTo(57, 42, 35, 44);
cavity.lineTo(-44, 46);
cavity.quadraticCurveTo(-80, 30, -82, -8);
cavity.closePath();
crankcase = op(crankcase, extrude(cavity, 96, 5));
crankcase = op(crankcase, cylinder(26.1, 125));
crankcase = op(crankcase, cylinder(36.1, 60, [0, 60, 0], 'y'));
for (const z of [-14, 14])
  crankcase = op(crankcase, cylinder(4, 60, [-45, 60, z], 'y'));
const rearBoss = new T.Shape();
rearBoss.absarc(0, 0, 29, 0, Math.PI * 2, false);
addHole(rearBoss, 26.1);
crankcase = add(crankcase, extrude(rearBoss, 8, -47));
for (const [x, y] of gxCoverBolts) {
  crankcase = add(crankcase, cylinder(7, 12, [x, y, 39]));
  crankcase = op(crankcase, cylinder(3.3, 20, [x, y, 39]));
}
save('gx-case', crankcase);

// PTO side cover shares the crankcase's actual perimeter and bearing register.
let cover = extrude(caseOutline(), 8, 0, 1);
cover = op(cover, cylinder(20.6, 30));
for (const [x, y] of gxCoverBolts) {
  cover = add(cover, cylinder(7, 8, [x, y, 0]));
  cover = op(cover, cylinder(3.4, 30, [x, y, 0]));
}
const boss = op(cylinder(29, 15, [0, 0, 5]), cylinder(20.6, 30));
cover = add(cover, boss);
save('gx-cover', cover);
let gasket = extrude(caseOutline(), 0.6);
for (const [x, y] of gxCoverBolts)
  gasket = add(gasket, cylinder(7, 0.6, [x, y, 0]));
gasket = op(gasket, extrude(cavity, 3));
for (const [x, y] of gxCoverBolts)
  gasket = op(gasket, cylinder(3.5, 3, [x, y, 0]));
save('gx-gasket', gasket);

// Combustion chamber + separate intake/exhaust throats and cross-drilled ports.
// Local origin is the cylinder deck/gasket interface, Y along the bore.
let head = extrude(rounded(108, 84, 10, -8, 0), 42, 21, 1);
head.geometry.rotateX(-Math.PI / 2);
head.updateMatrixWorld(true);
head = op(
  head,
  cylinder(
    GX.chamberRadius,
    GX.chamberDepth + 2,
    [0, (GX.chamberDepth - 2) / 2, 0],
    'y',
  ),
);
for (const [i, z] of [-14, 14].entries()) {
  const r = i ? 11.8 : 12.3;
  head = op(head, cylinder(r, 5, [-8, 7.7, z], 'y', 4.55));
  head = op(head, cylinder(4.51, 58, [-8, 31, z], 'y'));
  // Horizontal intake/exhaust passages meet the valve throat below the guide.
  head = op(head, cylinder(8, 49, [-8, 11, z + (i ? 25 : -25)], 'z'));
}
for (const x of [-39, 39])
  for (const z of [-32, 32])
    head = op(head, cylinder(4.6, 70, [x, 25, z], 'y'));
for (const z of [-14, 14]) head = op(head, cylinder(4, 70, [-45, 25, z], 'y'));
// Spark plug drilling enters the chamber from the right shoulder.
head = op(head, cylinder(6.2, 65, [29, 8, 0], 'x'));
save('gx-head', head);

// Pressed fuel tank has a relieved lower shoulder above the cylinder, rather
// than the previous tiny floating rectangular can. Wall thickness is rebuilt.
const tankShape = () => {
  const s = new T.Shape();
  s.moveTo(-78, -57);
  s.lineTo(24, -57);
  s.quadraticCurveTo(36, -56, 44, -43);
  s.lineTo(85, -4);
  s.quadraticCurveTo(92, 3, 92, 18);
  s.lineTo(92, 43);
  s.quadraticCurveTo(91, 58, 75, 60);
  s.lineTo(-76, 60);
  s.quadraticCurveTo(-92, 59, -92, 43);
  s.lineTo(-92, -41);
  s.quadraticCurveTo(-91, -55, -78, -57);
  s.closePath();
  return s;
};
let tank = extrude(tankShape(), 165, 0, 2);
const tankVoid = extrude(tankShape(), 161, 0, 0);
tankVoid.geometry.scale(0.976, 0.964, 1);
tank = op(tank, tankVoid);
tank = op(tank, cylinder(11, 22, [-27, 58, -15], 'y'));
save('gx-tank', tank);
let rockerCover = extrude(rounded(96, 71, 17), 24, 0, 3);
rockerCover = op(rockerCover, extrude(rounded(92, 67, 15), 30, 3, 1));
save('gx-rocker-cover', rockerCover);
let filterCover = extrude(rounded(65, 70, 9), 42, 0, 2);
filterCover = op(filterCover, extrude(rounded(61, 66, 7), 46, 4, 0));
for (let i = 0; i < 6; i++)
  filterCover = op(filterCover, box(41, 1.8, 10, [0, i * 7 - 17, -21]));
save('gx-filter-cover', filterCover);
let recoil = brush(
  new T.LatheGeometry(
    [
      [11, -8],
      [32, -8],
      [56, -4],
      [69, 4],
      [73, 8],
      [74, 15],
      [71, 15],
      [69, 9],
      [55, -1],
      [32, -5],
      [11, -5],
      [11, -8],
    ].map((v) => new T.Vector2(...v)),
    96,
  ).rotateX(Math.PI / 2),
);
for (let i = 0; i < 18; i++) {
  const slot = box(4, 26, 45, [0, 48, 0]);
  slot.geometry.rotateZ((i * Math.PI) / 9 + 0.16);
  recoil = op(recoil, slot);
}
save('gx-recoil-cover', recoil);

// Stamped flywheel blower housing includes the duct around the upper fins.
const blowerShape = () => {
  const s = new T.Shape();
  s.moveTo(-88, -47);
  s.quadraticCurveTo(-108, 11, -70, 63);
  s.quadraticCurveTo(-43, 91, -9, 84);
  s.lineTo(24, 111);
  s.quadraticCurveTo(34, 118, 43, 109);
  s.lineTo(82, 73);
  s.quadraticCurveTo(102, 53, 99, 22);
  s.lineTo(94, -38);
  s.quadraticCurveTo(88, -76, 42, -81);
  s.lineTo(-45, -82);
  s.quadraticCurveTo(-75, -79, -88, -47);
  s.closePath();
  return s;
};
let blower = extrude(blowerShape(), 47, 0, 2);
const inner = blowerShape();
const innerBrush = extrude(inner, 52, 3);
innerBrush.geometry.scale(0.962, 0.962, 1);
blower = op(blower, innerBrush);
blower = op(blower, cylinder(71, 90, [0, 0, 0]));
// Duct exits adjacent to the cylinder instead of a sealed red box.
blower = op(blower, box(56, 36, 65, [33, 103, 0]));
save('gx-blower', blower);

// Water-jacket outer shell: the two radial ports are actually bored through it.
let jacket = op(cylinder(111, 184), cylinder(108.3, 200));
for (const z of [-55, 55])
  jacket = op(jacket, cylinder(6.55, 30, [0, 115, z], 'y'));
for (const z of [-94, 94]) {
  const flange = new T.Shape();
  flange.absarc(0, 0, 125, 0, Math.PI * 2, false);
  addHole(flange, 99.12);
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) * Math.PI) / 4;
    addHole(flange, 3.5, 118 * Math.cos(a), 118 * Math.sin(a));
  }
  jacket = add(jacket, extrude(flange, 5, z, 0, 96));
}
// Cast support pads attach to the same casting rather than floating nearby.
for (const x of [-78, 78])
  for (const z of [-65, 65]) {
    let foot = box(32, 26, 25, [x, -91, z]);
    foot = op(foot, cylinder(5, 45, [x, -91, z], 'y'));
    jacket = add(jacket, foot);
  }
save('leaf-jacket', jacket);
const sleeve = op(
  cylinder(102, 184),
  cylinder(99.12, 200, [0, 0, 0], 'z', 99.12, 192),
);
save('leaf-sleeve', sleeve);

// Dished end bells carry the bearing boss, radial ribs and flange in one piece.
let bell = brush(
  new T.LatheGeometry(
    [
      [42.1, -9],
      [48, -9],
      [48, 1],
      [74, 0],
      [101, -10],
      [125, -15],
      [125, -9],
      [101, -3],
      [74, 7],
      [48, 9],
      [42.1, 9],
      [42.1, -9],
    ].map((v) => new T.Vector2(...v)),
    96,
  ).rotateX(Math.PI / 2),
);
for (let i = 0; i < 8; i++) {
  const a = ((i + 0.5) * Math.PI) / 4;
  bell = op(bell, cylinder(3.5, 60, [118 * Math.cos(a), 118 * Math.sin(a), 0]));
  const rib = box(65, 3.5, 9, [80, 0, -7]);
  rib.geometry.rotateZ(a);
  bell = add(bell, rib);
}
const frontBell = brush(bell.geometry.clone());
save('leaf-bell', bell);
let drilledBell = frontBell;
for (const x of [-20, 0, 20])
  drilledBell = op(drilledBell, cylinder(4.5, 70, [x, 91, 0]));
save('leaf-bell-front', drilledBell);

let manifold = box(84, 30, 35, [0, 0, 0]);
manifold = op(manifold, box(78, 24, 32, [0, 2, 3]));
for (const x of [-20, 0, 20])
  manifold = op(manifold, cylinder(4.5, 50, [x, 0, 0], 'y'));
save('leaf-terminal-shell', manifold);

const code =
  '// Generated by scripts/generate-powertrain-solids.mjs. Quantized millimetres (0.01 mm).\n' +
  '// Public-reference reconstruction; not factory CAD. Do not hand-edit.\n' +
  'export const powertrainSolids = ' +
  JSON.stringify(assets) +
  ' as const;\n';
writeFileSync('lib/powertrain/solids.generated.ts', code);
console.log('Wrote', code.length, 'bytes');
