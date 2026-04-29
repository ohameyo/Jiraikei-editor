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
- `renderExportImage()`
- `downloadCanvas()`
- `getCompareLabelStyle()`
- `compareMode`
- `exportModal`

## 已做修改
- 移动端导出预览增加长按保存提示。
- 下载 PNG 按钮弱化。
- 导出预览按钮间距做过修复。
- BEFORE/AFTER 字号做过统一。

## 验收标准
- PC 可以正常导出 PNG。
- 移动端可以打开导出预览并长按保存图片。
- 下载 PNG 不抢主视觉。
- 预览图和画布中的 BEFORE/AFTER 视觉大小一致。

