import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { cardKit, MM } from './card-kit.ts';
import { cardAirflow } from './airflow.ts';

/**
 * Intel Arc B580 Limited Edition.
 *
 * ── What is followed and what is not ────────────────────────────────────
 * Followed from Intel's specification page and published teardowns: the
 * 272 × 115 mm dual-slot envelope, a matte black shroud with two 85 mm
 * eleven-blade ring-linked fans, four heat pipes from a copper cold plate
 * into two fin stacks, a short eight-layer board about half the length of
 * the cooler, a backplate cut out past the end of the board so the second
 * fan blows straight through, six GDDR6 packages, 6 + 2 power phases, a single
 * 8-pin socket, three DisplayPort and one HDMI output, and a white LED logo
 * on the top edge.
 *
 * Not followed: exact fin pitch, pipe routing, component positions and passive
 * population. Those are drawn to be consistent with each other, not copied.
 *
 * Coordinates are millimetres in the card frame from `card-kit.ts`.
 */

const L = 272,
  W = 115;
const PCB = { x0: -L / 2 + 2, x1: 8, halfZ: 50 };
const GPU = { x: -62, z: 0 };
const Y = {
  backplate: -3.8,
  retention: -1.8,
  coldplate: 6.6,
  finsBottom: 10.5,
  finsTop: 27.5,
  fanMotor: 28.4,
  fan: 31.5,
  shroud: 35,
};
const FAN = { r: 42.5, xs: [-64, 68] as const };

export function buildArcCard(tools: ModelTools) {
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
  const { nickel, copper } = kit.materials;
  const { material } = tools;

  const matte = finish('plastic', '#101113', 0.8),
    satin = finish('anodized', '#17191c', 0.6),
    edge = finish('anodized', '#2a2d31', 0.5);
  matte.envMapIntensity = 0.25;
  satin.envMapIntensity = 0.35;

  // ── Board ──────────────────────────────────────────────────────────────
  const board = new T.Group();
  put(
    board,
    tools.pcb(v(PCB.x1 - PCB.x0, 1.6, PCB.halfZ * 2), 'graphics'),
    (PCB.x0 + PCB.x1) / 2,
    0,
    0,
  );
  text(board, 'ARC B580 · BMG-G21', -104, 0.9, -44, 40, '#8c938a');
  for (const x of [GPU.x - 27, GPU.x + 27])
    for (const z of [-27, 27]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(m(2.4), m(0.5), 6, 16),
        nickel,
      );
      ring.rotation.x = Math.PI / 2;
      put(board, ring, x, 0.95, z);
    }
  register('arcpcb', board, 0, 0, 0, [0, -0.8, 0]);

  const pkg = new T.Group();
  put(pkg, box(37.5, 1.4, 37.5, material('#1d3a2a', 0.15)));
  for (const x of [-15, 15])
    for (let i = 0; i < 8; i++)
      put(pkg, box(1.4, 0.6, 1, nickel), x, 1, -13.3 + i * 3.8);
  register('arcpackage', pkg, GPU.x, 2.2, GPU.z, [0, 1.3, 0]);
  const die = new T.Group();
  put(die, box(16.5, 1, 16.5, material('#636b70', 0.9, 0.3)));
  const dieMark = new T.Group();
  text(dieMark, 'intel', 0, 0, -3.5, 9, '#aeb3b2');
  text(dieMark, 'BMG-G21', 0, 0, 3.5, 12, '#aeb3b2');
  put(die, dieMark, 0, 0.56, 0);
  register('arcsilicon', die, GPU.x, 4.1, GPU.z, [0, 1.68, 0]);
  register('arcbga', kit.ballGrid(17, 2), GPU.x, 1.25, GPU.z, [0, 0.98, 0]);
  register(
    'arctim',
    box(16.5, 0.2, 16.5, material('#8b8f8d', 0.2, 0.9)),
    GPU.x,
    4.75,
    GPU.z,
    [0, 2.1, 0],
  );

  // Six GDDR6 packages: two above, two below, one either side.
  const memory: Vec3[] = [
    v(-76, 2.6, -31),
    v(-48, 2.6, -31),
    v(-76, 2.6, 31),
    v(-48, 2.6, 31),
    v(-95, 2.6, 0),
    v(-29, 2.6, 0),
  ];
  kit
    .instances('arcgddr6', memory, v(12, 2.6, 14), 0, '#111417')
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 0.9, p.base.z * 0.4),
    );
  kit
    .instances(
      'arcthermalpad',
      memory.map((p) => [p[0], m(3.6), p[2]]),
      v(12, 1.6, 14),
      0,
      '#777d80',
    )
    .forEach((p) =>
      p.delta.set((p.base.x - m(GPU.x)) * 0.5, 2.1, p.base.z * 0.4),
    );

  // Six GPU phases in a column at the end of the board, two memory phases
  // near the bracket.
  const chokes: Vec3[] = [],
    stages: Vec3[] = [],
    caps: Vec3[] = [];
  for (let row = 0; row < 6; row++) {
    const z = -35 + row * 14;
    chokes.push(v(-8, 4.5, z));
    stages.push(v(-18.5, 1.8, z));
  }
  for (const z of [22, 36]) {
    chokes.push(v(-112, 4.5, z));
    stages.push(v(-122, 1.8, z));
  }
  kit
    .instances('arcvrm', chokes, v(9, 7, 9.5), 0, '#24292d')
    .forEach((p) => p.delta.set(p.base.x > m(-60) ? 1.2 : -1.2, 0.6, 0));
  kit
    .instances('arcpowerstage', stages, v(5, 1.5, 5), 0, '#111416')
    .forEach((p) => p.delta.set(p.base.x > m(-60) ? 1.45 : -1.45, 0.4, 0));
  for (let i = 0; i < 9; i++) caps.push(v(2.5, 3.8, -40 + i * 10));
  kit
    .instances(
      'arccapacitor',
      caps,
      v(5.2, 6, 5.2),
      0,
      '#ffffff',
      kit.capacitorGeometry(2.6, 5.6),
    )
    .forEach((p) => p.delta.set(1.7, 0.4, 0));

  chip('arcpwm', 'PWM', -112, -38, 6);
  chip('arcbios', 'VBIOS', -118, 4, 7);
  chip('arctemperature', 'TEMP', -108, -20, 4);
  for (let i = 0; i < 4; i++)
    chip('arcesd', 'ESD', -130, -36 + i * 20, 3, 3, [-0.6, 0.9, 0]);
  register('arccrystal', box(6, 1.5, 3, nickel), -98, 1.8, 17, [-0.8, 0.75, 0]);
  for (const x of [GPU.x - 27, GPU.x + 27])
    for (const z of [-27, 27])
      register(
        'arcstandoff',
        new T.Mesh(new T.CylinderGeometry(m(2.4), m(2.4), m(6), 6), nickel),
        x,
        3.9,
        z,
        [0, 0.6, z * 0.015],
      );
  const retention = new T.Group();
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const arm = box(54, 0.8, 5, nickel);
    arm.rotation.y = angle;
    put(retention, arm);
  }
  register('arcretention', retention, GPU.x, Y.retention, GPU.z, [0, -1.3, 0]);

  // The single 8-pin socket sits on the top edge of the board, latch outward.
  const power = new T.Group();
  put(power, box(21, 12, 9));
  for (let i = 0; i < 8; i++) {
    const x = -6.3 + (i % 4) * 4.2,
      y = -2.1 + Math.floor(i / 4) * 4.2;
    put(power, box(3.3, 3.3, 0.3, material('#030405', 0)), x, y, -4.6);
    put(power, box(1, 1, 0.3, nickel), x, y, -4.75);
  }
  put(power, box(5, 2.5, 3), 0, 6.8, -3);
  register('arcpower', power, -8, 7, -PCB.halfZ + 3, [0.6, 0.7, -1.6]);

  // ── Outputs and edge connector ─────────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const hdmi = i === 3;
    register(
      hdmi ? 'archdmi' : 'arcdisplayport',
      kit.displaySocket(hdmi ? 'hdmi' : 'dp'),
      -127,
      6.5,
      -36 + i * 24,
      [-2, 0, (i - 1.5) * 0.15],
    );
  }
  register(
    'arcpcie',
    kit.edgeConnector(89, 82),
    -42,
    0,
    PCB.halfZ + 5,
    [0, -1.35, 0.8],
  );

  // ── Cooler ─────────────────────────────────────────────────────────────
  // A copper contact block on a black mounting plate that also presses on the
  // memory and regulator pads.
  const cold = new T.Group();
  put(cold, box(98, 2, 88, satin), 0, 0.5, 0);
  put(cold, box(30, 3, 30, copper), 0, -1, 0);
  for (let i = 0; i < 4; i++)
    put(cold, box(36, 2.4, 6.5, copper), 0, 2.2, (i - 1.5) * 9);
  register('arccoldplate', cold, GPU.x + 6, Y.coldplate, GPU.z, [0, 2.4, 0]);

  // Four pipes, each running from one fin stack, across the cold plate and
  // out into the other.
  for (let i = 0; i < 4; i++) {
    const z = (i - 1.5) * 9;
    heatpipe(
      'archeatpipe',
      [
        [-128, 16 + (i % 2) * 4, z * 2.2],
        [-100, 12, z * 1.5],
        [GPU.x, 9.3, z],
        [-20, 12, z * 1.5],
        [20, 15 + (i % 2) * 4, z * 2.2],
        [124, 18 + (i % 2) * 4, z * 2.2],
      ],
      2.6,
      [0, 2.75 + i * 0.04, 0],
      copper,
    );
  }

  // Two fin stacks standing on edge, one over the board and one over the open
  // end, with a gap between them where the pipes cross.
  const fins = new T.Group();
  const finMat = material('#43484c', 0.82, 0.85);
  finMat.envMapIntensity = 0.4;
  const finHeight = Y.finsTop - Y.finsBottom;
  const across = W * 0.84,
    pitch = 1.7;
  const finGeometry = new T.BoxGeometry(m(0.3), m(finHeight), m(across));
  for (const [start, stop] of [
    [-L / 2 + 8, -2],
    [14, L / 2 - 8],
  ]) {
    const rows = Math.round((stop - start) / pitch);
    const bank = new T.InstancedMesh(finGeometry, finMat, rows),
      helper = new T.Object3D();
    for (let i = 0; i < rows; i++) {
      helper.position.set(m(start + ((stop - start) * i) / (rows - 1)), 0, 0);
      helper.updateMatrix();
      bank.setMatrixAt(i, helper.matrix);
    }
    bank.castShadow = bank.receiveShadow = true;
    fins.add(bank);
    for (const z of [-across * 0.46, across * 0.46])
      put(
        fins,
        box(stop - start, 1.5, 3, finMat),
        (start + stop) / 2,
        -finHeight * 0.46,
        z,
      );
  }
  register(
    'archeatsink',
    fins,
    0,
    (Y.finsTop + Y.finsBottom) / 2,
    0,
    [0, 3.2, 0],
  );

  // ── Shroud ─────────────────────────────────────────────────────────────
  const shroud = new T.Group();
  const aperture = FAN.r * 1.04;
  const face = chamfered(L / 2, W / 2 - 1, 6);
  for (const x of FAN.xs) face.holes.push(circle(x, 0, aperture));
  put(shroud, plate(face, 2.2, matte));
  // A slim satin band across the middle, between the two fans.
  const band = chamfered(9, W / 2 - 8, 3);
  put(shroud, plate(band, 0.8, satin), (FAN.xs[0] + FAN.xs[1]) / 2, 2.2, 0);
  for (const x of FAN.xs) {
    const rim = new T.Mesh(
      new T.TorusGeometry(m(aperture), m(0.9), 8, 80),
      edge,
    );
    rim.rotation.x = Math.PI / 2;
    put(shroud, rim, x, 2.3, 0);
    for (const angle of [0.5, 2.6, 4.7]) {
      const arm = slab(FAN.r * 1.02, 1, 3.4, satin);
      arm.rotation.y = angle;
      put(
        shroud,
        arm,
        x + Math.cos(angle) * FAN.r * 0.5,
        -6.5,
        -Math.sin(angle) * FAN.r * 0.5,
      );
    }
  }
  const sideHeight = Y.shroud - Y.finsBottom + 2;
  for (const sz of [-1, 1]) {
    // Solid lower rail and upper lip on both long edges; the fins show
    // between them, which is how the air leaves a flow-through card sideways.
    put(shroud, slab(L - 2, 5, 2, matte), 0, -1.5, sz * (W / 2 - 1));
    put(
      shroud,
      slab(L - 2, 3, 2, matte),
      0,
      -sideHeight + 2.5,
      sz * (W / 2 - 1),
    );
    for (const x of [-L / 2 + 5, -2, 62, L / 2 - 5])
      put(
        shroud,
        slab(8, sideHeight, 2, matte),
        x,
        -sideHeight / 2 + 1,
        sz * (W / 2 - 1),
      );
  }
  for (const sx of [-1, 1])
    put(
      shroud,
      slab(2, sideHeight, W - 6, matte),
      sx * (L / 2 - 1),
      -sideHeight / 2 + 1,
      0,
    );
  const faceMark = new T.Group();
  text(faceMark, 'intel ARC', 0, 0, 0, 34, '#707477');
  put(shroud, faceMark, 2, 3.2, 0);
  faceMark.rotation.y = Math.PI / 2;
  register('arcshroud', shroud, 0, Y.shroud, 0, [0, 4.2, 0]);

  // The white Intel Arc logo on the top edge.
  const logo = new T.Group();
  const lettering = new T.Group();
  tools.label(lettering, 'intel ARC', [0, 0, 0], m(44), '#f4f7ff');
  lettering.rotation.x = -Math.PI / 2;
  put(logo, lettering, 0, 0, -0.4);
  put(
    logo,
    new T.Mesh(
      new T.BoxGeometry(m(46), m(8), m(0.4)),
      kit.glow('#ffffff', 0.35),
    ),
    0,
    0,
    0.1,
  );
  register('arclogo', logo, 52, Y.shroud - 12, -W / 2 - 0.4, [0, 3.6, -1.1]);

  // ── Fans, motors and wiring ────────────────────────────────────────────
  for (const [i, x] of FAN.xs.entries())
    kit.add(
      'arcfan',
      kit.fan(FAN.r * 0.97, 11, {
        ring: true,
        badge: i === 0 ? 'intel' : 'ARC',
        bladeColor: '#0d0f11',
      }),
      v(x, Y.fan, 0),
      [x * MM * 0.18, 4.6, 0],
    );
  for (const x of FAN.xs) kit.fanMotor('arcfanmotor', x, Y.fanMotor, 8.5);
  kit.fanHeader('arcfanheader', -122, 45, [-0.8, 0.5, 0.6]);
  for (const [i, x] of FAN.xs.entries())
    kit.fanCable(
      'arcfancable',
      [
        [-122 + i * 2, 4, 45],
        [-118, 10, 54],
        [x, 26, 54],
        [x, 28, 14],
        [x, 29, 0],
      ],
      [0, 3.1, 0.3],
    );
  for (const x of [-128, -2, 128])
    for (const z of [-50, 50])
      register('arcfastener', kit.screw(2), x, Y.shroud + 2.8, z, [0, 5.2, 0]);
  for (const x of [-100, 20])
    register(
      'arcfastener',
      kit.screw(2),
      x,
      Y.backplate - 0.2,
      44,
      [0, -2.9, 0],
    );

  // ── Bracket and backplate ──────────────────────────────────────────────
  register(
    'arcbracket',
    kit.bracket(W - 4, Y.shroud + 2.5 - Y.backplate),
    -L / 2 - 1.5,
    (Y.shroud + 2.5 + Y.backplate) / 2,
    0,
    [-2, 0, 0],
  );
  const back = chamfered(L / 2, W / 2, 6);
  back.holes.push(rect(PCB.x1 + 12, -42, L / 2 - 12, 42));
  const backplate = new T.Group();
  put(backplate, plate(back, 1.4, satin));
  const mark = new T.Group();
  text(mark, 'intel ARC B580', 0, 0, 0, 62, '#8d9296');
  mark.rotation.x = Math.PI;
  put(backplate, mark, -64, -0.3, 0);
  register('arcbackplate', backplate, 0, Y.backplate, 0, [0, -2.2, 0]);

  kit.passives(
    'arcresistor',
    'arcmlcc',
    [
      'arcpackage',
      'arcgddr6',
      'arcvrm',
      'arcpowerstage',
      'arccapacitor',
      'arcpwm',
      'arcbios',
      'arctemperature',
      'arcesd',
      'arccrystal',
      'arcfanheader',
      'arcstandoff',
      'arcpower',
      'arcdisplayport',
      'archdmi',
    ],
    { x0: PCB.x0 + 8, x1: PCB.x1 - 4, z0: -PCB.halfZ + 3, z1: PCB.halfZ - 3 },
    48,
  );

  // ── Airflow ─────────────────────────────────────────────────────────────
  // A card is two fans pressing air down into fin banks. Where there is
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
