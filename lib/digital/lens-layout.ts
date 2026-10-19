import type { Definition, DigitalPart } from './catalogue.ts';
import {
  cameraLensZ,
  lensMountY,
  opticalCentre,
  opticalVertices,
  paraxialPrescription,
} from './lens-prescription.ts';

export function refineOpticalLens(definitions: Definition[]) {
  const lens = definitions.find((d) => d.id === 'cameralens')!;
  lens.name = '100 mm 双高斯教学镜头';
  lens.summary = 'MIT 开源光学处方 · 六片四组 · 机械结构剖视';
  lens.source = 'optilandprescription';
  lens.camera = { direction: [1.1, 0.8, 1.1], padding: 1.06 };
  lens.specs = {
    光学参考: 'Optiland DoubleGauss（MIT）',
    设计焦距: '约 100 mm',
    '样例像方 F 数': 'f/5',
    光学结构: '6 片 / 4 组，含两组胶合双片',
    近轴后焦距: `${paraxialPrescription().backFocus.toFixed(3)} mm`,
    机械结构: '原创教学剖视，不对应商业镜头的维修结构',
    玻璃数据: 'SCHOTT / refractiveindex.info（CC0）',
  };
  const edit = (id: string, patch: Partial<DigitalPart>) =>
    Object.assign(
      lens.parts.find((p) => p.id === id)!,
      patch,
      { sources: ['optilandprescription'] },
    );
  const add = (
    id: string,
    name: string,
    size: DigitalPart['size'],
    pos: DigitalPart['pos'],
    delta: DigitalPart['delta'],
    description: string,
    category: DigitalPart['category'] = 'Chassis',
  ) =>
    lens.parts.push({
      id,
      name,
      size,
      pos,
      delta,
      description,
      purpose: description,
      category,
      color: '#65716e',
      shape: 'ring',
      sources: ['optilandprescription'],
    });
  edit('barrel', {
    name: '剖视外镜筒与调焦刻度',
    size: [68, 88, 68],
    pos: [0, 0, 0],
    delta: [-85, 0, 0],
    description:
      '独立设计的镜筒保留四分之一观察剖面，呈现同轴镜组和传动机构；真实成品不会保留这个开口。',
  });
  edit('frontglass', {
    name: '第 1 片 · 前部正透镜',
    size: [51, 11, 51],
    pos: [0, opticalCentre - 4.375, 0],
    delta: [0, 48, 0],
    description:
      'N-SSK2 玻璃，前后球面半径 56.20238 / 152.28580 mm，中心厚 8.75 mm。按开源处方生成弯曲实心透镜。',
  });
  edit('focusglass', {
    name: '第 2 / 3 片 · 前胶合双片',
    size: [44, 31, 44],
    pos: [0, opticalCentre - 17.4, 0],
    delta: [45, 28, 0],
    description:
      'N-SK2 与 F5 两片共用平面胶合界面，分别为 12.5 mm 与 3.8 mm 中心厚。拆解保留胶合关系，不能当作两片带空气间隔的镜片。',
  });
  add(
    'innerglass',
    '第 4 / 5 片 · 后胶合双片',
    [42, 25, 42],
    [0, opticalCentre - 63.067402, 0],
    [46, -25, 0],
    'F5 与 N-SK16 的胶合双片，前表面为负半径球面，中间平面胶合；厚度、间距保留处方数值。',
    'Board',
  );
  edit('rearglass', {
    name: '第 6 片 · 后部正透镜',
    size: [44, 9, 44],
    pos: [0, opticalCentre - 74.467402, 0],
    delta: [0, -45, 0],
    description:
      'N-SK16 玻璃，前后球面半径 177.41176 / -79.41143 mm，中心厚 7 mm。与前方镜组共同形成像平面。',
  });
  edit('iris', {
    name: '九叶光圈与枢轴',
    size: [52, 2, 52],
    pos: [0, opticalCentre - opticalVertices[5], 0],
    delta: [-48, -15, 0],
    description:
      '光阑位于处方指定的轴向位置；开口半径按近轴入瞳比例计算。九叶机械机构是原创可视设计，并非特定商品镜头叶片数量。',
  });
  edit('focusmotor', {
    name: '调焦电机与丝杠机构',
    size: [6, 26, 13],
    pos: [30.5, 0, 0],
    delta: [50, 0, 0],
    description:
      '镜筒侧方电机与丝杠表达调焦驱动，避开玻璃通光区；其机械尺寸与传动比属于原创教学设计。',
  });
  edit('mount', {
    name: 'E 口适配卡口与电气触点',
    size: [61, 5, 61],
    pos: [0, lensMountY, 0],
    delta: [0, -65, 0],
    description:
      '卡口适配段把开放光学样例的像平面与 18 mm 法兰距连接。金属卡爪、紧固孔与触点分别建模，不冒充 Sony 原厂镜头。',
  });
  add(
    'frontcell',
    '前透镜座与压圈',
    [56, 12, 56],
    [0, 33.5, 0],
    [-42, 42, -35],
    '带环形台阶、压圈与紧固件的透镜座，围绕前透镜边缘固定，不封住通光面。',
  );
  add(
    'midcell',
    '前胶合镜组固定筒',
    [49, 32, 49],
    [0, 14.5, 0],
    [-45, 24, -35],
    '薄壁固定筒包围前胶合镜组，内径避开曲面镜片，外缘保留安装台阶。',
  );
  add(
    'rearcell',
    '后胶合镜组固定筒',
    [47, 23, 47],
    [0, -19.43, 0],
    [-45, -24, -35],
    '后镜组固定筒与前筒沿共同光轴装配，机械壳体和玻璃可以独立查看。',
  );
  add(
    'endcell',
    '后透镜座与压圈',
    [49, 9, 49],
    [0, -35.48, 0],
    [-42, -42, -35],
    '后透镜的固定座、压圈和代表性紧固件，保留贯通的有效内孔。',
  );
  add(
    'spacers',
    '消光隔圈与轴向间隔筒',
    [55, 12, 55],
    [0, 4.5, 0],
    [40, 0, -40],
    '中空隔圈维持机械间隔，黑化内壁抑制旁路反射；不改变开源处方中的空气间隔。',
  );
  add(
    'helicoid',
    '调焦螺旋套筒',
    [59, 25, 59],
    [0, 0, 0],
    [82, 0, 0],
    '带螺旋牙形的剖视套筒把旋转转换为轴向机械位移，螺旋套筒位于光学通光区之外。',
  );
  add(
    'irisdrive',
    '光圈驱动环与连杆销',
    [57, 3, 57],
    [0, -5.1, 0],
    [42, -12, 40],
    '驱动环的枢轴销与叶片支点分开呈现，外缘局部齿形表达驱动耦合。',
  );
  const adapterHeight = Math.abs(lensMountY) - 44;
  add(
    'adapter',
    '后部适配筒',
    [61, adapterHeight, 61],
    [0, (-44 + lensMountY) / 2, 0],
    [-52, -45, 0],
    '额外的中空适配段连接长后焦距光学样例与短法兰距机身；长度由处方像面与卡口位置计算。',
  );
  add(
    'filterring',
    '前端滤镜螺纹环',
    [67, 5, 67],
    [0, 46.5, 0],
    [0, 62, 0],
    '前端螺纹与透镜压圈分开，保留可见的螺纹层和完整通光开口。',
  );
  add(
    'flex',
    '镜头控制柔性线路',
    [3, 46, 4],
    [-29, 0, -4],
    [-52, 0, 40],
    '柔性线路沿镜筒边缘连接驱动区和卡口端，避免穿过镜片与光圈开口。',
    'Board',
  );
  add(
    'seal',
    '卡口密封圈',
    [59, 1.2, 59],
    [0, lensMountY + 3.5, 0],
    [0, -58, 20],
    '独立的柔性密封圈位于卡口接合处，与金属卡口分开。',
  );
  add(
    'fasteners',
    '镜筒安装螺钉',
    [58, 1, 58],
    [0, -40, 0],
    [45, -45, 40],
    '六个代表性紧固点沿镜筒外围组织，用于展示总成装配关系，不代表某款镜头的完整螺钉表。',
  );
  const camera = definitions.find((d) => d.id === 'camera')!;
  Object.assign(
    camera.parts.find((p) => p.id === 'lens')!,
    {
      name: '100 mm 双高斯教学镜头',
      pos: [-8, 0, cameraLensZ],
      size: [68, 130, 68],
      sources: ['optilandprescription'],
    },
  );
  // Sensitive surface is +2.81 mm from the sensor assembly origin.
  camera.parts.find((p) => p.id === 'sensor')!.pos = [-8, 0, 6.69];
  camera.parts.find((p) => p.id === 'shutter')!.pos = [-8, 0, 13];
  camera.specs!['镜头说明'] =
    '独立设计的 100 mm 双高斯教学镜头；光学处方来自 Optiland（MIT），非 Sony 商业镜头';
}
