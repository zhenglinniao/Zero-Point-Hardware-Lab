import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';

const put = (parent: T.Group, object: T.Object3D, position: Vec3) => {
  object.position.set(...position);
  parent.add(object);
  return object;
};

function dieFrame(
  root: T.Group,
  box: ModelTools['box'],
  label: ModelTools['label'],
  title: string,
  tint: string,
) {
  const frame = new T.Group();
  frame.userData.contextFrame = true;
  put(frame, box([10.4, 0.08, 7.0], tint, 0.52), [0, -0.12, 0]);
  for (const x of [-4.95, 4.95])
    put(frame, box([0.06, 0.04, 6.5], '#8b7853', 0.82), [x, -0.03, 0]);
  label(frame, title, [0, 0.02, -3.1], 5.8, '#b8c7cf');
  root.add(frame);
}

function block(
  box: ModelTools['box'],
  label: ModelTools['label'],
  size: Vec3,
  color: string,
  title: string,
  subtitle?: string,
) {
  const group = new T.Group();
  put(group, box(size, color, 0.5), [0, 0, 0]);
  label(
    group,
    title,
    [0, size[1] / 2 + 0.03, subtitle ? -size[2] * 0.18 : 0],
    size[0] * 0.76,
    '#e0e8ec',
  );
  if (subtitle)
    label(
      group,
      subtitle,
      [0, size[1] / 2 + 0.03, size[2] * 0.24],
      size[0] * 0.72,
      '#aebdc5',
    );
  return group;
}

/** Logical floorplan of the Ryzen desktop I/O die, not a mask layout. */
export function buildRyzenIo({ add, box, label }: ModelTools, root: T.Group) {
  dieFrame(root, box, label, 'RYZEN I/O DIE · FUNCTIONAL FLOORPLAN', '#2b2030');

  add(
    'zeniofabric',
    block(
      box,
      label,
      [4.8, 0.22, 2.0],
      '#5a4664',
      'I/O FABRIC',
      'CCD 0  ↔  CCD 1',
    ),
    [0, 0.12, 0],
    [0, 1.5, 0],
  );
  for (const side of [-1, 1]) {
    add(
      'zeniomemory',
      block(
        box,
        label,
        [2.2, 0.2, 2.35],
        '#356d6b',
        `DDR5 CH ${side < 0 ? 'A' : 'B'}`,
      ),
      [side * 3.55, 0.1, -1.65],
      [side * 1.1, 1.2, -0.6],
    );
    add(
      'zeniopcie',
      block(
        box,
        label,
        [2.25, 0.2, 1.6],
        '#4d6475',
        side < 0 ? 'PCIe x16' : 'PCIe / NVMe',
      ),
      [side * 3.55, 0.1, 1.5],
      [side * 1.1, 1.2, 0.7],
    );
  }
  add(
    'zeniodisplay',
    block(box, label, [2.25, 0.2, 1.45], '#536d45', 'DISPLAY', 'MEDIA ENGINE'),
    [-1.35, 0.1, 2.55],
    [-0.5, 1.2, 1.2],
  );
  add(
    'zeniousb',
    block(box, label, [2.25, 0.2, 1.45], '#655533', 'USB', 'PLATFORM I/O'),
    [1.35, 0.1, 2.55],
    [0.5, 1.2, 1.2],
  );

  const links = new T.Group();
  for (const x of [-3.55, -1.35, 1.35, 3.55])
    put(links, box([0.09, 0.05, 1.05], '#d7a25e', 0.82), [
      x,
      0,
      x === -1.35 || x === 1.35 ? 1.45 : 0.55,
    ]);
  links.userData.contextFrame = true;
  root.add(links);
}

/** Logical floorplan of Arrow Lake's I/O extender tile. */
export function buildCoreIo({ add, box, label }: ModelTools, root: T.Group) {
  dieFrame(
    root,
    box,
    label,
    'CORE ULTRA I/O EXTENDER · FUNCTIONAL FLOORPLAN',
    '#202a32',
  );

  for (const side of [-1, 1]) {
    add(
      'arrowiopcie',
      block(
        box,
        label,
        [2.45, 0.22, 2.2],
        '#405c70',
        side < 0 ? 'PCIe 5.0' : 'PCIe ROOT PORTS',
      ),
      [side * 3.45, 0.11, -1.55],
      [side * 1.15, 1.2, -0.7],
    );
    add(
      'arrowiothunderbolt',
      block(
        box,
        label,
        [2.45, 0.22, 1.75],
        '#4d6d62',
        `THUNDERBOLT ${side < 0 ? '0' : '1'}`,
      ),
      [side * 3.45, 0.11, 1.3],
      [side * 1.15, 1.2, 0.7],
    );
  }
  add(
    'arrowioclock',
    block(box, label, [4.0, 0.22, 1.65], '#655534', 'CLOCKING + PHY SUPPORT'),
    [0, 0.11, -1.55],
    [0, 1.4, -0.8],
  );
  add(
    'arrowiod2d',
    block(
      box,
      label,
      [4.0, 0.22, 1.8],
      '#5c4566',
      'DIE-TO-DIE LINK',
      'TO SoC / BASE TILE',
    ),
    [0, 0.11, 1.25],
    [0, 1.4, 0.8],
  );

  const pads = new T.Group();
  for (let i = 0; i < 28; i++)
    put(pads, box([0.18, 0.04, 0.18], '#b69755', 0.88), [
      -3.8 + (i % 14) * 0.58,
      0,
      2.75 + Math.floor(i / 14) * 0.28,
    ]);
  pads.userData.contextFrame = true;
  root.add(pads);
}
