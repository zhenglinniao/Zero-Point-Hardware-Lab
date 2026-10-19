import type { Definition, DigitalLevel, DigitalPart } from './catalogue.ts';
import type { Vec3 } from '../layout.ts';

/** All dimensions are millimetres. Each assembly keeps its parent's datum;
 * the same closed geometry is installed in the device, never a proxy box. */
export function refineDeepAssemblies(definitions: Definition[]) {
  const part = (
    id: string,
    name: string,
    size: Vec3,
    pos: Vec3,
    delta: Vec3,
    description: string,
    color = '#8c9599',
    category: DigitalPart['category'] = 'Board',
  ): DigitalPart => ({
    id,
    name,
    size,
    pos,
    delta,
    description,
    purpose: description,
    color,
    category,
    shape: 'box',
  });
  const install = (
    parent: DigitalLevel,
    component: string,
    id: DigitalLevel,
    name: string,
    summary: string,
    unit: number,
    parts: DigitalPart[],
  ) => {
    const device = definitions.find((d) => d.id === parent)!;
    const slot = device.parts.find((p) => p.id === component)!;
    slot.open = id;
    const mechanismSource = id.includes('stick')
      ? 'dualsensestick'
      : id.includes('trigger')
        ? 'dualsensetrigger'
        : null;
    if (mechanismSource) {
      slot.sources = [mechanismSource, 'dualsenseasset'];
      for (const p of parts)
        p.sources =
          p.id === 'cap' || p.id === 'caps'
            ? ['dualsenseasset']
            : [mechanismSource];
    }
    if (id === 'ps5-fan')
      for (const p of parts)
        p.sources =
          p.id === 'stator' || p.id === 'shaft'
            ? ['ps5official', 'fanconstruction', 'bearing']
            : ['ps5official'];
    slot.description = summary + '。可继续进入内部机构，装配尺寸与整机一致。';
    if (id === 'gamepad-leftstick' || id === 'gamepad-rightstick')
      for (const p of parts)
        if (p.id !== 'cap') {
          p.pos[1] += 11;
          if (p.id === 'switch') {
            p.pos[0] = 7;
            p.pos[2] = 6;
          }
        }
    if (id === 'gamepad-right-trigger' || id === 'gamepad-rightstick')
      for (const p of parts)
        if (p.id !== 'caps' && p.id !== 'cap') {
          p.pos[0] *= -1;
          p.delta[0] *= -1;
        }
    const source = id.startsWith('gamepad-')
      ? 'dualsenserepair'
      : id.startsWith('phone-')
        ? 'iphonerepair'
        : device.source;
    definitions.push({
      id,
      parent,
      name,
      summary,
      source,
      unit,
      parts,
      ...(id === 'camera-display'
        ? { camera: { direction: [0.9, 0.6, -1.5] as Vec3, padding: 1.08 } }
        : {}),
    });
  };
  install(
    'ps5',
    'fan',
    'ps5-fan',
    'PS5 双面进气风扇',
    '120 × 45 mm 风扇：护框、叶轮、定子、轴与轴承',
    18,
    [
      {
        ...part(
          'housing',
          '环形风道与前护架',
          [45, 120, 120],
          [0, 0, 0],
          [50, 0, 0],
          '环形风道包围叶轮；护架与叶片轴向错开，留出旋转间隙。',
          '#232a2e',
          'Chassis',
        ),
        opensFirst: true,
      },
      part(
        'rear',
        '后护架',
        [1, 120, 120],
        [0, 0, 0],
        [-50, 0, 0],
        '后侧支撑跨过进气口，中心留给轴承座。',
        '#353d41',
        'Chassis',
      ),
      part(
        'rotor',
        '叶轮与中空轮毂',
        [39, 109, 109],
        [0, 0, 0],
        [28, 0, 0],
        '弯曲叶片与轮毂共同旋转；中空轮毂包围固定定子。',
        '#252d31',
        'Cooling',
      ),
      part(
        'stator',
        '固定定子与铜绕组',
        [20, 23, 23],
        [0, 0, 0],
        [-28, 0, 0],
        '定子铜绕组位于轮毂内，和转子之间保留径向空气隙。',
        '#bd864d',
        'Power',
      ),
      part(
        'shaft',
        '轴与两端轴承',
        [40, 12, 12],
        [0, 0, 0],
        [-70, 0, 0],
        '钢轴穿过定子中心，两端轴承分别约束径向位置。',
        '#aeb5b8',
      ),
    ],
  );
  install(
    'phone',
    'haptic',
    'phone-haptic',
    'Taptic Engine 线性触觉机构',
    '薄壁金属壳、悬置质量块、固定绕组与弹片',
    4,
    [
      {
        ...part(
          'lid',
          '金属盖板',
          [28, 0.22, 13],
          [0, 1.89, 0],
          [0, 9, 0],
          '薄盖封闭机构，拆开后可观察悬置运动空间。',
          '#a6afb2',
          'Chassis',
        ),
        opensFirst: true,
      },
      part(
        'housing',
        '薄壁承载壳',
        [28, 3.5, 13],
        [0, 0, 0],
        [0, -9, 0],
        '底板与四周薄壁形成容腔，不使用实心方块填满内部。',
        '#8c969a',
        'Chassis',
      ),
      part(
        'mass',
        '悬置质量块与磁体',
        [18, 2.3, 7],
        [0, 0.05, 0],
        [0, 6, -10],
        '配重与永磁体组成运动组件，沿长边方向小幅往复。',
        '#677379',
      ),
      part(
        'coil',
        '固定铜绕组',
        [20, 2.5, 9],
        [0, 0, 0],
        [0, 6, 10],
        '绕组包围运动组件，中间保留空腔；电流变化驱动线性振动。',
        '#b97942',
        'Power',
      ),
      part(
        'springs',
        '两端悬置弹片',
        [3, 2.5, 9],
        [0, 0, 0],
        [-10, 2, 0],
        '折弯弹片连接质量块与壳体，约束运动并提供回复力。',
        '#b2b8b9',
      ),
      part(
        'flex',
        '驱动连接排线',
        [5, 0.18, 3],
        [0, -1.3, 0],
        [12, -4, 0],
        '短排线和金属焊盘把绕组接到驱动电路。',
        '#bc8c43',
      ),
    ],
  );
  install(
    'phone',
    'speaker',
    'phone-speaker',
    '手机底部扬声器',
    '声腔、振膜、音圈、磁路与密封接点',
    3,
    [
      {
        ...part(
          'cover',
          '声腔上盖与出声口',
          [21, 0.3, 14],
          [0, 1.8, 0],
          [0, 8, 0],
          '上盖围住声腔，狭长开口连接手机底部声道。',
          '#20292c',
          'Chassis',
        ),
        opensFirst: true,
      },
      part(
        'chamber',
        '中空声腔与安装耳',
        [21, 3.4, 14],
        [0, 0, 0],
        [0, -8, 0],
        '薄壁腔体保留发声单元的空间，侧面安装耳用于固定。',
        '#1e292d',
        'Chassis',
      ),
      part(
        'diaphragm',
        '椭圆振膜与悬边',
        [14, 0.12, 8],
        [0, 0.9, 0],
        [0, 6, 0],
        '轻薄振膜由周围柔性悬边支撑，将音圈的运动传给空气。',
        '#87999d',
      ),
      part(
        'voice-coil',
        '椭圆音圈',
        [10, 0.6, 4],
        [0, 0.35, 0],
        [9, 4, 0],
        '微型音圈位于磁隙中，与上方振膜相连。',
        '#be8246',
      ),
      part(
        'magnet',
        '磁体与回磁轭',
        [12, 1.4, 6],
        [0, -0.8, 0],
        [0, -5, 8],
        '中央磁体和外围回磁轭在音圈附近形成磁路。',
        '#78858c',
      ),
      part(
        'contacts',
        '密封垫与弹性接点',
        [21, 0.2, 14],
        [0, 1.55, 0],
        [-10, 4, 0],
        '周边垫圈封住声腔接合面，镀金触点连接音频电路。',
        '#252b30',
      ),
    ],
  );
  install(
    'camera',
    'finder',
    'camera-finder',
    '电子取景器与热靴',
    '保留 α7 IV 外形基准，分别观察取景器外壳、目镜、调节轮与热靴',
    5,
    [
      {
        ...part(
          'housing',
          '取景器隆起外壳',
          [44, 19, 41],
          [0, 0, 0],
          [0, 18, 0],
          '多截面隆起保留机顶轮廓，正面 SONY 标识与原总成一致。',
          '#17191b',
          'Chassis',
        ),
        opensFirst: true,
      },
      part(
        'eyecup',
        '橡胶眼罩与目镜筒',
        [34, 23, 21],
        [0, 0, 0],
        [0, 0, -22],
        '橡胶眼罩遮挡杂散光，目镜筒与机顶壳体按原安装基准连接。',
        '#101213',
        'Chassis',
      ),
      part(
        'optic',
        '目镜光学窗口',
        [23, 14, 0.2],
        [0, 0, 0],
        [0, 0, -42],
        '目镜出射窗位于眼罩中心；没有虚构厂商内部光学处方。',
        '#25323a',
      ),
      part(
        'diopter',
        '屈光度调节轮',
        [2, 4.4, 4.4],
        [0, 0, 0],
        [-20, 0, 0],
        '目镜侧边小轮用于屈光度调节，拆出方向沿轮轴。',
        '#17191b',
      ),
      part(
        'shoe',
        '多接口热靴与触点',
        [20, 3, 20],
        [0, 0, 0],
        [0, 32, 0],
        '双导轨、绝缘底板与前端触点组成附件接口。',
        '#858a8c',
      ),
    ],
  );
  install(
    'camera',
    'display',
    'camera-display',
    '翻转屏总成',
    '显示面板、外框背板与侧向铰链分离',
    6,
    [
      {
        ...part(
          'frame',
          '屏幕外框与背板',
          [75.6, 52.5, 4.4],
          [0, 0, 0],
          [0, 0, 14],
          '圆角外框保持原机屏幕比例，底边保留 SONY 标识。',
          '#171a1b',
          'Chassis',
        ),
        opensFirst: true,
      },
      part(
        'lcd',
        '显示面板与取景信息',
        [66.6, 43.2, 0.12],
        [0, 0, 0],
        [0, 0, -14],
        '显示层与边框沿厚度方向分开，原有取景文字和对焦框随面板移动。',
        '#10191d',
      ),
      part(
        'hinge',
        '侧翻转铰链',
        [3.6, 40, 3.6],
        [0, 0, 0],
        [18, 0, 0],
        '侧向铰链与屏幕边框分离；共享安装基准避免整机与子层错位。',
        '#101213',
      ),
    ],
  );
  for (const [component, id, name] of [
    ['triggers', 'gamepad-triggers', '左侧自适应扳机'],
    ['right-trigger', 'gamepad-right-trigger', '右侧自适应扳机'],
  ] as const)
    install(
      'gamepad',
      component,
      id,
      name,
      '肩键外形与电机、蜗杆、减速齿轮、回复弹簧分别拆解',
      4,
      [
        {
          ...part(
            'caps',
            '肩键与扳机帽',
            [27, 21, 25],
            [0, 0, 0],
            [0, 17, -8],
            '复用署名授权模型的肩键与扳机曲面，保持整机安装轮廓。',
            '#20262a',
            'Chassis',
          ),
          opensFirst: true,
        },
        part(
          'base',
          '传动安装座',
          [22.14, 2, 17],
          [0, -7.35, 0],
          [0, -12, 0],
          '薄底座连接电机、齿轮轴与扳机支点。',
          '#252e32',
          'Chassis',
        ),
        part(
          'motor',
          '微型驱动电机',
          [10, 8.6, 8.6],
          [-6.3, -1, 3.2],
          [-15, 0, 0],
          '有刷电机驱动蜗杆；电机输出轴与蜗杆连续，而非把螺旋放进电机内部。',
          '#adb3b3',
          'Power',
        ),
        part(
          'worm',
          '输出轴与蜗杆',
          [10, 2.4, 2.4],
          [3.5, -1, 3.2],
          [12, 0, 0],
          '蜗杆沿电机轴布置，侧边与减速齿轮的齿缘啮合。',
          '#dfd6c0',
        ),
        part(
          'gear',
          '减速齿轮与阻力拨臂',
          [9, 1.6, 9],
          [4, 1, -2.5],
          [0, 13, 0],
          '齿轮改变阻力拨臂的位置，向扳机提供可控阻力；不是额外的振动马达。',
          '#d5cbb3',
        ),
        part(
          'spring',
          '回复扭簧',
          [5, 4, 5],
          [-5, 3, -5],
          [0, 10, -12],
          '金属扭簧围绕支点布置，松开手指后使扳机复位。',
          '#a8b2b6',
        ),
        part(
          'flex',
          '反馈机构柔性连接',
          [6, 0.2, 8],
          [0, -6, 1],
          [12, -6, 7],
          '短柔性连接承担电机供电与机构连接，装配态收在底座范围内。',
          '#b88c50',
        ),
      ],
    );
  for (const [component, id, name] of [
    ['leftstick', 'gamepad-leftstick', '左摇杆机构'],
    ['rightstick', 'gamepad-rightstick', '右摇杆机构'],
  ] as const)
    install(
      'gamepad',
      component,
      id,
      name,
      '帽体、双轴万向架、两只电位器、回复弹簧与按压开关',
      3,
      [
        {
          ...part(
            'cap',
            '摇杆帽与上部轴套',
            [22, 21, 22],
            [0, 0, 0],
            [0, 18, 0],
            '保留授权模型的帽体、轴与外壳开口环，进入下层后不替换成圆柱占位。',
            '#20272b',
            'Chassis',
          ),
          opensFirst: true,
        },
        part(
          'gimbal',
          '双轴万向架',
          [14, 8, 14],
          [0, -7, 0],
          [0, 5, 0],
          '两只互相垂直的转架分别传递水平和垂直摆动。',
          '#a4afb0',
        ),
        part(
          'pot-x',
          'X 轴电位器',
          [3, 7, 12],
          [-8.7, -7, 0],
          [-13, 0, 0],
          '碳膜电阻轨与滑动触点感知一条轴的转角；原版机构采用电位器。',
          '#2c7663',
        ),
        part(
          'pot-y',
          'Y 轴电位器',
          [12, 7, 3],
          [0, -7, -8.7],
          [0, 0, -13],
          '与第一只电位器垂直，独立采集另一条轴的转角。',
          '#2c7663',
        ),
        part(
          'spring',
          '中心回复弹簧',
          [7, 4, 7],
          [0, -12, 0],
          [0, -12, 0],
          '中心压簧与支撑件使摇杆在松手后返回中位。',
          '#b1babc',
        ),
        part(
          'switch',
          '按压开关与引脚',
          [6, 3, 6],
          [5, -13, 4],
          [12, -8, 8],
          '按压开关提供 L3 / R3 输入，焊接引脚将机构连接到主板。',
          '#5e6b72',
        ),
      ],
    );
}
