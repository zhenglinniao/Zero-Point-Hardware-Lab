import type { Category, Concept } from './concept.ts';
import type { LevelId } from './levels.ts';

export const categoryZh: Record<Category, string> = { Chassis: '外壳与结构', Cooling: '散热系统', Board: '电路与连接', Power: '供电系统', Memory: '内存系统', Storage: '存储系统', Compute: '处理与计算', Graphics: '图形系统' };
export const levelZh: Partial<Record<LevelId, string>> = {
  pc:'台式电脑', motherboard:'主板', dimm:'DDR5 内存模组', dram:'DDR5 芯片封装', banks:'DDR5 存储阵列', bank:'DDR5 存储体', cell:'DRAM 存储单元', ddr4:'DDR4 内存模组', ddr4dram:'DDR4 芯片封装', ddr4banks:'DDR4 存储阵列', ddr4array:'DDR4 存储体', ddr4cell:'DDR4 存储单元', ryzen:'Ryzen 9 9950X 处理器', ryzenio:'Ryzen I/O 裸片', corei9:'Core Ultra 9 285K 处理器', coreio:'Core Ultra I/O 模块', psu:'850W 模组化电源', psubronze:'750W 非模组电源', fan:'机箱风扇', cooler:'塔式处理器散热器', liquid:'一体式水冷', ssd:'SATA 固态硬盘', nvme:'NVMe 固态硬盘', card:'RTX 5090 显卡', die:'GB202 处理器架构', gpc:'图形处理簇 GPC', tpc:'纹理处理簇 TPC', sm:'流式多处理器 SM', rx9070:'Radeon RX 9070 XT 显卡', navi48:'Navi 48 架构', rxse:'着色器引擎', rxwgp:'工作组处理器 WGP', rxcu:'计算单元 CU', arcb580:'Arc B580 显卡', bmg:'BMG-G21 架构', xeslice:'渲染切片', xecore:'Xe 核心', xve:'Xe 向量引擎', legion:'联想拯救者 Legion 5', legionboard:'笔记本系统主板', legioncpu:'Ryzen 7 5800H', legioncore:'Zen 3 处理器核心', legiongpu:'RTX 3060 笔记本 GPU', legionsm:'Ampere SM', legionmemory:'DDR4 SO-DIMM 内存', legionpackage:'笔记本 DRAM 封装', legiondram:'笔记本 DRAM 裸片', legionbank:'笔记本 DRAM 存储体', legioncell:'笔记本 DRAM 存储单元', legionstorage:'笔记本 NVMe 存储', legioncooling:'笔记本散热', legionbattery:'笔记本电池', legiondisplay:'笔记本显示屏', macbook:'MacBook Pro 14 英寸', macboard:'MacBook 逻辑板', m1pro:'M1 Pro 芯片', maccpu:'M1 Pro CPU 集群', maccore:'M1 Pro CPU 核心', macgpu:'M1 Pro GPU', macgpucore:'M1 Pro GPU 核心', macmemory:'统一内存', macdram:'统一内存 DRAM 裸片', macbank:'统一内存存储体', maccell:'统一内存存储单元', macstorage:'MacBook 存储', maccooling:'MacBook 散热', macbattery:'MacBook 电池', macdisplay:'MacBook 显示屏',
};
export const branchZh: Record<string,string> = { Motherboard:'主板与处理器', Memory:'内存', 'Power supply':'电源', Cooling:'散热', Storage:'存储', GPU:'显卡', 'System board':'系统主板', Processor:'处理器', Graphics:'图形', Battery:'电池', Display:'显示屏', 'Logic board':'逻辑板', 'Unified memory':'统一内存', 'CPU':'处理器', 'SoC':'系统级芯片' };
export const phaseZh: Record<string,string> = { Assembled:'完整装配', Dissection:'分层拆解', Inventory:'零件清单' };

const words: [RegExp,string][] = [
  [/streaming multiprocessor/gi,'流式多处理器'], [/graphics processing cluster/gi,'图形处理簇'], [/texture processing cluster/gi,'纹理处理簇'], [/workgroup processor/gi,'工作组处理器'], [/compute unit/gi,'计算单元'], [/vector engine/gi,'向量引擎'], [/render slice/gi,'渲染切片'],
  [/graphics card/gi,'显卡'], [/graphics processor/gi,'图形处理器'], [/motherboard/gi,'主板'], [/logic board|system board/gi,'系统主板'], [/unified memory/gi,'统一内存'], [/memory controller/gi,'内存控制器'], [/memory module/gi,'内存模组'], [/memory chips|memory packages/gi,'内存封装'], [/memory bank/gi,'存储体'], [/storage cell|DRAM cell/gi,'DRAM 存储单元'], [/wordline/gi,'字线'], [/bitline/gi,'位线'], [/sense amplifier/gi,'感应放大器'],
  [/heat spreader/gi,'散热片'], [/heat pipes?/gi,'热管'], [/vapor chamber/gi,'均热板'], [/cold ?plate/gi,'接触底板'], [/fin banks?|fin stacks?/gi,'鳍片阵列'], [/heatsink|heat sink/gi,'散热器'], [/thermal pads?/gi,'导热垫'], [/thermal paste|thermal interface/gi,'导热界面'], [/fan shroud/gi,'风扇导风罩'], [/fan blades?/gi,'风扇叶片'], [/fans?/gi,'风扇'], [/radiator/gi,'水冷排'], [/pump/gi,'水泵'], [/coolant/gi,'冷却液'],
  [/power supply/gi,'电源'], [/voltage regulation|voltage regulator/gi,'供电调节'], [/power stages?/gi,'功率级'], [/capacitors?/gi,'电容'], [/inductors?|chokes?/gi,'电感'], [/transformer/gi,'变压器'], [/rectifier/gi,'整流器'], [/battery/gi,'电池'],
  [/front panel/gi,'前面板'], [/side panel/gi,'侧面板'], [/backplate/gi,'背板'], [/back cover|bottom cover/gi,'底盖'], [/dust filters?/gi,'防尘网'], [/drive cages?/gi,'硬盘支架'], [/brackets?/gi,'支架'], [/screws?/gi,'螺丝'], [/mounting/gi,'安装'], [/keyboard/gi,'键盘'], [/touchpad|trackpad/gi,'触控板'], [/hinges?/gi,'铰链'], [/display panel/gi,'显示面板'], [/display/gi,'显示屏'], [/speakers?/gi,'扬声器'], [/webcam/gi,'摄像头'], [/microphones?/gi,'麦克风'], [/antenna/gi,'天线'],
  [/printed circuit board/gi,'印制电路板'], [/circuit board/gi,'电路板'], [/connectors?/gi,'连接器'], [/contacts?/gi,'触点'], [/sockets?/gi,'插座'], [/slots?/gi,'插槽'], [/cables?/gi,'线缆'], [/cooling/gi,'散热'], [/register file/gi,'寄存器堆'], [/registers?/gi,'寄存器'], [/instruction cache/gi,'指令缓存'], [/data cache/gi,'数据缓存'], [/cache/gi,'缓存'], [/scheduler/gi,'调度器'], [/execution/gi,'执行'], [/decoder/gi,'译码器'], [/dispatch/gi,'分派'], [/load\/store/gi,'加载与存储'], [/load.store unit/gi,'加载存储单元'], [/texture units?/gi,'纹理单元'], [/tensor cores?/gi,'张量核心'], [/RT cores?/gi,'光线追踪核心'], [/CUDA cores?/gi,'CUDA 计算核心'], [/transistors?/gi,'晶体管'], [/die substrate/gi,'裸片基板'], [/substrate/gi,'基板'], [/packages?/gi,'封装'], [/silicon die/gi,'硅裸片'], [/die/gi,'裸片'], [/cores?/gi,'核心'], [/controllers?/gi,'控制器'], [/buffers?/gi,'缓冲区'], [/housing|chassis/gi,'外壳'], [/enclosure/gi,'外壳'],
];
export function nameZh(name: string): string {
  if (/[\u3400-\u9fff]/.test(name)) return name;
  return words.reduce((text,[pattern,replacement]) => text.replace(pattern,replacement), name);
}
export function scaleNameZh(id: LevelId, fallback: string): string { return levelZh[id] ?? nameZh(fallback); }
export function conceptNameZh(c: Concept): string { return c.open ? scaleNameZh(c.open,c.name) : nameZh(c.name); }

type Profile = [RegExp,string,string];
/** Authored Chinese reading summaries, not unverified sentence-by-sentence machine translations. */
const profiles: Profile[] = [
  [/graphicscard|^card$|^rx9070$|^arcb580$|graphics card/i,'这是一块完整的显卡：图形处理器、显存、供电与散热结构共同组成一个计算子系统。','执行图形及适合并行处理的计算任务，并把结果传递给系统或显示设备。'],
  [/^pc$|^legion$|^macbook$/i,'整台设备由计算、存储、供电、散热与输入输出等子系统协作组成。','为软件提供完整运行环境；可逐层进入内部组件，查看各部分如何连接。'],
  [/motherboard|logic board|system board/i,'主板通过插座、连接器与多层电路，把处理器、内存和外设组织在一起。','提供部件间的数据通道和供电连接。'],
  [/heat ?pipe|vapor chamber|cold.?plate|heat.?sink|fin bank|fin stack|heat spreader|thermal pad|thermal paste|thermal interface/i,'这是散热路径的一部分，位于发热元件与空气或冷却介质之间。','传递或分散热量，减小局部温升；具体材料、数量和尺寸请查阅下方原始规格。'],
  [/fan|impeller/i,'风扇由旋转叶片与支撑结构构成，在机身或散热器附近组织空气流动。','让空气经过需要换热的区域；风向与安装位置共同决定冷却路径。'],
  [/pump|radiator|coolant|liquid cooler|liquid cooling/i,'水冷结构把接触底板、循环管路和冷排连接成散热回路。','通过冷却介质搬运热量，再由冷排与空气交换热量。'],
  [/battery/i,'电池把电能储存在电化学系统中，和充电、保护及电源管理电路共同工作。','为便携设备提供脱离外部电源后的工作电力。'],
  [/transformer/i,'变压器通过磁耦合参与开关电源中的能量传递。','在相应电源结构中实现电压变换与电气隔离。'],
  [/rectif/i,'整流电路把交变电流转换成单方向的电流。','为后续电源转换与滤波提供合适的输入。'],
  [/power supply|psu|power unit/i,'电源是设备的能量入口和转换子系统，包含保护、转换、滤波等功能区域。','把输入电力转换为计算与外设所需的供电。'],
  [/vrm|voltage regul|power stage|pmic|power management/i,'供电调节电路位于电源与负载之间，使用多个器件协同控制输出。','为处理器、显存或其他负载提供合适且稳定的电压。'],
  [/capacitor/i,'电容通过电场储存电荷，可以出现在供电滤波电路或 DRAM 原理示意中。','在具体电路中承担平滑电压、耦合信号或保存电荷等角色；用途需结合所在层级理解。'],
  [/inductor|choke/i,'电感通过磁场储存能量，是开关稳压与滤波结构中的常见元件。','配合开关器件和电容调节电流、减小电源波动。'],
  [/sense amplif/i,'感应放大器检测位线上的微小电信号，是理解 DRAM 读取过程的关键部分。','把微弱的存储信号恢复为可供后续电路使用的逻辑电平。'],
  [/wordline/i,'字线连接一行存储单元的访问控制端。','在读写时选择相应存储行。'],
  [/bitline/i,'位线是存储单元与感应、读写电路之间的信号通路。','在读取与写入时传递和检测存储状态。'],
  [/transistor|access gate/i,'晶体管是可受电信号控制的器件，本视图用简化几何解释其电路角色。','按控制信号影响电流或连接状态；这里不是精确晶体管制造版图。'],
  [/dram cell|storage cell|capacitor cell|1t1c/i,'DRAM 存储单元的教学示意把控制访问与保存电荷的部分分开显示。','解释一个比特如何被访问和保存；不表示真实芯片的精确布局。'],
  [/dimm|memory module|fury beast|so-dimm/i,'内存模组把多个 DRAM 封装及相关电路安装在一块带边缘触点的板上。','向处理器提供高速工作存储；代际、容量和组织方式见原始规格。'],
  [/gddr|memory package|dram package|fbga/i,'存储封装保护内部裸片，并把芯片连接到外部电路板。','在相应显存或系统内存中保存工作数据。'],
  [/bank|row decoder|column decoder|mat array|memory array/i,'这里展示存储阵列中的分组与寻址结构，方块表示逻辑组织而非晶体管位置。','帮助理解数据如何按行、列及存储体被选择和访问。'],
  [/nand|flash|ssd|nvme|sata/i,'固态存储由控制与非易失性存储等部分组成，其功能与工作内存不同。','在断电后继续保存系统、应用与文件；接口和容量见原始规格。'],
  [/tensor|matrix/i,'矩阵或张量计算资源面向成组数据的特定运算方式。','为受支持的数据类型和算法提供计算资源；不代表所有任务都能获得相同加速。'],
  [/ray tracing|rt core|ray acceler/i,'光线追踪相关资源帮助处理光线与场景几何之间的计算。','为兼容的图形流程提供光线追踪计算支持。'],
  [/texture|sampler/i,'纹理采样资源是图形流水线的一部分，与纹理数据访问和采样有关。','把纹理资源中的数据提供给后续着色计算。'],
  [/scheduler|dispatch|issue/i,'调度与分派逻辑组织等待执行的工作。','把适合的工作分配给可用的执行资源。'],
  [/register/i,'寄存器是靠近计算资源的工作数据存储，通常与正在执行的任务紧密相关。','让计算过程快速访问当前需要的操作数与中间结果。'],
  [/cache|shared memory|scratchpad/i,'缓存或局部存储位于计算资源附近，用于缩短部分数据访问路径。','在具体层级中暂存可复用数据；容量、共享范围和用途见原始规格。'],
  [/instruction|decoder|branch predict|fetch/i,'这里展示处理器获取、解释或组织指令的功能区域。','把程序的指令流交给相应执行资源；方块图不表示真实物理布线。'],
  [/sm$|^gpc$|^tpc$|streaming multiprocessor|compute unit|workgroup|vector engine|xe.core|render slice|shader engine/i,'这是 GPU 中一个逻辑层级，包含更细分的计算、调度或存储资源。','展示并行计算资源的组织关系；不要把方块面积理解为精确芯片面积。'],
  [/processor|cpu|gpu|ryzen|core ultra|gb202|navi 48|m1 pro|bmg|cuda|alu|fpu/i,'处理器或执行资源按照指令和数据进行计算，图中可能展示封装或逻辑功能。','执行通用、图形或专用计算；应结合当前层级区分实体硬件与架构示意。'],
  [/display|lcd|oled|screen|backlight/i,'显示组件把电子图像呈现给使用者，由面板和支持结构等部分共同组成。','显示画面及交互信息；本模型不逐个模拟真实像素。'],
  [/speaker/i,'扬声器把电信号转换成机械运动与声波。','输出音频，声腔与安装位置也会影响声学表现。'],
  [/microphone|webcam|camera/i,'这是把外部声音或光学信息引入设备的输入组件。','把环境信息转化为电子系统可处理的信号。'],
  [/keyboard|touchpad|trackpad|keycap/i,'输入组件将按压、触摸等动作转化为电子输入。','让使用者与设备上的软件交互。'],
  [/antenna|wireless|wifi|wi-fi|bluetooth/i,'无线连接需要通信电路与天线等部分协作。','在设备与外部无线网络或外设之间交换信号。'],
  [/connector|socket|slot|contact|port|cable|header/i,'连接部件在组件之间建立机械或电气接口。','传输电力、数据或控制信号；接口形态与电气标准需要匹配。'],
  [/pcb|circuit board|substrate/i,'电路板或基板为电子器件提供支撑，并连接不同功能区域。','把封装或板上组件连接成可工作的电路系统。'],
  [/screw|bracket|mount|hinge|frame/i,'机械支撑与紧固结构维持组件之间的相对位置。','固定、承载或允许受控运动，不承担处理器运算功能。'],
  [/cover|chassis|shroud|housing|panel|glass|enclosure|backplate|filter/i,'外壳、盖板或保护结构围绕内部组件构成机械边界。','保护部件并参与安装、屏蔽或空气流动的组织。'],
];
const categoryIntro: Record<Category,[string,string]> = {
  Chassis:['这是设备的机械结构或保护组件，形态与安装位置用于展示装配关系。','为内部组件提供支撑、保护或空间组织。'], Cooling:['这是热管理系统中的组件，需结合发热元件与空气路径理解。','参与热量传递或空气组织，帮助设备控制温度。'], Board:['这是电路、连接或输入输出相关组件，作用需结合所在系统理解。','与相邻组件交换电力、数据、控制或外部输入输出信号。'], Power:['这是电力供应、转换或管理相关组件。','帮助设备获得和分配合适的工作电力。'], Memory:['这是工作存储系统中的组件或逻辑区域。','参与工作数据的保存、寻址、访问或传输。'], Storage:['这是长期存储系统中的组件或控制区域。','参与文件与系统数据的非易失性保存或访问。'], Compute:['这是计算系统中的硬件或逻辑功能区域。','参与指令执行、数据处理或资源组织。'], Graphics:['这是图形系统中的硬件或逻辑功能区域。','参与图形或并行计算流程，并与相关存储和控制资源协作。'],
};
export function chineseIntro(c: Concept): { description: string; purpose: string } {
  if (/[\u3400-\u9fff]/.test(c.description) && /[\u3400-\u9fff]/.test(c.purpose)) return { description: c.description, purpose: c.purpose };
  const preferred = /connector|socket|slot|header|cable|contact|port\b/i.test(c.name) ? profiles.find(([match]) => match.source.startsWith('connector')) : /screw|bracket|hinge|mount|frame/i.test(c.name) ? profiles.find(([match]) => match.source.startsWith('screw')) : undefined;
  const profile = preferred ?? profiles.find(([match]) => match.test(c.id) || match.test(c.name));
  const [description,purpose] = profile ? [profile[1],profile[2]] : categoryIntro[c.category];
  return { description, purpose };
}
export function accuracyZh(c: Concept): string {
  if (/[\u3400-\u9fff]/.test(c.physicalAccuracy)) return c.physicalAccuracy;
  return c.representationType === 'logical' ? '逻辑架构教学示意。方块的大小、位置和连线用于解释功能关系，不是精确的晶体管布局或芯片制造版图。' : '硬件结构教学示意。外形、安装位置与元件数量可能经过简化，不是完整物料清单、精确 PCB 布局或维修图纸；型号参数请结合原始规格和引用来源核对。';
}
export function quantityZh(value: string): string {
  if (/[\u3400-\u9fff]/.test(value)) return value;
  return value.replace(/reference specimen/gi,'个参考样本').replace(/illustrated functional group/gi,'组功能示意').replace(/illustrative/gi,'示意').replace(/per /gi,'每个 ').replace(/installed/gi,'已安装').replace(/total/gi,'总计').replace(/units?/gi,'个单元').replace(/groups?/gi,'组').replace(/modules?/gi,'个模组').replace(/chips?/gi,'个芯片').replace(/packages?/gi,'个封装').replace(/instances?/gi,'个实例');
}
const labels: Record<string,string> = { Architecture:'架构', GPU:'GPU 型号', Memory:'内存 / 显存', 'Graphics power':'显卡功率', 'Total board power':'整卡功率', 'Exterior reference':'外观参考', Dimensions:'尺寸', Interface:'接口', Capacity:'容量', Model:'参考型号', Processor:'处理器', Graphics:'图形', Storage:'存储', Display:'显示屏', Battery:'电池', Format:'形态', Output:'输出', Efficiency:'效率', Cabling:'线缆方式', Cores:'核心 / 线程', Clocks:'频率', Cache:'缓存', Process:'制程', Socket:'插座', Power:'功率 / 供电', 'Default TDP':'默认 TDP', Type:'类型', Function:'功能', Role:'作用', Reference:'参考', Count:'数量', Organization:'组织方式', Voltage:'电压', Speed:'速度', Width:'宽度', Height:'高度', Length:'长度', Material:'材料', Location:'位置', 'Data rate':'数据速率', 'Bus width':'总线宽度', 'Memory type':'内存类型', 'Memory capacity':'内存容量', Frequency:'频率', Resolution:'分辨率', 'Native resolution':'原生分辨率', 'Refresh rate':'刷新率', Generation:'代际', Standard:'标准', Technology:'技术', 'Reference model':'参考型号', 'Board size':'电路板尺寸', Channels:'通道', Banks:'存储体', Rows:'行数', Columns:'列数', 'Addressing':'寻址', 'Installed':'安装情况', Cooling:'散热', Purpose:'用途', 'Learning role':'学习作用', 'Accuracy':'精度范围', 'Scope':'示意范围' };
export function specLabelZh(key:string) { return labels[key] ?? (/[\u3400-\u9fff]/.test(key) ? key : nameZh(key)); }
export const comparisonGroupZh: Record<string,string> = { gpu:'显卡', psu:'电源', cpu:'处理器', memory:'内存', notebook:'笔记本电脑' };
