import * as T from 'three';

/** Cut a closed thin shell with an exact plane, including its annular rim.
 * Cutting the already tessellated surface keeps complementary seams identical. */
export function horizontalSection(
  source: T.BufferGeometry,
  y: number,
  upper: boolean,
) {
  const p = source.getAttribute('position'),
    n = source.getAttribute('normal');
  const positions: number[] = [],
    normals: number[] = [],
    segments: T.Vector3[][] = [];
  type Vertex = { p: T.Vector3; n: T.Vector3 };
  const emit = (v: Vertex) => {
    positions.push(...v.p.toArray());
    normals.push(...v.n.toArray());
  };
  for (let i = 0; i < p.count; i += 3) {
    const input: Vertex[] = [0, 1, 2].map((j) => ({
      p: new T.Vector3().fromBufferAttribute(p, i + j),
      n: new T.Vector3().fromBufferAttribute(n, i + j),
    }));
    const output: Vertex[] = [],
      crossings: T.Vector3[] = [];
    for (let j = 0; j < 3; j++) {
      const a = input[j],
        b = input[(j + 1) % 3],
        insideA = upper ? a.p.y >= y : a.p.y <= y,
        insideB = upper ? b.p.y >= y : b.p.y <= y;
      if (insideA) output.push(a);
      if (insideA !== insideB) {
        const t = (y - a.p.y) / (b.p.y - a.p.y);
        const point = a.p.clone().lerp(b.p, t);
        point.y = y;
        output.push({ p: point, n: a.n.clone().lerp(b.n, t).normalize() });
        crossings.push(point);
      }
    }
    if (crossings.length === 2) segments.push(crossings);
    for (let j = 1; j < output.length - 1; j++) {
      emit(output[0]);
      emit(output[j]);
      emit(output[j + 1]);
    }
  }
  const key = (p: T.Vector3) =>
    `${Math.round(p.x * 10000)},${Math.round(p.z * 10000)}`;
  const edges = new Map<string, { point: T.Vector3; next: string[] }>();
  for (const [a, b] of segments) {
    const ka = key(a),
      kb = key(b);
    if (ka === kb) continue;
    if (!edges.has(ka)) edges.set(ka, { point: a, next: [] });
    if (!edges.has(kb)) edges.set(kb, { point: b, next: [] });
    edges.get(ka)!.next.push(kb);
    edges.get(kb)!.next.push(ka);
  }
  const seen = new Set<string>(),
    loops: T.Vector2[][] = [];
  for (const start of edges.keys()) {
    if (seen.has(start)) continue;
    let current = start,
      previous = '';
    const loop: T.Vector2[] = [];
    while (!seen.has(current)) {
      seen.add(current);
      const edge = edges.get(current)!;
      loop.push(new T.Vector2(edge.point.x, edge.point.z));
      const next = edge.next.find((k) => k !== previous);
      if (!next) break;
      previous = current;
      current = next;
    }
    if (current === start && loop.length > 2) loops.push(loop);
  }
  loops.sort(
    (a, b) => Math.abs(T.ShapeUtils.area(b)) - Math.abs(T.ShapeUtils.area(a)),
  );
  if (loops.length) {
    const vertices = loops.flat(),
      normal = new T.Vector3(0, upper ? -1 : 1, 0);
    const faces = T.ShapeUtils.triangulateShape(loops[0], loops.slice(1));
    for (const face of faces) {
      const triangle = face.map(
        (i) => new T.Vector3(vertices[i].x, y, vertices[i].y),
      );
      const cross = new T.Vector3()
        .subVectors(triangle[1], triangle[0])
        .cross(new T.Vector3().subVectors(triangle[2], triangle[0]));
      if (cross.dot(normal) < 0) triangle.reverse();
      triangle.forEach((p) => emit({ p, n: normal }));
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  const uv = new Float32Array((positions.length / 3) * 2);
  for (let i = 0; i < positions.length / 3; i++) {
    uv[i * 2] = positions[i * 3] / 24 + 0.5;
    uv[i * 2 + 1] = positions[i * 3 + 2] / 30 + 0.5;
  }
  geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
  geometry.computeBoundingBox();
  return geometry;
}
