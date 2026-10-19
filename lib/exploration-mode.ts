import { isPhysical, type LevelId } from './levels.ts';

type Mode =
  | 'assembly'
  | 'section'
  | 'bonded'
  | 'manufacturing'
  | 'welded'
  | 'optical';
const groups: Record<Mode, readonly LevelId[]> = {
  assembly: [
    'pc',
    'motherboard',
    'dimm',
    'ddr4',
    'psu',
    'psubronze',
    'fan',
    'ssd',
    'nvme',
    'card',
    'rx9070',
    'arcb580',
    'legion',
    'legionboard',
    'legionmemory',
    'legionstorage',
    'macbook',
    'macboard',
    'macstorage',
    'ps5',
    'ps5board',
    'phone',
    'phoneboard',
    'phonecamera',
    'camera',
    'camera-board',
    'gamepad',
    'gamepadboard',
    'ps5-drive',
    'ps5-fan',
    'camera-display',
    'gamepad-triggers',
    'gamepad-right-trigger',
    'engine-cover',
    'engine-crank',
    'engine-piston',
    'engine-head',
    'engine-timing',
    'engine-induction',
    'engine-starter',
    'evmotor',
    'ev-bearing',
    'ev-terminal',
  ],
  section: [
    'dram',
    'ddr4dram',
    'legionpackage',
    'engine',
    'engine-block',
    'engine-cylinder',
  ],
  bonded: [
    'legionbattery',
    'legiondisplay',
    'macbattery',
    'macdisplay',
    'earbuds',
    'earbudunit',
    'earbuds-board',
    'earbudunit-processor',
    'phone-display',
  ],
  manufacturing: [
    'camerasensor',
    'camera-shutter',
    'gamepad-haptics',
    'gamepad-right-haptic',
    'gamepad-leftstick',
    'gamepad-rightstick',
    'phone-haptic',
    'phone-speaker',
    'camera-finder',
    'ps5-power',
    'ev-stator',
    'ev-rotor',
    'ev-housing',
  ],
  welded: ['cooler', 'liquid', 'legioncooling', 'maccooling', 'ps5cooling'],
  optical: ['cameralens', 'earbuddriver'],
};
export const physicalExploration = Object.fromEntries(
  Object.entries(groups).flatMap(([mode, ids]) => ids.map((id) => [id, mode])),
) as Partial<Record<LevelId, Mode>>;
const copy: Record<Mode, { label: string; description: string }> = {
  assembly: {
    label: '总成拆解',
    description:
      '先观察模块的安装与连接，再进入子层级；动画用于说明结构，实际拆卸仍须先解除螺钉、连接器与线缆。',
  },
  section: {
    label: '内部剖分',
    description:
      '分开展示被外壳或封装遮挡的结构；铸入件、芯片封装与固定连接不能按画面直接抽出。',
  },
  bonded: {
    label: '粘接结构分解',
    description:
      '胶层、密封和焊接连接经分离后才可看到内部；画面展示结构层次，不表示能无损拔出所有零件。',
  },
  manufacturing: {
    label: '制造层级分解',
    description:
      '包含去焊、解胶或制造时装入的内部件；分开展示用于理解连接关系，不等同于可直接拆卸的维修步骤。',
  },
  welded: {
    label: '焊接总成观察',
    description:
      '热管、底板与鳍片通常固定为一体；分解或清单用于辨认构成，不能按独立模块直接拔开。',
  },
  optical: {
    label: '原理模型',
    description:
      '用于解释光学或声学结构；此子层级的参数与零件不代表整机品牌的原厂镜头或定制发声单元。',
  },
};
const specific: Partial<Record<LevelId, string>> = {
  ps5cooling:
    '0–70% 保持焊接的热管、鳍片和接触底板相连，只分离导风与界面示意；100% 清单将各构成独立排开。',
  'ps5-power':
    '先抬起上盖，再观察同一块异形 PCB 上的功能区；28% 后的元件分离是去焊示意，下壳和板保持基准。',
  engine:
    '35% 后隐藏一体铸件观察曲柄连杆；气缸不从机体滑出。70% 后转为零件清单排布。',
  'engine-cylinder':
    '气缸属于一体机体，此层展示固定的局部结构；零件清单不表示可卸式缸套。',
  'ev-stator':
    '槽内导体、端部线圈与槽绝缘按制造层次展开；灌封绕组不能作为整套线圈直接从槽中拔出。',
  cameralens:
    '此层使用 Double Gauss 教学光学处方，解释光路与镜片分组；不是 Sony FE 套机镜头的内部结构。',
  earbuddriver:
    '此层为通用动圈发声单元原理模型；不将其磁路、振膜与尺寸作为 Apple 原厂单元的测绘数据。',
};

export function explorationMode(level: LevelId, amount = 0) {
  if (amount >= 99.5)
    return {
      kind: 'inventory',
      label: '零件清单',
      description:
        '为便于逐件选择而重新排布；位置和间距不代表装配状态，也不是拆卸运动路径。',
    };
  if (!isPhysical(level))
    return {
      kind: 'logical',
      label: '逻辑架构示意',
      description:
        '方块、比例和位置表示功能与资源组织，不是实际芯片版图、走线或晶体管位置。',
    };
  const mode = physicalExploration[level] ?? 'assembly';
  return {
    kind: mode,
    ...copy[mode],
    description: specific[level] ?? copy[mode].description,
  };
}
