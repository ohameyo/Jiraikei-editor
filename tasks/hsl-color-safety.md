# HSL 色块与肤色保护

## 优先级
P1。

## 背景
HSL 和部分滤镜可能让脸部、手部出现不自然色块，需要限制影响范围。

滤镜预设参数、整体滤镜质感、HSL 默认值和可调范围统一迁移/关联到 `tasks/filter-parameter-tuning.md`；本任务作为 HSL 色彩安全专项记录。

## 当前问题
- 水色、蕾粉、HSL 可能在脸上出现绿/粉色块。
- 色相和亮度调节范围可能过大。
- 具体预设参数和审美方向由 `tasks/filter-parameter-tuning.md` 统一维护。

## 相关文件
- `src/app.js`

## 关键代码/变量
- `HSL_AXES`
- `HSL_CHANNELS`
- `applySelectiveHsl()`
- `getHueChannelWeight()`
- `skinMask`
- `personMaskCanvas`

## 已做修改
- 低饱和区域减少 HSL 权重。
- 肤色区域减少 HSL 影响。
- HSL 范围曾收窄。
- 已将 HSL 默认值、可调范围、肤色/手部/低饱和保护要求迁移/关联到 `tasks/filter-parameter-tuning.md`。
- 修复移动端 HSL 通道按钮被系统 emoji 强制渲染为红色爱心的问题，改为 CSS 可控色票爱心。

## 修改文件
- `src/app.js`
- `styles.css`
- `tasks/hsl-color-safety.md`
- `tasks/filter-parameter-tuning.md`
- `TASKS.md`

## 验证结果
- 已复查任务边界：本任务保留 HSL 色彩安全专项，具体预设参数和整体质感由 `tasks/filter-parameter-tuning.md` 统一维护。
- `node --check src/app.js` 通过。

## 验收标准
- 人脸、手部不出现明显色块。
- HSL 仍保留可见调色效果。
- 预设滤镜在不同照片上稳定。
- HSL 安全策略符合 `tasks/filter-parameter-tuning.md` 的滤镜质感目标。

## 遗留风险
- 具体 HSL 数值仍需结合样片验证。
