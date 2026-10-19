import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildChip, buildScrew } from './parts.ts';

/**
 * Inside a 2.5-inch SATA solid-state drive.
 *
 * X is the 100 mm length, Z is the 69.85 mm width and Y comes up through the
 * 7 mm enclosure. The board is intentionally shorter than the case: many
 * consumer drives use the familiar 2.5-inch shell around a much smaller PCB.
 */
const mm = (v: number) => v / 8;
const L = mm(100);
const W = mm(69.85);
const H = mm(7);

export function buildSsd(tools: ModelTools, _root: T.Group) {
  const { add, box, pcb, material, label } = tools;
  const place = (group: T.Group, object: T.Object3D, position: Vec3) => {
    object.position.set(...position);
    group.add(object);
    return object;
  };

  // Bottom tray, folded up at the edges with the standard side fixings.
  const tray = new T.Group();
  place(tray, box([L, mm(1), W], '#5f676d', 0.88, 0.006), [0, -H / 2, 0]);
  for (const sx of [-1, 1])
    place(tray, box([mm(1), H, W], '#697177', 0.88), [
      sx * (L / 2 - mm(0.5)),
      0,
      0,
    ]);
  for (const sz of [-1, 1])
    place(tray, box([L, H, mm(1)], '#697177', 0.88), [
      0,
      0,
      sz * (W / 2 - mm(0.5)),
    ]);
  for (const sx of [-1, 1])
    for (const z of [-mm(24), mm(24)])
      place(tray, buildScrew(material, mm(1.5)), [
        sx * (L / 2 + mm(0.2)),
        0,
        z,
      ]);
  label(
    tray,
    '2.5-INCH SATA SSD',
    [0, -H / 2 + mm(0.6), mm(24)],
    mm(62),
    '#41494e',
  );
  add('ssdcase', tray, [0, 0, 0], [0, -1.8, 0]);

  // Stamped lid. It is a removable part rather than a sealed solid block, so
  // the assembled view is complete and the board can be exposed cleanly.
  const lid = new T.Group();
  place(
    lid,
    box([L - mm(1.2), mm(1), W - mm(1.2)], '#9aa2a8', 0.92, 0.005),
    [0, 0, 0],
  );
  place(lid, box([mm(72), mm(0.5), mm(44)], '#d9dde0', 0.08, 0.002), [
    0,
    mm(0.65),
    0,
  ]);
  label(lid, 'SOLID STATE DRIVE', [0, mm(1), -mm(5)], mm(52), '#4f575c');
  label(lid, 'SATA 6 Gb/s', [0, mm(1), mm(9)], mm(34), '#6a7277');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(lid, buildScrew(material, mm(1.4)), [
        sx * mm(44),
        mm(1),
        sz * mm(29),
      ]);
  add('ssdcover', lid, [0, H / 2, 0], [0, 2.7, 0]);

  // A representative compact SSD board with controller, DRAM and four NAND
  // packages. Package population varies; the physical relationships do not.
  const board = new T.Group();
  place(board, pcb([mm(82), mm(1.2), mm(58)], 'storage'), [-mm(7), 0, 0]);
  label(board, 'SATA SSD PCB', [-mm(7), mm(0.8), mm(25)], mm(44), '#82998b');
  add('ssdboard', board, [0, 0, 0], [0, -1.0, 0]);

  const controller = new T.Group();
  place(
    controller,
    buildChip(material, [mm(13), mm(1.8), mm(13)], 7, true, '#171a1d'),
    [0, 0, 0],
  );
  label(controller, 'CTRL', [0, mm(1.5), 0], mm(11), '#8c9499');
  add('ssdcontroller', controller, [-mm(18), mm(1.5), 0], [-1.2, 1.6, 0]);

  const dram = new T.Group();
  place(
    dram,
    buildChip(material, [mm(11), mm(1.5), mm(8)], 6, true, '#1b1e21'),
    [0, 0, 0],
  );
  label(dram, 'DRAM', [0, mm(1.3), 0], mm(9), '#8c9499');
  add('ssddram', dram, [-mm(3), mm(1.4), 0], [0, 1.5, 0]);

  for (const [i, position] of (
    [
      [-mm(23), -mm(18)],
      [-mm(3), -mm(18)],
      [-mm(23), mm(18)],
      [-mm(3), mm(18)],
    ] as const
  ).entries()) {
    const nand = new T.Group();
    place(
      nand,
      box([mm(16), mm(1.8), mm(13)], '#191c1f', 0.14, 0.002),
      [0, 0, 0],
    );
    label(nand, 'NAND', [0, mm(1.2), 0], mm(12), '#7d858a');
    add(
      'ssdnand',
      nand,
      [position[0], mm(1.5), position[1]],
      [(i < 2 ? -1 : 1) * 0.8, 2.0, position[1] * 0.12],
    );
  }

  // The narrow 7-pin data and wide 15-pin power connectors are separate
  // selectable parts, matching the two L-keyed sockets on the reference drive.
  const connector = (pins: number, width: number, text: string) => {
    const group = new T.Group();
    place(group, box([width, mm(5), mm(6)], '#171a1d', 0.12), [0, 0, 0]);
    for (let i = 0; i < pins; i++)
      place(group, box([mm(0.65), mm(1), mm(3.5)], '#c1a45d', 0.92), [
        -width / 2 + mm(1.5) + (i * (width - mm(3))) / Math.max(1, pins - 1),
        -mm(1.2),
        mm(1.1),
      ]);
    label(group, text, [0, mm(3.2), 0], width * 0.8, '#8b9398');
    return group;
  };
  add(
    'ssddata',
    connector(7, mm(16), 'DATA · 7 PIN'),
    [mm(31), 0, mm(31.5)],
    [1.2, 0, 1.8],
  );
  add(
    'ssdpower',
    connector(15, mm(28), 'POWER · 15 PIN'),
    [mm(8), 0, mm(31.5)],
    [0.5, 0, 2.0],
  );
}
