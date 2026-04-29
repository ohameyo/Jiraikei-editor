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

## 验证
```sh
node --check src/app.js
```

验证结果：通过。

## 验收标准
- 爱心马赛克拖动、缩放时显示心形预览。
- 贴纸和马赛克不会因图片比例变化而变形。
- 当前贴纸包只显示需要保留的 12 个。
- iPad 端贴纸选择格紧凑，贴纸缩略图和选框比例协调。
