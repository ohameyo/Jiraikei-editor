# Jirai-editor 地雷系编辑器

## 项目目标
优化静态网页图片编辑器，面向 PC 和移动端提供轻量、丝滑、稳定的地雷系图片编辑体验。核心能力包括导入图片、滤镜、人像腮红、马赛克、贴纸、文字图层、前后对比和导出。

## 项目路径
`/Users/meyo/Documents/Codex/2026-04-23-project-context-jirai-kei-photo-editor`

## 主要文件
- `index.html`：页面结构、入口 DOM、基础元信息。
- `styles.css`：PC 与移动端布局、控件样式、画布和图层交互视觉。
- `src/app.js`：当前主逻辑文件，包含状态管理、渲染、滤镜、图层、滑杆、导出和事件绑定。
- `src/vision-skill.js`：人像识别与腮红辅助逻辑。

## 已存在的模块化方向
项目中已有以下模块文件，后续可逐步把 `src/app.js` 中的逻辑迁移或对齐：
- `src/core/store.js`
- `src/modules/canvasRenderer.js`
- `src/modules/mosaicEffects.js`
- `src/modules/overlayLayer.js`
- `src/modules/exporter.js`
- `src/ui/controls.js`
- `src/config/filterPresets.js`
- `src/config/stickerPacks.js`
- `src/config/textTemplates.js`

## 验证命令
```sh
node --check src/app.js
```

## 产品原则
- 移动端画布视图固定，功能区不能挤压或覆盖画布关键操作。
- 移动端优先单手、轻量、低阻力操作。
- 滑杆、移动、缩放、旋转必须跟手，拖动中要有实时视觉反馈。
- PC 和移动端能力尽量一致，但交互布局可按设备习惯区分。
- 元素控制器只在选中图层元素时展开，未选中时不遮挡功能区。
- 文案、字体、颜色、贴纸风格要和地雷系视觉统一。
- 不引入复杂依赖，优先保持静态网页结构。
- 每次改动后至少运行 `node --check src/app.js`。

## 当前最高优先级
移动端滑杆和元素操作丝滑度优化。

