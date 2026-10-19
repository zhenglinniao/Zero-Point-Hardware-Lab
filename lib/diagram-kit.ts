import * as T from 'three';
import { byId } from './manifest.ts';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';

/**
 * The visual language the chip diagrams are drawn in.
 *
 * Navi 48 and BMG-G21 are drawn the same way so that they can be compared:
 * labelled blocks standing on a slab, a rail down each long edge and a caption
 * in one corner. Only the colours are the chip's own, so the drawing lives here
 * once and each chip supplies a palette. GB202's scales were drawn before this
 * kit existed and still build their own scenery; they share `put` only.
 */

/** Position an object inside a group, and hand it back. */
export const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
  obj.position.set(...pos);
  parent.add(obj);
  return obj;
};

/** The colours one chip's diagrams are drawn in. */
export type DiagramPalette = {
  /** The slab the blocks stand on. */
  panel: string;
  /** The rail along each of its long edges. */
  rail: string;
  /** The caption in its corner. */
  caption: string;
  /** Lettering on the blocks themselves. */
  text: string;
};

export function diagramKit(
  { add, box, label }: ModelTools,
  palette: DiagramPalette,
) {
  /** Scenery under a diagram, so the blocks read as sitting on something. */
  const backdrop = (root: T.Group, size: [number, number], caption: string) => {
    const frame = new T.Group();
    frame.userData.contextFrame = true;
    put(frame, box([size[0], 0.09, size[1]], palette.panel, 0.55), [
      0,
      -0.08,
      0,
    ]);
    for (const side of [-1, 1])
      put(frame, box([size[0] * 0.98, 0.045, 0.025], palette.rail, 0.7), [
        0,
        0.01,
        side * (size[1] / 2 - 0.1),
      ]);
    label(
      frame,
      caption,
      [-size[0] / 2 + 1.2, 0.01, -size[1] / 2 + 0.25],
      2,
      palette.caption,
    );
    root.add(frame);
  };

  /** A single labelled block, added as one selectable part. */
  const block = (
    id: string,
    size: Vec3,
    pos: Vec3,
    color: string,
    text = byId[id].shortName.toUpperCase(),
    delta: Vec3 = [0, 1, Math.sign(pos[2]) * 0.4],
    textColor = palette.text,
  ) => {
    const group = new T.Group();
    put(group, box(size, color, 0.45), [0, 0, 0]);
    label(
      group,
      text,
      [0, size[1] / 2 + 0.01, 0],
      Math.min(size[0] * 0.86, text.length * 0.2 + 0.4),
      textColor,
    );
    return add(id, group, pos, delta);
  };

  return { backdrop, block };
}
