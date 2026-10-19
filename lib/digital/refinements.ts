import type {
  Definition,
  DigitalLevel,
  DigitalPart,
  ShapeKind,
} from './catalogue.ts';
import type { Category } from '../concept.ts';
import type { Vec3 } from '../layout.ts';

/** Dimensions below are photo-derived approximations unless the specification says otherwise.
 * Stable component IDs keep shared links, saved lessons and inspection working. */
export function refineDigitalDefinitions(definitions: Definition[]) {
  const get = (level: DigitalLevel) => definitions.find((d) => d.id === level)!;
  const edit = (level: DigitalLevel, id: string, patch: Partial<DigitalPart>) =>
    Object.assign(
      get(level).parts.find((p) => p.id === id)!,
      patch,
    );
  const add = (
    level: DigitalLevel,
    id: string,
    name: string,
    shape: ShapeKind,
    size: Vec3,
    pos: Vec3,
    delta: Vec3,
    description: string,
    category: Category = 'Board',
    color = '#b67f37',
  ) => {
    const part: DigitalPart = {
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
    };
    get(level).parts.push(part);
    return part;
  };
  for (const d of definitions) {
    const source = d.id.startsWith('ps5')
      ? 'ps5teardown'
      : d.id.startsWith('phone')
        ? 'iphoneinternal'
        : d.id.startsWith('camera')
          ? 'sonyservice'
          : d.id.startsWith('gamepad')
            ? 'dualsenserepair'
            : 'earbudteardown';
    if (d.id !== 'cameralens' && d.id !== 'earbuddriver') d.source = source;
    for (const p of d.parts) if (!p.open) p.sources = [d.source];
  }

  // Original CFI-10xx disc PS5: two-sided memory/storage, a curved fan cutout,
  // separate steel shields and the actual power/optical-drive stack.
  get('ps5').specs!['模型范围'] =
    'CFI-10xx 光驱版照片参考；关键装配关系重建，非尺寸测绘';
  edit('ps5', 'fan', {
    size: [45, 120, 120],
    pos: [-25, 118, -47],
    description:
      '原版 PS5 使用约 120 mm 直径、45 mm 厚的双面进气离心风扇。叶片曲率与数量在不同供应商版本之间存在差异。',
  });
  edit('ps5', 'cooling', { pos: [-34, -25, 25] });
  edit('ps5', 'frame', { shape: 'frame', size: [94, 360, 235] });
  get('ps5board').camera = { direction: [1.2, 1.5, 1.1], padding: 1.1 };
  edit('ps5cooling', 'coldplate', { pos: [-17, 28, 46.5] });
  edit('ps5cooling', 'interface', { pos: [-17, 29.3, 46.5] });
  edit('ps5cooling', 'pipes', { pos: [0, 26, 0] });
  edit('ps5board', 'pcb', {
    delta: [0, 0, 0],
    description:
      '依照原版主板照片绘制带风扇避让缺口的板形、铜箔接地边界、安装孔与接口边缘。微型走线仅为视觉近似。',
  });
  edit('ps5board', 'apu', {
    size: [52, 4, 52],
    pos: [-12, -5, 4],
    delta: [170, -45, 0],
    rotation: [Math.PI, 0, 0],
    description:
      '绿色封装基板上的裸露芯片与四周支持件，接触面通过液态金属连接散热器。没有把它画成桌面 CPU 的金属顶盖。',
  });
  edit('ps5board', 'memory', {
    name: 'GDDR6 内存封装 1',
    size: [14, 1.6, 12],
    pos: [-48, 3, -20],
    delta: [-45, 25, -10],
    description: '8 个 2 GB GDDR6 封装中的一个，位于主板背面；合计 16 GB。',
    quantity: '1 颗（同组共 8 颗）',
  });
  const memory: Vec3[] = [
    [-48, 3, 1],
    [-48, 3, 22],
    [-29, 3, 44],
    [-8, 3, 44],
    [15, 3, 44],
    [30, 3, 21],
    [30, 3, -1],
  ];
  memory.forEach((pos, i) =>
    add(
      'ps5board',
      `memory-${i + 2}`,
      `GDDR6 内存封装 ${i + 2}`,
      'chip',
      [14, 1.6, 12],
      pos,
      [(i % 2 ? 1 : -1) * 35, 25, i * 4 - 12],
      '主板背面独立内存封装；8 颗 2 GB GDDR6 组成 16 GB 统一内存。',
      'Memory',
      '#171b20',
    ),
  );
  edit('ps5board', 'nand', {
    name: 'NAND 闪存 1 / 正面',
    size: [18, 1.5, 14],
    pos: [42, 3, 67],
    delta: [35, 20, 40],
    description:
      '原版主板共有 6 个闪存封装，两面各 3 个；本模型分别展示每颗封装。',
  });
  [
    [64, 3, 67],
    [42, 3, 87],
    [42, -3, 67],
    [64, -3, 67],
    [42, -3, 87],
  ].forEach((pos, i) =>
    add(
      'ps5board',
      `nand-${i + 2}`,
      `NAND 闪存 ${i + 2} / ${i < 2 ? '正面' : '背面'}`,
      'chip',
      [18, 1.5, 14],
      pos as Vec3,
      [25, i < 2 ? 25 : -25, 45 + i * 5],
      '原版主板双面的闪存封装之一，配合 SSD 控制器保存非易失性数据。',
      'Storage',
      '#191e24',
    ),
  );
  edit('ps5board', 'ssd-controller', { pos: [53, 3, 40], size: [18, 2, 18] });
  edit('ps5board', 'vrm', {
    size: [18, 5, 90],
    pos: [53, 4, -25],
    shape: 'board',
    description:
      '沿处理器供电区域布置电感、功率级与电容。小器件数量和布线采用照片近似。',
  });
  edit('ps5board', 'shield', {
    shape: 'shield',
    pos: [0, 12, 0],
    delta: [-135, 65, 0],
    description: '带处理器接触开口、压筋、通风孔和螺钉位的钢制屏蔽结构。',
  });
  add(
    'ps5board',
    'ports',
    'HDMI / 网口 / USB 连接器',
    'connector',
    [114, 12, 14],
    [0, 5, -109],
    [0, 24, -45],
    '主板边缘按端口分出金属屏蔽外壳、绝缘舌片与插口。',
  );
  add(
    'ps5board',
    'rtc',
    '时钟备份电池',
    'ring',
    [20, 3, 20],
    [68, 4, 105],
    [35, 25, 45],
    '纽扣电池为断电后的时钟保持提供能量。',
    'Power',
    '#a5aaa8',
  );
  add(
    'ps5board',
    'm2-slot',
    'M.2 连接座与固定柱',
    'connector',
    [26, 5, 76],
    [-62, 4, 36],
    [-40, 25, 20],
    '空的 M.2 扩展槽包含连接座、定位柱与固定位置，不伪装成已安装 SSD。',
    'Storage',
    '#343c40',
  );
  add(
    'ps5',
    'antenna',
    '无线天线与同轴线组',
    'flex',
    [45, 1, 115],
    [42, 115, 35],
    [65, 50, 30],
    '内部天线板与细同轴线沿黑色支架布置，为无线通信提供射频连接。',
  );
  get('ps5').parts.find((p) => p.id === 'antenna')!.rotation = [
    0,
    0,
    Math.PI / 2,
  ];
  add(
    'ps5',
    'fasteners',
    '侧盖下固定螺钉组',
    'screws',
    [3, 280, 190],
    [46, 0, 0],
    [55, 0, 0],
    '代表性固定点与螺钉随支架移开；数量为可视化采样，非完整维修螺钉清单。',
    'Chassis',
    '#93999b',
  );

  // Apple 104901 rear-open internal view. Correct the previous speaker/haptic
  // swap and diagonal camera order, add TrueDepth and connector cowlings.
  edit('phone', 'display', {
    pos: [0, -3.4, 0],
    delta: [0, -34, 0],
    size: [69, 1, 145],
  });
  edit('phone', 'back', {
    pos: [0, 3.4, 0],
    delta: [170, 28, -30],
    size: [70, 0.8, 146],
    opensFirst: true,
  });
  edit('phone', 'frame', {
    delta: [-52, 0, 0],
    description:
      '圆角铝边框保留相机、扬声器和 USB-C 避让空间、内侧台阶、按钮和代表性螺柱。',
  });
  edit('phone', 'battery', {
    size: [43, 3.6, 87],
    pos: [-10, 0, 10],
    delta: [-30, 14, 0],
    description:
      '按官方背部内部视图，矩形软包电池位于中下部左侧；外侧包含封边、引出片与易拉胶条。',
  });
  edit('phone', 'board', { size: [18, 3, 78], pos: [22, -0.15, -12] });
  edit('phone', 'camera', { pos: [-17, 0, -50], size: [30, 7, 30] });
  edit('phone', 'coil', {
    size: [42, 0.3, 42],
    pos: [-5, 2.3, 12],
    delta: [0, 24, 0],
    description:
      '背盖内侧的接收线圈、磁环和下方定位磁条作为独立背部充电总成展示。',
  });
  edit('phone', 'haptic', {
    size: [15, 4, 12],
    pos: [23, 0, 58],
    delta: [25, 15, 30],
    description:
      '按照 Apple 官方背部内部视图修正为右下角的 Taptic Engine，总成包含金属壳与固定耳。',
  });
  edit('phone', 'speaker', {
    size: [39, 4, 12],
    pos: [-13, 0, 60],
    delta: [-25, 15, 30],
    description:
      '底部扬声器声腔位于左下部，与右侧触觉组件分开，包含声孔、固定耳与密封轮廓。',
  });
  edit('phone', 'top-speaker', { size: [18, 3, 8], pos: [23, 0, -63] });
  edit('phone', 'usb', {
    shape: 'connector',
    size: [12, 3, 6],
    pos: [0, 0, 70],
  });
  add(
    'phone',
    'truedepth',
    'TrueDepth 前置相机总成',
    'lens',
    [25, 3, 7],
    [2, 0, -66],
    [0, 22, -35],
    '顶部前摄与红外相关窗口沿听筒附近排布，与后置双摄分开。',
  );
  add(
    'phone',
    'camera-flex',
    '双摄柔性连接与压盖',
    'flex',
    [19, 0.35, 14],
    [8, 0.5, -37],
    [20, 24, -15],
    '两条相机排线转向逻辑板连接器；金属压盖通过代表性固定点保护插接位置。',
  );
  add(
    'phone',
    'battery-flex',
    '电池连接排线与压盖',
    'flex',
    [12, 0.4, 9],
    [17, 0.5, 35],
    [20, 24, 20],
    '电池软包引出片转向逻辑板连接器，具有柔性走线与独立接点。',
    'Power',
  );
  add(
    'phone',
    'usb-flex',
    '底部接口与麦克风排线',
    'flex',
    [47, 0.4, 8],
    [4, -1.5, 68],
    [0, -20, 35],
    '底部柔性电路连接 USB-C、主麦克风与机身连接点，几何走向依官方内部图近似。',
  );
  add(
    'phone',
    'microphone',
    '底部主麦克风',
    'chip',
    [4, 2, 3],
    [15, 0, 70],
    [20, 15, 35],
    '独立麦克风拾音入口位于底部接口旁。',
  );
  add(
    'phone',
    'fasteners',
    '内部压盖与固定螺钉',
    'screws',
    [65, 1, 132],
    [0, 2.3, 0],
    [0, 25, 0],
    '沿机身边缘分布的代表性螺钉位，作为独立可选组件。',
    'Chassis',
    '#9ca5a7',
  );
  edit('phoneboard', 'shield', {
    shape: 'shield',
    size: [17, 0.3, 69],
    pos: [0, 2.2, 0],
    delta: [35, 26, 0],
  });
  edit('phoneboard', 'pcb', {
    size: [18, 0.8, 76],
    description:
      '按窄长逻辑板轮廓绘制焊盘、接地边、连接器和装配缺口；并非简单矩形绿板。',
  });
  add(
    'phoneboard',
    'connectors',
    '板对板插座与射频接点',
    'connector',
    [16, 1, 70],
    [0, 1, 0],
    [17, 12, 0],
    '逻辑板边缘的微型插座与金色同轴接点，对应机身柔性线路的终端。',
  );
  edit('phonecamera', 'mainlens', { pos: [7, 3, 7], size: [15, 5, 15] });
  edit('phonecamera', 'widelens', { pos: [-7, 3, -7], size: [12, 4, 12] });
  edit('phonecamera', 'mainsensor', { pos: [7, 0.1, 7] });
  edit('phonecamera', 'widesensor', { pos: [-7, 0.1, -7] });
  edit('phonecamera', 'carrier', { size: [31, 2, 31] });
  edit('phonecamera', 'flex', {
    shape: 'flex',
    size: [10, 0.3, 12],
    pos: [0, -1, 19],
  });

  // ILCE-7M4 exploded views: rear/LCD, top, main board, heat spreader,
  // shutter, anti-shake and bayonet are distinct assemblies.
  edit('camera', 'finder', { pos: [-8, 40, -10], size: [38, 20, 27] });
  edit('camera', 'front', {
    size: [131, 90, 42],
    pos: [0, 0, 6],
    description:
      '依据 ILCE-7M4 前框与卡口分解图绘制镂空前框、握柄腔和内部螺柱；前壳不再是覆盖传感器的实心块。',
  });
  edit('camera', 'back', {
    size: [124, 82, 3],
    pos: [0, 0, -28],
    description: '后壳为屏幕、按键、拇指拨轮和连接排线预留位置，保留屏幕窗。',
  });
  edit('camera', 'board', {
    size: [87, 2, 62],
    pos: [-9, 0, -18],
    rotation: [Math.PI / 2, 0, 0],
    description:
      '对应服务手册 MAIN BOARD SECTION 的板形组织，包含处理区、金属屏蔽罩与边缘柔性连接座。',
  });
  edit('camera', 'battery', { size: [30, 52, 18], pos: [46, -11, 3] });
  edit('camera', 'lens', { pos: [-8, 0, 64] });
  edit('camera', 'sensor', { pos: [-8, 0, -1] });
  edit('camera', 'shutter', {
    pos: [-8, 0, 6],
    size: [46, 2, 38],
    rotation: [Math.PI / 2, 0, 0],
  });
  add(
    'camera',
    'mount',
    'E 卡口与电气触点',
    'mount',
    [61, 5, 61],
    [-8, 0, 25],
    [0, 0, 65],
    '金属卡口、弹簧接点和安装螺钉沿光轴组织；内孔保持贯通。',
    'Chassis',
    '#a8aaa8',
  ).rotation = [Math.PI / 2, 0, 0];
  add(
    'camera',
    'top',
    '顶部控制壳与热靴',
    'grip-shell',
    [127, 9, 47],
    [0, 40, -1],
    [0, 50, 0],
    '服务手册独立列出的顶部控制壳，包含热靴、快门按钮与控制拨轮安装区。',
    'Chassis',
    '#252a2d',
  );
  add(
    'camera',
    'heatplate',
    '图像主板导热承载板',
    'shield',
    [84, 1.2, 61],
    [-9, 0, -12],
    [-55, 0, -28],
    '主板与传感器组件之间的导热承载结构，带窗口和固定耳。',
    'Cooling',
    '#a6a9a6',
  ).rotation = [Math.PI / 2, 0, 0];
  add(
    'camera',
    'slots',
    '双存储卡插槽组件',
    'connector',
    [21, 4, 39],
    [49, 3, -18],
    [65, 0, -20],
    '两组独立卡槽位于握柄侧后部，包含金属壳与接触片；不以一个绿色方块代替。',
    'Storage',
    '#a6aaa8',
  ).rotation = [Math.PI / 2, 0, 0];
  add(
    'camera',
    'flex',
    '传感器与控制柔性排线',
    'flex',
    [75, 0.35, 58],
    [-9, 0, -8],
    [-45, 0, -25],
    '橙褐色柔性排线在主板、传感器和顶部控制部件之间转接，保留分叉和连接端。',
  ).rotation = [Math.PI / 2, 0, 0];
  add(
    'camera',
    'base',
    '底板与三脚架螺孔',
    'box',
    [123, 4, 44],
    [0, -43, 0],
    [0, -40, 0],
    '独立底板带三脚架安装嵌件和代表性螺钉。',
    'Chassis',
    '#2b3032',
  );
  edit('camerasensor', 'actuators', {
    shape: 'actuator',
    size: [47, 3, 36],
    description:
      '防抖承载框周围的线圈、磁体和支承结构，中央保持给传感器的开口，不以同心圆覆盖成像面。',
  });
  edit('camerasensor', 'flex', { shape: 'flex' });
  edit('cameralens', 'iris', {
    shape: 'shutter',
    description:
      '沿圆周交叠的光圈叶片围成中央开口，不再使用矩形焦平面快门代替光圈。',
  });

  get('gamepad').name = 'DualSense 无线控制器';
  get('gamepad').summary = '初代 DualSense · 双摇杆、触觉与自适应扳机';
  get('gamepad').specs!['模型范围'] =
    '初代 DualSense 拆解参考；后续硬件修订可能不同';
  edit('gamepad', 'top', {
    size: [155, 6, 93],
    pos: [0, 18, 0],
    delta: [0, 45, 0],
    description:
      '连续曲线握柄壳具有摇杆、十字键、动作键与触控板开孔，以及内侧加强筋。',
  });
  edit('gamepad', 'back', {
    size: [150, 5, 90],
    pos: [0, -18, 0],
    delta: [0, -45, 0],
    color: '#cfd6d4',
  });
  edit('gamepad', 'board', {
    size: [96, 2, 48],
    pos: [0, 0, -1],
    delta: [0, 24, 0],
  });
  edit('gamepad', 'battery', {
    size: [40, 10, 31],
    pos: [0, -10, -4],
    delta: [0, -32, 15],
  });
  edit('gamepad', 'leftstick', { size: [22, 21, 22], pos: [-28, 14, 12] });
  edit('gamepad', 'rightstick', { size: [22, 21, 22], pos: [28, 14, 12] });
  edit('gamepad', 'buttons', { size: [126, 7, 28], pos: [0, 22, -18] });
  edit('gamepad', 'touch', {
    size: [52, 3, 28],
    pos: [0, 26, -22],
    color: '#e5e8e9',
  });
  edit('gamepad', 'triggers', {
    shape: 'trigger',
    size: [27, 21, 25],
    pos: [-54, 2, -34],
    delta: [-40, 10, -30],
    name: '左侧自适应扳机机构',
    description:
      '电机、蜗杆、减速齿轮与扳机臂组成可控阻力机构，按原版拆解结构重建。',
  });
  add(
    'gamepad',
    'right-trigger',
    '右侧自适应扳机机构',
    'trigger',
    [27, 21, 25],
    [54, 2, -34],
    [40, 10, -30],
    '右手扳机具有对应的电机、蜗杆传动、齿轮与触发臂。',
  );
  edit('gamepad', 'haptics', {
    shape: 'actuator',
    size: [21, 18, 34],
    pos: [-52, -5, 24],
    delta: [-30, -20, 30],
    name: '左侧线性触觉执行器',
    description:
      '双握柄内部的圆柱形线性触觉执行器，包含外壳、磁路和线圈；不是偏心转子马达。',
  });
  add(
    'gamepad',
    'right-haptic',
    '右侧线性触觉执行器',
    'actuator',
    [21, 18, 34],
    [52, -5, 24],
    [30, -20, 30],
    '右侧独立线性执行器通过线缆接到控制电路，向右手传递触觉反馈。',
  );
  add(
    'gamepad',
    'holder',
    '电池承载架',
    'tray',
    [47, 3, 38],
    [0, -3, -4],
    [0, -25, 0],
    '电池架定位中央电池，并与周围的主板、扬声器与线缆分开。',
    'Chassis',
    '#252b30',
  );
  add(
    'gamepad',
    'speaker',
    '中央扬声器',
    'ring',
    [18, 5, 18],
    [0, 7, 8],
    [0, 25, 25],
    '触控板下方的小型扬声器通过声孔向外发声。',
    'Board',
    '#343b40',
  );
  add(
    'gamepad',
    'membrane',
    '按键导电胶与柔性触点膜',
    'flex',
    [124, 0.6, 37],
    [0, 15, -16],
    [0, 30, -15],
    '按键帽下方的硅胶与柔性触点把按压传到电路，不与硬塑料按钮合为一块。',
  );
  add(
    'gamepad',
    'wiring',
    '扳机排线与执行器线缆',
    'flex',
    [112, 0.3, 57],
    [0, -1, 0],
    [0, -22, 0],
    '左右扳机橙色排线与执行器红黑线连接主板，分别表达信号和供电路径。',
  );
  edit('gamepadboard', 'pcb', {
    size: [96, 1.5, 48],
    description:
      '带两摇杆避让缺口、螺孔、铜焊盘和接口的异形主板，支持件依照初代控制器照片近似排布。',
  });

  get('earbuds').name = 'AirPods Pro 2 参考结构';
  get('earbuds').summary = 'USB-C 充电盒 · 依拆解照片重建主要模块';
  get('earbuds').specs = {
    参考型号: 'AirPods Pro 2（USB-C，2023）',
    充电盒外形: '60.6 × 45.2 × 21.7 mm（官方规格）',
    建模范围: '拆解照片参考；未复刻芯片封装内部或厂商声学处方',
  };
  edit('earbuds', 'case', {
    size: [60.6, 38, 21.7],
    pos: [0, -2.5, 0],
    delta: [0, -35, 0],
  });
  edit('earbuds', 'lid', {
    size: [60.6, 7, 21.7],
    pos: [0, 20.5, 0],
    delta: [0, 35, -14],
  });
  edit('earbuds', 'battery', {
    size: [18, 4, 14],
    pos: [-11, -15, 0],
    delta: [-20, -22, 15],
    name: '充电盒左侧电芯',
    description:
      '拆解可见的双电芯供电组件中的左侧电芯，与右电芯和耳机小电池分开。',
  });
  add(
    'earbuds',
    'battery-right',
    '充电盒右侧电芯',
    'battery',
    [18, 4, 14],
    [11, -15, 0],
    [20, -22, 15],
    '双电芯组件中的右电芯，置于耳机承载托盘下方。',
    'Power',
    '#444a50',
  );
  edit('earbuds', 'board', {
    size: [46, 1.2, 25],
    pos: [0, -4, -8.6],
    rotation: [Math.PI / 2, 0, 0],
  });
  edit('earbuds', 'connector', {
    shape: 'connector',
    size: [10, 3, 5],
    pos: [0, -18, 8],
  });
  edit('earbuds', 'left', { pos: [-14, 1, 0], size: [17, 26, 18] });
  edit('earbuds', 'unit', { pos: [14, 1, 0], size: [18, 27, 19] });
  add(
    'earbuds',
    'tray',
    '双耳机定位托盘与充电触点',
    'tray',
    [56, 3, 18],
    [0, 7, 0],
    [0, 21, 0],
    '托盘保留左右耳机凹位、耳柄孔和金属充电触点，下面留给电池与电路。',
    'Chassis',
    '#e8ebea',
  );
  add(
    'earbuds',
    'coil',
    '无线充电线圈与磁体',
    'coil',
    [28, 0.5, 28],
    [0, -4, -10],
    [0, 0, -25],
    '充电盒背面内壁的接收线圈与定位磁体；匝数为几何近似。',
    'Power',
  ).rotation = [Math.PI / 2, 0, 0];
  add(
    'earbuds',
    'hinge',
    '上盖金属铰链',
    'mount',
    [22, 3, 4],
    [0, 16, -9],
    [0, 25, -15],
    '独立的铰链轴、两端固定耳和金属支架连接上下壳。',
    'Chassis',
    '#a3aaa8',
  );
  edit('earbudunit', 'shell', {
    size: [18, 27, 19],
    description:
      '短耳柄与偏置声腔的薄壁壳体，包含泄压网、麦克风窗与充电触点。外壳可移开观察内部。',
  });
  edit('earbudunit', 'battery', {
    shape: 'ring',
    size: [9, 5, 9],
    pos: [0, 3, 0],
    delta: [-12, 12, 0],
    name: '耳机纽扣形电池',
    description: '声腔内的金属壳小电池，与耳柄内柔性电路分开。',
    color: '#b4b1a4',
  });
  edit('earbudunit', 'processor', {
    shape: 'board',
    size: [3, 1, 16],
    pos: [2, -5, 5],
    delta: [12, -6, 10],
    rotation: [Math.PI / 2, 0, 0],
    name: '耳柄音频 SiP 与柔性电路',
    description:
      '沿短耳柄布置的柔性电路和音频处理封装，结合麦克风与触点；不展示未经公开的芯片内部版图。',
  });
  edit('earbudunit', 'driver', {
    size: [11, 5, 11],
    pos: [0, 7, -3],
    delta: [0, 20, -10],
  });
  edit('earbudunit', 'tip', {
    size: [12, 5, 12],
    pos: [0, 11, -5],
    delta: [0, 25, -18],
  });
  add(
    'earbudunit',
    'flex',
    '声腔柔性连接',
    'flex',
    [10, 0.3, 13],
    [0, 0, 4],
    [-12, -5, 8],
    '折弯柔性线路连接纽扣电池、音频电路与声学组件。',
  );
  add(
    'earbudunit',
    'contacts',
    '耳柄充电接点',
    'connector',
    [5, 1, 4],
    [2, -12, 5],
    [10, -15, 8],
    '耳柄末端的金属接点与盒内弹性触点配合，为耳机充电。',
    'Power',
    '#c2ae76',
  );
}
