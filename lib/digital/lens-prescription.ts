/** DoubleGauss sample, Optiland (Kramer Harrison), MIT.
 * Radii/thicknesses/material sequence are unscaled source data, in mm.
 * Clear radii and the mechanical barrel are authored for visualization and
 * are not manufacturing drawings or a recovered commercial Sony lens. */
export const doubleGaussSurfaces = [
  { radius: 56.20238, thickness: 8.75, glass: 'N-SSK2' },
  { radius: 152.2858, thickness: 0.5, glass: 'air' },
  { radius: 37.68262, thickness: 12.5, glass: 'N-SK2' },
  { radius: Infinity, thickness: 3.8, glass: 'F5' },
  { radius: 24.2313, thickness: 16.369445, glass: 'air' },
  { radius: Infinity, thickness: 13.747957, glass: 'air', stop: true },
  { radius: -28.37731, thickness: 3.8, glass: 'F5' },
  { radius: Infinity, thickness: 11, glass: 'N-SK16' },
  { radius: -37.92546, thickness: 0.5, glass: 'air' },
  { radius: 177.41176, thickness: 7, glass: 'N-SK16' },
  { radius: -79.41143, thickness: 61.487536, glass: 'air' },
] as const;
export const opticalVertices = doubleGaussSurfaces.map((_, i) =>
  doubleGaussSurfaces.slice(0, i).reduce((sum, s) => sum + s.thickness, 0),
);
export const opticalCentre = opticalVertices[10] / 2;
export const imagePlaneY =
  opticalCentre - opticalVertices[10] - doubleGaussSurfaces[10].thickness;
export const lensMountY = imagePlaneY + 18;
export const cameraLensZ = 27.5 - lensMountY;
export const lensElements = [
  { id: 1, front: 0, back: 1, clearRadius: 25.5, group: 'frontglass' },
  { id: 2, front: 2, back: 3, clearRadius: 22, group: 'focusglass' },
  { id: 3, front: 3, back: 4, clearRadius: 22, group: 'focusglass' },
  { id: 4, front: 6, back: 7, clearRadius: 21, group: 'innerglass' },
  { id: 5, front: 7, back: 8, clearRadius: 21, group: 'innerglass' },
  { id: 6, front: 9, back: 10, clearRadius: 22, group: 'rearglass' },
] as const;
/** SCHOTT Sellmeier coefficients from refractiveindex.info (CC0), wavelength µm. */
const coefficients: Record<string, readonly number[]> = {
  'N-SSK2': [
    1.4306027, 0.00823982975, 0.153150554, 0.0333736841, 1.01390904, 106.870822,
  ],
  'N-SK2': [
    1.28189012, 0.0072719164, 0.257738258, 0.0242823527, 0.96818604, 110.377773,
  ],
  F5: [
    1.3104463, 0.00958633048, 0.19603426, 0.0457627627, 0.96612977, 115.011883,
  ],
  'N-SK16': [
    1.34317774, 0.00704687339, 0.241144399, 0.0229005, 0.994317969, 92.7508526,
  ],
};
export function glassIndex(name: string, wavelength = 0.5876) {
  if (name === 'air') return 1;
  const c = coefficients[name];
  if (!c) throw new Error(`Unknown optical glass ${name}`);
  const l = wavelength * wavelength;
  return Math.sqrt(
    1 +
      (c[0] * l) / (l - c[1]) +
      (c[2] * l) / (l - c[3]) +
      (c[4] * l) / (l - c[5]),
  );
}
export function sphericalSag(radius: number, radial: number) {
  if (!Number.isFinite(radius)) return 0;
  if (radial > Math.abs(radius))
    throw new Error('Clear radius exceeds spherical surface');
  return (
    radius - Math.sign(radius) * Math.sqrt(radius * radius - radial * radial)
  );
}

/** Paraxial consistency check / pupil scale, not a full aberration simulation. */
export function paraxialPrescription() {
  let height = 1,
    reducedAngle = 0,
    index = 1,
    stopGain = 0,
    backFocus = 0;
  for (let i = 0; i < doubleGaussSurfaces.length; i++) {
    const surface = doubleGaussSurfaces[i],
      next = glassIndex(surface.glass);
    if (Number.isFinite(surface.radius))
      reducedAngle -= ((next - index) * height) / surface.radius;
    if ('stop' in surface) stopGain = height;
    if (i === doubleGaussSurfaces.length - 1)
      backFocus = -height / reducedAngle;
    height += (surface.thickness / next) * reducedAngle;
    index = next;
  }
  const focalLength = -1 / reducedAngle;
  return {
    focalLength,
    backFocus,
    stopRadius: (Math.abs(stopGain) * focalLength) / 10,
    imageHeight: height,
  };
}
