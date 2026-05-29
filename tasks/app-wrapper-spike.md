# App 封装可行性 spike

## 优先级
P2，需在 Web 核心体验和 PWA 试验后推进。

## 任务目的
评估 Jirai-editor 是否需要以及如何封装成 App，重点比较 Capacitor、Tauri、Electron 和原生重写的成本、收益与风险。

## 前置条件
- Web 版本性能基线明确。
- PWA 试验结果明确。
- 已确认目标平台和分发方式。

## 范围
- Capacitor 移动端 WebView 小样：文件选择、保存到相册、分享、状态栏、安全区、Canvas 性能。
- Tauri 桌面小样：本地文件、窗口、菜单、资源包体积。
- Electron 仅作为桌面兼容性备选。
- 原生重写只做条件判断，不直接启动。

## 判断标准
- 是否需要系统级保存/分享/文件权限。
- WebView 中 Canvas 和导出是否达标。
- App 包体积、维护成本、上架成本是否可接受。
- 是否能复用现有 Web 核心逻辑。

## 推荐默认路线
- 移动端优先 Capacitor。
- 桌面端优先 Tauri。
- Electron 暂缓。
- 原生重写暂缓。

## 当前状态
- 待开始。

