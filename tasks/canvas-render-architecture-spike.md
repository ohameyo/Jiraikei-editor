# Canvas 渲染架构 spike

## 优先级
P0，承接 UX Lab 复盘。

## 背景
用户确认曾在 `jirai-editor-ux-lab` 中做过丝滑性实验，但效果没有达到质变。

lab 已尝试过：
- CSS filter 近似预览。
- 松手后 debounce 真实渲染。
- fast/fine 两级预览。
- 拖动期间阻断全局 render。
- 移动端进一步降低预览尺寸。
- 图层滑杆拖动只更新 overlay 预览。
- 腮红选区拖动只更新 overlay transform，松手后延迟滤镜渲染。

因此后续不能只继续调节流参数，需要验证渲染架构是否必须升级。

## 任务目的
判断 Jirai-editor 是否可以通过架构分层获得可见丝滑性提升，并找出最低成本路径。

## 重点问题
- `applyTonePipeline()` 是否能从主线程交互路径移走。
- Worker / OffscreenCanvas 是否适合当前滤镜管线和目标浏览器。
- 是否可以做“双管线”：交互预览低保真、最终输出高保真。
- 是否可以做“缓存底图 + 轻量图层合成”，避免每次图层变化重跑滤镜。
- 是否需要把重滤镜参数明确设计为“松手生效”。
- 是否存在比 Worker 更简单的收益点，例如预计算 tone base、复用 ImageData buffer、减少临时 canvas。

## 可选实验
1. Worker 版滤镜 spike：把纯像素处理迁出主线程，主线程只接收 bitmap/canvas。
2. OffscreenCanvas spike：验证 Safari/Chrome/内嵌浏览器支持与降级策略。
3. 双画布合成 spike：底层滤镜画布缓存，overlay/图层画布单独合成。
4. 预览/导出双质量 spike：预览永远低分辨率，导出才完整质量。
5. 图层操作保真 spike：拖动期间完全使用 DOM/canvas overlay，真实 canvas 延迟替换且不闪回。

## 验收标准
- 不要求一次性重构生产代码。
- 至少产出 1 个可运行最小实验或明确不可行证据。
- 对比 UX Lab 的既有优化，说明是否有肉眼可感的提升。
- 明确推荐路径：继续主线程优化、Worker 化、分层合成，或产品上接受松手生效。

## 当前状态
- 待开始。

