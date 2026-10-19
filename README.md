# 零点硬件实验室

一个以「观察 → 拆解 → 理解」为核心的中文硬件学习应用。首页、原创矢量结构示意、八条课程、二十四个实验、知识检查与学习记录由 zln 设计实现


## 数码设备库

首页可按电脑、游戏、移动、影像和音频分类筛选，共 8 台参考设备。新增的 5 类设备都能装配、分层拆解、查看零件清单、选择部件和进入子层级。

| 新增设备 | 直接打开 | 深入层级 |
| --- | --- | --- |
| PlayStation 5 | /?scale=ps5 | 主板、散热系统 |
| iPhone 15 参考结构 | /?scale=phone | 逻辑板、双摄模组 |
| Sony α7 IV 参考结构 | /?scale=camera | 传感器与防抖、通用镜头原理 |
| 双摇杆手柄 | /?scale=gamepad | 输入与控制电路 |
| 无线耳机原理样机 | /?scale=earbuds | 耳机内部、动圈单元 |

新增课程链接为 `/?lesson=console`、`mobile`、`imaging`、`interaction`、`audio`（均通过 lesson 参数）。每条路径含 3 个实验，与原有课程共同构成 8 条路径、24 个实验。

部件面板默认展示**中文功能导读**，原有电脑资料保留英文原文与原始规格，方便核对。新数码设备描述直接使用中文编写；中文搜索也支持「手机」「相机」「电池」等设备或部件词。运行时无需翻译接口或 API 密钥。

这些模型解释结构与功能，不是精确维修图、完整物料清单或性能模拟器。具体参考与局限见 [数码设备参考](docs/DIGITAL-DEVICES.md)。
## 启动

需要 Node.js 22.13 或更新版本，在项目目录运行：

```powershell
npm ci
npm run dev
```

打开终端地址的根路径（默认 http://127.0.0.1:5173/），看到新的中文学习台。`npm run build` 生成 dist/，`npm start` 启动生产预览。浏览器需支持 WebGL，推荐开启图形加速。

## 原创学习体验

- **学习台**：米白、墨绿与橙色视觉，原创可展开的处理器 / 主板 SVG 示意，课程选择与学习日志。
- **一台电脑的协作**：机箱 → 主板 → NVMe，从系统空间组织理解分工。
- **像素背后的工厂**：显卡 → GPU 架构 → SM，区分物理结构和逻辑组织。
- **追踪一个比特**：内存模组 → 封装 → 存储单元，逐层建立尺度概念。
- **互动实验**：依据模型层级和拆解进度解锁知识检查，答错可重试，答对才记录完成；不冒充眼动或阅读检测。
- **学习记录**：保存在当前浏览器，支持复习、继续未完成实验、确认后重置。存储损坏时安全恢复，存储禁用时提示仅暂存当前页面。
- **响应式工作台**：独立滚动的任务面板、始终可见的下一步按钮、手机任务抽屉。

课程链接：`/?lesson=inside`、`/?lesson=graphics`、`/?lesson=memory`。刷新恢复到该路径第一个未完成的实验。打开 `/?scale=sm` 等原有模型链接会进入自由拆解；原有电脑内容与对比功能保留，现合计 82 个探索层级、699 条部件资料。

电脑模型与渲染器复用原项目；PS5、手机、相机、手柄与耳机的教学几何、部件目录和课程由本项目新增。型号、原理样机与精度范围见 [数码设备参考](docs/DIGITAL-DEVICES.md)。更详细的版权和技术资料见 [LICENSE](LICENSE)、[SOURCES.md](SOURCES.md)、[原始 README](docs/UPSTREAM_README.md)。

## 验证

```powershell
npm run check
npm test
npm run build
npm run size
node scripts/learning-smoke.mjs
node --experimental-strip-types scripts/digital-smoke.mjs
```

浏览器脚本默认连接 http://127.0.0.1:4173/ ，运行前执行 `npm start`。默认使用 Windows Edge；其他环境通过 BROWSER_EXECUTABLE 指定浏览器，NOTEBOOK_BASE_URL 指定地址。截图写入被忽略的 output/playwright/learning/。验证范围见 [验证记录](docs/VALIDATION.md)。

## 部署与维护

静态应用，无服务端与 API 密钥。上传整个 dist/ 到网站根路径即可；保留 guide/ 的静态页面。已提供 Vercel 和 Netlify 配置。子路径部署需单独调整 Vite base 与静态链接。

当前没有远程仓库、不推送、不发布；所有节点提交到本地 main，作者为 `zln <zhenglinniao1417@gmail.com>`。上游版本 ace99de7956f741b6bdb70de56d5dc4b4aafb7ae。变更记录见 [开发记录](docs/DEVELOPMENT.md)，架构见 [ARCHITECTURE.md](ARCHITECTURE.md)。继承的英文指南、sitemap 和 robots.txt 仍含上游域名；独立域名发布前需统一更新。新的首页不会使用上游 canonical 或社交站点身份。
