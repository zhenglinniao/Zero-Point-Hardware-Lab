import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, put, type DiagramPalette } from './diagram-kit.ts';

/**
 * The logical scales inside BMG-G21: the die, a render slice, an Xe-core and
 * a vector engine.
 *
 * A block diagram of Intel's published Xe2 hierarchy, in the same visual
 * language as the other two GPUs. Counts are Intel's; sizes and positions are
 * illustrative, and nothing here is a floorplan.
 */

type Level = 'bmg' | 'xeslice' | 'xecore' | 'xve';

/** Cool blues, so an Intel scale is recognisable beside the other two chips. */
const palette: DiagramPalette = {
  panel: '#141d26',
  rail: '#4f7390',
  caption: '#7ea3bf',
  text: '#d6e4ee',
};

export function buildArcArchitecture(
  level: Level,
  tools: ModelTools,
  root: T.Group,
) {
  const { add, instances, box, material, label } = tools;
  const { backdrop, block } = diagramKit(tools, palette);

  if (level === 'bmg') {
    backdrop(root, [11.2, 7.6], 'BMG-G21 · XE2-HPG');
    instances(
      'xeslice',
      Array.from({ length: 5 }, (_, i) => [(i - 2) * 2.08, 0.2, -0.35] as Vec3),
      [1.9, 0.3, 3.4],
    ).forEach((p, i) => p.delta.set((i - 2) * 0.35, 1.3, 0));
    block(
      'arcl2',
      [10.3, 0.2, 0.5],
      [0, 0.15, 1.8],
      '#284457',
      'L2 CACHE · 18 MB',
      [0, 1.5, 0],
    );
    block(
      'arcmemif',
      [4.9, 0.16, 0.5],
      [-2.7, 0.12, -2.7],
      '#2f5360',
      'GDDR6 INTERFACE · 192-BIT',
      [0, 0.7, -0.9],
    );
    for (let i = 0; i < 2; i++)
      block(
        'arcmfx',
        [2.4, 0.16, 0.5],
        [1.35 + i * 2.65, 0.12, -2.7],
        '#6c6147',
        'MFX TRANSCODER ' + (i + 1),
        [(i + 0.5) * 0.5, 0.7, -0.9],
      );
    block(
      'archost',
      [4.9, 0.16, 0.5],
      [-2.7, 0.12, 2.55],
      '#355a5e',
      'PCIE 4.0 ×8 HOST',
      [0, 0.7, 0.9],
    );
    block(
      'arcdisplay',
      [5.05, 0.16, 0.5],
      [2.62, 0.12, 2.55],
      '#584e6c',
      'DISPLAY ENGINE',
      [0, 0.7, 0.9],
    );
  } else if (level === 'xeslice') {
    backdrop(root, [8.4, 7.8], 'RENDER SLICE · 1 OF 5');
    instances(
      'xecore',
      [
        [-1.8, 0.2, -1.95],
        [1.8, 0.2, -1.95],
        [-1.8, 0.2, 0.65],
        [1.8, 0.2, 0.65],
      ],
      [3.3, 0.3, 2.35],
    );
    instances(
      'arcsampler',
      Array.from({ length: 4 }, (_, i) => [(i - 1.5) * 1.8, 0.18, 2.4] as Vec3),
      [1.6, 0.2, 0.5],
      0,
      '#5b5480',
    ).forEach((p) => p.delta.set(p.base.x * 0.1, 0.8, 0.8));
    instances(
      'arcpixel',
      [
        [-1.8, 0.18, 3.1],
        [1.8, 0.18, 3.1],
      ],
      [3.4, 0.2, 0.55],
      0,
      '#664f78',
    ).forEach((p) => p.delta.set(p.base.x * 0.2, 0.7, 1.2));
  } else if (level === 'xecore') {
    backdrop(root, [11, 7.4], 'XE-CORE');
    instances(
      'xve',
      Array.from(
        { length: 8 },
        (_, i) =>
          [
            ((i % 4) - 1.5) * 2.0 - 0.9,
            0.2,
            (Math.floor(i / 4) - 0.5) * 2.45,
          ] as Vec3,
      ),
      [1.8, 0.28, 2.2],
    );
    block(
      'arcslm',
      [7.8, 0.18, 0.55],
      [-0.9, 0.13, -3.0],
      '#244654',
      'SLM · 128 KB',
      [0, 0.9, -0.8],
    );
    block(
      'arcl1',
      [7.8, 0.18, 0.55],
      [-0.9, 0.13, 3.0],
      '#2a4758',
      'L1 CACHE · 256 KB',
      [0, 0.9, 0.8],
    );
    const rtu = new T.Group();
    put(rtu, box([1.75, 0.26, 5.4], '#3f3e66', 0.65, 0.1), [0, 0, 0]);
    put(rtu, box([1.55, 0.045, 5.1], '#23233a', 0.55), [0, 0.15, 0]);
    label(rtu, 'RTU', [0, 0.184, -2.2], 1.1, '#cdc6f0');
    label(rtu, '18 BOX', [0, 0.184, 1.6], 1.2, '#a79fc6');
    label(rtu, '2 TRI · 3 PIPES', [0, 0.184, 2.2], 1.45, '#a79fc6');
    for (let j = 0; j < 18; j++) {
      const cube = new T.Mesh(
        new T.BoxGeometry(0.22, 0.06, 0.22),
        material('#8f86c4', 0.55, 0.4),
      );
      put(rtu, cube, [
        -0.45 + (j % 3) * 0.45,
        0.2,
        -1.7 + Math.floor(j / 3) * 0.42,
      ]);
    }
    for (let j = 0; j < 2; j++) {
      const triangle = new T.Mesh(
        new T.CylinderGeometry(0.28, 0.28, 0.055, 3),
        material('#aaa0dc', 0.6, 0.35),
      );
      put(rtu, triangle, [-0.35 + j * 0.7, 0.2, 1.05]);
      triangle.rotation.y = j * 0.5;
    }
    add('arcrtu', rtu, [4.4, 0.12, 0], [1.0, 1.2, 0]);
  } else {
    backdrop(root, [10.4, 7.6], 'XE VECTOR ENGINE');
    const alu: Vec3[] = [];
    for (let i = 0; i < 16; i++)
      alu.push([
        ((i % 8) - 3.5) * 0.98 - 0.6,
        0.2,
        -1.25 + Math.floor(i / 8) * 0.72,
      ]);
    instances('arcalu', alu, [0.82, 0.16, 0.6]);
    instances(
      'arcthread',
      Array.from(
        { length: 8 },
        (_, i) => [((i % 8) - 3.5) * 0.98 - 0.6, 0.18, -2.95] as Vec3,
      ),
      [0.82, 0.18, 0.5],
      0,
      '#4a6f93',
    ).forEach((p) => p.delta.set(p.base.x * 0.05, 0.8, -0.9));
    block(
      'arcregister',
      [7.8, 0.18, 0.45],
      [-0.6, 0.13, -2.2],
      '#2c5566',
      '512-BIT REGISTERS',
      [0, 0.9, -0.5],
    );
    // The XMX engine: a large tile carrying a matrix of accumulators, the
    // visual counterpart of the Tensor cores and RDNA matrix accelerators.
    const xmx = new T.Group();
    put(xmx, box([5.1, 0.26, 2.6], '#2d6a70', 0.6, 0.08), [0, 0, 0]);
    const cell = new T.BoxGeometry(0.34, 0.05, 0.2);
    const cellMat = material('#7fc4c3', 0.45, 0.45);
    for (let i = 0; i < 64; i++) {
      const c = new T.Mesh(cell, cellMat);
      c.position.set(
        ((i % 16) - 7.5) * 0.29,
        0.15,
        -0.55 + Math.floor(i / 16) * 0.3,
      );
      xmx.add(c);
    }
    label(xmx, 'XMX ENGINE · 2048-BIT', [0, 0.16, 0.95], 3.4, '#d8f1f0');
    add('arcxmx', xmx, [-2.0, 0.14, 1.75], [-0.4, 1.3, 0.6]);
    block(
      'arcem',
      [2.9, 0.2, 1.15],
      [2.35, 0.14, 1.1],
      '#46557a',
      'EXTENDED MATH · FP64',
      [0.8, 1.0, 0.2],
    );
    block(
      'arccoissue',
      [2.9, 0.2, 1.15],
      [2.35, 0.14, 2.5],
      '#6a5a3e',
      '3-WAY CO-ISSUE',
      [0.8, 1.0, 0.8],
    );
  }
}
