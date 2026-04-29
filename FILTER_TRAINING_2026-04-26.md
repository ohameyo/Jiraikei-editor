# 地雷系滤镜训练结果（2026-04-26）

数据源：`/Users/meyo/Desktop/训练`

分类样本数：
- 蕾粉：4
- 水色：4
- 灰粉：11
- 黑白：9

> 说明：样本多数为截图，已用中心区域二次统计，尽量降低 UI 边框干扰。

## 1) 风格统计摘要（中心裁剪统计）

- 蕾粉：
  - 亮度均值 `0.5586`
  - 饱和均值 `0.0869`
  - 粉色占比 `0.6336`
  - 蓝色占比 `0.0702`
  - 暗部占比 `0.0914`
  - 结论：低饱和、明显粉偏、黑发/黑衣需要保深。

- 水色：
  - 亮度均值 `0.6552`
  - 饱和均值 `0.0781`
  - 粉色占比 `0.0617`
  - 蓝色占比 `0.9195`
  - 暗部占比 `0.0430`
  - 结论：高亮清透、全局蓝偏、但主体暗部不能漂灰。

- 灰粉：
  - 亮度均值 `0.6522`
  - 饱和均值 `0.0314`
  - 粉色占比 `0.4413`
  - 蓝色占比 `0.2392`
  - 暗部占比 `0.1006`
  - 结论：接近去色灰阶，但要保留粉感（妆容/肤色）。

- 黑白：
  - 亮度均值 `0.5753`
  - 饱和均值 `0.0211`
  - 粉色占比 `0.3297`
  - 蓝色占比 `0.4555`
  - 暗部占比 `0.1775`
  - 结论：黑白灰主导，层次对比更强，少量面部粉意。

## 2) 可落地训练参数（对应当前引擎）

当前引擎参数：
`brightness/contrast/saturation/temperature/tint/skinWhiten/blushStrength/blackProtect/fade/overlayColor/overlayStrength + HSL分区`

### 蕾粉（全局粉倾向）

```json
{
  "brightness": 1.05,
  "contrast": 0.93,
  "saturation": 0.67,
  "temperature": -8,
  "tint": 24,
  "skinWhiten": 0.62,
  "blushStrength": 0.74,
  "blackProtect": 0.82,
  "fade": 0.14,
  "overlayColor": "#EFD4E6",
  "overlayStrength": 0.14
}
```

HSL 建议：
- master: `s -10`, `l +4`
- skin: `h +4`, `s +10`, `l +10`
- yellow/green: 强去色（`s -70~-90`）
- blue/purple: 轻去色 + 轻提亮（避免脏灰）

### 水色（全局蓝倾向）

```json
{
  "brightness": 1.03,
  "contrast": 0.98,
  "saturation": 0.62,
  "temperature": -30,
  "tint": -3,
  "skinWhiten": 0.50,
  "blushStrength": 0.20,
  "blackProtect": 0.86,
  "fade": 0.11,
  "overlayColor": "#D6E5F5",
  "overlayStrength": 0.16
}
```

HSL 建议：
- master: `s -16`, `l +4`
- skin: `h +2`, `s -8`, `l +8`
- green/cyan: 向蓝偏移（小幅 hue 偏移）
- yellow: 大幅去色（压暖黄）

### 灰粉（去色 + 保粉）

```json
{
  "brightness": 1.01,
  "contrast": 1.03,
  "saturation": 0.38,
  "temperature": -8,
  "tint": 6,
  "skinWhiten": 0.42,
  "blushStrength": 0.34,
  "blackProtect": 0.90,
  "fade": 0.08,
  "overlayColor": "#E2D7DF",
  "overlayStrength": 0.06
}
```

HSL 建议：
- master: `s -42`, `l +2`
- skin: `h +4`, `s -10`, `l +10`
- orange/yellow/green/cyan/blue/purple: 全部强去色
- red: 仅中度去色，留妆面粉感

### 黑白（黑白灰主导 + 面部少量粉）

```json
{
  "brightness": 0.98,
  "contrast": 1.12,
  "saturation": 0.12,
  "temperature": -4,
  "tint": 0,
  "skinWhiten": 0.36,
  "blushStrength": 0.18,
  "blackProtect": 0.96,
  "fade": 0.04,
  "overlayColor": "#DCDDE3",
  "overlayStrength": 0.03
}
```

HSL 建议：
- master: `s -88`
- skin: `h +2`, `s -40`, `l +8`
- 其余色相: 近乎全去色（`s -85~-100`）

## 3) 分区调色能力边界（当前版本）

当前“分区”能力是：
1. 基于色相通道的 HSL 分区（全图）
2. 基于肤色阈值 + 人脸框加权的肤色提白/腮红
3. 黑发保护（暗部 + 低色度区域保护）

不等于：语义级人脸分割/发丝分割。也就是说目前是“准分区”，不是完全精准的 AI 分割。

## 4) 下一步落地建议

1. 将四类参数写入 `FILTER_PRESETS`（新增灰粉、黑白）。
2. 为四类分别固化 HSL 默认值（当前仅主参数有默认值）。
3. 对每类做 5 张真实自拍 AB 测，记录“肤色、黑发、暗部细节、噪点”四项评分。
4. 若要“腮红只在脸颊”级别精准，建议后续接入人脸关键点/人像分割 skill。
