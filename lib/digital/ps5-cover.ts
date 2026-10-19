import type { Vec3 } from '../layout.ts';

/** The visible skins and snap attachments share this same cover surface. */
export function ps5CoverPoint(
  right: boolean,
  height: number,
  depth: number,
  y: number,
  z: number,
): Vec3 {
  const flare =
    20 * Math.pow(Math.abs(y) / (height / 2), 3) +
    8 * Math.cos((z / depth) * Math.PI);
  const bulge = right
    ? 11 * Math.exp(-Math.pow((y + 60) / 105, 2) - Math.pow((z - 30) / 95, 2))
    : 0;
  return [
    (right ? 1 : -1) * (flare + bulge),
    y -
      Math.sign(y) *
        20 *
        Math.pow(Math.abs(y) / (height / 2), 9) *
        (z / depth + 0.5),
    z * (0.96 + 0.04 * Math.cos((y / height) * Math.PI * 2)) +
      12 * Math.sin((y / height) * Math.PI),
  ];
}
