import type { LevelId } from './levels.ts';

export type DisassemblyStep = { name: string; at: number; instruction: string };
const step = (
  name: string,
  at: number,
  instruction: string,
): DisassemblyStep => ({ name, at, instruction });
/** Observation checkpoints on the real pose timeline. Nested mechanisms have
 * their own independent timeline; these are not real-world repair instructions. */
export const deviceDisassembly: Partial<Record<LevelId, DisassemblyStep[]>> = {
  'ps5-power': [
    step('Assembled', 0, '观察原版异形电源壳体、盖板与收窄输出端。'),
    step('抬盖让位', 18, '上盖先竖直离开下壳，再移到旁侧，避免扫过内部电容。'),
    step(
      '板上分区',
      28,
      '区分交流输入、两只卧式储能电容、磁性元件与次级输出。',
    ),
    step(
      '去焊分解示意',
      50,
      '板上元件先抬过外壳再向侧面分开；这一步包含解除焊接连接。',
    ),
    step(
      'Inventory',
      100,
      '对照异形 PCB、绝缘片、接触座和电源元件；清单布局不代表拆卸路径。',
    ),
  ],
  ps5cooling: [
    step('焊接总成', 0, '观察三个鳍片区与弯曲热管，管片和底板保持连接。'),
    step('围护让位', 30, '移开导风边条与泡棉示意，查看中央接触区。'),
    step(
      '导热路径',
      50,
      '沿液金界面、接触底板、热管和鳍片追踪热量；焊接部分不滑开。',
    ),
    step(
      'Inventory',
      100,
      '各构成分开展示以便选择，不表示焊接总成可以无损拔开。',
    ),
  ],
  engine: [
    step('Assembled', 0, '辨认倾斜气缸、油箱、空滤、消声器和手拉启动器。'),
    step(
      '移开外部总成',
      20,
      '供油进排气与启动组件先离开机体，露出散热缸体和缸盖。',
    ),
    step(
      '隐藏铸件剖视',
      35,
      '缸盖退出后隐藏一体机体，观察仍保持装配的曲轴、连杆、活塞与推杆；此阶段是剖视，不是把气缸拆下。',
    ),
    step(
      'Dissection',
      50,
      '分别进入曲轴箱、曲柄连杆、OHV 配气、正时与供油系统。',
    ),
    step(
      '机构细分',
      68,
      '从曲柄连杆继续拆活塞、开口环、组合油环、活塞销和挡圈。',
    ),
    step('Inventory', 100, '逐件核对零件名称、作用、装配关系与尺寸来源。'),
  ],
  evmotor: [
    step('Assembled', 0, '观察输出轴、水冷机壳与三相接线盒。'),
    step('退出端盖', 20, '端盖与轴承先沿轴向退出，机壳随后滑离电磁核心。'),
    step(
      '抽出转子',
      35,
      '转子沿轴线退出定子孔，保持 0.495 mm 的原始径向气隙基准。',
    ),
    step('Dissection', 50, '进入定子绕组、内嵌磁钢转子、夹套、轴承或接线盒。'),
    step(
      '绕组与磁路',
      68,
      '分别选择槽绝缘、铜线束、槽楔、跨槽线圈以及八极双层磁钢组。',
    ),
    step(
      'Inventory',
      100,
      '核对 48 槽、8 极、三相、轴系和冷却组件的独立说明。',
    ),
  ],
  pc: [
    step('Assembled', 0, '先观察机箱中各模块的安装位置。'),
    step('移开外壳', 20, '观察侧板、前板与顶板如何让出内部空间。'),
    step('分离散热', 35, '观察机箱风扇和散热组件的拆出方向。'),
    step(
      'Dissection',
      50,
      '选择主板、内存、电源、存储或显卡，继续进入各自的内部层级。',
    ),
    step('总成展开', 68, '对照模块连接关系，再进入其中一个总成。'),
    step('Inventory', 100, '用零件清单逐个定位组件，点击可阅读说明。'),
  ],
  legion: [
    step('Assembled', 0, '观察屏幕、键盘面与底盖的装配关系。'),
    step('打开机壳', 20, '先看底盖和键盘面让出的空间。'),
    step('散热路径', 35, '沿热管寻找处理器、显卡和双风扇。'),
    step('Dissection', 50, '比较电池、主板、内存和存储的位置。'),
    step('深入主板', 68, '选择主板继续拆处理器、显卡与内存结构。'),
    step('Inventory', 100, '按零件标签检查每个模块及其介绍。'),
  ],
  macbook: [
    step('Assembled', 0, '先确认屏幕、掌托与底壳的相对位置。'),
    step('移开底壳', 20, '观察外壳拆开后露出的主板和电池区域。'),
    step('散热系统', 35, '比较双风扇、散热器与芯片的布局。'),
    step('Dissection', 50, '观察多片电池、逻辑板、扬声器与显示总成。'),
    step('芯片与存储', 68, '进入逻辑板，继续探索 M1 Pro、统一内存与闪存。'),
    step('Inventory', 100, '在清单中分别检查电池、显示和计算系统。'),
  ],
  ps5: [
    step('Assembled', 0, '观察 2020 原版光驱版的双侧曲面外盖。'),
    step('取下侧盖', 20, '侧盖先移开，观察黑色承载框架。'),
    step('风扇散热', 35, '选择双面进气风扇，可继续拆叶轮、定子与轴承。'),
    step('Dissection', 50, '观察主板两面、散热器、光驱和电源的独立安装区域。'),
    step('功能总成', 68, '分别进入主板、散热、电源与光驱子层级。'),
    step('Inventory', 100, '按标签定位每个模块，再检查其结构说明。'),
  ],
  phone: [
    step('Assembled', 0, '确认标准 iPhone 15 的双摄与薄型机身。'),
    step('分离玻璃', 20, '显示总成与背玻璃先沿厚度方向移开。'),
    step('显露内部', 35, '观察电池、逻辑板、相机和无线充电线圈。'),
    step(
      'Dissection',
      50,
      '选择屏幕、逻辑板、双摄、触觉机构或扬声器继续拆解。',
    ),
    step('支架让位', 68, '内部模块退出后，再观察机身边框的安装基准。'),
    step('Inventory', 100, '用清单检查排线、接口、屏蔽和紧固组件。'),
  ],
  camera: [
    step('Assembled', 0, '观察 α7 IV 的握柄、取景器隆起、卡口和翻转屏。'),
    step('移开机壳', 20, '前后壳、机顶和底板沿各自方向分开。'),
    step('观察光路', 35, '从镜头、快门到全画幅传感器建立前后关系。'),
    step(
      'Dissection',
      50,
      '进入镜头、传感器防抖、快门、主板、取景器或翻转屏。',
    ),
    step('总成展开', 68, '比较握柄中的电池与机身中的成像、控制模块。'),
    step('Inventory', 100, '按标签选择零件，核对中文介绍和参考资料。'),
  ],
  gamepad: [
    step('Assembled', 0, '先观察 DualSense 的握柄、摇杆和肩键轮廓。'),
    step(
      '退出输入件',
      20,
      '按键和触控板先竖直退出开口，再移到侧边；背壳向下分离。',
    ),
    step('移开上壳', 35, '上壳在输入件让位后抬起；观察握柄内的触觉执行器。'),
    step('Dissection', 50, '分别进入左右摇杆、自适应扳机、主板与触觉机构。'),
    step('机构细分', 68, '在摇杆中看双轴电位器，在扳机中看电机与蜗杆齿轮。'),
    step('Inventory', 100, '检查两侧对应的机构与独立零件说明。'),
  ],
  earbuds: [
    step('Assembled', 0, '观察 AirPods Pro 2 的闭合轮廓与盒盖接缝。'),
    step('开盖查看', 16, '上盖先绕后铰链转动，耳机仍停留在托盘口袋内。'),
    step('提起耳机', 28, '两只耳机先竖直退出各自的口袋。'),
    step('Dissection', 50, '继续观察托盘、充电板、两片电池与无线充电线圈。'),
    step('声学与电路', 68, '进入单只耳机，再拆发声单元和音频处理电路。'),
    step('Inventory', 100, '比较盒内供电与单耳电池，并按标签检查每个组件。'),
  ],
};

export function activeDisassemblyStep(level: LevelId, amount: number) {
  return deviceDisassembly[level]?.findLast((s) => amount >= s.at - 0.1);
}
