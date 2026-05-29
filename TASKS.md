# Tasks

## P0 当前最高优先级
- [ ] [整站丝滑性与跟手优化 v2](tasks/smoothness-v2.md)
- [ ] [滤镜调色训练 v2](tasks/filter-training-v2.md)
- [x] [移动端滑杆和元素操作丝滑度优化](tasks/performance-mobile-interactions.md)
- [ ] [图层元素体验调教](tasks/layer-elements-tuning.md)（本轮已补线上反馈的松手空选框、腮红缩放预览、贴纸 tab 首开加载和轻量贴纸缩略图）

## P0 性能与交互
- [ ] [滤镜渲染性能优化](tasks/filter-render-performance.md)
- [ ] [Canvas 渲染架构 spike](tasks/canvas-render-architecture-spike.md)
- [ ] [画布元素选择与控制器展开](tasks/layer-selection-controls.md)（已合并进图层元素体验调教）

## P1 移动端布局
- [ ] [移动端画布与功能区布局整理](tasks/mobile-layout.md)
- [ ] [顶部工具栏与前后对比交互](tasks/mobile-toolbar-compare.md)

## P1 数据与部署
- [x] [用户行为统计埋点](tasks/analytics-tracking.md)
- [x] [个人简介卡片](tasks/profile-card.md)（本轮已压缩头像并预加载）
- [x] [Lab 测试版脚标](tasks/lab-footnote.md)
- [x] [网页制作方向与 App 封装方案](tasks/web-app-roadmap.md)
- [ ] [后续事项讨论与推进](tasks/next-roadmap-discussion.md)
- [ ] [Web 性能基线与真机验收清单](tasks/web-performance-baseline.md)
- [ ] [资源体积、缓存和部署策略](tasks/web-resource-cache-strategy.md)
- [ ] [Web 生产入口与模块化迁移计划](tasks/web-architecture-migration.md)

## P1 文字
- [x] [文字输入、字体与图层命名](tasks/text-fonts-and-input.md)（本轮已补字体预览加载、文字预设 fallback 预览、选中文字松手显示、文字滑杆实时预览、描边色和无描边默认字色）

## P1 拍立得
- [x] [正式版拍立得与画布一致性](tasks/polaroid-production.md)（本轮已补图层裁切、拍立得腮红二次编辑、拍立得滤镜实时编辑、拍立得尺寸导出和边框轻量预览）

## P1 滤镜与 HSL
- [ ] [滤镜参数与质感调教](tasks/filter-parameter-tuning.md)
- [ ] [HSL 色块与肤色保护](tasks/hsl-color-safety.md)

## P1 腮红
- [ ] [腮红识别失败与手动选区](tasks/blush-manual-region.md)（本轮已补拍立得模式下二次编辑和坐标映射）

## P1 马赛克与贴纸
- [ ] [马赛克贴纸比例与预览](tasks/mosaic-sticker-shapes.md)（本轮已补爱心马赛克羽化预览一致性、手绘第 8 个贴纸替换和装饰贴纸按主色排序）

## P2 导出
- [ ] [移动端与 PC 导出体验](tasks/export-experience.md)（本轮已补拍立得模式按边框尺寸导出）

## P2 Web 安装与 App 封装
- [ ] [PWA 安装、离线和缓存试验](tasks/pwa-installability.md)
- [ ] [App 封装可行性 spike](tasks/app-wrapper-spike.md)

## 任务更新规则
每完成一个任务，请在对应 `tasks/*.md` 中更新：
- 已完成修改
- 修改文件
- 验证结果
- 遗留风险

同时在本文件勾选任务状态。
