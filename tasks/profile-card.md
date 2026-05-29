# 个人简介卡片

## 优先级
P1。

## 背景
用户希望点击页面里的蝴蝶结 icon 后展示个人简介入口，便于访问小红书主页。

## 已做修改
- 桌面端侧栏蝴蝶结 logo 和移动端画布左上蝴蝶结 logo 改为可点击按钮。
- 新增简介弹层：圆形头像、小红书账号名称 `meyo酱の碎碎念`、一句话简介、跳转主页按钮。
- 圆形头像已从蝴蝶结 logo 替换为用户提供的娃娃头像素材 `assets/profile-avatar.png`。
- 头像素材已压缩到 320px 长边，体积从约 764KB 降到约 112KB；页面 head 增加头像 preload，简介卡片头像改为 eager 加载，避免打开简介时空白等待。
- 简介主页链接使用新窗口打开，并补充 `noopener noreferrer`。
- 新增简介弹层关闭按钮、点击遮罩关闭、Esc 关闭。
- 为简介打开事件补充 `profile_open` 埋点白名单。

## 修改文件
- `index.html`
- `src/app.js`
- `styles.css`
- `assets/profile-avatar.png`

## 验证
```sh
node --check src/app.js
curl -I http://127.0.0.1:4181/
npx --yes wrangler@4.90.0 pages deploy . --project-name jirai-editor-ux-lab
curl -I https://932f0be6.jirai-editor-ux-lab.pages.dev
curl -I https://932f0be6.jirai-editor-ux-lab.pages.dev/assets/profile-avatar.png
```

验证结果：通过。

- 本地静态服务 `http://127.0.0.1:4181/` 返回 200，页面可加载到最新 `index.html`。
- 本地静态服务确认 `assets/profile-avatar.png` 返回 200。
- 已部署到 Cloudflare Pages 测试环境：`https://932f0be6.jirai-editor-ux-lab.pages.dev`，线上首页与头像资源均返回 200。
- 已验证 `node --check src/app.js` 通过；本轮压缩后 `assets/profile-avatar.png` 约 112KB。

## 遗留风险
- 当前头像按圆形头像框居中裁切；如需完整展示头饰或衣服，需要后续再微调 `object-position` 或改成方形头像框。
