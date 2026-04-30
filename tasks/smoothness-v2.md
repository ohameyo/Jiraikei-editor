# 整站丝滑性与跟手优化 v2

## 优先级
P0，当前最高优先级。

## 任务边界
本窗口只处理整站“丝滑性”和操作跟手程度，目标是让 Jirai-editor 在移动端和 PC 端的核心操作尽量接近原生修图 App。

范围内：
- 移动端滑杆拖动跟手。
- PC 端滑杆拖动跟手。
- 滤镜滑动中的实时预览策略。
- 贴纸、文字、马赛克、腮红的移动、缩放、旋转实时反馈。
- 元素释放后立即显示在当前位置。
- 点选元素后控制器立即展开。
- Canvas 渲染节流、降采样、缓存。
- pointer/touch 事件优化。
- 避免拖动中出现原元素残影、选框和内容不同步。
- 低端手机和内嵌浏览器的性能策略。

范围外：
- 滤镜审美参数训练。
- 文案内容。
- 字体资源配置。
- 导出文案。
- 贴纸素材选择。
- 页面整体视觉改版。

## 当前代码路径梳理
### 滑杆输入路径
- `makeSlider()` 是当前主要滑杆工厂，位于 `src/app.js`，而 `src/ui/controls.js` 里也有旧的简单版本，但当前主页面使用的是 `src/app.js` 内部版本。
- 滑杆使用 `pointerdown`、`pointermove`、`pointerup` 主动按 pointer 横坐标计算数值，避免完全依赖移动端原生 range 行为。
- 移动端启用水平意图锁定：明显纵向滚动会取消本次 slider drag，明显横向移动才进入参数调整。
- 滤镜和 HSL 滑杆传入 `commitOnEnd: true`，拖动中主要走 `onPreview()` 和 CSS 近似预览，松手后通过 `onInput()` 一次性提交 store。
- 部分图层滑杆没有显式传 `commitOnEnd`，移动端默认也是松手提交，PC 端会按约 16ms 节流实时提交。
- `MOBILE_SLIDER_COMMIT_MS`、`MOBILE_LIGHTWEIGHT_RENDER_MS`、`DESKTOP_SLIDER_COMMIT_MS`、`DESKTOP_LIGHTWEIGHT_RENDER_MS` 控制拖动期间提交和轻量渲染节奏。

### 滤镜实时预览路径
- `onPreview()` 写入 `sliderPreviewFilters`，并调用 `applyCanvasCssInteractionPreview()`。
- `applyCanvasCssInteractionPreview()` 通过 canvas CSS `filter` 近似亮度、对比、饱和度、sepia、hue-rotate 等变化，给滑动中即时反馈。
- 松手后 `store.setFilters()` 触发真实像素渲染，`finishDrag()` 会清掉 CSS filter，并在 commit-on-end 路径上延后到 idle/timeout 后执行清晰渲染。
- `scheduleRender()` 在 `isSliderDragging` 或 `isTextEditing` 时按轻量间隔调度，并根据 `INTERACTIVE_RENDER_BUDGET_MS` 调整 `interactiveRenderPressure`。

### Canvas 渲染、降采样和缓存路径
- 主渲染入口是 `render()` -> `renderCanvas(ctx, state)`。
- `getPreviewScaleForState()` 根据移动端/PC、是否直接操作、交互压力，决定预览降采样比例。
- `createPreviewRenderState()` 会缩小 canvas、faceBoxes、faceLandmarks，并按比例调整文字、马赛克参数。
- `previewRenderCache` 缓存 `original`、`toneBase`、`edited`，用 `renderToken`、`toneToken`、尺寸、隐藏图层 ID 和 interactive 状态判断是否复用。
- `renderToneBaseCanvas()` 负责重滤镜像素管线；`drawLayerStack()` 在 tone base 上绘制马赛克、贴纸和文字。
- `applyTonePipeline()` 是最重路径，包含逐像素 HSL、肤色保护、腮红、叠色、黑发保护和暗部平滑。

### 元素实时操作路径
- 画布元素交互集中在 `createOverlayLayer()`，当前主逻辑在 `src/app.js` 内部版本。
- overlay 直接创建贴纸、文字、马赛克、腮红选区 DOM 预览，拖动中通过 `requestAnimationFrame` 合并 pointermove，并应用 DOM `transform`。
- `startInteraction()` 会 `store.beginStep()`，设置 `isDirectManipulating = true`，并 `cancelQueuedRenderWork()`，避免拖动时 Canvas 重算抢主线程。
- `queueInteractionPreview()` 每帧只应用最新 patch；拖动中不写 store。
- `finishInteraction()` 松手后将 pending patch 一次性写入 store，再 `render(store.getState())`。
- 多指缩放通过 `pointers` Map、`getPinchPoints()`、`startPinchInteraction()` 管理；第二根手指落在 overlay layer 时也可加入当前图层 pinch。
- 腮红选区走同一套 overlay transform 预览，松手后通过 `patchBlush()` 写入 filter。

### 选中与控制器展开路径
- `revealLayerControlsFor(layer)` 会切换到对应工具、设置 `mobileLayerControlsExpanded = true`，并立即 `renderLayerControls()`。
- overlay item 的 `pointerdown` 和 `click` 都会选中图层并调用控制器展开逻辑。
- 移动端拖动开始时使用 `store.selectLayerSilent()` 避免完整 notify/render 造成第一帧阻塞，然后手动展开控制器。
- 主 `render()` 根据 `activeTool`、`selectedLayerId` 和 `mobileLayerControlsExpanded` 控制图层控制区是否显示。

## 已确认存在的优化
- 滑杆已改为 pointer 坐标驱动，并配有横向意图锁。
- 移动端滤镜滑杆拖动中不立即重算完整滤镜，先使用 CSS 近似预览。
- PC 端滑杆没有移动端意图等待，桌面拖动路径更直接。
- Canvas 已有交互降采样、渲染预算压力调整和预览缓存。
- 直接操作图层时，拖动中使用 DOM overlay 预览，松手后一次性写入 store。
- 文字输入使用 rAF 合并 input。
- 滑杆和文字编辑期间会跳过部分 DOM 重建：overlay、preset、腮红控件、图层列表和移动图层 dock。
- 贴纸图片有内存缓存 `STICKER_IMAGE_CACHE`。
- 移动端小元素有最小可操作选框，控制点有反向缩放变量，降低命中困难和按钮变形。

## 疑似瓶颈与风险
- `applyTonePipeline()` 是主线程逐像素全图处理，移动端大图、HSL、肤色保护、黑发保护、暗部平滑叠加时仍会造成明显阻塞。
- `renderCanvas()` 每次可能创建多个临时 canvas，低端手机上 GC 压力可能影响拖动后的恢复速度。
- 滤镜滑动中 CSS 预览只是近似，复杂项如肤色保护、腮红、黑发保护、局部 HSL 仍需要松手后的真实渲染补齐。
- `finishDrag()` 的 commit-on-end 路径会先清 CSS filter，再延后真实 render；若真实渲染慢，可能出现松手瞬间画面反馈跳变或短暂停顿。
- `overlayController.render()` 每次重建 overlay DOM；当前在拖动中会跳过，但释放后仍可能造成一次较重 DOM/布局开销。
- `finishInteraction()` 先移除 `is-transforming`，再写 store 和 render；如果真实 Canvas 渲染耗时，需重点复测是否会短暂露出旧位置、残影或内容消失。
- `activeTransformLayerId` 参与缓存隐藏逻辑，但当前 `startInteraction()` 没有在已读代码片段中看到持续设置为当前 layer id，需继续核查残影规避是否真正生效。
- `src/modules/canvasRenderer.js` 和 `src/modules/overlayLayer.js` 保留了较旧的实现，可能造成后续维护误判；当前主入口依赖 `src/app.js` 内部版本。
- 移动端 Safari、微信/内嵌浏览器对 pointer capture、range、touch-action 行为差异大，需要真机或 in-app browser 重点验证。
- `resize` 和 `orientationchange` 直接触发完整 render，旋转屏幕和键盘弹出路径可能造成突发卡顿。

## 本轮已完成
- 创建本任务记录 `tasks/smoothness-v2.md`。
- 在 `TASKS.md` 增加 P0 任务入口。
- 阅读 `PROJECT_CONTEXT.md`、`TASKS.md`、当前任务文件和交互/渲染主代码。
- 初步整理当前性能路径、已做优化、疑似瓶颈和验收标准。
- 产品层面收敛滤镜控制项：隐藏 HSL 整个面板，基础调色不再展示色温、色调偏移和对比度；底层参数、预设和算法保留。
- 对应调整滤镜控制 UI：滤镜面板 tab 从三列改为两段式铺满，匹配当前仅保留的「基础 / 人像」两组控制。

## 下一步建议
- 先复查 `activeTransformLayerId` 的设置时机，确认拖动中是否真正隐藏 Canvas 内原元素，优先解决残影和释放瞬间旧位置闪回。
- 梳理 `finishDrag()` 松手路径，让 CSS 近似预览、store 提交、清晰渲染之间不出现空窗或跳变。
- 对 `applyTonePipeline()` 做交互预览分层：滑动中明确跳过或降采样最重的后处理，松手后只执行一次清晰渲染。
- 将高频临时 canvas 尽量复用或集中缓存，降低低端手机 GC 抖动。
- 为 overlay 释放后增加“保持最后 DOM 预览直到真实 Canvas 完成”的策略，避免元素消失或旧位置残影。
- 复测 PC 端滑杆，确认桌面端拖动不因移动端 commit-on-end 策略退化。

## 验收标准
- 所有滑杆移动端可稳定拖动。
- 滑杆拖动中有实时反馈，松手后清晰渲染。
- 元素移动、缩放、旋转时内容和选框同步跟手。
- 释放后元素不消失、不残影、不延迟恢复。
- 点选画布元素立即展开对应控制器。
- PC 端操作不退化。
- 低端手机和内嵌浏览器下，拖动期间不因完整滤镜重算阻塞手指反馈。

## 修改文件
- `src/app.js`
- `styles.css`
- `TASKS.md`
- `tasks/smoothness-v2.md`

## 验证
```sh
node --check src/app.js
```

验证结果：通过。

## 遗留风险
- 当前整理基于代码静态阅读，尚未在真机/浏览器中复测。
- 后续优化必须避免改变滤镜最终审美参数和页面整体视觉。
