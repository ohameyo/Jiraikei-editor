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
