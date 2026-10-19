import type {
  Definition,
  DigitalLevel,
  DigitalPart,
  ShapeKind,
} from './catalogue.ts';
import type { Vec3 } from '../layout.ts';
import type { Category } from '../concept.ts';

// Assembly-local millimetres. Each dive installs the very same child model;
// functional subcomponents are not separately invented at the system level.
// Internal dimensions are reconstruction choices, not recovered factory CAD.
export function refinePrecisionAssemblies(definitions: Definition[]) {
  const get = (id: DigitalLevel) => definitions.find((d) => d.id === id)!;
  const edit = (level: DigitalLevel, id: string, patch: Partial<DigitalPart>) =>
    Object.assign(
      get(level).parts.find((p) => p.id === id)!,
      patch,
    );
  const part = (
    id: string,
    name: string,
    shape: ShapeKind,
    size: Vec3,
    pos: Vec3,
    delta: Vec3,
    description: string,
    category: Category = 'Board',
    color = '#323a40',
  ): DigitalPart => ({
    id,
    name,
    shape,
    size,
    pos,
    delta,
    description,
    purpose: description,
    category,
    color,
  });
  const add = (
    id: DigitalLevel,
    parent: DigitalLevel,
    name: string,
    unit: number,
    parts: DigitalPart[],
  ) => {
    const source = get(parent).source;
    definitions.push({
      id,
      parent,
      name,
      unit,
      source,
      summary: '从总成到零件 · 内部结构与工作原理',
      camera: { direction: [0.7, 1.4, 0.9], padding: 1.08 },
      specs: {
        结构依据: '同代设备维修或拆解资料，见来源链接',
        尺寸范围: '内部尺寸为资料重建；非制造测绘或维修公差',
      },
      parts: parts.map((p) => ({ ...p, sources: [source] })),
    });
  };

  edit('phone', 'display', {
    open: 'phone-display',
    rotation: [0, 0, Math.PI],
    description:
      '整机和显示层级共用同一薄层总成，包含盖板、光学层、OLED、背板和连接端；表面朝向机身正面。',
  });
  add('phone-display', 'phone', 'iPhone 15 显示总成', 12, [
    part(
      'glass',
      '圆角盖板与黑色边框',
      'screen',
      [69, 0.22, 145],
      [0, 0.37, 0],
      [0, 12, 0],
      '前盖板包围有效显示区，顶部开窗与 TrueDepth 区域对应。',
      'Chassis',
      '#101a21',
    ),
    part(
      'optical',
      '光学贴合与偏振层',
      'screen',
      [66.8, 0.045, 142.8],
      [0, 0.2, 0],
      [0, 7, 0],
      '透明贴合及偏振功能层；分层用于讲解，不代表原厂完整膜层配方。',
    ),
    part(
      'oled',
      'OLED 发光与驱动面板',
      'screen',
      [66.8, 0.12, 142.8],
      [0, 0.08, 0],
      [0, 0, 0],
      '面板按像素发光，显示驱动与机身电路通过柔性连接交换信号。',
    ),
    part(
      'graphite',
      '石墨导热与绝缘层',
      'screen',
      [65.5, 0.045, 140.5],
      [0, -0.07, 0],
      [0, -6, 0],
      '薄片帮助面板背部均温，并隔开相邻金属支承件。',
      'Cooling',
      '#30343a',
    ),
    part(
      'backplate',
      '显示背部支承板',
      'shield',
      [67, 0.17, 143],
      [0, -0.23, 0],
      [0, -12, 0],
      '支承板以薄板、边缘翻边和局部连接区表达，不用厚方块替代。',
      'Chassis',
      '#737b80',
    ),
    part(
      'flex',
      '显示驱动柔性连接与焊盘',
      'flex',
      [14, 0.1, 22],
      [-20, -0.39, 44],
      [22, -9, 8],
      '排线折叠在显示背面连接区，装配时留在机身厚度以内。',
    ),
    part(
      'seal',
      '周边显示胶与密封框',
      'frame',
      [68.5, 0.1, 144.5],
      [0, -0.43, 0],
      [-13, -8, 0],
      '连续周边密封框与显示面板分开，保留机身的圆角边界。',
      'Chassis',
      '#303638',
    ),
  ]);

  edit('ps5', 'power', {
    open: 'ps5-power',
    description:
      '可深入的封闭电源总成，内部区分输入滤波、储能、变压和低压输出区。',
  });
  add('ps5-power', 'ps5', 'PS5 内置电源总成', 20, [
    part(
      'housing',
      '电源下壳与固定座',
      'frame',
      [62, 64, 170],
      [0, -2, 0],
      [0, -65, 0],
      '薄壁壳体包围电路，设通风孔、安装柱和独立盖板。',
      'Chassis',
    ),
    part(
      'cover',
      '电源通风上盖',
      'shield',
      [62, 2, 170],
      [0, 33, 0],
      [0, 55, 0],
      '带通风槽的盖板先移开，随后可以看到电源板功能分区。',
      'Chassis',
    ),
    part(
      'pcb',
      '电源 PCB 与隔离槽',
      'board',
      [54, 1.6, 158],
      [0, -25, 0],
      [0, -15, 0],
      '初级与次级之间留隔离槽；装饰走线不作为真实电气网表。',
      'Power',
      '#31584b',
    ),
    part(
      'input',
      '交流输入与 EMI 滤波',
      'coil',
      [40, 24, 30],
      [0, -11.5, -58],
      [-48, 15, -20],
      '输入插座、共模电感与滤波元件组成独立功能总成。',
      'Power',
    ),
    part(
      'bulk',
      '初级储能电容',
      'ring',
      [23, 36, 23],
      [-12, -5, -20],
      [-40, 24, 0],
      '圆柱电容有绝缘套、顶部泄压纹与底部引出脚；容值不虚构。',
      'Power',
    ),
    part(
      'transformer',
      '高频变压器与绝缘骨架',
      'coil',
      [27, 31, 32],
      [7, -8, 16],
      [40, 24, 0],
      '磁芯、骨架和绕组分开表达，跨越能量转换的隔离边界。',
      'Power',
    ),
    part(
      'secondary',
      '次级整流与滤波区',
      'board',
      [42, 25, 30],
      [0, -11, 56],
      [45, 20, 25],
      '散热片、整流封装、输出电容和连接片沿输出端布置。',
      'Power',
    ),
  ]);
  get('ps5-power').parts.find((p) => p.id === 'cover')!.opensFirst = true;
  get('ps5-power').parts.find((p) => p.id === 'housing')!.opensFirst = true;
  edit('ps5', 'drive', { open: 'ps5-drive' });
  add('ps5-drive', 'ps5', 'PS5 蓝光驱动器', 20, [
    part(
      'chassis',
      '冲压底壳与减振安装点',
      'frame',
      [20, 145, 140],
      [0, 0, 0],
      [-32, 0, 0],
      '底壳容纳光学拾取与进盘机构，四角保留减振安装点。',
      'Chassis',
      '#929ca1',
    ),
    part(
      'cover',
      '光驱上盖与压盘座',
      'shield',
      [1, 143, 138],
      [9.5, 0, 0],
      [45, 0, 0],
      '薄金属盖与压盘座先移开，露出主轴和滑台。',
      'Chassis',
      '#aab0b3',
    ),
    part(
      'spindle',
      '盘片主轴与夹持盘',
      'ring',
      [10, 30, 30],
      [1, 8, 7],
      [32, 28, 0],
      '主轴电机转动夹持盘；这里只显示机械部件，不模拟激光或读取过程.',
    ),
    part(
      'pickup',
      '光学拾取滑台',
      'lens',
      [9, 25, 22],
      [-1, -27, 8],
      [30, -28, 0],
      '拾取头沿两根导轨移动，其物镜窗口与机械托架分开。',
    ),
    part(
      'rails',
      '双导轨与进给丝杆',
      'pipes',
      [7, 95, 38],
      [-4, -13, 7],
      [-30, 0, 32],
      '导轨限定拾取台运动，细丝杆将旋转转换为径向进给。',
    ),
    part(
      'loader',
      '吸入滚轮与传动齿轮',
      'ring',
      [10, 18, 110],
      [0, -57, 0],
      [0, -35, 35],
      '窄长滚轮与齿轮共同引导盘片进入；不把滚轮画成实心盘片。',
    ),
    part(
      'controller',
      '驱动控制板与排线接口',
      'board',
      [10, 27, 36],
      [-2, 47, -40],
      [-35, 25, -30],
      '电机驱动、读取控制和连接器位于独立控制板区域。',
    ),
  ]);
  get('ps5-drive').parts.find((p) => p.id === 'cover')!.opensFirst = true;

  edit('camera', 'board', { open: 'camera-board' });
  add('camera-board', 'camera', 'α7 IV 图像处理主板', 12, [
    part(
      'pcb',
      '带缺口的主板与安装孔',
      'board',
      [87, 1, 62],
      [0, 0, 0],
      [0, -16, 0],
      '主板按取景器及机身避让区组织轮廓；处理区与连接区使用统一坐标。',
      'Board',
      '#315d4c',
    ),
    part(
      'processor',
      '图像处理封装',
      'chip',
      [21, 1.6, 20],
      [-13, 1.5, 0],
      [-18, 18, 0],
      '处理封装具有基板、塑封与底部焊点示意，不虚构内部晶体管布局。',
      'Compute',
    ),
    part(
      'memory',
      '图像缓存封装',
      'chip',
      [14, 1.3, 17],
      [12, 1.35, 0],
      [18, 18, 0],
      '缓存为图像数据流提供临时存储，封装与处理器保持独立。',
      'Memory',
    ),
    part(
      'power',
      '电源管理与支持电路',
      'chip',
      [11, 1.1, 12],
      [28, 1.25, 15],
      [30, 14, 20],
      '电源管理封装和周边去耦元件位于板边区域，料号不作未经核实的标注。',
      'Power',
    ),
    part(
      'shield',
      '分区屏蔽罩与卡脚',
      'shield',
      [50, 0.35, 27],
      [-1, 3.25, 0],
      [0, 30, 0],
      '中空屏蔽罩围绕处理与缓存分区，留有高于封装顶面的净空。',
      'Chassis',
      '#a7afb0',
    ),
    part(
      'connectors',
      '传感器与控制排线插座',
      'connector',
      [76, 1.2, 52],
      [0, 1.2, 0],
      [35, 12, -20],
      '沿主板四侧布置有开口的柔性连接插座，接触片在插槽内部。',
    ),
  ]);
  edit('camera', 'shutter', {
    open: 'camera-shutter',
    description: '快门固定框、前后帘、驱动与排线共用相同总成坐标。',
  });
  add('camera-shutter', 'camera', 'α7 IV 焦平面快门', 7, [
    part(
      'frame',
      '快门固定框与成像窗口',
      'frame',
      [46, 1, 38],
      [0, 0, 0],
      [0, -10, 0],
      '中心开口覆盖成像区域，安装孔与传感器平面同轴。',
      'Chassis',
    ),
    part(
      'first',
      '前帘叶片组',
      'shutter',
      [38, 0.25, 25],
      [0, 0.68, 0],
      [-25, 7, 0],
      '薄叶片沿同一方向搭接，表示曝光开始一侧的机械帘。',
    ),
    part(
      'second',
      '后帘叶片组',
      'shutter',
      [38, 0.25, 25],
      [0, 1.18, 0],
      [25, 12, 0],
      '第二组叶片处于独立深度，避免与前帘几何重合。',
    ),
    part(
      'drive',
      '侧部驱动与连杆机构',
      'actuator',
      [3, 1.5, 27],
      [21, 0.7, 0],
      [18, 5, 0],
      '侧部转轴与连杆控制帘片；机构为资料参考的教学重建。',
    ),
    part(
      'flex',
      '快门控制柔性连接',
      'flex',
      [10, 0.12, 5],
      [10, 0.5, -16],
      [20, 0, -10],
      '短柔性连接留在固定框边缘，不穿过有效成像窗口。',
    ),
  ]);

  for (const [id, side] of [
    ['gamepad-haptics', 'haptics'],
    ['gamepad-right-haptic', 'right-haptic'],
  ] as const) {
    edit('gamepad', side, {
      open: id,
      description:
        '线性反馈机构可继续拆为套筒、固定磁路、运动质量、线圈与端盖；沿握柄安装。',
    });
    add(
      id,
      'gamepad',
      side === 'haptics' ? '左侧线性触觉反馈机构' : '右侧线性触觉反馈机构',
      5,
      [
        part(
          'sleeve',
          '金属套筒与固定耳',
          'ring',
          [15, 15, 24],
          [0, 0, 0],
          [-18, 0, 0],
          '沿握柄轴线的薄壁套筒，内部留出线性运动空间。',
          'Chassis',
          '#939da2',
        ),
        part(
          'magnet',
          '固定磁路与中心导向',
          'ring',
          [9, 9, 10],
          [0, 0, 0],
          [0, -15, 0],
          '固定磁体与中心导向构成磁路，区别于偏心旋转马达。',
        ),
        part(
          'mass',
          '可动质量与环形配重',
          'ring',
          [12, 12, 12],
          [0, 0, 0],
          [18, 0, 0],
          '环形质量通过端部弹性支承运动；此层用于理解线性反馈。',
        ),
        part(
          'coil',
          '驱动线圈与绝缘骨架',
          'coil',
          [10.4, 10.4, 11],
          [0, 0, 0],
          [0, 15, 0],
          '线圈与磁场相互作用推动运动组件；不进行电磁性能仿真。',
          'Power',
          '#b67b42',
        ),
        part(
          'end-a',
          '前端弹性支承与盖',
          'mount',
          [15, 15, 0.8],
          [0, 0, 12.4],
          [0, 0, 15],
          '端盖与弹性支承限制轴向行程，安装于套筒端面。',
        ),
        part(
          'end-b',
          '后端弹性支承与接线端',
          'mount',
          [15, 15, 0.8],
          [0, 0, -12.4],
          [0, 0, -15],
          '另一端盖带端子与短引线，不伸出握柄表面。',
        ),
      ],
    );
  }

  edit('earbuds', 'board', { open: 'earbuds-board', pos: [0, -3.8, -8.6] });
  add('earbuds-board', 'earbuds', 'AirPods Pro 2 充电盒管理板', 6, [
    part(
      'pcb',
      '充电管理板与安装缺口',
      'board',
      [46, 0.6, 25],
      [0, 0, 0],
      [0, -8, 0],
      '垂直安装于盒后侧，板形留出铰链与壳体固定位置。',
      'Board',
      '#294e43',
    ),
    part(
      'charger',
      '充电管理封装',
      'chip',
      [5, 0.65, 5],
      [-10, 0.75, 2],
      [-12, 9, 0],
      '管理盒电池和外部电源；仅标注功能，不虚构芯片供应商。',
      'Power',
    ),
    part(
      'controller',
      '定位与控制封装',
      'chip',
      [5.5, 0.65, 6],
      [2, 0.75, 1],
      [0, 12, 0],
      '盒内控制与定位相关电路以独立封装区表示。',
      'Compute',
    ),
    part(
      'power',
      '滤波与保护元件',
      'chip',
      [4, 0.65, 5],
      [13, 0.75, 2],
      [13, 9, 0],
      '保护与滤波器件沿电源路径排布，与中央封装保持间隔。',
      'Power',
    ),
    part(
      'connectors',
      '电芯、接口与触点连接座',
      'connector',
      [39, 0.7, 19],
      [0, 0.75, 0],
      [18, 7, 0],
      '插座在板边连接双电芯、USB-C 和耳机触点，接触片独立建模。',
    ),
  ]);
  edit('earbudunit', 'processor', {
    open: 'earbudunit-processor',
    size: [2.4, 0.8, 13],
    pos: [2.3, -6, 5],
  });
  add('earbudunit-processor', 'earbudunit', '耳柄柔性电路与音频处理', 1, [
    part(
      'flex',
      '柔性电路基底与覆盖膜',
      'board',
      [2.4, 0.12, 13],
      [0, 0, 0],
      [-4, 0, 0],
      '狭长柔性基底沿耳柄安装；铜线路为示意而非芯片网表。',
      'Board',
      '#9d692e',
    ),
    part(
      'sip',
      '音频处理 SiP 封装',
      'chip',
      [1.9, 0.38, 4],
      [0, 0.35, -2],
      [3, 4, 0],
      '微型系统封装负责音频与连接相关功能，不将其画成裸露的大型桌面芯片。',
      'Compute',
    ),
    part(
      'sensor',
      '交互与感知封装',
      'chip',
      [1.4, 0.3, 1.5],
      [0, 0.3, 2],
      [3, 3, 3],
      '感知功能封装与主处理区分开，保留必要安装间距。',
    ),
    part(
      'contacts',
      '底端供电与测试焊盘',
      'connector',
      [1.8, 0.25, 1.3],
      [0, 0.22, 5.3],
      [0, 3, 4],
      '末端接触焊盘与耳柄充电接点相连。',
      'Power',
    ),
  ]);
  edit('earbudunit', 'battery', { size: [6.8, 3.8, 6.8], pos: [0, 4, 4.4] });
  edit('earbudunit', 'driver', { pos: [0, 7, -4.2], size: [9.6, 5, 9.6] });
  edit('earbudunit', 'mic', { size: [1.8, 0.8, 1.2], pos: [2.3, -6, 6.9] });
  for (const p of get('earbuddriver').parts) {
    p.size[0] *= 0.8;
    p.size[2] *= 0.8;
  }
  // Rear connector/flex layers remain beneath the phone cover; the camera
  // bump is intentionally outside it and aligns with the back-glass openings.
  for (const id of ['soc', 'nand', 'radio'])
    edit('phoneboard', id, {
      size: [
        get('phoneboard').parts.find((p) => p.id === id)!.size[0],
        1,
        get('phoneboard').parts.find((p) => p.id === id)!.size[2],
      ],
      pos: [0, 1.2, get('phoneboard').parts.find((p) => p.id === id)!.pos[2]],
    });
  edit('phoneboard', 'pmic', { size: [8, 0.8, 8], pos: [0, 1.1, 28] });
  edit('phoneboard', 'shield', { pos: [0, 2.25, 0] });
  edit('phone', 'frame', { motion: [0.45, 0.7] });
  edit('ps5', 'frame', { motion: [0.45, 0.7] });
  edit('camera', 'shutter', { delta: [0, 42, 60] });
  edit('camera', 'heatplate', { delta: [-55, 0, 24] });
  edit('camerasensor', 'sensor', {
    size: [35.9, 1, 23.9],
    description:
      'Sony ILCE-7M4 官方规格为 35.9 × 23.9 mm Exmor R CMOS；有效感光面按此尺寸绘制。',
    sources: ['sonyalpha'],
  });
  get('camera').specs!['感光面尺寸'] = '35.9 × 23.9 mm（Sony 官方规格）';
  edit('earbuds', 'left', {
    assembly: 'earbudunit',
    pos: [-14, 2.5, 0],
    rotation: [0, Math.PI / 2, 0],
  });
  edit('earbuds', 'unit', {
    pos: [14, 2.5, 0],
    rotation: [0, -Math.PI / 2, 0],
  });
  get('earbudunit').parts.push({
    ...part(
      'cap',
      '声腔上壳与分型边',
      'earbud',
      [18, 9, 19],
      [0, 0, 0],
      [16, 20, 0],
      '互补曲面壳盖覆盖声腔上部；壳盖移开后再观察电池与发声单元。',
      'Chassis',
      '#edf0ed',
    ),
    opensFirst: true,
    sources: [get('earbudunit').source],
  });
  for (const [id, delta] of [
    ['glass', [0, 65, 0]],
    ['optical', [15, 40, 0]],
    ['oled', [0, 15, 0]],
    ['graphite', [-15, -15, 0]],
    ['backplate', [0, -45, 0]],
    ['flex', [35, -30, 20]],
    ['seal', [-25, -65, 0]],
  ] as [string, Vec3][])
    edit('phone-display', id, { delta });
  edit('ps5-power', 'cover', { delta: [65, 55, -100] });
}
