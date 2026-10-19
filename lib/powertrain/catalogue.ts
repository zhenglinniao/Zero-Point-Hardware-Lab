import type {
  Definition,
  DigitalLevel,
  DigitalPart,
} from '../digital/catalogue.ts';
import type { Category } from '../concept.ts';
import type { Vec3 } from '../layout.ts';
import {
  GX,
  leafMagnetBars,
  leafCoils,
  gxCoverBolts,
  gxPushrodBottomY,
  gxPushrodTopY,
} from './dimensions.ts';

export const powertrainAccuracy =
  '公开资料约束的程序化参考重建。GX160 的缸径、行程、活塞/销/曲柄销及气门尺寸和 LEAF 的铁芯包络、48 槽/8 极来自所列原始资料。铸件曲面、端盖、槽形、磁钢截面、绕组端部、管路和紧固件尺寸为重建；不等同原厂 CAD、完整生产 BOM 或维修模型。铜线以可辨识的线束分组表达，不声称复现原厂逐股走线。';
const steel = '#8c9aa4',
  dark = '#303a40',
  copper = '#bd783d',
  alloy = '#829096';
function p(
  id: string,
  name: string,
  category: Category,
  pos: Vec3,
  delta: Vec3,
  description: string,
  open?: DigitalLevel,
  color = steel,
  size: Vec3 = [10, 10, 10],
): DigitalPart {
  return {
    id,
    name,
    category,
    shape: 'box',
    pos,
    delta,
    size,
    color,
    description,
    purpose: description,
    open,
    quantity: open ? '1 套可继续拆解的总成' : '1 件独立可选零件',
  };
}
function def(
  id: DigitalLevel,
  parent: DigitalLevel | null,
  name: string,
  summary: string,
  parts: DigitalPart[],
  unit = 25,
): Definition {
  return {
    id,
    parent,
    name,
    summary,
    parts,
    unit,
    source: id.startsWith('ev') ? 'leafdimensions' : 'hondaut2',
    accuracy: powertrainAccuracy,
    camera: { direction: [1.2, 0.8, 1.5], padding: 1.14 },
  };
}
const ring = (id: string, name: string, y: number, d: number, color = steel) =>
  p(
    id,
    name,
    'Mechanical',
    [0, y, 0],
    [d, 30, 0],
    '嵌入活塞环槽；开口环保留端隙，三组开口错开，避免与活塞销孔方向重合。',
    undefined,
    color,
  );
const enginePiston = def(
  'engine-piston',
  'engine-crank',
  '活塞、活塞环与销',
  '67.99 mm 活塞 · 三道环槽与组合油环',
  [
    p(
      'piston',
      '铝合金活塞',
      'Mechanical',
      [0, 12, 0],
      [0, 0, 0],
      '裙部外径采用 67.990 mm，缸径 68 mm；空心裙部、销座与三道环槽实际建出。冠部与裙高为参考重建。',
    ),
    ring('top-ring', '第一道压缩环', 27.8, -55),
    ring('second-ring', '第二道压缩环', 24.8, 55, dark),
    ring('oil-upper', '油环上刮片', 21.9, -72),
    ring('oil-expander', '油环波形衬簧', 21, 75, copper),
    ring('oil-lower', '油环下刮片', 20.1, 90),
    p(
      'pin',
      '空心活塞销',
      'Mechanical',
      [0, 0, 0],
      [0, 0, 75],
      '外径 17.997 mm，位于本田 UT2 服务尺寸范围内；空心销沿曲轴方向连接连杆小头。',
    ),
    p(
      'clip-front',
      '前侧销挡圈',
      'Mechanical',
      [0, 0, 28],
      [0, 0, 90],
      '开口弹性挡圈嵌入销孔端部的槽，限制活塞销轴向移动。',
    ),
    p(
      'clip-rear',
      '后侧销挡圈',
      'Mechanical',
      [0, 0, -28],
      [0, 0, -90],
      '与另一侧挡圈共同限制销的轴向窜动。',
    ),
  ],
  10,
);
const engineCrank = def(
  'engine-crank',
  'engine',
  '曲柄连杆与活塞',
  '曲轴 → 曲柄销 → 连杆 → 空心活塞',
  [
    p(
      'crankshaft',
      '曲轴与平衡重',
      'Mechanical',
      [0, 0, 0],
      [0, 0, -150],
      '主轴、偏置 22.5 mm 的曲柄销与两块平衡重共轴装配，2 倍曲柄半径得到 45 mm 行程。',
    ),
    p(
      'rod',
      '连杆主体',
      'Mechanical',
      [0, 57.5, 0],
      [65, 0, 0],
      '大头内径采用 30.026 mm，小头套在活塞销外；杆身为有凹槽的工字截面。中心距 70 mm 是重建值。',
    ),
    p(
      'cap',
      '连杆大头盖',
      'Mechanical',
      [0, 22.5, 0],
      [0, -75, 0],
      '与连杆主体形成分体大头；沿大头分割面移开，可看到曲柄销配合。',
    ),
    p(
      'dipper',
      '飞溅润滑拨油勺',
      'Mechanical',
      [10, 8, 0],
      [35, -65, 0],
      '固定在连杆盖附近，随曲轴运动把曲轴箱润滑油拨向内部摩擦副。',
    ),
    ...[-1, 1].map((s, i) =>
      p(
        `rod-bolt-${i + 1}`,
        `连杆盖螺栓 ${i + 1}`,
        'Mechanical',
        [s * 20, 17, 0],
        [s * 35, -75, 0],
        '独立六角螺栓连接连杆盖；螺纹只显示可辨识的螺旋轮廓。',
      ),
    ),
    p(
      'piston-unit',
      '活塞环销总成',
      'Mechanical',
      [0, GX.pinY, 0],
      [0, 125, 0],
      '继续进入活塞、两道压缩环、组合油环、空心销和两侧挡圈。',
      'engine-piston',
    ),
  ],
  20,
);
const blockParts: DigitalPart[] = [
  p(
    'case',
    '空腔曲轴箱铸件',
    'Chassis',
    [0, 0, 0],
    [-140, 0, 0],
    '带贯通轴承孔的中空铸件，开口曲轴室为平衡重、曲轴和连杆留下空间；壁厚为重建。',
    undefined,
    alloy,
  ),
  p(
    'barrel',
    '散热缸体',
    'Cooling',
    [0, (55 + GX.deckY) / 2, 0],
    [-125, 80, 0],
    '68 mm 缸孔周围有独立散热鳍片和推杆通道；鳍片不是填满气缸的实心叠块。',
    undefined,
    alloy,
  ),
  p(
    'liner',
    '铸铁缸套',
    'Mechanical',
    [0, (55 + GX.deckY) / 2, 0],
    [0, 145, 0],
    '内径 68.000 mm，保留活塞行程；外径与长度为装配重建。',
    undefined,
    '#59616a',
  ),
  p(
    'cover',
    '曲轴箱侧盖',
    'Chassis',
    [0, 0, 51],
    [0, 0, 160],
    '独立侧盖带轴承座、加强筋和密封面，沿轴向退出。',
    undefined,
    alloy,
  ),
  p(
    'gasket',
    '侧盖密封垫',
    'Mechanical',
    [0, 0, 45.6],
    [0, 0, 135],
    '薄片密封垫沿曲轴箱开口周边成形，中央区域留空。',
    undefined,
    '#5c6456',
  ),
  p(
    'seal-front',
    '输出轴油封',
    'Mechanical',
    [0, 0, 60],
    [0, 0, 175],
    '采用装配图中的 25 × 41 × 6 mm 油封包络，孔口与轴同心。',
    undefined,
    dark,
  ),
  p(
    'seal-rear',
    '飞轮侧油封',
    'Mechanical',
    [0, 0, -51],
    [0, 0, -130],
    '飞轮侧密封唇围绕轴颈，阻止润滑油沿轴向漏出。',
    undefined,
    dark,
  ),
  p(
    'dipstick',
    '机油尺与加油塞',
    'Fluid',
    [53, -18, 33],
    [70, 0, 45],
    '机油尺插入曲轴箱下部，外露拧盖与细长探杆分开呈现。',
    undefined,
    '#d4ad48',
  ),
  p(
    'drain',
    '放油螺塞与垫圈',
    'Fluid',
    [-44, -45, 48],
    [-65, -25, 55],
    '放油螺塞位于曲轴箱下部；垫圈和六角头可辨识。',
  ),
];
for (const z of [-35, 35])
  for (const x of [-49, 49])
    blockParts.push(
      p(
        `foot-${x}-${z}`,
        '机体安装脚',
        'Chassis',
        [x, -60, z],
        [x, -50, z],
        '带通孔的安装耳把机体载荷传到支架；孔位为参考布局。',
        undefined,
        alloy,
      ),
    );
for (let i = 0; i < 6; i++) {
  const [x, y] = gxCoverBolts[i];
  blockParts.push(
    p(
      `cover-bolt-${i + 1}`,
      `侧盖螺栓 ${i + 1}`,
      'Mechanical',
      [x, y, 56],
      [0, 0, 180 + i * 5],
      '独立侧盖紧固件沿周边布置；孔径和孔数采用本教学铸件布局。',
    ),
  );
}
const engineBlock = def(
  'engine-block',
  'engine',
  '缸体、曲轴箱与密封',
  '真实空腔 · 缸孔 · 轴承孔 · 散热鳍片',
  blockParts,
);
const headParts: DigitalPart[] = [
  p(
    'head',
    '带气门孔与推杆孔的气缸盖',
    'Chassis',
    [0, 0, 0],
    [-120, 35, 0],
    '缸盖在气缸上方封闭燃烧室，分别建立气门导管孔、推杆孔与螺栓孔；表面曲率为参考重建。',
    undefined,
    alloy,
  ),
  p(
    'gasket',
    '缸垫',
    'Mechanical',
    [0, 0.5, 0],
    [0, -25, 0],
    '薄缸垫具有气缸开口与独立螺栓孔，安装在缸体与缸盖之间。',
    undefined,
    '#6c6c59',
  ),
  p(
    'cover',
    '摇臂室盖',
    'Chassis',
    [-15, 77.5, 0],
    [0, 90, 0],
    '薄壁罩壳覆盖摇臂与气门弹簧，内侧为空腔。',
    undefined,
    '#b6b9b6',
  ),
  p(
    'cover-gasket',
    '摇臂盖密封圈',
    'Mechanical',
    [-15, 64, 0],
    [0, 75, 0],
    '闭合密封圈沿摇臂罩边缘布置。',
    undefined,
    '#393e39',
  ),
  p(
    'plug',
    '火花塞',
    'Power',
    [43, 8, 0],
    [70, 25, 0],
    '金属螺纹壳、陶瓷绝缘体、中心电极和接地电极分别建出；位置为示意重建。',
    undefined,
    '#deddd0',
  ),
];
for (const [i, z] of [-14, 14].entries()) {
  const name = i ? '排气' : '进气';
  headParts.push(
    p(
      `valve-${i}`,
      `${name}门`,
      'Mechanical',
      [-8, 15.3, z],
      [0, -58, z * 2],
      `${name}门盘径 ${i ? GX.exhaustDiameter : GX.intakeDiameter} mm；阀杆采用 UT2 服务范围内的尺寸，盘、杆与端部为同一零件。`,
    ),
    p(
      `guide-${i}`,
      `${name}门导管`,
      'Mechanical',
      [-8, 28, z],
      [45, 35, z * 2],
      '内孔 5.506 mm，与对应阀杆保持正间隙；导管外径与长度为重建。',
      undefined,
      '#a69a6d',
    ),
    p(
      `spring-${i}`,
      `${name}门弹簧`,
      'Mechanical',
      [-8, 48, z],
      [55, 60, z * 3],
      '真实螺旋线弹簧围绕阀杆；30.5 mm 是手册自由长度，当前压缩安装长度采用 22 mm 重建。',
    ),
    p(
      `retainer-${i}`,
      `${name}门弹簧座`,
      'Mechanical',
      [-8, 60, z],
      [0, 90, z * 3],
      '带中心开口的弹簧上座承受弹簧力并限制轴向位置。',
    ),
    p(
      `rocker-${i}`,
      `${name}门摇臂`,
      'Mechanical',
      [-26, GX.rockerY, z],
      [-55, 95, z * 3],
      '桥形摇臂跨接推杆与阀杆，支点孔、接触垫与调节螺钉可见。',
    ),
    p(
      `pivot-${i}`,
      `${name}门摇臂支点`,
      'Mechanical',
      [-26, 58, z],
      [-60, 75, z * 3],
      '独立支点螺柱与锁紧螺母连接摇臂和缸盖。',
    ),
  );
}
for (const x of [-39, 39])
  for (const z of [-32, 32])
    headParts.push(
      p(
        `bolt-${x}-${z}`,
        '气缸盖螺栓',
        'Mechanical',
        [x, 42, z],
        [x, 110, z * 2],
        '独立长螺栓沿缸盖孔道固定缸体；位置与孔道共用坐标。',
      ),
    );
const engineHead = def(
  'engine-head',
  'engine',
  '气缸盖与 OHV 配气',
  '进排气门 · 导管 · 弹簧 · 摇臂 · 火花塞',
  headParts,
  15,
);
headParts.find((p) => p.id === 'plug')!.rotation = [0, 0, -Math.PI / 2];
const timingParts: DigitalPart[] = [
  p(
    'crank-gear',
    '曲轴正时小齿轮',
    'Mechanical',
    [0, 0, 30],
    [0, 0, 110],
    '20 齿、模数 1.5 的教学重建齿形；与 40 齿凸轮齿轮保持四冲程 2:1 转速关系。',
  ),
  p(
    'camshaft',
    '凸轮轴与双凸轮',
    'Mechanical',
    [-45, 0, 0],
    [-110, 0, 0],
    '轴径采用 13.975 mm；进排气两个独立凸轮沿轴布置，轮廓为重建。',
  ),
  p(
    'cam-gear',
    '凸轮轴正时大齿轮',
    'Mechanical',
    [-45, 0, 30],
    [-65, 0, 120],
    '40 齿与曲轴 20 齿啮合，中心距 45 mm；这是满足运动关系的重建齿数，并非本田齿数实测。',
    undefined,
    '#b6ab83',
  ),
  p(
    'governor',
    '离心调速齿轮',
    'Mechanical',
    [35, -29, 32],
    [80, -60, 90],
    '齿轮上的两只飞锤和滑套用来解释转速反馈；齿形与尺寸为参考重建。',
    undefined,
    '#a99c75',
  ),
  p(
    'governor-arm',
    '调速轴与外部摆臂',
    'Mechanical',
    [50, 10, 0],
    [100, 20, 0],
    '摆臂连接曲轴箱内调速机构与外部节气门拉杆。',
  ),
];
for (const [i, z] of [-14, 14].entries())
  timingParts.push(
    p(
      `tappet-${i}`,
      `${i ? '排气' : '进气'}挺柱`,
      'Mechanical',
      [-45, 27, z],
      [-85, 30, z * 3],
      '底部圆盘接触凸轮，细长导向体在曲轴箱孔中滑动。',
    ),
    p(
      `pushrod-${i}`,
      `${i ? '排气' : '进气'}推杆`,
      'Mechanical',
      [-45, (gxPushrodBottomY + gxPushrodTopY) / 2, z],
      [-95, 70, z * 3],
      '球头推杆从挺柱延伸至摇臂，轴线与缸盖的推杆孔共享。',
    ),
  );
const engineTiming = def(
  'engine-timing',
  'engine',
  '正时、推杆与调速',
  '曲轴与凸轮 2:1 · 双挺柱 · 双推杆',
  timingParts,
  20,
);
const induction = def(
  'engine-induction',
  'engine',
  '供油、进气与排气',
  '油箱 → 化油器 → 进气门 → 排气消声器',
  [
    p(
      'tank',
      '燃油箱壳体',
      'Fluid',
      [0, 0, 0],
      [0, 90, 0],
      '焊接式燃油箱采用带壁厚的壳体，外形、焊缝、安装耳与加油口为 GX 系列照片参考重建。',
      undefined,
      '#d5d9d3',
    ),
    p(
      'cap',
      '油箱盖',
      'Fluid',
      [18, 31, 0],
      [0, 135, 0],
      '带防滑棱与通气结构的加油盖独立拆出。',
      undefined,
      '#a5a8a7',
    ),
    p(
      'fuel-line',
      '供油软管',
      'Fluid',
      [-45, -20, -10],
      [-45, 0, -60],
      '弯曲软管连接油箱出口与化油器，使用中空管截面表示。',
      undefined,
      dark,
    ),
    p(
      'carb',
      '化油器本体与浮子室',
      'Fluid',
      [-68, -52, 12],
      [-90, 0, 0],
      '喉管保留真实贯通气道；下部浮子室、进油接头与调节螺钉分别可见。',
      undefined,
      '#b3aaa0',
    ),
    p(
      'throttle',
      '节气门轴与蝶片',
      'Fluid',
      [-68, -52, 12],
      [0, 0, 65],
      '蝶片位于化油器喉管中，轴穿过本体侧孔；这里展示关闭附近的观察姿态。',
      undefined,
      '#b09c57',
    ),
    p(
      'filter',
      '空气滤芯',
      'Fluid',
      [-68, -52, 66],
      [0, 0, 110],
      '折叠滤纸围绕中空骨架成形，过滤后空气沿喉管进入缸盖。',
      undefined,
      '#c9bca0',
    ),
    p(
      'filter-cover',
      '空滤保护盖',
      'Chassis',
      [-68, -52, 93],
      [0, 0, 145],
      '带内部空腔和进气百叶的黑色罩盖，先移开即可看到折叠滤芯。',
      undefined,
      dark,
    ),
    p(
      'intake',
      '进气连接弯管',
      'Fluid',
      [-56, -67, -23],
      [-100, -30, -35],
      '中空气道把化油器接到缸盖进气口；长度和弯曲半径为参考重建。',
      undefined,
      alloy,
    ),
    p(
      'muffler',
      '排气消声器',
      'Fluid',
      [74, -43, 0],
      [110, 0, 0],
      '壳体、进气管与打孔隔板为独立几何；内部通道用于解释消声原理，不宣称原厂声学设计。',
      undefined,
      '#3a3d3c',
    ),
    p(
      'heatshield',
      '消声器防烫罩',
      'Cooling',
      [89, -43, 0],
      [155, 0, 0],
      '冲孔弧形防护罩与消声器之间保持空气间层。',
      undefined,
      '#676d70',
    ),
  ],
  20,
);
const starter = def(
  'engine-starter',
  'engine',
  '飞轮、冷却风扇与手拉启动',
  '磁电点火 · 飞轮惯性 · 回卷启动器',
  [
    p(
      'flywheel',
      '飞轮与磁体座',
      'Mechanical',
      [0, 0, 0],
      [0, 0, -100],
      '飞轮储存转动惯量，轮缘保留磁体槽和风扇安装凸台。',
      undefined,
      '#7f858b',
    ),
    p(
      'fan',
      '离心冷却风扇',
      'Cooling',
      [0, 0, -23],
      [0, 0, -145],
      '弧形叶片围绕轮毂分布，沿轴向进气并向缸体散热片送风。',
      undefined,
      '#d0d3c5',
    ),
    p(
      'magnet',
      '点火飞轮磁体',
      'Magnetic',
      [69, 0, 0],
      [100, 0, 0],
      '轮缘永磁体经过点火线圈，产生点火系统需要的磁通变化。',
      undefined,
      '#635d59',
    ),
    p(
      'coil',
      '点火线圈与铁芯',
      'Power',
      [91, 0, 0],
      [120, 35, 0],
      'U 形铁芯与绝缘线包分开建出，与飞轮轮缘保留间隙。',
      undefined,
      dark,
    ),
    p(
      'cup',
      '启动杯',
      'Mechanical',
      [0, 0, -32],
      [0, 0, -180],
      '带棘爪接合窗口的中空启动杯连接曲轴端。',
    ),
    p(
      'pulley',
      '拉绳卷盘',
      'Mechanical',
      [0, 0, -48],
      [0, 0, -215],
      '双边轮缘、绳槽与棘爪组成卷盘，中心不填成实心球。',
      undefined,
      '#494a42',
    ),
    p(
      'spring',
      '回卷平面涡卷弹簧',
      'Mechanical',
      [0, 0, -58],
      [0, 0, -245],
      '平面螺旋钢带为拉绳提供回卷力，圈间保持可见间距。',
    ),
    p(
      'rope',
      '拉绳与手柄',
      'Mechanical',
      [0, 0, -49],
      [-120, 50, -160],
      '绳子沿卷盘外缘绕行，外端连接有穿绳孔的握柄。',
      undefined,
      dark,
    ),
    p(
      'housing',
      '风罩与启动器外罩',
      'Cooling',
      [0, 0, -62],
      [0, 0, -290],
      '红色薄壁罩保留径向进气槽、中心通气孔和紧固耳，避免遮罩直接穿入风扇。',
      undefined,
      '#b94332',
    ),
    p(
      'nut',
      '飞轮轴端螺母',
      'Mechanical',
      [0, 0, -37],
      [0, 0, -195],
      '独立六角锁紧件固定启动杯和飞轮。',
    ),
  ],
  20,
);
const tilt = -GX.inclination;
const tilted = (part: DigitalPart) => {
  const [x, y, z] = part.pos;
  part.pos = [
    x * Math.cos(tilt) - y * Math.sin(tilt),
    x * Math.sin(tilt) + y * Math.cos(tilt),
    z,
  ];
  part.rotation = [0, 0, tilt];
  return part;
};
const engine = def(
  'engine',
  null,
  'Honda GX160 内燃机',
  'UT2 单缸四冲程 OHV · 风冷 · 68 × 45 mm',
  [
    tilted(
      p(
        'block',
        '缸体、曲轴箱与密封',
        'Chassis',
        [0, 0, 0],
        [-200, 0, 0],
        '进入中空机体、缸套、散热片、侧盖、油封与安装脚。',
        'engine-block',
      ),
    ),
    tilted(
      p(
        'crank',
        '曲柄连杆与活塞',
        'Mechanical',
        [0, 0, 0],
        [0, 0, 190],
        '进入曲轴、连杆、拨油勺，再拆活塞环、活塞销与挡圈。',
        'engine-crank',
      ),
    ),
    tilted(
      p(
        'head',
        '气缸盖与 OHV 配气',
        'Mechanical',
        [0, GX.deckY + GX.headGasket, 0],
        [60, 165, 0],
        '拆开摇臂盖，分别观察进排气门、导管、弹簧、摇臂和火花塞。',
        'engine-head',
      ),
    ),
    tilted(
      p(
        'timing',
        '正时、推杆与调速',
        'Mechanical',
        [0, 0, 0],
        [-175, 30, 130],
        '凸轮轴转速为曲轴的一半，推杆把挺柱运动传到缸盖摇臂。',
        'engine-timing',
      ),
    ),
    p(
      'induction',
      '供油、进气与排气',
      'Fluid',
      [-45, 178, 0],
      [0, 195, 0],
      '油箱、化油器、滤芯与消声器构成发动机外部可辨识的系统。',
      'engine-induction',
    ),
    p(
      'starter',
      '飞轮、冷却与手拉启动',
      'Mechanical',
      [0, 0, -84],
      [0, 0, -240],
      '飞轮、风扇、点火线圈、启动杯、卷盘与回卷弹簧分别展开。',
      'engine-starter',
    ),
  ],
  35,
);
engine.specs = {
  参考机型: 'Honda GX160 UT2 · 无减速器教学布局',
  排量: '163 cm³',
  '缸径 × 行程': '68 × 45 mm',
  结构: '单缸四冲程、25° 倾斜、OHV',
  尺寸依据: 'UT2 官方规格/服务表；缸套与曲轴共用毫米坐标',
  重建范围: '铸件曲面、管路、螺孔布局及连杆中心距等非公开尺寸',
};

const cylinderIds = new Set(['barrel', 'liner']);
const coverIds = new Set([
  'cover',
  'gasket',
  'seal-front',
  ...Array.from({ length: 6 }, (_, i) => 'cover-bolt-' + (i + 1)),
]);
const engineCylinder = def(
  'engine-cylinder',
  'engine',
  '气缸、缸套与散热',
  '一体铸件局部观察 · 铸入缸套 · 双推杆通道',
  engineBlock.parts.filter((p) => cylinderIds.has(p.id)),
  20,
);
const engineCover = def(
  'engine-cover',
  'engine',
  '曲轴箱侧盖与密封',
  '侧盖 · 密封垫 · 输出轴油封 · 六个紧固件',
  engineBlock.parts.filter((p) => coverIds.has(p.id)),
  20,
);
engineBlock.parts = engineBlock.parts.filter(
  (p) => !cylinderIds.has(p.id) && !coverIds.has(p.id),
);
for (const side of [-1, 1])
  engineBlock.parts.push(
    p(
      'bearing-' + side,
      (side > 0 ? '输出' : '飞轮') + '侧曲轴轴承',
      'Mechanical',
      [0, 0, side * 40],
      [0, 0, side * 110],
      '独立内外圈与滚珠支承曲轴；轴承外径和滚珠数为教学重建。',
    ),
  );
engine.parts.push(
  tilted(
    p(
      'cylinder',
      '气缸、缸套与散热',
      'Cooling',
      [0, 0, 0],
      [80, 170, 0],
      '同一机体铸件的上部观察入口；与曲轴箱同步移动，不表示气缸可以独立拆下。缸套为铸入结构，子层采用剖分观察。',
      'engine-cylinder',
    ),
  ),
  tilted(
    p(
      'cover',
      '曲轴箱侧盖与密封',
      'Chassis',
      [0, 0, 0],
      [0, 0, 180],
      '侧盖先沿输出轴退出，再移到侧边，为曲柄连杆让出轴向路径。',
      'engine-cover',
    ),
  ),
);
const rootPart = (id: string) => engine.parts.find((p) => p.id === id)!;
rootPart('head').delta = [
  Math.sin(GX.inclination) * 300,
  Math.cos(GX.inclination) * 300,
  0,
];
rootPart('head').motion = [8, 24];
rootPart('cylinder').motion = [62, 70];
rootPart('cylinder').delta = [...rootPart('block').delta];
rootPart('cover').path = [
  { at: 0, offset: [0, 0, 0] },
  { at: 8, offset: [0, 0, 0] },
  { at: 25, offset: [0, 0, 150] },
  { at: 40, offset: [200, 0, 150] },
  { at: 70, offset: [200, 0, 150] },
];
rootPart('crank').motion = [42, 62];
rootPart('crank').delta = [0, 0, 270];
rootPart('timing').motion = [40, 60];
rootPart('timing').delta = [-130, 0, 170];
rootPart('block').motion = [62, 70];
// A complete crank/rod/piston cannot slide sideways through an integral bore.
// Outer accessories leave first, then the cast body is hidden for inspection.
for (const id of ['block', 'cylinder', 'crank', 'timing']) {
  const part = rootPart(id);
  part.path = [
    { at: 0, offset: [0, 0, 0] },
    { at: 70, offset: [0, 0, 0] },
  ];
  if (id === 'block' || id === 'cylinder') part.sectionAt = 0.35;
}
engine.summary += ' · 外件拆卸后隐藏机体剖视，不将整套曲柄侧向穿过缸壁';

engineCylinder.summary = '剖分观察，不是把铸入缸套作为普通可卸件抽出';
for (const part of engineCylinder.parts) {
  part.path = [
    { at: 0, offset: [0, 0, 0] },
    { at: 70, offset: [0, 0, 0] },
  ];
  part.description +=
    ' 此件与机体保持固定，使用隐藏功能观察内孔；清单阶段仅作资料排版。';
}
for (const part of engineBlock.parts.filter((p) => p.id.startsWith('foot-'))) {
  part.delta = [...engineBlock.parts.find((p) => p.id === 'case')!.delta];
  part.description =
    '机体一体铸造的安装脚区域，与曲轴箱同步展开；并非独立可卸支脚。';
  const x = part.pos[0],
    y = -88;
  part.pos = [
    x * Math.cos(GX.inclination) - y * Math.sin(GX.inclination),
    x * Math.sin(GX.inclination) + y * Math.cos(GX.inclination),
    part.pos[2],
  ];
  part.rotation = [0, 0, GX.inclination];
}
headParts.push(
  p(
    'stem-seal',
    '进气门杆油封',
    'Mechanical',
    [-8, 41, -14],
    [40, 65, -50],
    '本田装配图中仅进气侧配置杆密封；弹性唇口围绕阀杆，抱紧箍圈位于外侧。',
    undefined,
    dark,
  ),
  p(
    'pushrod-guide',
    '双推杆导向板',
    'Mechanical',
    [-45, 53, 0],
    [-45, 70, 0],
    'UT2 零件目录中的推杆导向板，两个孔分别限制进、排气推杆的侧向偏移；采用同一推杆轴线基准。',
  ),
  ...[-1, 1].map((side, i) =>
    p(
      'dowel-' + i,
      '缸盖定位套 ' + (i + 1),
      'Mechanical',
      [side * 39, 0, side * 32],
      [side * 60, 30, side * 50],
      '空心定位套共同约束缸体、缸垫与缸盖，位置使用相同螺栓孔基准。',
    ),
  ),
);
starter.parts.push(
  p(
    'blower',
    '飞轮风道与导流罩',
    'Cooling',
    [0, 0, -15],
    [0, 0, -310],
    '冲压薄壁导流罩包围飞轮冷却扇，并沿上部开口把气流导向气缸散热片；与圆形回卷启动器分开。',
    undefined,
    '#ad3428',
  ),
  ...[-1, 1].map((side, i) =>
    p(
      'pawl-' + i,
      '启动接合棘爪 ' + (i + 1),
      'Mechanical',
      [side * 18, 0, -39],
      [side * 45, 25, -195],
      '棘爪安装在卷盘侧面，拉动时接合启动杯，回卷时脱开；采用静态观察姿态。',
    ),
  ),
);
engine.parts.find((p) => p.id === 'starter')!.pos = [0, 0, -68];
// Induction interfaces share the head's installed datum (the ports run along Z).
const headPortX =
  -8 * Math.cos(tilt) - (GX.deckY + GX.headGasket + 11) * Math.sin(tilt);
const headPortY =
  -8 * Math.sin(tilt) + (GX.deckY + GX.headGasket + 11) * Math.cos(tilt);
engine.parts.find((p) => p.id === 'induction')!.pos = [-65, 158, 0];
const intakeX = headPortX + 65,
  intakeY = headPortY - 158;
for (const part of induction.parts) {
  if (part.id === 'cap') part.pos = [-27, 65, -15];
  if (part.id === 'carb' || part.id === 'throttle')
    part.pos = [intakeX, intakeY, -68];
  if (part.id === 'filter') part.pos = [intakeX, intakeY, -104];
  if (part.id === 'filter-cover') part.pos = [intakeX, intakeY, -110];
  if (part.id === 'intake') part.pos = [intakeX, intakeY, -54];
  if (part.id === 'muffler') part.pos = [intakeX, intakeY, 86];
  if (part.id === 'heatshield') part.pos = [intakeX + 31, intakeY, 86];
  if (part.id === 'fuel-line') part.pos = [intakeX - 92, intakeY + 29, -6];
}
induction.parts.push(
  p(
    'tank-bracket',
    '油箱安装托架',
    'Chassis',
    [-20, -61, 0],
    [-40, 60, 0],
    '折弯托架把燃油箱安装耳连接至机体上部；安装孔与支承台共用基准，尺寸为照片参考重建。',
    undefined,
    alloy,
  ),
  p(
    'filter-base',
    '空滤承托底座',
    'Fluid',
    [intakeX, intakeY, -87],
    [0, 0, -85],
    '带中心气孔的承托底座与化油器喉管共轴，封闭滤芯内外侧的空气通路。',
    undefined,
    dark,
  ),
  p(
    'insulator',
    '化油器隔热垫座',
    'Fluid',
    [intakeX, intakeY, -50],
    [0, 0, -55],
    '隔热垫座位于化油器和缸盖之间，中心孔与进气道对齐，独立孔供安装长螺柱穿过。',
    undefined,
    dark,
  ),
  p(
    'intake-gasket',
    '进气密封垫',
    'Fluid',
    [intakeX, intakeY, -45],
    [0, 0, -38],
    '薄片密封垫位于隔热座与缸盖之间，贯通气孔和两只紧固孔沿同一基准。',
    undefined,
    '#70664d',
  ),
  ...[-15, 15].map((x, i) =>
    p(
      'mount-stud-' + i,
      '空滤与化油器贯穿螺柱 ' + (i + 1),
      'Mechanical',
      [intakeX + x, intakeY, -68],
      [x * 3, 30, -105],
      '长螺柱共同定位缸盖接口、隔热座、化油器与空滤底座，拆卸先解除端部螺母。',
    ),
  ),
);
// Explicit construction sequence, not an unrestrained radial explosion.
for (const part of headParts) {
  if (part.id === 'head')
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 70, offset: [0, 0, 0] },
    ];
  else if (part.id.startsWith('valve-'))
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 18, offset: [0, 0, 0] },
      { at: 60, offset: [0, -100, 0] },
      { at: 70, offset: [0, -100, 0] },
    ];
  else if (part.id === 'cover') part.motion = [0, 10];
  else if (
    part.id.startsWith('spring') ||
    part.id.startsWith('retainer') ||
    part.id === 'rotator'
  )
    part.motion = [5, 18];
}

const statorParts: DigitalPart[] = [
  p(
    'core',
    '48 槽叠片定子铁芯',
    'Magnetic',
    [0, 0, 0],
    [-175, 0, 0],
    '外径 198.12 mm、内孔 130.96 mm、叠长 151.38 mm；48 个真实槽口与齿沿周向形成。',
    undefined,
    '#727d86',
  ),
];
for (let i = 0; i < 48; i++) {
  const a = (2 * Math.PI * i) / 48,
    phase = leafCoils.find((c) => c.from === i || c.to === i)!.phase;
  statorParts.push(
    p(
      `liner-${i + 1}`,
      `第 ${i + 1} 槽绝缘衬`,
      'Magnetic',
      [0, 0, 0],
      [Math.cos(a) * 140, Math.sin(a) * 140, 0],
      '独立 U 形绝缘衬包围槽内铜导体，与铁芯和槽楔留出间隙；材料厚度为重建。',
      undefined,
      '#ddcda8',
    ),
  );
  statorParts.push(
    p(
      `conductor-${i + 1}`,
      `${['U', 'V', 'W'][phase]} 相 · 第 ${i + 1} 槽导体束`,
      'Magnetic',
      [0, 0, 0],
      [Math.cos(a) * 180, Math.sin(a) * 180, 0],
      '每槽以 120 股、约 0.8 mm 的实例化铜导体表示六匝与并绕线束；线束独立可选，端部按分布绕组跨槽连接；颜色区分相带，不代表工厂线色或真实端部布线路径。',
      undefined,
      [copper, '#b9944f', '#ab6a45'][phase],
    ),
  );
  statorParts.push(
    p(
      `wedge-${i + 1}`,
      `第 ${i + 1} 槽槽楔`,
      'Magnetic',
      [0, 0, 0],
      [Math.cos(a) * 110, Math.sin(a) * 110, 0],
      '窄绝缘楔位于槽口外侧，限制铜导体径向运动，不能伸入转子气隙。',
      undefined,
      '#c1b598',
    ),
  );
}
for (let i = 0; i < 24; i++)
  statorParts.push(
    p(
      `endturn-${i + 1}`,
      `端部跨槽线圈 ${i + 1}`,
      'Magnetic',
      [0, 0, 0],
      [0, 0, (i % 2 ? 1 : -1) * (150 + i)],
      '同一线圈的两边采用跨距 5 槽的短距绕组；24 个线圈共 48 个槽边。端部走线采用分层重建，不宣称逐根漆包线还原。',
      undefined,
      copper,
    ),
  );
const stator = def(
  'ev-stator',
  'evmotor',
  '定子铁芯、绕组与绝缘',
  '48 槽 · 24 个跨槽线圈 · 三相分布绕组',
  statorParts,
  25,
);
const rotorParts: DigitalPart[] = [
  p(
    'core',
    '内置磁体转子叠片',
    'Magnetic',
    [0, 0, 0],
    [0, 0, -210],
    '外径 129.97 mm、叠长 151.16 mm，铁芯有独立轴孔与双层磁钢槽；槽形为公开结构约束下的重建。',
    undefined,
    '#747d83',
  ),
  p(
    'shaft',
    '阶梯输出轴',
    'Mechanical',
    [0, 0, 0],
    [0, 0, 260],
    '叠片段直径 44.45 mm；阶梯轴承段、定位肩、花键可见，阶梯尺寸为重建。',
  ),
  ...[-1, 1].map((s, i) =>
    p(
      `plate-${i}`,
      `${i ? '驱动' : '感知'}侧转子压板`,
      'Mechanical',
      [0, 0, s * 77.5],
      [0, 0, s * 190],
      '开有轴孔和减重孔的压板压紧转子叠片，边缘不超出转子气隙包络。',
    ),
  ),
];
for (const [i, bar] of leafMagnetBars.entries())
  rotorParts.push(
    p(
      'magnet-' + (i + 1),
      `第 ${bar.pole + 1} 极 · ${bar.layer === 'flat' ? '外层平直' : '内层 V 形'}磁钢组 ${(i % 4) + 1}`,
      'Magnetic',
      [0, 0, 0],
      [Math.cos(bar.angle) * 130, Math.sin(bar.angle) * 130, 0],
      '双层磁路拓扑参考 Motor-CAD LEAF 教程；每条磁钢组显示 18 段轴向磁片。截面参数和分段来自教学重建，不宣称等同原厂完整磁片数量。',
      undefined,
      bar.pole % 2 ? '#657e9d' : '#b66e60',
    ),
  );
const rotor = def(
  'ev-rotor',
  'evmotor',
  'IPM 转子、磁钢与输出轴',
  '8 极内嵌磁路 · 129.97 mm 转子 · 独立磁钢',
  rotorParts,
  20,
);
const bearingParts: DigitalPart[] = [
  p(
    'outer',
    '轴承外圈',
    'Mechanical',
    [0, 0, 0],
    [-85, 0, 0],
    '外圈的沟道约束滚珠，外径 84 mm 是当前轴系的重建选型。',
  ),
  p(
    'inner',
    '轴承内圈',
    'Mechanical',
    [0, 0, 0],
    [85, 0, 0],
    '内孔 44.45 mm 与模型轴承段配合；实际商品轴承型号并未由公开资料确认。',
  ),
  p(
    'cage',
    '滚珠保持架',
    'Mechanical',
    [0, 0, 0],
    [0, 0, 65],
    '带十个窗口的保持架分开滚珠，窗口与滚珠共用节圆。',
    undefined,
    '#b7a164',
  ),
];
for (let i = 0; i < 10; i++) {
  const a = (i * Math.PI) / 5;
  bearingParts.push(
    p(
      `ball-${i + 1}`,
      `滚珠 ${i + 1}`,
      'Mechanical',
      [32 * Math.cos(a), 32 * Math.sin(a), 0],
      [Math.cos(a) * 80, Math.sin(a) * 80, 0],
      '独立球面位于滚道节圆；10 颗球仅为参考选型，数量不作为 LEAF 原厂轴承规格。',
    ),
  );
}
for (const s of [-1, 1])
  bearingParts.push(
    p(
      `shield-${s}`,
      `${s > 0 ? '前' : '后'}防尘盖`,
      'Mechanical',
      [0, 0, s * 8.4],
      [0, 0, s * 95],
      '薄环形防尘盖封住滚道侧面，内圈与外圈仍可区分。',
      undefined,
      dark,
    ),
  );
const bearing = def(
  'ev-bearing',
  'evmotor',
  '支承轴承内部',
  '内外圈 · 独立滚珠 · 保持架 · 防尘盖',
  bearingParts,
  12,
);
const housingParts: DigitalPart[] = [
  p(
    'shell',
    '水冷夹套内筒',
    'Cooling',
    [0, 0, 0],
    [-200, 0, 0],
    '内筒与定子外圆共轴，外侧环形水道位于密封外套以内；水道间距为重建。',
    undefined,
    alloy,
  ),
  p(
    'jacket',
    '水道外套',
    'Cooling',
    [0, 0, 0],
    [200, 0, 0],
    '薄壁外套封闭水道，内部不是与定子相交的实体圆柱。',
    undefined,
    '#909ca0',
  ),
  ...[-1, 1].map((s, i) =>
    p(
      `bell-${i}`,
      `${i ? '输出' : '感知'}侧端盖`,
      'Chassis',
      [0, 0, s * 112],
      [0, 0, s * 245],
      '端盖带轴承孔、筋板与周向螺栓孔；所有轴孔沿同一条电机轴线。',
      undefined,
      alloy,
    ),
  ),
  ...[-1, 1].map((s, i) =>
    p(
      `oring-${i}`,
      `夹套密封圈 ${i + 1}`,
      'Cooling',
      [0, 0, s * 91],
      [0, 0, s * 185],
      '弹性密封圈嵌在水道端部，限制冷却液向端盖空间流动。',
      undefined,
      dark,
    ),
  ),
  p(
    'inlet',
    '冷却液入口接管',
    'Cooling',
    [0, 120, -55],
    [0, 70, -35],
    '中空入口接管连通外层水道，不进入定子铜线区域。',
    undefined,
    alloy,
  ),
  p(
    'outlet',
    '冷却液出口接管',
    'Cooling',
    [0, 120, 55],
    [0, 70, 35],
    '出口与入口位于水套不同轴向位置；管口与流道以贯通孔表示。',
    undefined,
    alloy,
  ),
];
for (let i = 0; i < 8; i++) {
  const a = ((i + 0.5) * Math.PI) / 4;
  housingParts.push(
    p(
      `bolt-${i + 1}`,
      `端盖连接螺栓 ${i + 1}`,
      'Mechanical',
      [118 * Math.cos(a), 118 * Math.sin(a), 118],
      [Math.cos(a) * 30, Math.sin(a) * 30, 275],
      '独立紧固件对应端盖真实孔位，贯穿路径位于铜线和铁芯包络之外。',
    ),
  );
}
const housing = def(
  'ev-housing',
  'evmotor',
  '机壳与水冷夹套',
  '同轴孔 · 环形水道 · 接管 · 密封与紧固',
  housingParts,
  30,
);
const terminalParts: DigitalPart[] = [
  p(
    'base',
    '三相接线绝缘座',
    'Power',
    [0, 0, 0],
    [0, -45, 0],
    '绝缘座具有独立三相通道，接线端和外壳保持间隙。',
    undefined,
    '#d3bea0',
  ),
  p(
    'cover',
    '接线盒盖',
    'Chassis',
    [0, 20, 0],
    [0, 55, 0],
    '有壁厚的盒盖保护三相连接；橙色用于识别电驱系统高压接口。',
    undefined,
    '#d78239',
  ),
];
for (let i = 0; i < 3; i++)
  terminalParts.push(
    p(
      `bus-${i}`,
      `${['U', 'V', 'W'][i]} 相铜排`,
      'Power',
      [(i - 1) * 20, 0, 0],
      [(i - 1) * 40, 30, 0],
      '带螺栓孔的弯折铜排连接定子相线与外部逆变器；弯折路径为重建。',
      undefined,
      copper,
    ),
    p(
      `stud-${i}`,
      `${['U', 'V', 'W'][i]} 相接线螺柱`,
      'Power',
      [(i - 1) * 20, 8, 0],
      [(i - 1) * 40, 65, 0],
      '接线螺柱穿过铜排的通孔，绝缘座把三相互相隔开。',
    ),
  );
const terminal = def(
  'ev-terminal',
  'evmotor',
  '三相接线盒',
  'U / V / W 独立铜排与绝缘通道',
  terminalParts,
  10,
);
const motor = def(
  'evmotor',
  null,
  'LEAF 电动车驱动电机',
  '2012 LEAF / EM61 参考 · 内置永磁同步电机',
  [
    p(
      'housing',
      '机壳与水冷夹套',
      'Cooling',
      [0, 0, 0],
      [-300, 0, 0],
      '进入内筒、外套、水道、接管与密封圈；端盖与紧固件在整机单独选择。',
      'ev-housing',
    ),
    p(
      'stator',
      '48 槽定子与三相绕组',
      'Magnetic',
      [0, 0, 0],
      [0, 185, 0],
      '48 槽铁芯、每槽绝缘、槽楔、铜导体束与跨槽端部可以分别选择。',
      'ev-stator',
    ),
    p(
      'rotor',
      '8 极 IPM 转子与输出轴',
      'Magnetic',
      [0, 0, 0],
      [0, 0, 310],
      '转子先沿轴向退出定子内孔，再展开磁钢、叠片、压板和输出轴。',
      'ev-rotor',
    ),
    p(
      'bearing',
      '输出侧轴承',
      'Mechanical',
      [0, 0, 112],
      [0, 0, 220],
      '继续进入独立内外圈、滚珠、保持架和防尘盖。',
      'ev-bearing',
    ),
    {
      ...p(
        'bearing-rear',
        '感知侧轴承',
        'Mechanical',
        [0, 0, -112],
        [0, 0, -200],
        '与输出侧共用同一份轴承几何，维持轴系同心。',
      ),
      assembly: 'ev-bearing',
    },
    p(
      'terminal',
      '三相接线盒',
      'Power',
      [0, 134, 25],
      [0, 150, 90],
      'U、V、W 铜排和独立接线柱连接到外部逆变器。',
      'ev-terminal',
    ),
    p(
      'resolver-stator',
      '旋转变压器定子参考',
      'Board',
      [0, 0, -141],
      [0, 0, -225],
      '端部多齿铁芯和励磁/感应绕组表示转角感知机构；详细极数与绕法为教学参考，未由本报告核实。',
      undefined,
      copper,
    ),
    p(
      'resolver-rotor',
      '旋转变压器转子参考',
      'Mechanical',
      [0, 0, -141],
      [0, 0, -265],
      '带凸极的薄壁感知转子固定在轴上，与外部感知定子保持空气间隙；轮廓为重建。',
    ),
  ],
  40,
);
const bellParts = housing.parts.filter((p) => p.id.startsWith('bell-'));
motor.parts.find((p) => p.id === 'terminal')!.pos = [0, 108, 118];
motor.parts.find((p) => p.id === 'terminal')!.rotation = [Math.PI / 2, 0, 0];
motor.parts.find((p) => p.id === 'terminal')!.motion = [0, 15];
motor.parts.push(
  ...[0, 1, 2].map((i) =>
    p(
      'phase-lead-' + i,
      ['U', 'V', 'W'][i] + ' 相绝缘引出段',
      'Power',
      [0, 0, 0],
      [0, 120, 175],
      '三相引出段从前端绕组区域经端盖绝缘套进入接线座，不穿过封闭的冷却液腔；相带／支路连接是教学等效而非原厂逐股测绘。',
      undefined,
      copper,
    ),
  ),
);
housing.parts = housing.parts.filter(
  (p) => !p.id.startsWith('bell-') && !p.id.startsWith('bolt-'),
);
for (const b of bellParts) {
  motor.parts.push({
    ...b,
    id: 'end' + b.id,
    delta: [0, 0, b.pos[2] > 0 ? 245 : -245],
  });
}
for (const b of housingParts.filter((p) => p.id.startsWith('bolt-')))
  motor.parts.push({
    ...b,
    pos: [b.pos[0], b.pos[1], 103],
    id: 'housing-' + b.id,
  });
motor.parts.find((p) => p.id === 'housing')!.path = [
  { at: 0, offset: [0, 0, 0] },
  { at: 23, offset: [0, 0, 0] },
  { at: 55, offset: [0, 0, -310] },
  { at: 70, offset: [-200, 0, -310] },
];
for (const b of motor.parts.filter((p) => p.id.startsWith('endbell'))) {
  const sign = b.pos[2] > 0 ? 1 : -1;
  b.path = [
    { at: 0, offset: [0, 0, 0] },
    { at: 20, offset: [0, 0, sign * 220] },
    { at: 35, offset: [sign * 210, 0, sign * 220] },
    { at: 70, offset: [sign * 210, 0, sign * 220] },
  ];
}
for (const b of motor.parts.filter(
  (p) => p.id.includes('bearing') || p.id.startsWith('resolver'),
))
  b.motion = [0, 18];
motor.parts.find((p) => p.id === 'rotor')!.path = [
  { at: 0, offset: [0, 0, 0] },
  { at: 20, offset: [0, 0, 0] },
  { at: 35, offset: [0, 0, 340] },
  { at: 70, offset: [170, 0, 310] },
];
motor.parts.find((p) => p.id === 'stator')!.path = [
  { at: 0, offset: [0, 0, 0] },
  { at: 55, offset: [0, 0, 0] },
  { at: 70, offset: [0, 185, 0] },
];
motor.specs = {
  参考机型: '2012 Nissan LEAF / EM61 电机结构',
  形式: '内置永磁同步电机（IPM），非轮毂电机',
  '槽 / 极 / 相': '48 槽 / 8 极 / 3 相',
  '定子外径 / 内径': '198.12 / 130.96 mm',
  '转子外径 / 叠长': '129.97 / 151.16 mm',
  单侧径向气隙: '0.495 mm（由实测直径相减得到）',
  边界: '只展示电机；逆变器、减速器和整车电池不属于本模型',
  重建范围: '槽形、磁钢截面、轴承规格、端部绕线与铸件',
};

stator.summary =
  '槽内装配与线束连接 · 导体／衬纸轴向退出示意；绕组端部采用观察剖分';
for (const part of stator.parts) {
  if (part.id === 'core')
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 70, offset: [0, 0, 0] },
    ];
  else if (part.id.startsWith('endturn-')) {
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 70, offset: [0, 0, 0] },
    ];
    part.description +=
      ' 端部保持不动，表示不可作为刚体径向抽出的绕组；隐藏铁芯可查看线束路径。';
  } else {
    const sign = part.id.startsWith('liner-') ? -1 : 1;
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 8, offset: [0, 0, 0] },
      { at: 55, offset: [0, 0, sign * 205] },
      {
        at: 70,
        offset: [part.delta[0] * 0.4, part.delta[1] * 0.4, sign * 205],
      },
    ];
    part.description +=
      ' 轴向退出是制造剖分示意；真实浸漆绕组不能这样无损拆出。';
  }
}

export const powertrainDefinitions: Definition[] = [
  engine,
  engineBlock,
  engineCylinder,
  engineCover,
  engineCrank,
  enginePiston,
  engineHead,
  engineTiming,
  induction,
  starter,
  motor,
  stator,
  rotor,
  housing,
  bearing,
  terminal,
];

for (const part of rotor.parts) {
  if (part.id.startsWith('magnet')) {
    const i = Number(part.id.split('-')[1]) - 1,
      sign = i % 2 ? 1 : -1;
    part.path = [
      { at: 0, offset: [0, 0, 0] },
      { at: 35, offset: [0, 0, sign * 180] },
      { at: 70, offset: [part.delta[0], part.delta[1], sign * 180] },
    ];
  } else if (part.id === 'core') part.motion = [55, 70];
  else if (part.id === 'shaft') part.motion = [0, 20];
}
for (const d of powertrainDefinitions)
  for (const part of d.parts) {
    if (part.path)
      part.path = part.path.map((p) => ({ at: p.at / 100, offset: p.offset }));
    if (part.motion) part.motion = [part.motion[0] / 100, part.motion[1] / 100];
    if (d.id === 'ev-rotor') part.sources = ['leafdimensions', 'leafmotorcad'];
    if (d.id === 'ev-stator' && part.id !== 'core')
      part.sources = ['leafdimensions', 'leafmotorcad'];
    if (d.id === 'engine-head')
      part.sources = ['hondaassembly', 'hondaut2parts'];
  }
engine.camera = { direction: [1.2, 0.75, -1.7], padding: 1.1 };
