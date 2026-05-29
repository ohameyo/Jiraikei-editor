# 马赛克贴纸比例与预览

## 优先级
P1。

## 背景
马赛克和贴纸需要保持比例稳定，拖动中预览要表达真实形状。

## 当前问题
- 马赛克贴纸比例不能随图片大小变形。
- 爱心马赛克移动中不能显示为椭圆预览。
- 贴纸列表保持当前 12 个，不需要额外医疗贴纸。

## 相关文件
- `src/app.js`
- `styles.css`
- `assets/user_stickers/*`

## 关键代码/变量
- `MOSAIC_TOOL_DEFAULTS`
- `drawShapePath()`
- `appendLayerPreview()`
- `applyFrostedBlurMosaic()`
- `applyGridGlassMosaic()`
- `getStickerMetrics()`
- `STICKER_IMAGE_CACHE`

## 已做修改
- 爱心马赛克拖动预览改为 SVG 心形。
- 马赛克贴纸比例问题做过修复。
- 移除误加的医疗贴纸。
- 再次从 `USER_STICKER_FILES` 排除 `sel_02.png` 创可贴，并更新贴纸资源版本，避免缓存继续显示医疗贴纸。
- 彻底删除 `assets/user_stickers/sel_02.png` 文件，避免旧代码或缓存路径再次加载创可贴资源。
- 贴纸缩略图改为绝对资源 URL，加载失败时自动回退到不带版本号的原始路径；贴纸缓存只在图片真正加载成功后写入，避免移动端出现空白贴纸格。
- iPad 竖屏贴纸网格改为固定上限的小卡片，避免等分 5 列时选框被撑得过大。
- 贴纸 tab 新增子项目 `手绘风格贴纸`，位于 `地雷系装饰贴纸` 下方。
- 贴纸包标题统一使用原 `field-title` 风格，并移除贴纸面板里重复的静态标题。
- PC 端贴纸面板释放最外层 `card-block` 容器，只保留每个贴纸包自身的分类卡片，避免两层嵌套圆角边框。
- `地雷系装饰贴纸` 继续追加 8 个挡脸/装饰素材：黑灰心形遮挡、粉色心形遮挡、链条十字心、链条绑带心、银色十字星光、黑心十字、链条宝石十字心、粉色珍珠十字心。
- 已删除上一版 10 个手绘贴纸素材，并替换为 7 个新的粉色手绘贴纸：线框、蝴蝶结、箭头、绑带、爱心翅膀、发光爱心、双爱心。新素材不再使用蕾丝裁切预览。
- `手绘风格贴纸` 继续追加 3 个粉色手绘素材：兔耳线框、星星十字、スキ。
- 线上测试反馈后补修：爱心马赛克 overlay 预览改用和 canvas 遮罩相同的心形路径，并按当前羽化/羽化范围追加多层 SVG 羽化预览，减少预览和实际渲染形状不一致。
- 按用户指定素材替换 `手绘风格贴纸` 正数第 8 个 / 倒数第 3 个贴纸为粉色“天使”字样，并更新手绘贴纸资源版本避免旧缩略图缓存。
- `地雷系装饰贴纸` 按主色重新排序为粉色、蓝色、黑色三段，便于移动端浏览时先看到粉色系贴纸。

## 验证
```sh
node --check src/app.js
curl -I 'http://127.0.0.1:4181/assets/hand_drawn_stickers/hand-drawn-08.png?v=20260512-hand-drawn-angel'
npx --yes wrangler@4.90.0 pages deploy . --project-name jirai-editor-ux-lab
curl -I 'https://4223a071.jirai-editor-ux-lab.pages.dev/assets/hand_drawn_stickers/hand-drawn-08.png?v=20260512-hand-drawn-angel'
```

验证结果：通过。

- 已在当前 in-app browser 刷新并进入贴纸 tab，确认显示 `地雷系装饰贴纸` 与 `手绘风格贴纸` 两个子项目。
- 旧版手绘贴纸曾导入 10 个素材，其中蕾丝 1/2/3 使用裁切预览；当前已被新版 7 个粉色手绘贴纸替换。
- 已追加 8 个 `deco_*.png` 到 `assets/user_stickers`，并更新贴纸资源版本，避免旧缓存不刷新。
- 已在当前 in-app browser 刷新并进入贴纸 tab，确认贴纸按钮共 30 个；`地雷系装饰贴纸` 包资源 20 个，其中新增 `deco_*.png` 8 个，`手绘风格贴纸` 10 个。
- 已清空 `assets/hand_drawn_stickers` 旧素材并导入 `hand-drawn-01.png` 到 `hand-drawn-07.png`，手绘贴纸资源版本更新为 `20260511-hand-drawn-2`。
- 已在当前 in-app browser 刷新并进入贴纸 tab，确认贴纸按钮共 27 个；`地雷系装饰贴纸` 包资源 20 个，`手绘风格贴纸` 包资源 7 个，旧手绘素材和裁切预览数量均为 0。
- 已导入 `hand-drawn-08.png` 到 `hand-drawn-10.png`，手绘贴纸资源版本更新为 `20260511-hand-drawn-3`。
- 已在当前 in-app browser 刷新并进入贴纸 tab，确认贴纸按钮共 30 个；`手绘风格贴纸` 包资源 10 个，其中新增 3 个素材均已出现。
- 已验证 `node --check src/app.js` 通过；静态复核爱心马赛克 overlay 和 canvas 遮罩共用 `HEART_PATH_POINTS`，overlay 额外按 `feather` / `featherRange` 绘制羽化层。
- 已验证 `node --check src/app.js` 通过；静态复核 `USER_STICKER_FILES` 顺序已改为粉色优先、蓝色居中、黑色靠后，`hand-drawn-08.png` 已替换为新素材。
- 本地静态服务确认新版 `hand-drawn-08.png?v=20260512-hand-drawn-angel` 返回 200。
- 已部署到 Cloudflare Pages 测试环境：`https://4223a071.jirai-editor-ux-lab.pages.dev`，线上新版手绘第 8 个贴纸资源返回 200。

## 验收标准
- 爱心马赛克拖动、缩放时显示心形预览。
- 贴纸和马赛克不会因图片比例变化而变形。
- 当前贴纸包只显示需要保留的 12 个。
- iPad 端贴纸选择格紧凑，贴纸缩略图和选框比例协调。
- 贴纸 tab 显示 `地雷系装饰贴纸` 与 `手绘风格贴纸` 两个子项目，手绘包共 10 个素材。
- 新版手绘素材缩略图正常完整展示，不再出现旧版蕾丝裁切预览。
- PC 端贴纸面板不出现外层大卡片和内层贴纸包卡片的双重嵌套边框。
- `地雷系装饰贴纸` 包包含原 12 个贴纸和新增 8 个装饰贴纸。
- 手绘第 8 个贴纸显示为粉色“天使”字样；地雷系装饰贴纸按粉色、蓝色、黑色主色分组排列。
