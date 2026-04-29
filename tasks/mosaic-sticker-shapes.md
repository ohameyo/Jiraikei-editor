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

## 验收标准
- 爱心马赛克拖动、缩放时显示心形预览。
- 贴纸和马赛克不会因图片比例变化而变形。
- 当前贴纸包只显示需要保留的 12 个。

