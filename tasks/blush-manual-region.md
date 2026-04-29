# 腮红识别失败与手动选区

## 优先级
P1。

## 背景
当无法识别人脸时，需要提示用户，并提供可编辑腮红选区。

## 当前问题
- 未识别人脸时手动腮红选区需要更容易点选和移动。
- 腮红选区在切换 tab 或恢复原图时不应复位。
- 腮红移动时需要实时跟手。

## 相关文件
- `src/app.js`
- `src/vision-skill.js`
- `styles.css`

## 关键代码/变量
- `blushEditMode`
- `blushPreviewEnabled`
- `blushFallbackNoticeShown`
- `enterManualBlushFallback()`
- `renderBlushControls()`
- `drawBlushPreview()`
- `preserveManualBlushRegion()`

## 已做修改
- 识别失败时会进入手动腮红 fallback。
- 腮红选区加大过，便于手指操作。
- 原图滤镜会保留手动腮红区域。

## 验收标准
- 未识别人脸时有明确提示。
- 手动腮红选区可轻松点选、移动、缩放。
- 切换 tab、点原图、恢复原图不改变已确认腮红位置。

