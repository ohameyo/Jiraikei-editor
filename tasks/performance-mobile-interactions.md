# 移动端滑杆和元素操作丝滑度优化

## 优先级
P0，当前最高优先级。

## 背景
用户反馈移动端滑杆、元素移动、元素缩放仍有卡顿或不跟手问题。目标是让滑杆和画布元素操作接近原生修图 App 的响应。

## 当前问题
- 移动端部分滑杆拖动仍可能卡顿或无法稳定滑动。
- 滑杆拖动时滤镜重算可能阻塞 UI。
- 移动端元素缩放、移动、旋转需要持续实时反馈。
- 点选画布上的贴纸、文字、马赛克后，对应控制器必须立即展开。
- 释放元素后，图案必须立刻留在当前位置，不能只剩选框或点击空白后才恢复。

## 相关文件
- `src/app.js`
- `styles.css`

## 关键代码/变量
- `makeSlider()`
- `getPreviewScaleForState()`
- `renderCanvas()`
- `previewRenderCache`
- `overlayController.render()`
- `appendLayerPreview()`
- `attachMoveHandler()`
- `startInteraction()`
- `activeTransformLayerId`
- `isSliderDragging`
- `isDirectManipulating`
- `mobileLayerControlsExpanded`

## 已做修改
- 滑杆改为通过 pointer 位置主动计算数值。
- `input[type="range"]` 使用 `touch-action: none`。
- 移动端滑杆节流约 32ms。
- 移动端滑动时降低预览渲染尺寸。
- 拖动元素时用 overlay preview 跟手，并通过 `activeTransformLayerId` 隐藏 canvas 内原元素。
- 移动端滑杆提交与轻量预览重绘统一降到约 48ms，减少滤镜重算挤占主线程。
- 图层移动/缩放/旋转首帧先更新 DOM overlay preview，把隐藏 canvas 原图层的重绘推到下一帧，避免 pointermove 同步卡顿。
- 移动端 range thumb 和轨道加大，提升手指命中和拖动稳定性。
- PC/移动端交互预览加入自适应降采样压力控制：当连续渲染超过预算时自动降低拖动中的预览尺寸，保护浏览器主线程。
- 滑杆/文字编辑中的预览滤镜保留与最终画面一致的亮度分区叠色和腮红覆盖，仅跳过最重的黑色保护平滑收尾，避免交互中出现灰色近似效果。
- 交互降采样下限抬高，移动端和 PC 端拖动中保留更清晰、更接近最终结果的预览。
- 图层与腮红拖动的 pointermove 改为 requestAnimationFrame 合并提交，每帧只应用最新一次 DOM transform，降低事件洪峰导致的卡顿风险。
- 基础滑杆拖动增加高清 CSS 即时预览层，亮度/对比度/饱和度先在当前 canvas 上即时反馈，真实像素渲染合并补齐，减少不跟手且避免低清预览。
- 滑杆和文字编辑期间跳过 preset、腮红控件、overlay、图层列表与移动图层 dock 的 DOM 重建，降低主线程压力。
- 图层移动/缩放/旋转在 pointerdown 时先进入直接操作状态，再触发选中与控制器展开，减少拖动第一帧阻塞。
- iPad/触屏平板竖屏强制进入移动端布局，横屏显示竖屏使用提示，避免网页端控制器在平板上错位。
- 移动端滑杆改为滑块/进度条每次 pointermove 立即更新，数据提交降频到约 64ms，轻量真实渲染降频到约 96ms，减少滤镜重算阻塞手指跟随。
- 基础滤镜滑杆增加移动端乐观 CSS 预览，拖动时先用当前 canvas 即时反馈亮度/对比/饱和变化，真实像素渲染随后补齐。
- 移动端基础滤镜滑杆拖动中不再提交 store 和触发 canvas 重绘，松手后一次性提交真实滤镜，避免滤镜重算阻塞手指移动。
- 图层移动/缩放/旋转拖动中改为纯 DOM transform 预览，不再每帧 `store.updateLayer()` 或 `renderCanvas()`；松手后一次性写入图层并渲染。
- 移动端所有滑杆统一改为拖动中只更新控件 UI，松手后提交数据；并扩大 range thumb/轨道和拖动命中区域，降低手指偏移导致的丢事件和不跟手。
- PC 端滑杆保留拖动中实时提交，基础滤镜拖动中同样使用 CSS 乐观预览，避免桌面端 canvas 重绘阻塞滑杆。
- 滤镜滑杆增加水平意图锁定：上下滚动时不启动参数调整，只有明显横向拖动才接管滑杆；松手后的真实渲染延迟到短暂空闲后执行，降低释放手势时的卡顿。
- PC 端滑杆取消移动端式意图等待，pointerdown 立即接管并更新数值；桌面端滑杆提交约 16ms、轻量渲染约 24ms，优先恢复网页端跟手反馈。

## 修改文件
- `src/app.js`
- `styles.css`
- `TASKS.md`
- `tasks/performance-mobile-interactions.md`

## 验收标准
- 移动端所有滑杆都能顺滑拖动。
- 滑杆拖动中画面持续反馈，松手后清晰渲染。
- 移动、缩放、旋转贴纸/文字/马赛克时，元素内容和选框同步跟手。
- 松手后元素立即在当前位置显示。
- 点选画布元素后立即展开对应元素控制器。
- PC 端滑杆和元素操作不退化。

## 验证
```sh
node --check src/app.js
```

验证结果：通过。

## 遗留风险
- 移动端 Safari/内嵌浏览器对 pointer capture 和 range 控件行为差异较大，需要实机反复验证。
- 滤镜重算仍可能是主要卡顿来源，必要时继续降采样或延迟重算。
- 图层拖动开始的极短瞬间可能仍会同时看到 canvas 旧位置和 overlay preview，下一帧隐藏旧图层；需在真机上确认观感是否可接受。
- 拖动中的预览仍会跳过暗部保护平滑，最终画质在松手后补齐；如果后续还需要完全实时最终画质，需要引入 Worker 或 OffscreenCanvas。
- CSS 即时预览主要覆盖亮度、对比度、饱和度；色温、色调、HSL、肤色保护等复杂滤镜仍依赖合并后的真实渲染补齐。
