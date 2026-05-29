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
- 导入 `Nonbiri_2.otf` 为 `assets/fonts/nonbiri-2.otf`，PC 和移动端字体选择器均可使用。
- 导入 `HaruTegakiFont12.otf` 为 `assets/fonts/haru-tegaki-12.otf`，PC 和移动端字体选择器均可使用。
- 导入 `ShigotoMemogaki-Regular-1-02.ttf` 为 `assets/fonts/shigoto-memogaki.ttf`，新增 `仕事メモ書き（日文）` 字体，PC 和移动端字体选择器均可使用。
- 导入 `KyouryunoGuratan.ttf` 为 `assets/fonts/kyouryuno-guratan.ttf`，新增 `きょうりゅうのグラタン（日文）` 字体，PC 和移动端字体选择器均可使用。
- `Nonbiri_2` 和 `HaruTegakiFont12` 使用字体内部 family 名 `Nonbiri_2` / `harutegakifont` 声明，提升 Safari 和本地预览兼容性。
- 字体选择器的字体名称和 `今日の私` 示例都套用对应字体，增强 PC 和移动端新字体预览可见性。
- 字体选择器预览文案默认按字体类型统一：中文字体显示 `我爱你`，日文字体显示 `愛してる`。
- `Nonbiri_2` 和 `HaruTegakiFont12` 在 PC 端保留现有胶囊尺寸，但改用各自稳定支持的日文样本 `のんびり` / `はるてがき`，避免 `愛してる` 中缺字导致整行 fallback 成系统字体、看起来没有预览效果。
- 支持回车换行。
- 文本框缩放可改变字号。
- 增加左/中/右对齐。
- 默认文字位于画布右下，左对齐，开启描边，描边色 `#e170c7`。
- 描边、背景、阴影改成开关逻辑。
- 图层名称同步为文字内容。
- 移动端输入控件字号设为 16px，并限制 viewport 缩放。
- 文字输入用 `requestAnimationFrame` 合并更新，输入中不重建属性面板，降低 PC 和移动端输入卡顿。
- 文本框范围按文字实际宽高、描边、阴影和开启后的背景留白计算；未开启背景时不再用背景留白撑大控制框。
- 画布预览文字对齐状态同步到 overlay 文字预览。
- 文字图层移动预览增加多方向 `text-shadow` 描边兜底，避免移动端 transform 过程中 `-webkit-text-stroke` 失效后描边消失。
- 文字选中框从 `outline + outline-offset` 改为内部 `::after` 虚线边框，修复移动端 Safari transform 渲染时左侧边线消失的问题。
- 移动端文字工具在图层属性折叠时，`ContentPanel` 改为从工具栏下方延伸到安全区底部并开启纵向滚动，修复小屏幕文案预设列表显示不完整且无法滑动的问题。
- 移除 `index.html` 中 `nonbiri-2.otf` 与 `haru-tegaki-12.otf` 的首屏 preload，恢复字体按需/错峰加载策略，避免移动端被新增大字体阻塞。
- 字体加载成功或失败后会强制刷新文字预设和图层属性面板，使字体选择器、文案预设和实际文字图层尽快从 fallback 状态切回真实字体状态。
- 文字拖动 DOM 预览取消居中网格布局，行内容按图层对齐方式铺满文本框，修复拖动中看起来居中、松手后左对齐的不一致。
- 文字图层松手时先提交最终图层状态并同步绘制 canvas，再撤掉 DOM 拖动预览，减少文字短暂消失后再出现的闪烁。
- 文字属性面板新增 `字重` 控制器，范围从 100-1000 提高到 100-1500，画布渲染和拖动 DOM 预览共用同一 `fontWeight`。
- 修复字重超过 1000 后文字缩小的问题：CSS/Canvas 合法字重封顶 1000，1000-1500 区间改用额外描画模拟加粗，避免浏览器解析非法字重导致字体度量异常。
- 字间距控制范围扩大到 `-24` 到 `36`，支持更大幅度收紧和拉开文字间距。
- `のんびり` 和 `はる手書き` 字体选择器预览文案统一改为 `愛してる`。
- 修复关闭文字描边后 canvas 仍有细描边的问题：描边关闭时不再调用 `strokeText()`，避免 `ctx.lineWidth = 0` 被浏览器忽略后保留默认 1px 描边。
- 线上测试反馈后补修：描边色 fallback、拖动 DOM 预览、颜色控制器默认值统一改为 `#e170c7`。
- 文字字号、字重、字间距、行间距和描边宽度滑杆在移动端不再等松手才提交，拖动中会按轻量节流实时更新画布预览。
- 移动端字体预览预热取消串行队列，改为错峰并行加载；未加载完成前不主动套用字体 class，减少大字体互相阻塞导致倒数几款预览迟迟不显示。
- 根据线上反馈回调：移动端字体按钮恢复 warmup probe 和字体 class 预览触发，避免字体预览因为等待 JS 加载状态而显得过慢。
- 文字选中态恢复为 DOM 文字预览显示，并在文字工具内从 preview canvas 临时跳过当前选中文字图层；点击画布取消选中后 canvas 会补回文字，避免松手后空框和点击确认后消失两类问题。
- 根据线上反馈回调：移动端字体按钮和文字预设会先套用字体 class 触发浏览器自身 `font-display`，字体未完成前显示 fallback 文案，目标字体加载完成后自动刷新为真实字体，避免预设区域长时间空白。
- 关闭文字描边时会同步把默认字色改为 `#F168CB`，无描边状态下的旧文字层也使用该颜色兜底。
- 文字预设渲染后会立即触发对应 preset 字体加载；移动端初始化空闲阶段也会优先加载当前字体和 `無心`，减少进入文字 tab 后等待。
- 移动端文字预设按钮取消继承低透明度，保证 fallback 阶段也能清晰看到文案预览。
- 重新生成 `zhaizai-marker-mobile.woff2` 子集，补入 `我爱你`、默认文案和日文激活样本所需字形；同时更新字体资源版本，修复 `宅在家麦克笔` 的 `我爱你` 预览一直回退系统字体的问题。

## 修改文件
- `index.html`
- `styles.css`
- `src/app.js`
- `assets/fonts/zhaizai-marker.ttf`
- `assets/fonts/nonbiri-2.otf`
- `assets/fonts/haru-tegaki-12.otf`
- `assets/fonts/shigoto-memogaki.ttf`
- `assets/fonts/kyouryuno-guratan.ttf`

## 验证结果
- `node --check src/app.js` 通过。
- 已用 in-app browser 打开本地 `file://` 页面验证，新字体按钮出现在移动端字体选择器中，字体名称和示例均使用对应字体样式。
- 已检查 `我爱你` / `愛してる` 在对应中文/日文字体中的字形覆盖；`Nonbiri_2` / `HaruTegakiFont12` 在 PC 端对统一日文样本存在缺字 fallback。
- 已验证 `node --check src/app.js` 通过；PC 端两款新字体已切换为各自稳定支持的预览样本。
- 已确认 `zhaizai-marker.ttf` 覆盖 `>w<` 和 `今日の私` 所需字形。
- 已检查 `nonbiri-2.otf` 和 `haru-tegaki-12.otf` 的字形覆盖；字体文件可加载，但部分中文/日文汉字会走 fallback。
- 已用浏览器打开 `file:///Users/meyo/Documents/Codex/2026-04-23-project-context-jirai-kei-photo-editor/index.html` 验证，文案预设字体已显示为对应字体效果。
- 已在本地页面创建文字图层，确认文字图层控制框和预览路径可加载；实际有图拖动场景需在移动端继续复测描边显示。
- 已验证 `node --check src/app.js` 通过。
- 已用本地服务 `http://127.0.0.1:4180/` 打开页面，首屏无控制台 error；添加文字图层后，字体选择器可显示 `のんびり` 和 `はる手書き`。
- 已验证 `node --check src/app.js` 通过；静态复核文字拖动收尾顺序为 `store.updateLayer()` 抑制自动重绘 -> 恢复 canvas 当前图层 -> 同步 `render()` -> 移除 DOM 预览。
- 已验证 `node --check src/app.js` 通过；静态复核 canvas `ctx.font`、测量路径和 overlay 文字预览均使用 `fontWeight`。
- 已验证 `node --check src/app.js` 通过；字重滑杆上限和 `getTextFontWeight()` clamp 已同步提高到 1500。
- 已验证 `node --check src/app.js` 通过；字重超过 1000 时不再把 1500 直接写入 CSS/Canvas `font-weight`，而是通过额外描画模拟加粗。
- 已验证 `node --check src/app.js` 通过；`zhaizai-marker-mobile.woff2` 约 6.5KB，并确认包含 `我爱你`、`今日の私`、`愛してる` 和 `>w<` 所需字形。
- 已验证 `node --check src/app.js` 通过；`仕事メモ書き（日文）` 与 `きょうりゅうのグラタン（日文）` 已加入字体选择器、移动端字体白名单和预热顺序。
- 已移除新增字体文件的 `com.apple.quarantine` 隔离属性，降低 Safari 本地加载被拒风险。
- 已在当前 in-app browser 刷新页面，移动端文字字体选择器中可见 `仕事メモ書き（日文） 愛してる` 与 `きょうりゅうのグラタン（日文） 愛してる` 两个按钮。
- 已验证 `node --check src/app.js` 通过；静态复核文字 canvas 渲染路径在 `strokeWidth <= 0.1` 时不会调用 `strokeText()`。
- 已验证 `node --check src/app.js` 通过。
- 已用本地服务 `http://127.0.0.1:4181/` 打开页面，首屏无控制台 error；创建文字图层后可见 12 个字体按钮、6 个文字滑杆和 2 个颜色输入。
- 已验证 `node --check src/app.js` 通过；静态复核文字工具内选中文字会由 DOM 预览显示，点击画布取消选中会清理预览缓存并立即重绘完整 canvas 文字。
- 已修复 preview 渲染路径中的 `hiddenLayerId` 作用域错误；该错误会导致 `getEdited()` 运行时失败并回退原图，从而表现为滤镜无效、文字不显示。
- 已验证 `node --check src/app.js` 通过；静态复核移动端 `shouldApplyFontPreviewClass()` 不再等待 ready 才套用字体 class，字体按钮和文字预设在字体未 ready 时仍显示 fallback 文案并触发真实字体加载。

## 验收标准
- PC 和移动端字体切换明显、稳定。
- 输入文字不卡顿。
- 图层名称等于当前文字内容。
- 文本框贴合内容范围。
- 移动端输入文字时页面不自动放大。

## 遗留风险
- 真机移动端 Safari/微信内置浏览器的拖动中截图仍需复测，字体下载和 `font-display` 仍可能受系统缓存、网络和浏览器字体策略影响。
- 各字体的日文假名/汉字覆盖范围不同，少数字符仍可能按 fallback 字体显示。
- `nonbiri-2.otf` 缺少 `私/満/点` 等字形，`haru-tegaki-12.otf` 缺少 `请/输` 等中文字形；对应字符会由 fallback 字体补齐。
- Cloudflare 线上缓存可能继续持有旧 JS/CSS；重新部署后需要确认 Worker/Pages 缓存已失效。
