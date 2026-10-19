import { concept, type Category, type Concept } from '../concept.ts';
import type { LevelDef } from '../levels.ts';
import type { SourceId } from '../sources.ts';
import type { Vec3 } from '../layout.ts';
import { powertrainDefinitions } from '../powertrain/catalogue.ts';
import { refineDigitalDefinitions } from './refinements.ts';

export type DigitalLevel = 'engine' | 'engine-cylinder' | 'engine-cover' | 'engine-block' | 'engine-crank' | 'engine-piston' | 'engine-head' | 'engine-timing' | 'engine-induction' | 'engine-starter' | 'evmotor' | 'ev-stator' | 'ev-rotor' | 'ev-housing' | 'ev-bearing' | 'ev-terminal' | 'ps5' | 'ps5board' | 'ps5cooling' | 'phone' | 'phoneboard' | 'phonecamera' | 'camera' | 'camerasensor' | 'cameralens' | 'gamepad' | 'gamepadboard' | 'earbuds' | 'earbudunit' | 'earbuddriver' | 'phone-display' | 'ps5-power' | 'ps5-drive' | 'camera-board' | 'camera-shutter' | 'gamepad-haptics' | 'gamepad-right-haptic' | 'earbudunit-processor' | 'earbuds-board' | 'ps5-fan' | 'phone-haptic' | 'phone-speaker' | 'camera-finder' | 'camera-display' | 'gamepad-triggers' | 'gamepad-right-trigger' | 'gamepad-leftstick' | 'gamepad-rightstick';
export type ShapeKind = 'box' | 'board' | 'chip' | 'battery' | 'screen' | 'wing' | 'frame' | 'fan' | 'fins' | 'pipes' | 'lens' | 'ring' | 'coil' | 'sensor' | 'shutter' | 'grip-shell' | 'buttons' | 'stick' | 'earbud' | 'diaphragm' | 'flex' | 'screws' | 'connector' | 'trigger' | 'actuator' | 'tray' | 'shield' | 'mount';
export type DigitalPart = {
  id: string; name: string; category: Category; shape: ShapeKind;
  size: Vec3; pos: Vec3; delta: Vec3; color: string;
  description: string; purpose: string; open?: DigitalLevel; opensFirst?: boolean;
  rotation?: Vec3; sources?: SourceId[]; quantity?: string; assembly?: DigitalLevel; motion?: [number, number]; path?: {at:number;offset:Vec3}[];
};
export type Definition = { id: DigitalLevel; parent: DigitalLevel | null; name: string; summary: string; unit: number; source: SourceId; specs?: Record<string, string>; parts: DigitalPart[]; accuracy?: string; camera?: LevelDef['camera'] };

function p(id: string, name: string, category: Category, shape: ShapeKind, size: Vec3, pos: Vec3, delta: Vec3, color: string, description: string, purpose: string, open?: DigitalLevel, opensFirst = false): DigitalPart {
  return { id, name, category, shape, size, pos, delta, color, description, purpose, open, opensFirst };
}

export const digitalDefinitions: Definition[] = [
  { id: 'ps5', parent: null, name: 'PlayStation 5', summary: '2020 原版光驱版 · 整机结构教学', unit: 40, source: 'ps5official', specs: { '参考型号': '2020 年原版 PS5 光驱版（非 Slim / Pro）', '处理器': '定制 AMD CPU / GPU', '内存': '16 GB GDDR6', '存储': '825 GB 内置 SSD；M.2 扩展槽', '模型范围': '公开架构与外观参考；内部布局简化' }, parts: [
    p('left-cover', '左侧曲面外盖', 'Chassis', 'wing', [5,390,260], [-51,0,0], [-130,5,0], '#eeeae0', '标志性的白色侧盖包覆黑色机身，两块侧盖首先向两侧移开。', '保护内部组件并组织机身进出风空间。', undefined, true),
    p('right-cover', '右侧曲面外盖', 'Chassis', 'wing', [5,390,260], [51,0,0], [130,5,0], '#eeeae0', '机身另一侧的外盖采用相同的曲面语言；这里简化了卡扣与局部曲率。', '与内部支架共同形成可辨识的机身轮廓。', undefined, true),
    p('frame', '中央承载框架', 'Chassis', 'frame', [94,360,235], [0,0,0], [0,-70,0], '#181c22', '黑色承载框架把电路、散热和驱动器组织在狭长的空间中。', '提供安装基准；开口与固定点属于教学示意。'),
    p('board', '主板与计算系统', 'Compute', 'board', [4,235,170], [4,17.5,20], [90,0,0], '#335a49', '定制处理器、统一内存和存储相关电路位于主板系统上。', '把游戏逻辑、图形计算和数据传输连接起来。', 'ps5board'),
    p('cooling', '散热组件', 'Cooling', 'fins', [33,165,145], [-27,-8,25], [-90,0,0], '#999b96', '大面积散热器与导热结构把处理器的热量传向流动的空气。', '控制处理器温度，使系统能够持续工作。', 'ps5cooling'),
    p('fan', '双面进气风扇', 'Cooling', 'fan', [28,112,112], [-25,135,-47], [-75,65,-20], '#30363d', '风扇与狭长机身协作形成冷却通道，绘图叶片数经过简化。', '让空气通过散热器与机身内部。'),
    p('power', '内置电源模块', 'Power', 'box', [62,68,170], [0,-147,10], [0,-100,0], '#242a30', '内部电源把外部供电转换为系统需要的电压。', '为计算、存储、驱动器和散热等模块供电。'),
    p('drive', 'Ultra HD Blu-ray 光驱', 'Storage', 'box', [20,145,140], [30,-20,15], [115,-15,0], '#747b7f', '原版光驱版 PS5 带有光盘驱动器，本视图不代表可拆卸光驱的后续版本。', '读取兼容的实体游戏与光盘媒体。'),
    p('m2', 'M.2 扩展槽盖板', 'Storage', 'box', [2,95,27], [43,18,-70], [105,0,-45], '#b8bfc0', '公开的 M.2 扩展槽用于兼容的 SSD；槽位盖板与内置 SSD 是不同部件。', '为扩展存储保留位置；不能把槽位盖板误认为 SSD。'),
    p('ports', 'USB 与后部接口组', 'Board', 'box', [63,18,12], [0,-155,-112], [0,-45,-65], '#3e454c', '接口连接外设、显示器、网络与供电；这里把接口外壳作为一组展示。', '把主机与外部设备连接起来。'),
  ] },
  { id: 'ps5board', parent: 'ps5', name: 'PS5 主板', summary: '定制处理器、GDDR6 与固态存储', unit: 25, source: 'ps5faq', parts: [
    p('pcb', '主板 PCB', 'Board', 'board', [170,3,235], [0,0,0], [0,-35,0], '#335546', '多层电路板提供元件安装位置与电气连接。', '连接处理器、内存、存储控制与供电电路。'),
    p('apu', '定制 AMD 处理器', 'Compute', 'chip', [52,6,52], [0,6,0], [0,45,0], '#b2b9b4', 'CPU 与 GPU 功能集中在定制处理器中；金属方块表示封装而不是晶体管版图。', '执行游戏程序并进行图形处理。'),
    p('memory', 'GDDR6 内存封装组', 'Memory', 'chip', [27,4,18], [-48,5,-30], [-48,25,-18], '#191d23', '主机使用 16 GB GDDR6；此处只示意一组封装，不复现全部芯片数量或布线。', '为处理器提供高速工作数据。'),
    p('ssd-controller', 'SSD 控制电路', 'Storage', 'chip', [21,3,21], [42,4,67], [35,25,25], '#272c33', '控制电路组织固态存储的数据传输。', '协调存储访问与系统 I/O。'),
    p('nand', '内置闪存封装组', 'Storage', 'chip', [34,3,20], [0,4,77], [0,25,65], '#222831', '内置 SSD 的闪存以焊接封装形式参与主板系统。', '在断电后保存系统、游戏与用户数据。'),
    p('vrm', '供电调节区域', 'Power', 'chip', [19,6,62], [55,5,-26], [48,35,0], '#5f6870', '供电调节区域由多种元件构成，本模型把它们合并展示。', '把输入电压转换为芯片需要的稳定供电。'),
    p('shield', '电磁屏蔽盖', 'Chassis', 'box', [155,1.5,210], [0,13,0], [0,80,0], '#9fa8aa', '金属盖覆盖电路区域，拆解时先离开电路板。', '参与电磁屏蔽和机械保护。', undefined, true),
  ] },
  { id: 'ps5cooling', parent: 'ps5', name: 'PS5 散热系统', summary: '散热片、热管与液态金属界面示意', unit: 25, source: 'ps5official', parts: [
    p('base', '散热器承载底座', 'Cooling', 'box', [140,3,160], [0,0,0], [0,-30,0], '#777e83', '底座把接触面与散热结构组织成机械组件。', '为导热部件与散热片提供连接。'),
    p('fins', '散热鳍片阵列', 'Cooling', 'fins', [130,22,150], [0,14,0], [0,60,0], '#a3a9aa', '薄片扩大与空气接触的面积；片数与间距经过教学简化。', '把导来的热量交换给空气。'),
    p('pipes', '热管组', 'Cooling', 'pipes', [110,4,150], [0,4,0], [-55,30,0], '#bf8154', '热管把接触区域的热量分配到更大范围的散热片。', '在接触面与鳍片之间传递热量。'),
    p('coldplate', '处理器接触底板', 'Cooling', 'box', [53,2,53], [-5,-3,25.5], [0,-48,0], '#b8ada0', '底板靠近处理器，连接芯片侧与散热器侧。', '为热量提供低热阻的传导路径。'),
    p('interface', '液态金属导热界面示意', 'Cooling', 'box', [35,.3,35], [-5,-4.3,25.5], [35,-50,0], '#d0d3d0', '索尼官方拆解介绍了液态金属导热界面。模型以薄层示意，不模拟流动。', '减小处理器与散热器接触界面的热阻。'),
    p('duct', '导风结构', 'Chassis', 'frame', [145,30,165], [0,13,0], [0,60,-60], '#252c31', '导风结构限制空气旁路，让气流更有效地经过散热区域。', '配合风扇组织机身内部空气流动。'),
  ] },
  { id: 'phone', parent: null, name: 'iPhone 15', summary: '6.1 英寸参考机型 · 双摄与紧凑装配', unit: 12, source: 'iphoneinternal', specs: { '参考型号': 'iPhone 15（2023，非 Pro）', '外形尺寸': '147.6 × 71.6 × 7.8 mm', '芯片': 'A16 Bionic', '屏幕': '6.1 英寸 OLED', '后置相机': '4800 万像素主摄 + 1200 万像素超广角', '模型范围': '内部位置、排线与紧固细节为教学简化' }, camera: { direction: [0.6,1.5,0.85], padding: 1.05 }, parts: [
    p('display', 'OLED 显示总成', 'Board', 'screen', [69,1.3,145], [0,4.4,0], [0,35,0], '#0d2029', '屏幕总成位于机身正面，边缘与内部排线相连。', '显示画面并承载触控交互。', undefined, true),
    p('back', '背部玻璃', 'Chassis', 'box', [70,1,146], [0,-4,0], [0,-30,0], '#bbd8de', '玻璃背盖与铝制边框形成外壳；开盖方向仅为教学展示。', '保护内部并提供无线充电可穿透的背部区域。', undefined, true),
    p('frame', '铝制边框', 'Chassis', 'frame', [71.6,7.8,147.6], [0,0,0], [-35,0,0], '#7e999f', '边框沿机身边缘承载屏幕、背盖与内部组件。', '提供机械强度、按钮与连接器安装位置。'),
    p('battery', '锂离子电池', 'Power', 'battery', [40,4,87], [-11,0,11], [-33,12,0], '#34393b', '电池占据机身内部较大面积，位置参考公开内部视图。', '为便携设备储存和提供电能。'),
    p('board', '紧凑逻辑板', 'Compute', 'board', [19,3.4,80], [21,0,-17], [33,15,0], '#294e47', '逻辑板在有限空间中组织应用处理、存储、通信与供电。', '协调手机的运算、无线连接和外设。', 'phoneboard'),
    p('camera', '后置双摄系统', 'Board', 'lens', [30,7,30], [-17,-.5,-50], [-30,-15,-25], '#30383e', '标准 iPhone 15 具有主摄与超广角；本模型没有加入 Pro 专属镜头。', '把不同视角的光学画面转成电信号。', 'phonecamera'),
    p('coil', '无线充电线圈示意', 'Power', 'coil', [44,1,44], [0,-2.7,8], [0,-22,0], '#b38755', '平面线圈示意无线充电接收区域；具体匝数和磁体结构经过简化。', '把交变磁场携带的能量引入充电电路。'),
    p('haptic', 'Taptic Engine 触觉组件', 'Board', 'box', [28,4,13], [-12,0,60], [-25,15,30], '#727d81', '苹果内部视图单独列出了触觉反馈组件。', '把系统交互转化为可感知的机械反馈。'),
    p('speaker', '底部扬声器', 'Board', 'box', [21,4,14], [21,0,60], [25,15,30], '#232d32', '小型扬声器与声腔布置在机身底部附近。', '把音频信号转化为声音。'),
    p('top-speaker', '顶部扬声器', 'Board', 'box', [24,3,7], [9,0,-66], [15,20,-30], '#354146', '公开内部视图中的顶部扬声器被单独显示。', '承担听筒与音频播放相关功能。'),
    p('usb', 'USB-C 接口总成', 'Board', 'box', [13,3,8], [0,0,70], [0,10,35], '#8d999c', 'USB-C 连接器位于底部边缘。', '连接充电与有线数据路径。'),
  ] },
  { id: 'phoneboard', parent: 'phone', name: '手机逻辑板', summary: '应用处理器、闪存、射频与电源管理', unit: 5, source: 'iphonerepair', parts: [
    p('pcb', '多层电路板', 'Board', 'board', [21,1,76], [0,0,0], [0,-10,0], '#31574c', '紧凑电路板承载高密度封装。其布线与板层不在本模型中复现。', '在芯片、天线和机身模块之间传递电力与信号。'),
    p('soc', 'A16 Bionic 封装示意', 'Compute', 'chip', [14,2,14], [0,2,-12], [0,14,0], '#292d35', '手机应用处理器承担通用计算、图形与相关处理功能。', '执行应用程序并协调手机计算任务。'),
    p('nand', '闪存封装示意', 'Storage', 'chip', [12,2,13], [0,2,12], [15,14,10], '#303640', '非易失性存储封装用于保存系统、应用和文件。', '在断电后继续保存数据。'),
    p('pmic', '电源管理电路', 'Power', 'chip', [8,1.5,8], [0,2,28], [-15,12,15], '#3e4748', '电源管理区域以功能块表示，不宣称芯片的实际供应商或完整电路。', '管理电源转换、分配和运行状态。'),
    p('radio', '通信与射频区域', 'Board', 'chip', [12,2,13], [0,2,-30], [15,12,-15], '#677477', '通信区域与天线、调制解调器等一起支持无线连接。', '连接蜂窝、局域网与其他无线链路。'),
    p('shield', '屏蔽罩', 'Chassis', 'box', [19,.5,69], [0,3.4,0], [0,26,0], '#a9b2ae', '金属屏蔽罩覆盖高密度电路区域。', '参与电磁兼容与机械保护。', undefined, true),
  ] },
  { id: 'phonecamera', parent: 'phone', name: '手机双摄模组', summary: '主摄与超广角 · 物理示意', unit: 4, source: 'iphonespec', parts: [
    p('carrier', '模组承载框', 'Chassis', 'frame', [31,5,31], [0,0,0], [0,-10,0], '#555e63', '相机模组把镜头和图像传感器组织在一起。', '维持光学组件的相对位置。'),
    p('mainlens', '主摄镜头示意', 'Board', 'lens', [14,8,14], [-7,5,-7], [-9,18,-9], '#303d43', '主摄光路对应公开规格中的 4800 万像素主摄。镜片数量并非真实光学处方。', '把光线聚焦到主摄图像传感器。'),
    p('widelens', '超广角镜头示意', 'Board', 'lens', [12,7,12], [7,5,7], [9,18,9], '#293840', '第二条光路对应 1200 万像素超广角。', '提供更宽的取景范围。'),
    p('mainsensor', '主摄传感器示意', 'Board', 'sensor', [9,1,7], [-7,1,-7], [-9,-9,-9], '#8a62a3', '感光芯片把光线转换成电信号，表面颜色仅帮助辨识。', '将主摄图像转换为可处理的数据。'),
    p('widesensor', '超广角传感器示意', 'Board', 'sensor', [6,1,5], [7,1,7], [9,-9,9], '#6c8fa7', '超广角光路具有自己的图像传感器。', '采集超广角画面的电信号。'),
    p('flex', '模组连接排线', 'Board', 'box', [10,.4,12], [0,-2,19], [0,-9,10], '#b88a50', '柔性连接把相机与手机逻辑板连接起来。', '传输数据、控制与供电。'),
  ] },
  { id: 'camera', parent: null, name: 'Sony α7 IV 相机', summary: '全画幅无反参考机型 · 机身与代表性镜头', unit: 15, source: 'sonyalpha', specs: { '参考机身': 'Sony α7 IV / ILCE-7M4', '成像': '约 3300 万有效像素全画幅 CMOS', '卡口': 'Sony E 卡口', '防抖': '机身传感器位移防抖', '镜头说明': '通用教学镜头；不对应某款镜头的光学处方' }, parts: [
    p('front', '前壳与握柄', 'Chassis', 'grip-shell', [131,90,48], [0,0,0], [0,0,65], '#282d2e', '相机机身以握柄和镜头卡口为主要外观特征，外形作教学近似。', '提供持握、卡口与内部支架结构。', undefined, true),
    p('back', '背部外壳', 'Chassis', 'box', [124,82,10], [0,0,-27], [0,0,-60], '#292e31', '背壳为屏幕、按键与连接件提供安装位置。', '保护机身背面的电子与机械组件。', undefined, true),
    p('display', '翻转显示屏总成示意', 'Board', 'screen', [66,5,43], [9,-6,-34], [0,-35,-75], '#182e3b', '后屏显示实时取景、图像与菜单；铰链在模型中简化。', '向拍摄者提供可视反馈。'),
    p('board', '图像处理主板', 'Compute', 'board', [95,3,66], [0,0,-12], [-70,0,-20], '#35574b', '主板连接图像传感器、存储和控制系统。', '执行图像处理与相机控制。'),
    p('battery', '可充电电池包', 'Power', 'battery', [30,55,18], [43,-12,0], [65,-30,0], '#41484a', '握柄附近容纳可拆卸电池，具体外形与内部位置作示意。', '为便携拍摄提供电能。'),
    p('sensor', '传感器与防抖组件', 'Board', 'sensor', [48,40,8], [-8,0,0], [0,0,40], '#816a9e', '全画幅传感器及其承载机构位于镜头后方。', '接收光线，并通过机身防抖机构补偿部分抖动。', 'camerasensor'),
    p('shutter', '焦平面快门示意', 'Board', 'shutter', [46,38,2], [-8,0,8], [0,42,30], '#292e33', '快门位于传感器前方；叶片形态与数量为解释原理而简化。', '在机械快门模式下控制传感器曝光时间。'),
    p('lens', '代表性可换镜头', 'Board', 'lens', [64,70,64], [-8,0,55], [0,0,100], '#303638', '镜头以通用结构展示镜组、光圈与对焦，不声称是具体 Sony 镜头的精确拆解。', '收集光线并在传感器平面形成图像。', 'cameralens'),
    p('finder', '电子取景器', 'Board', 'box', [38,23,27], [-8,49,-10], [0,50,-20], '#252b2e', '电子取景器把传感器输出呈现给拍摄者。', '提供贴眼取景与拍摄信息。'),
    p('dial', '拍摄控制拨轮', 'Board', 'ring', [22,7,22], [39,44,-1], [40,40,0], '#181d20', '外部拨轮与按键用于输入拍摄设置。', '把操作者的动作转成控制信号。'),
  ] },
  { id: 'camerasensor', parent: 'camera', name: '传感器与防抖', summary: '成像平面、滤光层与位移支架示意', unit: 7, source: 'sonyalpha', parts: [
    p('carrier', '活动承载框', 'Chassis', 'frame', [49,3,40], [0,0,0], [0,-12,0], '#77817e', '承载框把感光组件连接到可位移的机构上。', '维持成像平面并允许小范围受控位移。'),
    p('sensor', '全画幅 CMOS 示意', 'Board', 'sensor', [36,1,24], [0,2,0], [0,16,0], '#8065a0', '矩形感光区域表示全画幅级 CMOS，像素排布没有逐个复现。', '把镜头投射的光学图像转换为电信号。'),
    p('filter', '保护与滤光层示意', 'Board', 'box', [38,.6,26], [0,4,0], [0,30,0], '#7b9ca6', '感光面前的光学层以半透明色块作概念表达。', '保护感光面并参与光谱控制；不复现厂商镀膜配方。'),
    p('actuators', '防抖驱动机构示意', 'Board', 'coil', [45,2,35], [0,-2,0], [-22,0,0], '#b68c54', '驱动与反馈机构共同控制传感器的微小位移；线圈形态为代表性示意。', '补偿部分机身运动对成像的影响。'),
    p('flex', '柔性信号连接', 'Board', 'box', [22,.5,15], [0,-2,28], [0,0,25], '#b78b54', '柔性连接允许承载机构小范围运动。', '在感光组件与处理主板之间传递信号和电力。'),
  ] },
  { id: 'cameralens', parent: 'camera', name: '可换镜头原理', summary: '通用镜组、光圈与对焦示意', unit: 10, source: 'sonyoptics', parts: [
    p('barrel', '外部镜筒', 'Chassis', 'ring', [67,76,67], [0,0,0], [-65,0,0], '#252d30', '镜筒把镜组、光圈与对焦机构安装成同轴系统。', '提供遮光、机械连接和光学元件安装位置。'),
    p('frontglass', '前镜组示意', 'Board', 'lens', [57,8,57], [0,29,0], [0,60,0], '#315469', '前镜组用简化的几何表示多片光学元件。', '收集并初步折射入射光线。'),
    p('focusglass', '移动对焦镜组示意', 'Board', 'lens', [39,9,39], [0,4,0], [45,25,0], '#41546c', '移动部分镜组可以改变成像关系。这里只表示运动角色，不提供光学处方。', '让选定距离的物体在成像平面清晰成像。'),
    p('iris', '光圈叶片示意', 'Board', 'shutter', [48,2,48], [0,-10,0], [-45,-15,0], '#4f5960', '光圈开口控制通过镜头的光束范围；简化叶片只用于解释机制。', '影响通光量以及与景深有关的成像条件。'),
    p('rearglass', '后镜组示意', 'Board', 'lens', [34,6,34], [0,-25,0], [0,-60,0], '#34506b', '后镜组继续调整通过镜头的光线。', '与其他镜组共同在传感器平面形成图像。'),
    p('focusmotor', '对焦驱动区域', 'Power', 'box', [12,29,15], [27,0,0], [55,0,0], '#787f7c', '驱动机构根据相机控制移动对焦组件。外形不对应某个商业镜头的马达。', '将控制信号转换成受控的光学组件位移。'),
    p('mount', '卡口与触点', 'Board', 'ring', [61,5,61], [0,-40,0], [0,-80,0], '#b4b4a8', '机械卡口与电气触点连接镜头和机身。', '维持安装关系并交换控制、状态与电力。'),
  ] },
  { id: 'gamepad', parent: null, name: '双摇杆游戏手柄', summary: '参考 DualSense 的功能组织 · 非精确内部复刻', unit: 18, source: 'dualsenseofficial', specs: { '功能参考': 'DualSense 无线控制器', '输入': '双摇杆、按键、触控区与扳机', '反馈': '触觉反馈与自适应扳机功能', '模型范围': '通用功能结构；不复现专有执行器内部或精确壳体' }, parts: [
    p('top', '上壳与握柄', 'Chassis', 'grip-shell', [155,45,93], [0,0,0], [0,40,0], '#e2e5df', '双握柄把按键、摇杆和扳机布置在手指可及的区域。', '支撑手掌并保护内部组件。', undefined, true),
    p('back', '下部外壳', 'Chassis', 'grip-shell', [150,17,90], [0,-17,0], [0,-40,0], '#383d40', '下壳与上壳共同形成握持轮廓。', '封闭机身并固定内部功能模块。', undefined, true),
    p('board', '输入与控制电路', 'Compute', 'board', [100,2,54], [0,-2,0], [0,35,0], '#335b48', '控制电路汇集输入并与主机通信。', '采集输入、发送状态并接收反馈指令。', 'gamepadboard'),
    p('battery', '充电电池', 'Power', 'battery', [38,11,32], [0,-9,7], [0,-35,25], '#59605d', '无线手柄通过内置可充电电池工作。', '为输入电路与反馈系统提供便携供电。'),
    p('leftstick', '左摇杆模块', 'Board', 'stick', [27,24,27], [-29,14,17], [-42,30,25], '#20272b', '摇杆将拇指的二维运动转化为输入量。', '控制方向与连续变化的游戏动作。'),
    p('rightstick', '右摇杆模块', 'Board', 'stick', [27,24,27], [29,14,17], [42,30,25], '#20272b', '第二个摇杆提供独立的二维输入。', '常用于视角、瞄准或其他连续控制。'),
    p('buttons', '方向键与动作键组', 'Board', 'buttons', [126,7,28], [0,24,-15], [0,40,-20], '#3d454c', '离散按键与连续摇杆互补。', '把按压转化为明确的数字输入。'),
    p('touch', '触控面板', 'Board', 'box', [52,4,28], [0,25,-21], [0,60,-15], '#242b30', '触控区域是不同于物理按键的输入表面。', '向兼容软件提供触摸与按压相关输入。'),
    p('triggers', '肩键与自适应扳机区域', 'Board', 'box', [122,15,18], [0,5,-43], [0,15,-45], '#262d32', 'DualSense 官方资料说明了自适应扳机功能，此处只画出功能区域。', '通过输入行程及可控阻力建立交互感受。'),
    p('haptics', '触觉反馈执行器组', 'Board', 'box', [100,18,18], [0,-2,32], [0,-25,40], '#737f80', '执行器把反馈指令转成机械振动；不将其误画成传统偏心转子马达。', '向双手提供与游戏事件相关的触觉反馈。'),
  ] },
  { id: 'gamepadboard', parent: 'gamepad', name: '手柄控制电路', summary: '采集输入、处理通信与驱动反馈', unit: 12, source: 'dualsenseofficial', parts: [
    p('pcb', '控制 PCB', 'Board', 'board', [100,2,54], [0,0,0], [0,-16,0], '#335b48', '电路板把输入、无线连接与反馈模块连接起来。', '提供电气连接和机械安装基底。'),
    p('mcu', '控制处理器示意', 'Compute', 'chip', [17,3,17], [0,3,0], [0,22,0], '#2e363b', '功能框表示控制处理器，并不标注未经核对的芯片型号。', '汇集输入、管理通信并协调反馈。'),
    p('radio', '无线通信区域', 'Board', 'chip', [16,3,13], [31,3,-10], [25,20,-10], '#6c7a7c', '通信模块建立与主机或兼容设备的数据链路。', '交换按键状态与反馈指令。'),
    p('imu', '运动感知区域示意', 'Board', 'chip', [9,2,9], [-30,3,10], [-25,20,10], '#5c6b66', '运动传感器检测控制器的运动状态。', '为兼容的交互提供姿态与运动相关输入。'),
    p('usb', 'USB-C 连接器', 'Board', 'box', [13,5,9], [0,3,-27], [0,12,-20], '#a9b2af', '有线接口提供电力和通信路径。', '连接充电与兼容的有线使用方式。'),
  ] },
  { id: 'earbuds', parent: null, name: '无线耳机与充电盒', summary: '通用动圈无线耳机 · 原理样机', unit: 10, source: 'earbudofficial', specs: { '模型类型': '通用教学样机，不是 AirPods 精确复刻', '功能参考': '公开无线耳机规格中的动圈、麦克风与充电功能', '几何说明': '内部布局、尺寸、线圈匝数与电池规格不代表某款产品' }, parts: [
    p('case', '充电盒下壳', 'Chassis', 'frame', [64,42,45], [0,0,0], [0,-30,0], '#e5e5df', '充电盒容纳耳机与充电电路，壳体用简化圆角结构表达。', '保护耳机并为充电组件提供安装空间。'),
    p('lid', '充电盒上盖', 'Chassis', 'box', [64,8,45], [0,25,0], [0,35,-15], '#ecece5', '上盖闭合时保护内部，拆解时先移开。', '形成便于携带的封闭外壳。', undefined, true),
    p('battery', '充电盒电池', 'Power', 'battery', [43,4,25], [0,-17,0], [0,-20,25], '#4a5152', '充电盒电池与耳机自身的小电池是不同的供电组件。', '在外部电源之外为耳机补充电量。'),
    p('board', '盒内充电管理板', 'Power', 'board', [46,1.5,7], [0,-11,-16], [-45,10,0], '#3b6150', '充电板连接电池、充电输入与耳机触点。', '管理充电盒中的能量分配。'),
    p('left', '左耳机示意', 'Board', 'earbud', [17,26,18], [-16,1,0], [-30,35,0], '#efeee7', '左、右耳机分别包含小型声学与电子组件。', '向左耳提供声音与交互。'),
    p('unit', '右耳机内部', 'Board', 'earbud', [17,26,18], [16,1,0], [30,35,0], '#efeee7', '从右耳机继续进入独立的声学与电子结构。', '把无线音频信号转化成声音。', 'earbudunit'),
    p('connector', '充电输入接口', 'Board', 'box', [12,4,8], [0,-5,23], [0,-10,25], '#949f9e', '充电盒的输入端与内部充电管理板相连。', '从外部电源补充能量。'),
  ] },
  { id: 'earbudunit', parent: 'earbuds', name: '耳机内部结构', summary: '外壳、发声单元、电池与信号处理', unit: 3, source: 'earbudofficial', parts: [
    p('shell', '耳机壳体', 'Chassis', 'earbud', [18,27,19], [0,0,0], [-22,0,0], '#e7e6df', '小型壳体组织声学空间与电子组件。', '保护内部并构成佩戴与出声结构。', undefined, true),
    p('driver', '动圈发声单元', 'Board', 'ring', [11,5,11], [0,2,-3], [0,20,-10], '#626b6b', '动圈单元通过振膜运动产生声音。外形与尺寸属于通用原理示意。', '把音频电信号转换成空气压力变化。', 'earbuddriver'),
    p('battery', '耳机电池示意', 'Power', 'battery', [8,6,8], [0,-3,1], [0,-18,0], '#b5b5a4', '耳机的小电池支持脱离充电盒后的使用。', '为无线、处理与发声组件提供能量。'),
    p('processor', '音频处理与通信区域', 'Compute', 'chip', [7,2,7], [0,4,5], [15,12,10], '#3e4948', '微型电子区域汇集无线通信与音频处理。', '接收音频并处理相关控制和信号。'),
    p('mic', '麦克风区域示意', 'Board', 'chip', [3,2,3], [0,-7,6], [10,-15,10], '#737e79', '麦克风将环境或语音声波转化为电信号。', '为通话及兼容的噪声控制功能提供输入。'),
    p('tip', '柔性耳塞套', 'Chassis', 'ring', [12,5,12], [0,6,-7], [0,25,-20], '#d1d2ca', '耳塞套与耳道接触，影响佩戴及声学密封。', '把出声结构与耳道连接起来。'),
  ] },
  { id: 'earbuddriver', parent: 'earbudunit', name: '动圈发声原理', summary: '振膜、音圈、磁体与支架', unit: 2, source: 'dynamicdriver', parts: [
    p('frame', '单元支架', 'Chassis', 'ring', [12,5,12], [0,0,0], [-12,0,0], '#7b8583', '支架组织磁路与可运动的振膜组件。', '维持各部分的几何关系。'),
    p('magnet', '永磁体与磁路示意', 'Board', 'ring', [9,3,9], [0,-1,0], [0,-10,0], '#626d71', '磁路在音圈附近建立磁场；本模型不计算磁场分布。', '为电流产生驱动力提供磁场。'),
    p('coil', '音圈', 'Board', 'coil', [5,2,5], [0,1,0], [12,5,0], '#bd895a', '音圈随音频电流变化受到电磁作用。', '把变化的电信号转换成机械驱动力。'),
    p('diaphragm', '振膜', 'Board', 'diaphragm', [10,.3,10], [0,3,0], [0,12,0], '#b8bfc0', '振膜与音圈协作运动，推动周围空气。', '形成可传播的声波。'),
    p('mesh', '出声保护网示意', 'Chassis', 'ring', [11,.5,11], [0,4,0], [0,20,0], '#8b9895', '出声端的保护结构以简化环网表达。', '保护精细的发声结构。'),
  ] },
];

refineDigitalDefinitions(digitalDefinitions);
digitalDefinitions.push(...powertrainDefinitions);

export const digitalRoots = digitalDefinitions.filter((item) => item.parent === null).map((item) => item.id);
const subsystemLabels: Partial<Record<DigitalLevel,string>> = {
  ps5board:'主板与计算',ps5cooling:'散热与气流','ps5-fan':'散热与气流','ps5-power':'电源','ps5-drive':'光驱与存储',
  phoneboard:'逻辑板',phonecamera:'双摄影像','phone-display':'显示系统','phone-haptic':'声音与触觉','phone-speaker':'声音与触觉',
  camerasensor:'成像与光学',cameralens:'成像与光学','camera-shutter':'成像与光学','camera-board':'电路与控制','camera-finder':'取景与显示','camera-display':'取景与显示',
  gamepadboard:'控制电路','gamepad-haptics':'触觉反馈','gamepad-right-haptic':'触觉反馈','gamepad-triggers':'自适应扳机','gamepad-right-trigger':'自适应扳机','gamepad-leftstick':'摇杆输入','gamepad-rightstick':'摇杆输入',
  earbudunit:'耳机与声学','earbuds-board':'充电与供电',
};
const phases = [['Assembled', 0], ['Dissection', 50], ['Inventory', 100]] as const;
export const digitalLevels = Object.fromEntries(digitalDefinitions.map((item) => [item.id, {
  id: item.id, parent: item.parent, name: item.name, title: item.name, caption: item.accuracy ? '动力系统 · 公开资料参考重建' : '数码硬件 · 教学示意', summary: item.summary,
  concept: item.id, kind: 'physical', phases: item.id==='earbuds' ? [['Assembled',0],['开盖查看',16],['Dissection',50],['Inventory',100]] : phases, detailed: true, spread: 1.1,
  ...(item.parent && digitalDefinitions.find(d => d.id === item.parent)?.parent === null ? { branchLabel: subsystemLabels[item.id] ?? item.name } : {}), camera: item.camera ?? { padding: 1.05, direction: [1.2,1.0,1.5] },
} satisfies LevelDef])) as unknown as Record<DigitalLevel, LevelDef>;

export const digitalAccuracy = '依照所列型号的内部视图、拆解照片或分解图重建主要组件。壳体曲面、板形、排线和紧固件为观察资料后的几何近似；未测绘的尺寸、微型元件与走线不作为维修依据，镜头和动圈子层级仍是原理模型。';
export const digitalConcepts: Concept[] = digitalDefinitions.flatMap((item) => [
  ...(item.parent ? [] : [concept({ id: item.id, name: item.name, level: item.id, open: item.id, parent: null, category: 'Chassis', description: item.summary + '。', purpose: '通过可选择的三维组件理解这类硬件设备的结构和功能分工。', quantity: '1 台教学参考设备', specifications: item.specs ?? {}, representationType: 'physical', physicalAccuracy: item.accuracy ?? digitalAccuracy, sources: [item.source], searchTerms: [item.id, item.name, item.summary] })]),
  ...item.parts.map((part) => concept({ id: part.open ?? `${item.id}-${part.id}`, level: item.id, open: part.open, parent: item.id, name: part.name, category: part.category, description: part.description, purpose: part.purpose, quantity: part.quantity ?? '1 个组件 / 总成（微型支持件随总成展示）', specifications: part.open ? (digitalDefinitions.find((entry) => entry.id === part.open)?.specs ?? {}) : {}, representationType: 'physical', physicalAccuracy: digitalAccuracy, sources: part.sources ?? [item.source], searchTerms: [item.id, item.name, part.name], opensFirst: part.opensFirst })),
]);
