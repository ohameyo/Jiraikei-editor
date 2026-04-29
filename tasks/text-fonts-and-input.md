# 文字输入、字体与图层命名

## 优先级
P1。

## 背景
文字功能需要支持日文文案、字体切换、换行、对齐、描边、背景、阴影，并在移动端稳定显示。

## 当前问题
- 移动端部分日文字体可能加载慢或显示无差异。
- PC 输入文字曾出现卡顿。
- 文本框需要贴合实际文本范围。
- 移动端输入时不能自动放大页面。
- 移动端拖动文字图层时，跟手预览可能丢失描边。

## 相关文件
- `index.html`
- `styles.css`
- `src/app.js`
- `assets/fonts/*`

## 关键代码/变量
- `TEXT_FONTS`
- `TEXT_PRESETS`
- `DEFAULT_TEXT_STYLE`
- `ensureTextFontLoaded()`
- `makeTextInput()`
- `makeFontPicker()`
- `getTextLayerName()`
- `measureTextLayer()`
- `getTextLayout()`

## 已做修改
- 字体列表包含系统默认和 7 款本地字体。
- 文案预设替换为日文。
- 新增文字图层默认字体为 `宅在家麦克笔`。
- 文案预设默认字体为 `無心`。
- 页面不再首屏预加载全部本地字体，避免移动端加载被大字体阻塞。
- 字体 fallback 优先使用日文字体族，减少日文落到中文字体后显示无差异的问题。
- 字体切换改为先更新图层再后台加载字体，字体加载完成后自动重绘，避免点击字体时卡住。
- 字体加载改为优先使用 CSS Font Loading API 激活 `@font-face`，超时后回退到 JS `FontFace(url)` 注册，避免 `fetch + FontFace(ArrayBuffer)` 在部分浏览器卡住。
- 字体加载后使用 `document.fonts.load()` 按实际文案 `今日の私、満点!` 激活字体，修复默认文案无心体未应用的问题。
- JS 字体资源请求在 http/https 下增加版本号，绕开浏览器或 CDN 中曾经失败的旧字体缓存；`file://` 本地预览保持无 query，避免本地字体加载失败。
- 移除首屏字体 preload，避免移动端被约 46MB 本地字体阻塞加载。
- 移动端字体面板只保留 `無心`、`宅在家麦克笔`、`缝合像素日文`、`缝合像素简中`，并优先按这 4 款错峰加载预览；PC 端仍保留完整字体列表。
- 为移动端 4 款字体生成常用预览文字 woff2 子集：`mushin-mobile.woff2`、`zhaizai-marker-mobile.woff2`、`fusion-pixel-jp-mobile.woff2`、`fusion-pixel-sc-mobile.woff2`，移动端优先加载小体积子集，PC 端继续使用完整字体。
- PC 端仍保留完整字体列表和字体预热体验。
- 字体按钮示例文案统一为 `今日の私`。
- 取消字体加载中/未开始时的灰色预览样式，避免所有字体在加载阶段看起来像统一 fallback。
- 字体按钮预览改用独立 CSS 变量 `--font-preview-family` 设置字体，避免移动端/按钮样式覆盖预览字体。
- 文案预设列表会主动加载对应 preset 的字体，并使用 `--text-preset-family` 设置预设文字字体，避免被 `.preset-chip` 默认 UI 字体覆盖。
- 为字体预览和文案预设补充固定 `.text-font-*` CSS 类，并用 `!important` 绑定字体，减少 Safari/按钮继承样式导致的覆盖。
- `@font-face` 权重保持静态字体最兼容的 `400`，预览文本也用常规字重，避免本地 Safari 因权重 descriptor 或合成粗体显示成系统字体。
- 移除 `assets/fonts/*` 的 macOS `com.apple.quarantine` 隔离属性，解决 Safari `file://` 本地打开时拒绝加载字体、全部回退系统字体的问题。
- 文字图层保存 `fontId`，字体控制器不再只依赖 `fontFamily` 字符串反查当前字体。
- 为本地字体声明 `font-style` 和 `font-weight`，字体示例改用常规字重，降低浏览器合成粗体导致的显示趋同。
- 新增文字图层的默认文案改为 `>w<`，文案预设仍保留原日文列表。
- 导入 `宅在家麦克笔.ttf` 为 `assets/fonts/zhaizai-marker.ttf`，替换原字体列表中的 `缝合像素繁中` 槽位。
- 支持回车换行。
- 文本框缩放可改变字号。
- 增加左/中/右对齐。
- 默认文字位于画布右下，左对齐，开启描边，描边色 `#FF40FF`。
- 描边、背景、阴影改成开关逻辑。
- 图层名称同步为文字内容。
- 移动端输入控件字号设为 16px，并限制 viewport 缩放。
- 文字输入用 `requestAnimationFrame` 合并更新，输入中不重建属性面板，降低 PC 和移动端输入卡顿。
- 文本框范围按文字实际宽高、描边、阴影和开启后的背景留白计算；未开启背景时不再用背景留白撑大控制框。
- 画布预览文字对齐状态同步到 overlay 文字预览。
- 文字图层移动预览增加多方向 `text-shadow` 描边兜底，避免移动端 transform 过程中 `-webkit-text-stroke` 失效后描边消失。

## 修改文件
- `index.html`
- `styles.css`
- `src/app.js`
- `assets/fonts/zhaizai-marker.ttf`

## 验证结果
- `node --check src/app.js` 通过。
- 已确认 `zhaizai-marker.ttf` 覆盖 `>w<` 和 `今日の私` 所需字形。
- 已用浏览器打开 `file:///Users/meyo/Documents/Codex/2026-04-23-project-context-jirai-kei-photo-editor/index.html` 验证，文案预设字体已显示为对应字体效果。
- 已在本地页面创建文字图层，确认文字图层控制框和预览路径可加载；实际有图拖动场景需在移动端继续复测描边显示。

## 验收标准
- PC 和移动端字体切换明显、稳定。
- 输入文字不卡顿。
- 图层名称等于当前文字内容。
- 文本框贴合内容范围。
- 移动端输入文字时页面不自动放大。

## 遗留风险
- 真机移动端 Safari/微信内置浏览器的拖动中截图仍需复测，字体下载和 `font-display` 仍可能受系统缓存、网络和浏览器字体策略影响。
- 各字体的日文假名/汉字覆盖范围不同，少数字符仍可能按 fallback 字体显示。
