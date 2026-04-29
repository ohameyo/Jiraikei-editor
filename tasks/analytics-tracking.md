# 用户行为统计埋点

## 优先级
P1。

## 背景
需要在 Cloudflare Pages 部署下统计基础访问量与核心编辑行为，用于判断用户是否能完成导入、编辑、预览和下载流程。

## 隐私边界
- 不采集用户图片或图片数据。
- 不采集图片文件名。
- 不采集用户输入文字或文字图层内容。
- 不采集人脸框、人脸关键点、分割蒙版或其他人脸数据。
- 不采集姓名、邮箱、账号、IP 等个人身份信息。
- 不生成或上报用户 ID、设备 ID、随机 session ID 等可持续关联标识。
- 仅保留安全的枚举、布尔值和粗粒度数字，例如工具名、预设 ID、贴纸 ID、字体 ID、画布图层数量、图片宽高和文件大小。

## 10 个核心事件
- `app_open`：页面打开，用于访问量统计。
- `tool_select`：用户切换工具栏。
- `image_upload_success`：图片成功读取到浏览器内存，不含文件名和图片内容。
- `filter_preset_apply`：套用滤镜预设或恢复原图。
- `filter_adjust`：完成一次滤镜/HSL 滑杆调整。
- `sticker_add`：添加贴纸图层。
- `text_add`：添加文字图层或文案预设，不含文字内容。
- `compare_toggle`：切换前后对比。
- `export_preview_open`：移动端或受限环境打开导出预览。
- `download_png`：触发 PNG 下载。

## 已做修改
- 在 `src/app.js` 中统一封装 `trackEvent(name, payload)`。
- `trackEvent()` 使用 allowlist 限制事件名，并对 payload 做字段名、类型和长度过滤。
- 前端优先用 `navigator.sendBeacon('/analytics')`，失败后用 `fetch(..., keepalive: true)` 兜底。
- 为页面打开、工具切换、上传成功、滤镜预设、滤镜调整、贴纸添加、文字添加、前后对比、导出预览和下载 PNG 接入埋点。
- 新增 Cloudflare Pages Function `functions/analytics.js`。
- Pages Function 对事件名和字段做二次 allowlist，只写入安全字段。
- Cloudflare 环境存在 `ANALYTICS` 绑定时写入 Workers Analytics Engine；本地或未配置绑定时返回成功但不落库，避免影响静态页面使用。

## Cloudflare 配置
部署时需要在 Cloudflare Pages 项目中绑定 Workers Analytics Engine 数据集：
- Binding name: `ANALYTICS`
- 前端请求路径: `/analytics`
- Function 文件: `functions/analytics.js`

## 修改文件
- `src/app.js`
- `functions/analytics.js`
- `tasks/analytics-tracking.md`
- `TASKS.md`

## 验证结果
- `node --check src/app.js` 通过。
- `node --check functions/analytics.js` 通过。

## 验收标准
- 前端只有一个统一埋点入口 `trackEvent()`。
- 首批只实现 10 个核心事件。
- 上传、滤镜、贴纸、文字、导出预览、下载 PNG 都有事件覆盖。
- Cloudflare Pages 部署后可通过 Analytics Engine 绑定落库。
- 埋点不发送图片、文件名、用户输入文字、人脸数据或个人身份信息。

## 遗留风险
- 本轮未在真实 Cloudflare Pages 环境验证 `ANALYTICS` 绑定写入，需要部署后用 Analytics Engine 查询确认数据点。
- 未配置 `ANALYTICS` 绑定时接口会成功返回但不保存数据，这是为了不阻塞静态页面和本地开发。
