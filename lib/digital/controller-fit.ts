import type { Definition, DigitalPart } from './catalogue.ts';

/** Fit independently built internals to the licensed controller surfaces. */
export function refineControllerFit(definitions: Definition[]) {
  const controller = definitions.find((d) => d.id === 'gamepad')!;
  const edit = (id: string, patch: Partial<DigitalPart>) =>
    Object.assign(
      controller.parts.find((p) => p.id === id)!,
      patch,
    );
  edit('back', { delta: [0, -45, 0], motion: [0.16, 0.28] });
  edit('top', { delta: [0, 110, 0], motion: [0.2, 0.36] });
  // Caps must leave their apertures vertically before moving sideways. The
  // upper shell then lifts through the space they have actually vacated.
  edit('buttons', {
    path: [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.1, offset: [0, 22, 0] },
      { at: 0.2, offset: [0, 22, 100] },
    ],
  });
  edit('touch', {
    path: [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.1, offset: [0, 25, 0] },
      { at: 0.2, offset: [0, 25, -70] },
    ],
  });
  edit('board', { pos: [0, 7.1, -17], delta: [0, 40, 0], motion: [0.5, 0.65] });
  edit('battery', {
    pos: [0, 0.5, -18],
    delta: [0, 24, 0],
    motion: [0.5, 0.65],
  });
  edit('holder', {
    pos: [0, -2, -18],
    size: [43, 7, 36],
    delta: [0, -12, 0],
    motion: [0.5, 0.65],
  });
  edit('speaker', {
    pos: [0, 18, -20],
    delta: [0, 60, 0],
    motion: [0.36, 0.5],
  });
  edit('membrane', { pos: [0, 8, 0], delta: [0, 60, 0], motion: [0.36, 0.5] });
  edit('wiring', {
    pos: [0, 0, 0],
    path: [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.55, offset: [0, 0, 0] },
      { at: 0.6, offset: [0, 0, 22] },
      { at: 0.68, offset: [0, -30, 22] },
    ],
  });
  for (const [id, x] of [
    ['haptics', -57],
    ['right-haptic', 57],
  ] as const)
    edit(id, { pos: [x, -12, 15] });
  const board = definitions.find((d) => d.id === 'gamepadboard')!;
  Object.assign(
    board.parts.find((p) => p.id === 'radio')!,
    { pos: [27, 3, -10] },
  );
  Object.assign(
    board.parts.find((p) => p.id === 'imu')!,
    { pos: [-10, 3, 10] },
  );
  Object.assign(
    board.parts.find((p) => p.id === 'usb')!,
    { pos: [0, 2, -20], size: [10, 3, 7] },
  );
  for (const id of ['leftstick', 'rightstick'])
    edit(id, { delta: [0, 48, 0], motion: [0.36, 0.5] });
  for (const id of ['triggers', 'right-trigger'])
    edit(id, { motion: [0.36, 0.55] });
  for (const id of ['haptics', 'right-haptic'])
    edit(id, { motion: [0.22, 0.36] });
  for (const level of ['gamepad-triggers', 'gamepad-right-trigger']) {
    const assembly = definitions.find((d) => d.id === level)!;
    for (const part of assembly.parts) {
      if (part.id === 'caps') {
        part.delta = [0, 0, -32];
        part.motion = [0, 0.2];
      } else {
        part.pos[1] += 4;
        part.pos[2] += 20;
        part.motion = [0.24, 0.65];
      }
    }
  }
}
