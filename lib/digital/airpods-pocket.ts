import * as T from 'three';

/** Mirrored oval head recess with an inward silicone-tip recess. Coordinates
 * belong to the case, so the tray opening and cup use the exact same outline. */
export function airpodsPocket(left: boolean) {
  const s = new T.Path();
  s.moveTo(-14, 8.2);
  s.bezierCurveTo(-20, 8.2, -24.8, 4.8, -24.8, 0);
  s.bezierCurveTo(-24.8, -4.8, -20, -8.2, -14, -8.2);
  s.bezierCurveTo(-8, -8.2, -6, -6, -4.5, -5.8);
  s.lineTo(-1.2, -5.8);
  s.quadraticCurveTo(-0.4, -5.8, -0.4, -5);
  s.lineTo(-0.4, 5);
  s.quadraticCurveTo(-0.4, 5.8, -1.2, 5.8);
  s.lineTo(-4.5, 5.8);
  s.bezierCurveTo(-6, 6, -8, 8.2, -14, 8.2);
  s.closePath();
  const points = s.getSpacedPoints(192).slice(0, -1);
  return new T.Path(points.map((p) => (left ? p : new T.Vector2(-p.x, -p.y))));
}

export function airpodsCup(left: boolean) {
  const points = airpodsPocket(left).getSpacedPoints(192).slice(0, -1);
  const centre = left ? -14 : 14,
    sign = left ? 1 : -1;
  const levels = [0, 0.6, 1, 2, 3, 4, 5, 6, 7, 10, 15, 21.4];
  const positions: number[] = [],
    indices: number[] = [];
  for (const outer of [false, true])
    for (const depth of outer ? [...levels].reverse() : levels) {
      const mix = T.MathUtils.smoothstep(depth, 1, 7);
      for (const p of points) {
        const u = p.x - centre,
          v = p.y,
          angle = Math.atan2(v, u);
        const x = T.MathUtils.lerp(u, -sign * 5 + Math.cos(angle) * 3.1, mix);
        const z = T.MathUtils.lerp(v, sign * 2.3 + Math.sin(angle) * 2.7, mix);
        positions.push(
          x + (outer ? 0.3 * Math.cos(angle) : 0),
          -depth,
          z + (outer ? 0.3 * Math.sin(angle) : 0),
        );
      }
    }
  const count = points.length,
    rings = levels.length * 2;
  for (let row = 0; row < rings; row++)
    for (let i = 0; i < count; i++) {
      const a = row * count + i,
        b = row * count + ((i + 1) % count),
        c = ((row + 1) % rings) * count + ((i + 1) % count),
        d = ((row + 1) % rings) * count + i;
      indices.push(a, c, b, a, d, c);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
