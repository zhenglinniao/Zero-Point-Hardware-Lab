import type { Definition, DigitalLevel, DigitalPart } from './catalogue.ts';
import type { Vec3 } from '../layout.ts';

export function refinePs5Rebuild(definitions: Definition[]) {
  const get = (id: DigitalLevel) => definitions.find((d) => d.id === id)!;
  const edit = (level: DigitalLevel, id: string, patch: Partial<DigitalPart>) =>
    Object.assign(
      get(level).parts.find((p) => p.id === id)!,
      patch,
    );
  const add = (
    level: DigitalLevel,
    id: string,
    name: string,
    size: Vec3,
    pos: Vec3,
    delta: Vec3,
    description: string,
    category: DigitalPart['category'] = 'Cooling',
  ) =>
    get(level).parts.push({
      id,
      name,
      size,
      pos,
      delta,
      description,
      purpose: description,
      category,
      shape: 'box',
      color: '#777e83',
      sources: ['ps5teardown'],
    });
  edit('ps5-power', 'housing', {
    name: '异形电源下壳与 PCB 支承柱',
    description:
      '按原版拆解照片重建折转轮廓与收窄尾部，内壁、底座和支承柱共用板形基准。',
    delta: [0, 0, 0],
    opensFirst: false,
  });
  edit('ps5-power', 'cover', {
    description:
      '与下壳共用靴形边界，两个通风区域采用真实贯穿孔；先竖直抬盖，再侧向让位。',
    path: [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.18, offset: [0, 45, 0] },
      { at: 0.3, offset: [80, 60, 0] },
    ],
  });
  edit('ps5-power', 'pcb', {
    size: [57.2, 1.6, 165.2],
    delta: [0, 0, 0],
    description:
      '收窄且折转的整块电源板，支承柱顶面接触 PCB 下表面；输入、储能、变压和输出元件均安装在同一块板上。',
  });
  edit('ps5-power', 'input', { pos: [0, -12, -62], size: [44, 24, 30] });
  edit('ps5-power', 'bulk', {
    name: '卧式初级储能电容组',
    size: [44, 23, 34],
    pos: [0, -12.5, -28],
    description:
      '拆解照片中的两只卧式大电容并排安装，轴向引脚折回主板；数量和姿态依据照片，未标注未经确认的容量。',
  });
  edit('ps5-power', 'transformer', { pos: [-4, -8, 7], size: [23, 31, 26] });
  edit('ps5-power', 'secondary', {
    pos: [-9, -12, 57],
    size: [24, 24, 38],
    description:
      '尾部收窄区的输出滤波电容、整流封装与散热片，直接安装在公共 PCB 上，无虚构的第二块小板。',
  });
  for (const p of get('ps5-power').parts.filter(
    (p) => !['housing', 'cover', 'pcb'].includes(p.id),
  )) {
    const end = p.delta;
    p.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.28, offset: [0, 0, 0] },
      { at: 0.48, offset: [0, 65, 0] },
      { at: 0.68, offset: [end[0] * 1.6, 95, end[2] * 1.6] },
    ];
    p.description += ' 此后分解属于元件级去焊示意，不表示可直接拔下。';
  }
  add(
    'ps5-power',
    'output',
    '主板直插供电接触座',
    [18, 14, 10],
    [-9, -15.5, 77],
    [45, 65, 35],
    '输出接触座位于窄端，金属触点嵌入绝缘壳；主板通过接触连接取电。',
    'Power',
  );
  add(
    'ps5-power',
    'insulator',
    'PCB 底面绝缘垫片',
    [57.2, 0.25, 165.2],
    [0, -26.1, 0],
    [0, -55, 0],
    '异形绝缘片覆盖 PCB 下方，四个支承孔避让固定柱；与金属机壳之间留绝缘空间。',
    'Chassis',
  );
  get('ps5-power').parts.find((p) => p.id === 'output')!.path = [
    { at: 0, offset: [0, 0, 0] },
    { at: 0.28, offset: [0, 0, 0] },
    { at: 0.5, offset: [0, 70, 0] },
    { at: 0.68, offset: [65, 95, 45] },
  ];
  get('ps5-power').parts.find((p) => p.id === 'insulator')!.delta = [0, 0, 0];
  get('ps5-power').summary = '原版靴形电源 · 贯通通风孔、公共 PCB 与卧式电容';

  edit('ps5cooling', 'base', {
    size: [140, 2, 160],
    delta: [0, 0, 0],
    description:
      '带安装耳的异形承载铜板；中央留出导热脊线与管路，三个鳍片堆分区安装。',
  });
  edit('ps5cooling', 'fins', {
    pos: [0, 0, 0],
    size: [130, 21, 147],
    name: '三个分段异形鳍片堆',
    description:
      '三个错位的薄片堆保留导风间隙，每片根据实际热管曲线生成穿管孔，不用实心片穿过铜管。',
  });
  edit('ps5cooling', 'pipes', {
    pos: [0, 0, 0],
    size: [140, 30, 150],
    name: '六根弯曲铜热管',
    description:
      '六条连续弯管从接触底板导向三个鳍片区；孔位从相同曲线取样，路径和片数是照片重建近似。',
  });
  edit('ps5cooling', 'duct', {
    name: '分区导风边条',
    description: '边条沿外侧引导风路，中央与三个鳍片堆之间留出流通和管路空间。',
  });
  edit('ps5cooling', 'interface', {
    name: '液态金属薄层（剖分示意）',
    size: [24, 0.3, 26],
    description:
      '薄层位于处理器接触底板上侧，周边另设绝缘泡棉围护。不是普通硅脂垫，不模拟液体流动。',
  });
  add(
    'ps5cooling',
    'foam',
    '液金周边绝缘泡棉围护',
    [35, 1.1, 37],
    [-17, 29.3, 46.5],
    [52, 60, 0],
    '带中央窗口的泡棉围护包围液金接触区，防止把整个接触区域画成实心导热垫。',
  );
  add(
    'ps5cooling',
    'brackets',
    '鳍片端部固定耳与铆接点',
    [140, 3, 160],
    [0, 0, 0],
    [0, -48, 0],
    '端部安装耳与底座孔同轴；耳片和铆接点表达总成固定关系，不是独立散热块。',
    'Chassis',
  );
  // Brazed fins/pipes cannot be slid apart as though they were service modules.
  for (const p of get('ps5cooling').parts) {
    if (['base', 'fins', 'pipes', 'coldplate', 'brackets'].includes(p.id))
      p.delta = [0, 0, 0];
    else p.motion = [0.05, 0.25];
  }
  edit('ps5cooling', 'foam', {
    path: [
      { at: 0, offset: [0, 0, 0] },
      { at: 0.18, offset: [0, 35, 0] },
      { at: 0.3, offset: [52, 60, 0] },
    ],
  });
  edit('ps5cooling', 'interface', { delta: [0, 50, 0], motion: [0.3, 0.5] });
  edit('ps5cooling', 'duct', { delta: [0, 60, -60] });
  get('ps5cooling').summary = '分区鳍片、连续弯管与液金围护 · 焊接总成观察';
}
