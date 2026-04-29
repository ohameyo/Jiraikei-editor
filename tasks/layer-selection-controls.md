# 画布元素选择与控制器展开

## 优先级
P0。

## 背景
画布元素包括马赛克、贴纸、文字、腮红选区。用户希望点选元素后立即出现对应控制器，未选中时不遮挡功能区。

## 当前问题
- 点选贴纸或马赛克后，控制器有时没有立刻展开。
- 移动端选中元素时，元素操作区应从功能 tab 下方开始，不应露出无关功能区。
- 未选中元素时，元素操作区应完全折叠。

## 相关文件
- `src/app.js`
- `styles.css`

## 关键代码/变量
- `renderLayerControls()`
- `renderMobileLayerDock()`
- `toolForLayer()`
- `setActiveTool()`
- `mobileLayerControlsExpanded`
- `lastLayerControlsKey`
- `overlayController.render()`
- `revealLayerControlsFor(layer)`

## 已做修改
- 元素控制区改为选中图层后展开。
- 图层集合按钮放在画布右上。
- 移动端未选择元素时尽量折叠控制区。

## 验收标准
- 点击画布上的贴纸、文字、马赛克，立即展开对应控制器。
- 添加新元素后，自动选中并展开对应控制器。
- 点击空白处可收起元素控制区。
- PC 端属性面板同步显示当前图层属性。

