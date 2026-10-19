import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, put, type DiagramPalette } from './diagram-kit.ts';

/**
 * The logical scales inside Navi 48: the die, a shader engine, a workgroup
 * processor and a compute unit.
 *
 * A block diagram of the architecture AMD described at Hot Chips 2025, drawn
 * in the same visual language as the GB202 scales so the two can be compared.
 * Counts are AMD's; sizes and positions are illustrative. The die is drawn
 * wide so the four shader engines sit in one row; it is not a floorplan.
 */

type Level = 'navi48' | 'rxse' | 'rxwgp' | 'rxcu';

/** Warm greys, so an AMD scale is recognisable beside the other two chips. */
const palette: DiagramPalette = {
  panel: '#21171a',
  rail: '#7a5a55',
  caption: '#a88580',
  text: '#e6d6d2',
};

export function buildRadeonArchitecture(
  level: Level,
  tools: ModelTools,
  root: T.Group,
) {
  const { add, instances, box, material, label } = tools;
  const { backdrop, block } = diagramKit(tools, palette);

  if (level === 'navi48') {
    backdrop(root, [11.6, 7.6], 'NAVI 48 · 356.5 MM²');
    const seX = [-3.9, -1.3, 1.3, 3.9];
    instances(
      'rxse',
      seX.map((x) => [x, 0.2, -0.3] as Vec3),
      [2.4, 0.3, 3.1],
    ).forEach((p, i) => p.delta.set((i - 1.5) * 0.45, 1.3, 0));
    instances(
      'rxinfinity',
      seX.map((x) => [x, 0.16, -2.4] as Vec3),
      [2.4, 0.2, 0.55],
    ).forEach((p) => p.delta.set(0, 0.9, -0.7));
    instances(
      'rxmemctl',
      seX.map((x) => [x, 0.16, -3.1] as Vec3),
      [2.4, 0.2, 0.5],
    ).forEach((p) => p.delta.set(0, 0.7, -1.2));
    block(
      'rxl2',
      [10.6, 0.2, 0.5],
      [0, 0.15, 1.65],
      '#4c2f2e',
      'L2 CACHE · 8 MB',
      [0, 1.5, 0],
    );
    const services: [string, number, number, number, string][] = [
      ['rxcommand', -4.15, 2.35, 2.3, '#6b4c3a'],
      ['rxcompress', -1.65, 2.35, 2.3, '#5f4640'],
      ['rxmp0', 0.2, 2.35, 1.0, '#5a4a4f'],
      ['rxhost', 2.0, 2.35, 2.2, '#4c5a5c'],
      ['rxdisplay', 4.3, 2.35, 2.0, '#634c68'],
    ];
    for (const [id, x, z, w, color] of services)
      block(id, [w, 0.16, 0.5], [x, 0.12, z], color, undefined, [
        x * 0.12,
        0.6,
        0.65,
      ]);
    for (let i = 0; i < 2; i++)
      block(
        'rxmedia',
        [2.55, 0.16, 0.5],
        [-1.4 + i * 2.8, 0.12, 3.0],
        '#76654a',
        'MEDIA ENGINE ' + (i + 1),
        [(i - 0.5) * 0.8, 0.6, 1.1],
      );
  } else if (level === 'rxse') {
    backdrop(root, [9.6, 7.8], 'SHADER ENGINE · 1 OF 4');
    instances(
      'rxwgp',
      Array.from(
        { length: 8 },
        (_, i) =>
          [
            ((i % 4) - 1.5) * 2.15,
            0.2,
            (Math.floor(i / 4) - 0.5) * 2.25,
          ] as Vec3,
      ),
      [1.95, 0.28, 2.0],
    );
    block(
      'rxraster',
      [4.1, 0.2, 0.6],
      [-2.2, 0.18, -2.75],
      '#6a4150',
      'RASTERIZER',
    );
    block(
      'rxprim',
      [4.1, 0.2, 0.6],
      [2.2, 0.18, -2.75],
      '#5d4a60',
      'PRIMITIVE UNIT',
    );
    instances(
      'rxrb',
      [
        [-2.2, 0.2, 2.65],
        [2.2, 0.2, 2.65],
      ],
      [4.1, 0.22, 0.55],
      0,
      '#6f5078',
    ).forEach((p) => p.delta.set(p.base.x * 0.2, 0.9, 0.8));
    instances(
      'rxra',
      Array.from({ length: 4 }, (_, i) => [(i - 1.5) * 2.2, 0.17, 3.3] as Vec3),
      [2.0, 0.16, 0.4],
      0,
      '#58465e',
    ).forEach((p) => p.delta.set(p.base.x * 0.1, 0.7, 1.2));
  } else if (level === 'rxwgp') {
    backdrop(root, [8.6, 7.4], 'WORKGROUP PROCESSOR');
    instances(
      'rxcu',
      [
        [-2, 0.2, 0],
        [2, 0.2, 0],
      ],
      [3.5, 0.32, 3.7],
    );
    block(
      'rxsched',
      [7.6, 0.2, 0.6],
      [0, 0.18, -2.55],
      '#8a5a3e',
      'SCHEDULER UNITS',
    );
    block(
      'rxslm',
      [7.6, 0.18, 0.6],
      [0, 0.15, 2.55],
      '#4a3036',
      'SHARED MEMORY · 128 KB',
    );
  } else {
    backdrop(root, [10.2, 7.6], 'COMPUTE UNIT');
    // Two 32-wide ALUs: drawn as one block each with their lanes marked on
    // top, because AMD names each unit, not its lanes.
    const lanes = (
      group: T.Group,
      width: number,
      depth: number,
      color: string,
    ) => {
      const lane = new T.BoxGeometry(width / 8 - 0.06, 0.04, depth / 4 - 0.08);
      const mat = material(color, 0.4, 0.5);
      for (let i = 0; i < 32; i++) {
        const m = new T.Mesh(lane, mat);
        m.position.set(
          ((i % 8) - 3.5) * (width / 8),
          0.13,
          (Math.floor(i / 8) - 1.5) * (depth / 4),
        );
        group.add(m);
      }
    };
    const alu = (id: string, x: number, color: string, text: string) => {
      const group = new T.Group();
      put(group, box([3.3, 0.22, 2.3], color, 0.45), [0, 0, 0]);
      lanes(group, 3.1, 1.7, '#e3b892');
      label(group, text, [0, 0.14, -1.0], 2.6, '#f2e0d4');
      add(id, group, [x, 0.15, -0.55], [x * 0.15, 1.2, -0.3]);
    };
    alu('rxalu', -3.1, '#8a4c36', 'ALU · FMA · 32-WIDE');
    alu('rxaluint', 0.35, '#8f5a31', 'ALU · FMA/INT · 32-WIDE');
    block(
      'rxtlu',
      [1.5, 0.22, 2.3],
      [3.35, 0.15, -0.55],
      '#7a5b47',
      'TLU · 8-WIDE',
      [0.8, 1.0, 0],
    );
    block(
      'rxscalar',
      [2.1, 0.18, 0.55],
      [-3.7, 0.13, -2.55],
      '#6b4a3f',
      'SCALAR UNIT',
      [0, 0.8, -0.9],
    );
    block(
      'rxscache',
      [1.9, 0.18, 0.55],
      [-1.55, 0.13, -2.55],
      '#4d3434',
      'SCALAR CACHE · 16 KB',
      [0, 0.8, -0.9],
    );
    block(
      'rxsgpr',
      [1.9, 0.18, 0.55],
      [0.45, 0.13, -2.55],
      '#4d3a3a',
      'SCALAR GPR · 8 KB',
      [0, 0.8, -0.9],
    );
    block(
      'rxsic',
      [3.1, 0.18, 0.55],
      [3.05, 0.13, -2.55],
      '#4b3440',
      'INSTRUCTION CACHE · 32 KB',
      [0, 0.8, -0.9],
    );
    instances(
      'rxmatrix',
      [
        [-3.55, 0.2, 1.35],
        [-1.3, 0.2, 1.35],
      ],
      [2.1, 0.26, 1.35],
      0,
      '#a57a3a',
    ).forEach((p) => p.delta.set(p.base.x * 0.15, 1.3, 0.2));
    block(
      'rxvgpr',
      [4.35, 0.18, 0.5],
      [-2.43, 0.13, 2.45],
      '#46333b',
      'VECTOR GPR · 192 KB',
      [0, 0.8, 0.8],
    );
    block(
      'rxtexls',
      [4.35, 0.16, 0.45],
      [-2.43, 0.12, 3.22],
      '#5a4c66',
      'TEXTURE LOAD / STORE',
      [0, 0.7, 1.2],
    );
    block(
      'rxl0',
      [1.6, 0.18, 0.5],
      [3.95, 0.13, 3.1],
      '#40323a',
      'RA L0 · 32 KB',
      [0.6, 0.8, 1.0],
    );
    // The ray accelerator, drawn like the other ray tracing blocks in the
    // project: a raised tile carrying cubes for its ray/box units and
    // triangles for its ray/triangle units.
    const ray = new T.Group();
    put(ray, box([3.8, 0.26, 2.0], '#5b3b4f', 0.65, 0.1), [0, 0, 0]);
    put(ray, box([3.55, 0.045, 1.8], '#2a2230', 0.55), [0, 0.15, 0]);
    label(ray, 'RAY ACCELERATOR', [0, 0.184, -0.72], 2.4, '#ecc8da');
    label(ray, '8 BOX · 2 TRIANGLE', [0, 0.184, 0.74], 2.2, '#b597a8');
    for (let j = 0; j < 8; j++) {
      const cube = new T.Mesh(
        new T.BoxGeometry(0.28, 0.06, 0.28),
        material('#b58aa1', 0.55, 0.4),
      );
      put(ray, cube, [
        -1.4 + (j % 4) * 0.5,
        0.2,
        -0.25 + Math.floor(j / 4) * 0.45,
      ]);
    }
    for (let j = 0; j < 2; j++) {
      const triangle = new T.Mesh(
        new T.CylinderGeometry(0.3, 0.3, 0.055, 3),
        material('#c79bb4', 0.6, 0.35),
      );
      put(ray, triangle, [0.85 + j * 0.7, 0.2, -0.02]);
      triangle.rotation.y = j * 0.6;
    }
    add('rxray', ray, [2.45, 0.12, 1.7], [0.9, 1.2, 0.2]);
  }
}
