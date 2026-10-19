# 数码设备参考与模型范围

资料核对日期：2026-10-19。新增几何由本项目编写，使用原有 Three.js 渲染、拾取、拆解与资源释放机制，不下载第三方模型文件。

| 设备 | 可探索层级 | 参考资料 | 明确的边界 |
| --- | --- | --- | --- |
| PlayStation 5 | 整机 → 主板；整机 → 散热系统 | [2020 官方拆解](https://blog.playstation.com/2020/10/07/ps5-teardown-an-inside-look-at-our-most-transformative-console-yet/)、[官方 FAQ](https://blog.playstation.com/2020/11/09/ps5-the-ultimate-faq/) | 参考 2020 原版光驱版，不混入 Slim / Pro 结构。导热、板级与风扇组织作示意，非完整物料清单。 |
| iPhone 15 | 整机 → 逻辑板；整机 → 双摄模组 | [技术规格](https://support.apple.com/en-gb/111831)、[官方内部视图](https://support.apple.com/en-ca/104901)、[维修资料目录](https://support.apple.com/en-ca/104900) | 标准 iPhone 15，不加入 Pro 专属镜头。封装、屏蔽罩、排线与卡扣的位置/形态简化。 |
| Sony α7 IV | 机身 → 传感器/防抖；机身 → 镜头原理 | [机身规格](https://www.sony.com/electronics/support/e-mount-body-ilce-7-series/ilce-7m4/specifications)、[光圈与景深原理](https://www.sony.co.uk/electronics/what-is-aperture-depth-of-field) | 机身功能参考 α7 IV；镜头是通用教学结构，不声称是某款商业镜头的精确光学处方。 |
| 双摇杆手柄 | 整机 → 控制电路 | [DualSense 官方功能介绍](https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/) | 参考输入、通信、触觉与扳机功能；不声称是 DualSense 内部 PCB 或专有执行器的精确复刻。 |
| 无线耳机 | 充电盒/耳机 → 耳机内部 → 动圈单元 | [公开耳机功能参考](https://support.apple.com/en-il/111851)、[COMSOL 动圈单元原理](https://doc.comsol.com/6.3/doc/com.comsol.help.models.aco.lumped_loudspeaker_driver/lumped_loudspeaker_driver.html) | 通用原理样机，不是 AirPods 的内部复刻。线圈、振膜、电池与声腔尺寸不代表具体产品。 |

厂商公开页面支持型号、规格或功能存在；并不支持模型中每个坐标、包封数量或几何尺寸。原理性的组件角色与实物的供应商/料号不混为一谈。模型不模拟真实电路、温度、磁场、光学或声学性能。

## 中文内容

新增设备的描述、作用、示意范围和课程直接使用中文编写。原有电脑部件默认展示中文功能导读，同时保留「查看英文原文与精度说明」和原始规格值。导读按组件身份及功能分类组织，不宣称是 593 条原始长文的逐句专业翻译。

`lib/zh.ts` 提供本地中文名称、常见术语、功能导读、规格标签及精度说明；搜索同时保留英文名称，并加入中文设备和部件别名。运行时不调用翻译或外部模型接口。

## 实现与可靠性

- `lib/digital/catalogue.ts`：14 个层级、106 个目录条目，包括原生毫米尺寸、参考来源与父子关系。
- `lib/digital/models.ts`：按设备家族单位换算生成实体几何；子组件使用统一比例，不按各轴拉伸适配。
- 尺寸换算与安装旋转置于内部容器，外层保持动画系统要求的单位变换，避免运行时重置导致比例失真。
- `lib/devices.ts`：设备库与独立系统一一对应。
- `lib/digital-learning.ts`：5 条新增课程、15 个实验，与原有 3 条课程共同组成 8 条路径、24 个实验。
- `app/lab.tsx`：进入实验后才加载；首页不挂载 WebGL，也不提前加载完整实验面板。
- `tests/digital.test.ts`：目录/模型绑定、中文内容、完整层级、统一缩放、运行时姿态与边界检查。
- `scripts/digital-smoke.mjs`：实际浏览器中检查新层级三种姿态、中文介绍、隐藏/恢复、进入/返回、五条课程及移动端。

## 运行

```powershell
npm ci
npm run dev
```

生产预览与浏览器检查：

```powershell
npm run build
npm start
# 在另一个终端执行：
node --experimental-strip-types scripts/digital-smoke.mjs
```

默认浏览器脚本使用 Windows Edge。可通过 BROWSER_EXECUTABLE 指定本机已安装的浏览器，通过 NOTEBOOK_BASE_URL 指定预览地址。无新增运行时依赖，不需要 API 密钥。
