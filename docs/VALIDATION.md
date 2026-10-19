# 本地验证记录

日期：2026-10-19（Asia/Shanghai）。环境：Windows，Node.js v24.20.0，npm 11.19.0。

## 当前版本：原创学习产品重设计

- `npm test`：112 / 112 通过，0 失败、0 跳过；含新增课程数据、进度过滤、续学与课程链接测试。
- `npm run build`：TypeScript 与 Vite 生产构建通过。
- `npm run size`：入口 gzip 204.9 KiB，仍低于原有 220 KiB 预算，Three.js 未进入入口包。
- `node scripts/learning-smoke.mjs`：最终代码下退出码 0，执行期间没有 pageerror。
- 新首页不挂载 3D canvas；原创 SVG 可切换展开 / 收起，390 × 844 视口无横向溢出。
- 内存课程 dimm → dram → cell 完整通过：未观察时答案禁用，答错不记录完成，答对后记录进度并解锁下一步。
- 课程中刷新保留课程模式，并根据已完成记录恢复到第一个未完成步骤。
- 首页显示 3 / 9 完成，刷新后仍保留；复习已完成课程、手机任务抽屉与固定操作区正常。
- 重置先取消时不丢进度，确认后归零；损坏的 localStorage 数据安全回退。
- 普通 `?scale=sm` 链接保持自由探索模式。

已查看新版首页桌面 / 手机与实验工作台桌面 / 手机截图；代表性截图存入 docs/screenshots/learning-*.png。浏览器本轮完整走通的是内存路径，其他两条课程的数据有效性由测试覆盖，未声称九个实验都逐一人工答题。既有模型几何与对比引擎没有改动；上轮全链路浏览器结果作为历史保留在下方。本轮未重新执行整个 notebook-smoke 脚本。

## 初始复刻基线检查（历史记录）

| 检查 | 结果 |
| --- | --- |
| npm ci | 成功安装上游锁定依赖 |
| npm run check | TypeScript 无错误；扩展后 build 再次执行了类型检查 |
| npm test | 108 / 108 通过，0 失败、0 跳过 |
| npm run build | 生产构建成功，输出 dist/ |
| npm run size | 入口包 gzip 195.7 KiB，小于 220 KiB 预算；Three.js 未进入入口包 |
| node --check scripts/notebook-smoke.mjs | 脚本语法检查通过 |
| HTTP / 与 /guide/zh-CN.html | 生产预览均返回 200 |
| 目录完整度 | 68 个探索层级、593 条部件资料 |
| Git 作者配置 | 仅当前仓库设置 zln / zhenglinniao1417@gmail.com |

## 浏览器检查

使用仓库已有的 Playwright 脚本和本机 Microsoft Edge，headless + SwiftShader 软件渲染，deviceScaleFactor 为 1。生产预览地址为 http://127.0.0.1:4173/ 。

```powershell
$env:NOTEBOOK_BASE_URL = 'http://127.0.0.1:4173'
node scripts/notebook-smoke.mjs
```

脚本退出码为 0，以下检查全部通过，整个脚本执行期间未捕获 pageerror：

- Legion 5 装配 / 50% 拆解 / 100% 零件清单，以及从清单进入主板 → SO-DIMM → DRAM 封装。
- 切换 MacBook、拆解与重置；重置后仍保留正确的机器深链接。
- 进入笔记本对比、交换左右设备、退出并回到台式机。
- 台式机装配、50% 拆解、100% 零件清单；模型实际产生可渲染三角形。
- 点击顶部「使用指南」进入中文页，确认页面语言，点击「开始探索」返回模型。
- 中文指南在 390 × 844 视口无横向溢出；桌面、手机截图均已人工查看。
- 直接加载 maccell 深链接；手机宽度下展开导航并切换回笔记本。

截图位于被 Git 忽略的 output/playwright/，不覆盖上游参考截图。已人工查看 Legion 装配与拆解、MacBook 拆解、台式机装配、中文指南桌面与手机画面。页面错误检查不是所有浏览器控制台告警或每个硬件层级的完整审计。

## 验证边界

- Vite 对较大的入口和 Three.js 运行时 chunk 给出体积提示；构建及项目规定的 gzip 入口预算均通过，未通过提高预算隐藏提示。
- 使用的是软件渲染，自动检查速度不代表真实显卡性能。
- 手机检查使用 390 × 844 CSS 像素的浏览器视口，不能代替真实手机触控、双指缩放与所有设备兼容性检查。
- 本次不配置远程，不推送、不部署；GitHub CI 和托管平台上的实际构建尚未运行。
- 独立域名发布时仍需替换继承的 SEO 域名，具体位置见 README。
