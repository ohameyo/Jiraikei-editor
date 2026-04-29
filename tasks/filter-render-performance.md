# 滤镜渲染性能优化

## 优先级
P0。

## 背景
滤镜、HSL、人像参数在滑动中会触发画布重算，移动端容易出现卡顿。

## 当前问题
- 滤镜滑动中重算成本高。
- 移动端需要滑动中轻量预览，松手后精细渲染。
- 滤镜参数审美、HSL 默认值和色彩保护边界已迁移到 `tasks/filter-parameter-tuning.md`，本任务只跟进渲染性能。

## 相关文件
- `src/app.js`
- `styles.css`

## 关键代码/变量
- `FILTER_CONTROL_DEFS`
- `FILTER_PRESETS`
- `HSL_CHANNELS`
- `HSL_AXES`
- `applySelectiveHsl()`
- `renderToneBaseCanvas()`
- `createPreviewRenderState()`
- `getPreviewScaleForState()`
- `isSliderDragging`
- `previewRenderCache`

## 已做修改
- HSL 已加入肤色与低饱和保护逻辑。
- 滑动中预览尺寸会降低。
- 已将滤镜参数、滤镜质感和 HSL 色彩安全调教迁移/关联到 `tasks/filter-parameter-tuning.md`。

## 修改文件
- `tasks/filter-render-performance.md`
- `tasks/filter-parameter-tuning.md`
- `TASKS.md`

## 验证结果
- 已复查任务边界：本任务保留滑杆拖动、预览降采样、缓存和最终画质恢复等性能事项。

## 验收标准
- 移动端滤镜滑杆拖动不卡顿。
- 松手后画质恢复清晰。
- PC 端滤镜效果不退化。
- 性能优化不改变 `tasks/filter-parameter-tuning.md` 定义的最终滤镜效果。

## 遗留风险
- 如果 CPU 压力仍高，需考虑 worker、分块处理或缓存更多中间结果。
- 后续性能优化需要避免改变 `tasks/filter-parameter-tuning.md` 中定义的滤镜最终效果。
