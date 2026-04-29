# 腮红识别失败与手动选区

## 优先级
P1。

## 背景
当无法识别人脸时，需要提示用户，并提供可编辑腮红选区。

## 当前问题
- 未识别人脸时手动腮红选区需要更容易点选和移动。
- 腮红选区在切换 tab 或恢复原图时不应复位。
- 腮红移动时需要实时跟手。
- 多人照片需要自动给每张识别到的人脸添加腮红区域。
- 手动模式需要支持双人合照场景下额外新增 1 组左右腮红选区。

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
- `detectPortraitData()`
- `sortFacesByPriority()`
- `buildBlushRegions()`
- `getAutoBlushControls()`
- `controlsToBlushRegions()`
- `blushExtraEnabled`
- `blushExtraLeft*`
- `blushExtraRight*`

## 已做修改
- 识别失败时会进入手动腮红 fallback。
- 腮红选区加大过，便于手指操作。
- 原图滤镜会保留手动腮红区域。
- 人像识别不再只保留主脸，自动腮红会按多张脸生成多个左右腮红区域。
- 自动多人腮红兼容旧的单人左右腮红 controls。
- 手动模式新增 1 组额外腮红选区，面向双人合照；新增后画布上出现第二组左右腮红，可移动、缩放，并可通过删除按钮移除第二组。

## 修改文件
- `src/app.js`
- `tasks/blush-manual-region.md`

## 验证结果
- `node --check src/app.js` 通过。

## 验收标准
- 未识别人脸时有明确提示。
- 手动腮红选区可轻松点选、移动、缩放。
- 切换 tab、点原图、恢复原图不改变已确认腮红位置。
- 多人照片在自动识别成功时，每张脸都有左右腮红区域。
- 双人合照可手动新增 1 组左右腮红选区，新增后不可重复添加第三组。

## 遗留风险
- 当前手动新增只支持额外 1 组，适用于双人合照；三人及以上仍依赖自动识别多人腮红。
