import type { LevelId } from './levels.ts';

export type LessonStep = {
  id: string;
  level: LevelId;
  title: string;
  intro: string;
  observe: string;
  minimumOpen: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Lesson = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tag: string;
  color: string;
  steps: LessonStep[];
};

/** Original teaching sequences. Hardware facts remain linked to the sourced catalogue. */
export const lessons: Lesson[] = [
  {
    id: 'inside', number: '01', title: '一台电脑的协作', subtitle: '从机箱到主板，建立你的硬件地图。', tag: '入门 · 整机结构', color: 'orange',
    steps: [
      { id: 'inside-case', level: 'pc', title: '先打开这台机器', intro: '整机并不是一个黑盒。先把外壳与内部组件分开，观察不同部件如何占据空间。', observe: '将下方拆解滑块拖到 50% 以上，观察外壳如何让出内部空间。', minimumOpen: 50, question: '机箱在这套系统中的主要作用是什么？', options: ['执行程序指令', '固定、保护部件并组织空间', '长期保存文件'], answer: 1, explanation: '机箱提供机械结构和安装空间。执行指令由处理器负责，长期保存文件则由存储设备负责。' },
      { id: 'inside-board', level: 'motherboard', title: '找到连接的中心', intro: '主板把原本独立的部件连成系统。注意处理器插座、内存插槽和扩展接口在板上的分布。', observe: '将拆解进度拖到 50% 以上，旋转视角寻找插座与插槽。', minimumOpen: 50, question: '为什么主板上有不同形状的插槽与接口？', options: ['它们连接不同类型的部件', '它们都只能安装内存', '它们只是装饰'], answer: 0, explanation: '不同部件需要不同的机械与电气连接。插槽的位置与形状帮助表达这些连接关系，不能随意互换。' },
      { id: 'inside-storage', level: 'nvme', title: '文件住在哪里', intro: '从主板继续看向 NVMe 固态硬盘。把它展开，区分电路板、控制器与存储封装。', observe: '拖到 100% 零件清单，点选一个部件阅读原始资料卡。', minimumOpen: 100, question: '断电后仍需保存的照片，应该存在哪里？', options: ['风扇', '处理器缓存', 'SSD 等非易失性存储设备'], answer: 2, explanation: 'SSD 用来长期保存数据。缓存与常规 DRAM 用于工作中的快速访问，不承担断电后的文件保存。' },
    ],
  },
  {
    id: 'graphics', number: '02', title: '像素背后的工厂', subtitle: '剥开显卡外壳，走进并行计算。', tag: '进阶 · GPU 架构', color: 'green',
    steps: [
      { id: 'graphics-card', level: 'card', title: '显卡不只是一个芯片', intro: '从 RTX 5090 的完整显卡开始。外壳、风扇、散热组件与电路板共同支持内部处理器工作。', observe: '将显卡拆到 50% 以上，观察散热组件与电路板的关系。', minimumOpen: 50, question: '显卡上的风扇和散热器主要解决什么问题？', options: ['增加文件容量', '把芯片产生的热量带走', '代替 GPU 执行计算'], answer: 1, explanation: '运算会产生热量。散热组件帮助热量从芯片传出，风扇帮助空气流动；它们并不代替芯片计算。' },
      { id: 'graphics-die', level: 'die', title: '从硬件切换到架构', intro: '现在看到的是 GPU 逻辑架构。图中的区域表达功能组织，不再是外壳尺寸或真实晶体管版图。', observe: '观察重复排列的计算区域，区分架构示意与物理装配。', minimumOpen: 0, question: '这里的方块图应该如何理解？', options: ['逻辑功能与层级关系', '精确的晶体管制造版图', '显卡外壳的切割图'], answer: 0, explanation: '逻辑图帮助理解功能与组织方式，不能据此推断晶体管的精确物理位置。可继续查看每块区域的资料来源。' },
      { id: 'graphics-sm', level: 'sm', title: '走进一个计算单元', intro: '进入流式多处理器 SM。把它理解为并行计算工厂中的一个工作单元，观察内部不同资源的分工。', observe: '点选图中不同资源，阅读它们的用途，再完成下面的问题。', minimumOpen: 0, question: 'GPU 中重复的计算单元最适合说明哪种思路？', options: ['用一个单元保存所有文件', '用风扇决定执行顺序', '把大量工作分配给多个单元并行处理'], answer: 2, explanation: '大量重复的计算资源支持并行工作。具体任务如何映射、执行效率如何，仍取决于算法和硬件资源。' },
    ],
  },
  {
    id: 'memory', number: '03', title: '追踪一个比特', subtitle: '从内存条出发，寻找数据的最小栖身处。', tag: '进阶 · 内存层级', color: 'violet',
    steps: [
      { id: 'memory-module', level: 'dimm', title: '内存条上的小世界', intro: '先观察 DDR5 内存模组。长条形电路板上安装着多个封装，边缘触点连接主板插槽。', observe: '将模组拆到 50% 以上，分清散热片、电路板和芯片封装。', minimumOpen: 50, question: '整条内存模组与单个 DRAM 封装是什么关系？', options: ['它们是完全相同的东西', '模组可以承载多个 DRAM 封装', '封装就是主板插槽'], answer: 1, explanation: '内存模组是板级组件，DRAM 封装安装在模组上。区分这两个尺度，才能继续理解内部结构。' },
      { id: 'memory-package', level: 'dram', title: '打开封装', intro: '封装保护内部芯片并提供连接。现在把黑色外观与内部的芯片、基板等层次分开观察。', observe: '拖到 100% 零件清单，检查封装内部各层。', minimumOpen: 100, question: '芯片封装的意义是什么？', options: ['保护芯片并提供外部连接', '替代所有存储单元', '让电脑无需电源'], answer: 0, explanation: '封装把内部芯片连接到外部电路，并提供保护。封装本身不等于存储阵列，也不能替代供电。' },
      { id: 'memory-cell', level: 'cell', title: '一个比特的栖身处', intro: '最后来到 DRAM 存储单元的逻辑示意。观察晶体管与电容，以及读取、写入所需的连接。', observe: '点选电容和晶体管，结合资料卡理解存储单元。', minimumOpen: 0, question: '这里为什么要区分“电容”和“晶体管”？', options: ['它们都是机箱紧固件', '它们都负责散热', '它们在保存电荷与控制访问中分工不同'], answer: 2, explanation: '典型 DRAM 单元用电容保存电荷，用晶体管控制访问。这里展示的是原理示意，不能据此推断真实晶体管布局。' },
    ],
  },
];

export type LearningProgress = string[];
export const progressKey = 'zln-lab-progress-v1';
const validIds = new Set(lessons.flatMap((lesson) => lesson.steps.map((step) => step.id)));

export function sanitizeProgress(value: unknown): LearningProgress {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
    : [];
}

export function readProgress(): LearningProgress {
  try { return sanitizeProgress(JSON.parse(localStorage.getItem(progressKey) ?? '[]')); }
  catch { return []; }
}

export function saveProgress(progress: LearningProgress): boolean {
  try { localStorage.setItem(progressKey, JSON.stringify(sanitizeProgress(progress))); return true; }
  catch { return false; }
}

export function resumeStep(lesson: Lesson, progress: LearningProgress): number {
  const index = lesson.steps.findIndex((step) => !progress.includes(step.id));
  return index === -1 ? 0 : index;
}
