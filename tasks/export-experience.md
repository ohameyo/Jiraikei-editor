# 移动端与 PC 导出体验

## 优先级
P2。

## 背景
导出需要在移动端和 PC 端都稳定可用。移动端保存图片的真实习惯是长按保存到相册。

## 当前问题
- PC 端导出曾反馈受限。
- 移动端导出预览要强调长按图片保存到相册。
- 下载 PNG 在移动端只是文件下载，应弱化。
- 预览中 BEFORE/AFTER 字号要和画布视觉一致。

## 相关文件
- `src/app.js`
- `styles.css`

## 关键代码/变量
- `buildExportCanvas()`
- `cropPolaroidExportCanvas()`
- `exportPng()`
- `getCompareLabelStyle()`
- `compareMode`
- `exportModal`

## 已做修改
- 移动端导出预览增加长按保存提示。
- 下载 PNG 按钮弱化。
- 导出预览按钮间距做过修复。
- BEFORE/AFTER 字号做过统一。
- 拍立得启用后导出会裁出拍立得边框区域，并输出为拍立得素材自身尺寸，避免导出文件仍是原图尺寸。

## 验证结果
- `node --check src/app.js` 通过。
- 已静态复核非前后对比导出路径：`buildExportCanvas()` 在拍立得启用时调用 `cropPolaroidExportCanvas()`，竖版输出 `705x1111`，横版输出 `1111x705`。

## 验收标准
- PC 可以正常导出 PNG。
- 移动端可以打开导出预览并长按保存图片。
- 下载 PNG 不抢主视觉。
- 预览图和画布中的 BEFORE/AFTER 视觉大小一致。
- 拍立得模式导出的图片尺寸等于拍立得边框尺寸。
