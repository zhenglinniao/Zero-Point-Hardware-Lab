# 数码设备：拆解资料与重建范围

核对日期：2026-10-19。此轮替换了原有通用方块模型，重点重建主要内部装配。几何由项目编写，不把拆解照片、视频截图或第三方模型打包进应用。

## 逐设备依据

| 参考设备 | 直接参考 | 本次重建 |
| --- | --- | --- |
| 原版 PS5 光驱版 / CFI-10xx | [Sony 官方拆解](https://blog.playstation.com/2020/10/07/ps5-teardown-an-inside-look-at-our-most-transformative-console-yet/)、[iFixit 原版实机拆解](https://www.ifixit.com/Teardown/PlayStation+5+Teardown/138280) | 曲面侧盖、前后黑色壳架、进排风开口、风扇、光驱外壳；带避让缺口的 PCB、正反面封装、接口、热管、接触板与屏蔽结构。 |
| iPhone 15 标准版 | [Apple 内部视图](https://support.apple.com/en-ca/104901)、[官方维修目录](https://support.apple.com/en-ca/104900)、[规格](https://support.apple.com/en-gb/111831) | 背部开盖视角、对角双摄、TrueDepth、矩形软包电池、窄长逻辑板、USB-C 与麦克风、排线、压盖、边框内台阶与代表性螺钉。 |
| Sony α7 IV / ILCE-7M4 | [官方规格](https://www.sony.com/electronics/support/e-mount-body-ilce-7-series/ilce-7m4/specifications)、[Sony 服务手册分解页镜像](https://manuals.plus/m/662ac7b243a51dfb6adfa3f731348687443abee969b90e085dcd0aebbb51fbad.pdf) | 镂空前框、握柄腔、后壳窗口、顶盖、热靴、EVF、主板、导热承载板、卡槽、柔性连接、快门、卡口与传感器防抖分层。手册属于第三方托管的厂商文档副本。 |
| 初代 DualSense | [iFixit 初代维修资料](https://www.ifixit.com/Device/DualSense)、[实机拆解第 12 步起](https://www.ifixit.com/Teardown/PlayStation+5+Teardown/138280) | 带输入开孔的曲线握柄壳、异形板、中央电池架、两摇杆、触点膜、左右独立线性执行器和自适应扳机；扳机含电机、蜗杆、齿轮及触发臂。 |
| AirPods Pro 2 USB-C（2023）参考结构 | [52audio 原创拆解](https://www.52audio.com/archives/178135.html)、[Apple 规格](https://support.apple.com/en-il/111851) | 圆角薄壁盒壳、盖、铰链、双电芯、竖向充电板、双耳托盘与触点、背部线圈；耳机短柄、声腔、纽扣形电池、柔性电路和硅胶耳塞。 |

## 核对事实与近似部分

- **PS5**：原版主板的 8 颗 2 GB GDDR6、6 颗 NAND（两面各 3 颗）分别建为可选组件；风扇采用 120 mm / 45 mm 级包络。叶片数存在供应商差异，当前曲率与 23 片表示一种视觉近似，不作为所有 PS5 的统一风扇规格。CPU 裸芯片面朝向散热组件；没有误加桌面 CPU 金属顶盖。
- **手机**：按照 Apple 官方背部内部视图，底部扬声器在左、Taptic Engine 在右，TrueDepth 与后置双摄分开。标准版不添加 Pro 的第三颗相机。保留 147.6 × 71.6 × 7.8 mm 官方外形参考。
- **相机**：使用 ILCE-7M4 的装配分区，不将 A7R IV / A7R V 拆解冒称为 A7 IV。芯片微观布局、排线弯曲半径与光学处方没有公开测绘，本模型不填入未经核对的具体芯片料号。
- **手柄**：两个自适应扳机与两个线性执行器分别展示；不将触觉执行器当作传统偏心马达。不同 DualSense 硬件修订的电路和机构可能不同。
- **耳机**：从通用原理样机改为 USB-C 版主要组件参考，但仍不声称复制 AirPods 的声学腔体公差、SiP 内部封装或胶粘工艺。独立动圈子层级继续讲解通用原理。

外形曲面、板孔、元件尺寸、微型无源器件位置、排线轨迹和紧固件数量属于观察资料后的几何近似。可视螺钉是代表性采样；电路表面的装饰走线不是真实电气网络。这些模型不能替代维修手册或完整物料清单。

## 实现与计数

- `lib/digital/catalogue.ts` 保留原有 14 个层级与部件 ID。
- `lib/digital/refinements.ts` 维护本轮修正的位置、尺寸、来源与新增组件；已有课程记录和分享链接继续有效。
- `lib/digital/geometry.ts` 实现原生毫米几何：镂空轮廓、薄壁壳体、曲面侧盖、双面封装、微型插座、柔性线路、齿轮及声学部件。
- `lib/digital/models.ts` 负责父子单位换算与安装朝向；变换保存在内层，避免动画重置缩放后子模型变大。
- 新增 42 条部件资料。五类数码设备共有 148 条目录资料，其中 143 个为各层级的可选组件定义，5 个为设备根条目。整个应用为 741 条资料、82 层级、8 台参考设备、24 个实验。
- 支持件和微型无源器件随其总成选中；没有给装饰电路赋予虚构的料号。

## 验证方式

```bash
npm run lint
npm test
npm run build
npm run size
npm start
# 另开终端
node --experimental-strip-types scripts/digital-smoke.mjs
node scripts/learning-smoke.mjs
```

几何检查包括父子实际比例、动画前后变换、PS5 内部组件装配间隔与风扇包络、双面封装数量、手机的关键位置与背盖下排线、耳机与盒盖间隙。非凸主板按各实际子组件检查装配区域，避免用整个主板的包围盒填满风扇避让空间。

浏览器验收覆盖 14 层级 × 3 姿态、5 条新增课程、选择/隐藏/恢复、父子深入、中文说明、分类和移动端。截图与验收不是公差测绘、物理声学仿真或全部芯片的逐一鉴定。
