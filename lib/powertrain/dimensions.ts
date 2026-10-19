/** Millimetres. Published anchors and reconstruction assumptions are separated.
 * Honda UT2 manual pp. 1-11 / 2-3; ORNL 2013 APE051 slide 14. */
export const GX = {
  bore: 68,
  stroke: 45,
  pistonDiameter: 67.99,
  pinDiameter: 17.997,
  crankpinDiameter: 29.975,
  rodBore: 30.026,
  inclination: (25 * Math.PI) / 180,
  intakeDiameter: 25,
  exhaustDiameter: 24,
  intakeStem: 5.474,
  exhaustStem: 5.433,
  valveGuideBore: 5.506,
  camJournal: 13.975,
  // Reconstructed dimensions, not OEM measurements:
  rodLength: 70,
  pinY: 92.5,
  // Piston crown at TDC: pinY + pistonPinOffset + 20 = 124.5.
  // Reconstructed deck clearance and chamber, not factory measured values.
  deckY: 125.2,
  deckClearance: 0.7,
  headGasket: 0.8,
  chamberRadius: 30,
  chamberDepth: 5.3,
  rockerY: 68.8,
  tappetTopY: 38.5,
  pistonHeight: 44,
  pistonPinOffset: 12,
  crankTeeth: 20,
  camTeeth: 40,
  gearModule: 1.5,
} as const;
export const gxPushrodBottomY = GX.tappetTopY + 3;
export const gxPushrodTopY = GX.deckY + GX.headGasket + GX.rockerY - 4.5 - 3;
export const LEAF = {
  statorOD: 198.12,
  statorBore: 130.96,
  statorStack: 151.38,
  rotorOD: 129.97,
  rotorStack: 151.16,
  shaftDiameter: 44.45,
  slots: 48,
  poles: 8,
  phases: 3,
  // Reconstruction: individual slot, magnet, jacket and bearing profiles.
  slotOuterRadius: 89,
  slotInnerRadius: 69,
  bearingInner: 22.225,
  bearingOuter: 42,
  bearingWidth: 18,
} as const;
export const gxRingAngles = {
  top: 0.5,
  second: 0.5 + (2 * Math.PI) / 3,
  oilUpper: 0.5 + (4 * Math.PI) / 3 - 0.2,
  oilLower: 0.5 + (4 * Math.PI) / 3 + 0.2,
} as const;
/** Shared reconstructed cover flange datums, outside the crank/cam chamber. */
export const gxCoverBolts: readonly (readonly [number, number])[] = [
  [-86, -25],
  [-72, 38],
  [-20, 52],
  [65, 30],
  [74, -18],
  [44, -53],
];
export const radialAirGap = (LEAF.statorBore - LEAF.rotorOD) / 2;
export function pistonPinHeight(angle: number) {
  const r = GX.stroke / 2;
  return (
    r * Math.cos(angle) +
    Math.sqrt(GX.rodLength ** 2 - (r * Math.sin(angle)) ** 2)
  );
}

/** Dual-layer IPM topology follows the Motor-CAD LEAF tutorial, not OEM CAD.
 * Outer pair is flat; the inner pair forms a 124° included V. */
export const leafMagnetBars = Array.from({ length: 8 }, (_, pole) => {
  const a = (pole * Math.PI) / 4;
  return [-1, 1].flatMap((side) => [
    {
      pole,
      layer: 'flat',
      x: 57.9 * Math.cos(a) - side * 15.7 * Math.sin(a),
      y: 57.9 * Math.sin(a) + side * 15.7 * Math.cos(a),
      angle: a,
      thickness: 3.862,
      width: 13.9,
    },
    {
      pole,
      layer: 'v',
      x: 47 * Math.cos(a) - side * 10.1 * Math.sin(a),
      y: 47 * Math.sin(a) + side * 10.1 * Math.cos(a),
      angle: a - (side * 28 * Math.PI) / 180,
      thickness: 2.6,
      width: 21.33,
    },
  ]);
}).flat();

export const leafCoils = Array.from({ length: 24 }, (_, i) => {
  const from = (i * 10) % 48;
  return {
    from,
    to: (from + 5) % 48,
    phase: [0, 2, 1][(from / 2) % 3],
    polarity: (from / 2) % 2 ? -1 : 1,
  };
});

/** Same slot coordinate for the straight strands and both winding ends. */
export function leafWirePoint(
  slot: number,
  parallel: number,
  turn: number,
  z: number,
): [number, number, number] {
  const a = (slot * Math.PI) / 24,
    r = 74 + parallel * 0.7;
  const t = (turn - 2.5) * 0.84 + (parallel % 2 ? 0.21 : -0.21);
  return [
    r * Math.cos(a) - t * Math.sin(a),
    r * Math.sin(a) + t * Math.cos(a),
    z,
  ];
}
