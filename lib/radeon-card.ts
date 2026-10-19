import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { cardKit, MM } from './card-kit.ts';
import { cardAirflow } from './airflow.ts';
import { buildPerforation } from './parts.ts';

/**
 * Sapphire NITRO+ Radeon RX 9070 XT.
 *
 * ── What is followed and what is not ────────────────────────────────────
 * Followed from Sapphire's product page and a published teardown: the
 * 330.8 × 128.5 × 65.7 mm envelope, three 100 mm fans, a gun-metal shroud
 * with perforations and a grille on its visible edge, six heat pipes onto a
 * shared GPU and memory baseplate with separate VRM plates, a steel support
 * frame, a magnetic removable backplate, the 12V-2x6 socket on the REAR of
 * the board, sixteen power phases split 10/3/2/1, two HDMI and two
 * DisplayPort outputs, and no dual-BIOS switch.
 *
 * Not followed: exact fin pitch, pipe routing, component positions, trace
 * routing and passive population. Those are drawn to be physically consistent
 * with each other, not copied from the Sapphire board.
 *
 * Every coordinate below is millimetres in the card frame described in
 * `card-kit.ts`, with the card centred on the origin and the board's top face
 * at y ≈ 0.8.
 */

/** Overall envelope, from Sapphire's published dimensions. */
const L = 330.8,
  W = 128.5;
/** Where the board ends. Everything past it is open flow-through cooler. */
const PCB = { x0: -L / 2 + 2, x1: 80, halfZ: 55 };
const GPU = { x: -48, z: 0 };
/** Stacking heights, bottom to top. */
const Y = {
  backplate: -5,
  magnet: -2.4,
  retention: -1.8,
  baseplate: 6.6,
  vrmPlate: 9.6,
  frame: 11.2,
  finsBottom: 13,
  finsTop: 45,
  fanMotor: 46.4,
  fan: 51,
  shroud: 56,
};
const FAN = { r: 49, xs: [-108, 0, 108] as const };

export function buildRadeonCard(tools: ModelTools) {
  const kit = cardKit(tools);
  const {
    m,
    v,
    put,
    register,
    box,
    slab,
    text,
    chamfered,
    circle,
    rect,
    plate,
    chip,
    heatpipe,
    finish,
  } = kit;
  const { nickel } = kit.materials;
  const { material } = tools;

  const gunmetal = finish('anodized', '#3a3f44', 0.55),
    graphite = finish('anodized', '#202427', 0.65),
    trim = finish('brushed', '#7a8086', 0.45);
  gunmetal.envMapIntensity = 0.5;
  graphite.envMapIntensity = 0.35;

  // ── Board ──────────────────────────────────────────────────────────────
  const board = new T.Group();
  const boardLength = PCB.x1 - PCB.x0;
  put(
    board,
    tools.pcb(v(boardLength, 1.6, PCB.halfZ * 2), 'graphics'),
    (PCB.x0 + PCB.x1) / 2,
    0,
    0,
  );
  text(board, 'NITRO+ · NAVI 48', -128, 0.9, -48, 44, '#8c938a');
  for (const x of [GPU.x - 30, GPU.x + 30])
    for (const z of [-30, 30]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(m(2.5), m(0.5), 6, 16),
        nickel,
      );
      ring.rotation.x = Math.PI / 2;
      put(board, ring, x, 0.95, z);
    }
  register('rxpcb', board, 0, 0, 0, [0, -0.8, 0]);

  // The die is drawn at AMD's published 356.5 mm²; its outline is illustrative.
  const pkg = new T.Group();
  put(pkg, box(46, 1.4, 46, material('#2b2621', 0.15)));
  for (const x of [-20, 20])
    for (let i = 0; i < 10; i++)
      put(pkg, box(1.5, 0.6, 1, nickel), x, 1, -17 + i * 3.8);
  register('rxpackage', pkg, GPU.x, 2.2, GPU.z, [0, 1.3, 0]);
  const die = new T.Group();
  put(die, box(12.5, 1, 28.5, material('#5e666b', 0.9, 0.3)));
  const dieMark = new T.Group();
  text(dieMark, 'AMD', 0, 0, -5, 9, '#aeb3b2');
  text(dieMark, 'NAVI 48', 0, 0, 5, 11, '#aeb3b2');
  put(die, dieMark, 0, 0.56, 0);
  register('rxsilicon', die, GPU.x, 4.1, GPU.z, [0, 1.68, 0]);
  register('rxbga', kit.ballGrid(21, 2), GPU.x, 1.25, GPU.z, [0, 0.98, 0]);
  register(
    'rxtim',
    box(12.5, 0.2, 28.5, material('#8b8f8d', 0.2, 0.9)),
    GPU.x,
    4.75,
    GPU.z,
    [0, 2.1, 0],
  );

  // Eight 2 GB GDDR6 packages: three above, two beside and three below.
  const memory: Vec3[] = [];
  for (const x of [-72, -48, -24]) memory.push(v(x, 2.6, -36), v(x, 2.6, 36));
  memory.push(v(-86, 2.6, -11), v(-86, 2.6, 11));
  kit
    .instances('rxgddr6', memory, v(12, 2.6, 14), 0, '#111417')
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 0.9, p.base.z * 0.4),
    );
  kit
    .instances(
      'rxthermalpad',
      memory.map((p) => [p[0], m(3.6), p[2]]),
      v(12, 1.6, 14),
      0,
      '#777d80',
    )
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 2.1, p.base.z * 0.4),
    );

  // Sixteen phases in two columns beside the processor, each choke with its
  // power stage outboard of it: ten for the GPU core, three for the SoC rail,
  // two for memory and one for VDDCI.
  const chokes: Vec3[] = [],
    stages: Vec3[] = [],
    caps: Vec3[] = [];
  for (let row = 0; row < 8; row++)
    for (const [x, side] of [
      [-6, -1],
      [14, 1],
    ] as const) {
      const z = -45.5 + row * 13;
      chokes.push(v(x, 4.5, z));
      stages.push(v(x + side * 8.5, 1.8, z));
    }
  kit
    .instances('rxvrm', chokes, v(9, 7, 9.5), 0, '#24292d')
    .forEach((p) => p.delta.set(1.2, 0.6, 0));
  kit
    .instances('rxpowerstage', stages, v(5, 1.5, 5), 0, '#111416')
    .forEach((p) => p.delta.set(1.45, 0.4, 0));
  for (let i = 0; i < 11; i++)
    for (const x of [30, 37.5]) caps.push(v(x, 3.8, -48 + i * 9.6));
  kit
    .instances(
      'rxcapacitor',
      caps,
      v(5.2, 6, 5.2),
      0,
      '#ffffff',
      kit.capacitorGeometry(2.6, 5.6),
    )
    .forEach((p) => p.delta.set(1.7, 0.4, 0));

  chip('rxpwm', 'MP2868A', -112, -40, 6);
  chip('rxpwm', 'MP2868A', 52, -46, 6, 6, [0.8, 0.9, -0.3]);
  chip('rxbios', 'VBIOS', -116, 24, 7);
  chip('rxtemperature', 'TEMP', -110, -6, 4);
  chip('rxtemperature', 'TEMP', 58, 40, 4, 4, [0.8, 0.9, 0.3]);
  for (let i = 0; i < 4; i++)
    chip('rxesd', 'ESD', -152, -39 + i * 22, 3, 3, [-0.6, 0.9, 0]);
  register('rxcrystal', box(6, 1.5, 3, nickel), -104, 1.8, 8, [-0.8, 0.75, 0]);
  for (const x of [GPU.x - 30, GPU.x + 30])
    for (const z of [-30, 30])
      register(
        'rxstandoff',
        new T.Mesh(new T.CylinderGeometry(m(2.5), m(2.5), m(6), 6), nickel),
        x,
        3.9,
        z,
        [0, 0.6, z * 0.015],
      );

  // The retention spring is on the back of the board.
  const retention = new T.Group();
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const arm = box(62, 0.8, 5, nickel);
    arm.rotation.y = angle;
    put(retention, arm);
  }
  register('rxretention', retention, GPU.x, Y.retention, GPU.z, [0, -1.3, 0]);

  // The 12V-2x6 socket faces DOWN from the rear of the board, at its far end,
  // where the backplate is open. The cable leaves through that vent and runs
  // straight behind the motherboard tray.
  const power = new T.Group();
  put(power, box(22, 9, 10));
  for (let i = 0; i < 12; i++) {
    const x = -8.25 + (i % 6) * 3.3,
      z = -1.9 + Math.floor(i / 6) * 3.8;
    put(power, box(2.5, 0.25, 2.5, material('#030405', 0)), x, -4.6, z);
    put(power, box(0.8, 0.3, 0.8, nickel), x, -4.75, z);
  }
  for (let i = 0; i < 4; i++)
    put(power, box(1.2, 0.3, 1, nickel), -4.5 + i * 3, -4.7, -4.3);
  put(power, box(7, 3, 2), 0, -3, 6);
  register('rxpower', power, 70, -5.4, -30, [0.4, -1.5, -0.6]);
  const argb = kit.fanHeader('rxargb', 70, -10, [0.4, -1.1, 0]);
  argb.object.rotation.x = Math.PI;
  argb.object.position.y = m(-2.6);
  argb.base.y = m(-2.6);

  // Six magnets seat the backplate against the rear of the assembly.
  const magnets: Vec3[] = [];
  for (const x of [-140, -45, 40])
    for (const z of [-46, 46]) magnets.push(v(x, Y.magnet, z));
  for (const [i, [x, , z]] of magnets.entries())
    register(
      'rxmagnet',
      new T.Mesh(
        new T.CylinderGeometry(m(3.2), m(3.2), m(1.2), 20),
        material('#9aa1a5', 0.9, 0.3),
      ),
      x / MM,
      Y.magnet,
      z / MM,
      [(i % 3) - 1, -1.7, z * 0.2],
    );

  // ── Display outputs, behind the bracket ─────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const hdmi = i >= 2;
    register(
      hdmi ? 'rxhdmi' : 'rxdisplayport',
      kit.displaySocket(hdmi ? 'hdmi' : 'dp'),
      -157,
      8,
      -36 + i * 24,
      [-2.2, 0, (i - 1.5) * 0.15],
    );
  }
  register(
    'rxpcie',
    kit.edgeConnector(89, 82),
    -64,
    0,
    PCB.halfZ + 5,
    [0, -1.35, 0.8],
  );

  // ── Cooler ─────────────────────────────────────────────────────────────
  // One baseplate over the GPU and all eight memory chips.
  const base = new T.Group();
  put(base, box(96, 3, 92, nickel));
  put(base, box(16, 1.2, 32, nickel), 0, -2, 0);
  for (const z of [-46, 46]) put(base, box(96, 2, 2, nickel), 0, 1.5, z);
  register('rxbaseplate', base, GPU.x, Y.baseplate, GPU.z, [0, 2.5, 0]);
  for (const z of [-26, 26]) {
    const vrmPlate = new T.Group();
    put(vrmPlate, box(50, 2, 50, finish('brushed', '#7d8387', 0.5)));
    for (let i = 0; i < 6; i++)
      put(vrmPlate, box(48, 1.2, 1.4, nickel), 0, 1.4, -21 + i * 8.4);
    register('rxvrmplate', vrmPlate, 12, Y.vrmPlate, z, [0.6, 2.2, z * 0.02]);
  }

  // Frame Defense: a stamped steel frame with windows for the baseplate and
  // VRM plates, and a rail along each long edge.
  const frameShape = chamfered(L / 2 - 4, W / 2 - 6, 8);
  frameShape.holes.push(
    rect(GPU.x - 46, -44, -14, 44),
    rect(-10, -52, 40, -2),
    rect(-10, 2, 40, 52),
    rect(60, -48, L / 2 - 14, 48),
    rect(-L / 2 + 12, -44, GPU.x - 54, 44),
  );
  const frameGroup = new T.Group();
  frameGroup.add(plate(frameShape, 1.4, finish('steel', '#2a2d30', 0.6)));
  for (const z of [-W / 2 + 7, W / 2 - 7])
    put(
      frameGroup,
      box(L - 12, 5, 1.4, finish('steel', '#2a2d30', 0.6)),
      0,
      3,
      z,
    );
  register('rxframe', frameGroup, 0, Y.frame, 0, [0, 1.95, 0]);

  // Six heat pipes: three leave the baseplate towards the bracket end, three
  // run the long way to the open end of the card.
  for (let i = 0; i < 6; i++) {
    const z = (i - 2.5) * 13;
    const toBracket = i % 2 === 0;
    const end = toBracket ? -L / 2 + 8 : L / 2 - 8;
    const points: Vec3[] = [
      [GPU.x + (toBracket ? 30 : -30), 9.5, z * 0.7],
      [GPU.x, 9.4, z * 0.7],
      [GPU.x + (toBracket ? -40 : 40), 12, z],
      [toBracket ? -125 : 30, 22 + (i % 3) * 5, z],
      [end, 24 + (i % 3) * 5, z],
    ];
    heatpipe('rxheatpipe', points, 3, [0, 2.85 + i * 0.04, 0]);
  }

  // One fin stack the full length of the card. Fins lie across the card,
  // thin along X, so air from the fans passes between them top to bottom.
  const fins = new T.Group();
  const finMat = material('#4c5155', 0.82, 0.85);
  finMat.envMapIntensity = 0.4;
  const finHeight = Y.finsTop - Y.finsBottom;
  const finGeometry = new T.BoxGeometry(m(0.35), m(finHeight), m(W * 0.84));
  const span = L - 16,
    count = Math.round(span / 1.9);
  const bank = new T.InstancedMesh(finGeometry, finMat, count),
    helper = new T.Object3D();
  for (let i = 0; i < count; i++) {
    helper.position.set(m(-span / 2 + (span * i) / (count - 1)), 0, 0);
    helper.updateMatrix();
    bank.setMatrixAt(i, helper.matrix);
  }
  bank.castShadow = bank.receiveShadow = true;
  fins.add(bank);
  for (const z of [-W * 0.4, W * 0.4])
    put(fins, box(span, 1.5, 3, finMat), 0, -finHeight * 0.46, z);
  register(
    'rxheatsink',
    fins,
    0,
    (Y.finsTop + Y.finsBottom) / 2,
    0,
    [0, 3.3, 0],
  );

  // ── Shroud ─────────────────────────────────────────────────────────────
  const shroud = new T.Group();
  const aperture = FAN.r * 1.04;
  const face = chamfered(L / 2, W / 2 - 2, 12);
  for (const x of FAN.xs) face.holes.push(circle(x, 0, aperture));
  put(shroud, plate(face, 2.6, gunmetal), 0, 0, 0);
  // Angular raised panels between the fan openings and at the ends, each one
  // perforated: the NITRO+ faceted look, without copying its exact outline.
  for (const [x0, x1] of [
    [-L / 2 + 3, FAN.xs[0] - aperture - 1],
    [FAN.xs[2] + aperture + 1, L / 2 - 3],
  ]) {
    const w = Math.abs(x1 - x0);
    if (w < 3) continue;
    put(shroud, slab(w, 2, W * 0.7, graphite), (x0 + x1) / 2, 3.3, 0);
  }
  // Brushed facets in the waists between the fans and at both ends, the
  // angular trim that gives the NITRO+ its outline.
  for (const sz of [-1, 1]) {
    for (const x of [-54, 54]) {
      // The nameplate takes this waist on the slot side.
      if (sz === 1 && x === 54) continue;
      const facet = new T.Shape();
      facet.moveTo(x - 24, sz * (W / 2 - 3));
      facet.lineTo(x + 24, sz * (W / 2 - 3));
      facet.lineTo(x + 5, sz * (W / 2 - 15));
      facet.lineTo(x - 5, sz * (W / 2 - 15));
      facet.closePath();
      put(shroud, plate(facet, 1, trim), 0, 2.7, 0);
    }
    for (const sx of [-1, 1]) {
      const corner = new T.Shape();
      corner.moveTo(sx * (L / 2 - 3), sz * (W / 2 - 16));
      corner.lineTo(sx * (L / 2 - 3), sz * (W / 2 - 5));
      corner.lineTo(sx * (L / 2 - 22), sz * (W / 2 - 3));
      corner.closePath();
      put(shroud, plate(corner, 1, graphite), 0, 2.7, 0);
    }
  }
  const nameplate = new T.Group();
  put(nameplate, slab(40, 1, 9, graphite), 0, 0, 0);
  text(nameplate, 'NITRO+', 0, 0.6, 0, 30, '#c9cdd0');
  put(shroud, nameplate, 54, 3.2, W / 2 - 9.5);
  for (const x of FAN.xs) {
    const rim = new T.Mesh(
      new T.TorusGeometry(m(aperture), m(1.1), 8, 80),
      graphite,
    );
    rim.rotation.x = Math.PI / 2;
    put(shroud, rim, x, 2.8, 0);
    for (const angle of [0.4, 2.5, 4.6]) {
      const arm = slab(FAN.r * 1.02, 1, 4, graphite);
      arm.rotation.y = angle;
      put(
        shroud,
        arm,
        x + Math.cos(angle) * FAN.r * 0.5,
        -9.5,
        -Math.sin(angle) * FAN.r * 0.5,
      );
    }
  }
  // The long edges. The window-facing edge (−Z) carries the grille, the
  // light strip and the name; the slot edge (+Z) is a solid rail.
  const edgeHeight = Y.shroud - Y.finsBottom + 2;
  const grille = buildPerforation(
    material,
    m(L - 30),
    m(edgeHeight - 12),
    m(1.2),
    m(3.2),
    '#34393d',
  );
  put(shroud, grille, 0, -edgeHeight / 2 + 1, -W / 2 + 1);
  put(shroud, slab(L - 4, 4, 2.4, gunmetal), 0, -2, -W / 2 + 1);
  put(shroud, slab(L - 4, 4, 2.4, gunmetal), 0, -edgeHeight + 4, -W / 2 + 1);
  for (const x of [-L / 2 + 8, L / 2 - 8])
    put(
      shroud,
      slab(12, edgeHeight, 2.4, gunmetal),
      x,
      -edgeHeight / 2 + 1,
      -W / 2 + 1,
    );
  // The slot edge stays open between pillars, so the fin stack shows through
  // the way it does on the real card.
  put(shroud, slab(L - 4, 5, 2.4, gunmetal), 0, -2.5, W / 2 - 1);
  put(shroud, slab(L - 4, 3, 2.4, graphite), 0, -edgeHeight + 3, W / 2 - 1);
  for (const x of [-L / 2 + 6, -54, 54, L / 2 - 6])
    put(
      shroud,
      slab(8, edgeHeight - 2, 2.4, gunmetal),
      x,
      -edgeHeight / 2 + 0.5,
      W / 2 - 1,
    );
  for (const x of [-108, 0, 108]) {
    const brace = slab(52, 2.2, 2, graphite);
    brace.rotation.z = x === 0 ? 0.32 : -0.32;
    put(shroud, brace, x, -edgeHeight * 0.45, W / 2 - 0.6);
  }
  const strip = new T.Mesh(
    new T.BoxGeometry(m(150), m(1.4), m(0.6)),
    kit.glow('#f2f5ff', 1.4),
  );
  const light = new T.Group();
  put(light, strip, 0, 0, 0);
  for (const x of [-75, 75]) put(light, box(4, 2.4, 1.2, graphite), x, 0, 0);
  const brand = new T.Group();
  text(brand, 'NITRO+', 0, 0, 0, 34, '#d7dadd');
  brand.rotation.x = -Math.PI / 2;
  put(shroud, brand, -100, -8, -W / 2 - 0.6);
  const brandRadeon = new T.Group();
  text(brandRadeon, 'RADEON', 0, 0, 0, 30, '#9da3a8');
  brandRadeon.rotation.x = -Math.PI / 2;
  put(shroud, brandRadeon, 118, -8, -W / 2 - 0.6);
  register('rxshroud', shroud, 0, Y.shroud, 0, [0, 4.7, 0]);
  register('rxlight', light, 20, Y.shroud - 7, -W / 2 - 0.8, [0, 4.1, -1.1]);

  // ── Fans, motors and wiring ────────────────────────────────────────────
  for (const [i, x] of FAN.xs.entries()) {
    const object = kit.fan(FAN.r * 0.97, 9, {
      reverse: i === 1,
      badge: i === 1 ? 'SAPPHIRE' : 'NITRO+',
      bladeColor: '#15181b',
    });
    kit.add('rxfan', object, v(x, Y.fan, 0), [x * MM * 0.16, 5.1, 0]);
  }
  for (const [i, x] of FAN.xs.entries()) {
    kit.fanMotor('rxfanmotor', x, Y.fanMotor, 10);
    const headerX = -142 + i * 12;
    kit.fanHeader('rxfanheader', headerX, 46, [-0.8, 0.5, 0.6]);
    kit.fanCable(
      'rxfancable',
      [
        [headerX, 4, 46],
        [headerX, 14, 60],
        [x, 44, 60],
        [x, 46, 16],
        [x, 47, 0],
      ],
      [0, 3.4, 0.3],
    );
  }
  for (const x of [-150, -54, 54, 150])
    for (const z of [-54, 54])
      register('rxfastener', kit.screw(2.2), x, Y.shroud + 3, z, [0, 5.7, 0]);

  // ── Bracket and backplate ──────────────────────────────────────────────
  register(
    'rxbracket',
    kit.bracket(W - 6, Y.shroud + 3 - Y.backplate),
    -L / 2 - 1.5,
    (Y.shroud + 3 + Y.backplate) / 2,
    0,
    [-2, 0, 0],
  );
  const back = chamfered(L / 2, W / 2, 10);
  back.holes.push(rect(62, -46, L / 2 - 10, 46));
  const backplate = new T.Group();
  put(backplate, plate(back, 2.2, graphite), 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const rib = slab(52, 0.8, 2, gunmetal);
    rib.rotation.y = 0.7;
    put(backplate, rib, -120 + i * 22, -0.3, 22);
  }
  const mark = new T.Group();
  text(mark, 'SAPPHIRE', 0, 0, 0, 70, '#8a9094');
  mark.rotation.x = Math.PI;
  put(backplate, mark, -40, -0.4, -22);
  const nitro = new T.Group();
  text(nitro, 'NITRO+', 0, 0, 0, 40, '#b0b5b8');
  nitro.rotation.x = Math.PI;
  put(backplate, nitro, 20, -0.4, 36);
  register('rxbackplate', backplate, 0, Y.backplate, 0, [0, -2.35, 0]);

  // ── Passives in the remaining free board area ──────────────────────────
  kit.passives(
    'rxresistor',
    'rxmlcc',
    [
      'rxpackage',
      'rxgddr6',
      'rxvrm',
      'rxpowerstage',
      'rxcapacitor',
      'rxpwm',
      'rxbios',
      'rxtemperature',
      'rxesd',
      'rxcrystal',
      'rxfanheader',
      'rxstandoff',
      'rxdisplayport',
      'rxhdmi',
    ],
    { x0: PCB.x0 + 8, x1: PCB.x1 - 4, z0: -PCB.halfZ + 3, z1: PCB.halfZ - 3 },
    64,
  );

  // ── Airflow ─────────────────────────────────────────────────────────────
  // A card is three fans pressing air down into fin banks. Where there is
  // board underneath, that air has to turn and leave along the card's free
  // long edge; past the end of the board there is nothing but fin, so it goes
  // straight through and out of the other side. That is what a flow-through
  // cooler is, and it is the one thing about a card's shape you cannot see by
  // looking at it. Installed in the tower the whole picture turns over with
  // the card, and the air rises out of it instead.
  tools.airflow(
    cardAirflow({
      fans: FAN.xs,
      radius: FAN.r,
      width: W,
      fan: Y.fan,
      finsTop: Y.finsTop,
      finsBottom: Y.finsBottom,
      backplate: Y.backplate,
      pcbEnd: PCB.x1,
      scale: MM,
    }),
  );
}
