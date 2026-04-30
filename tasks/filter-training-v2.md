# 滤镜调色训练 v2

## 优先级
P0。

## 本窗口目标
建立一套可反复迭代的滤镜调色训练流程，让 Jirai-editor 的滤镜更稳定、更符合地雷系自拍审美。本任务不继承旧滤镜长上下文，只以 `PROJECT_CONTEXT.md`、`TASKS.md` 和当前代码为准。

## 范围
- 原图、蕾粉、水色、灰粉、黑白等滤镜预设参数。
- 地雷系低饱和、冷调、灰粉、病弱感、少女感的调色标准。
- RGB/HSL、肤色保护、黑发保护、红色保真的参数训练。
- 避免脸部、手部、低饱和区域出现色块。
- 不同样张下的滤镜一致性。
- 滤镜评估标准和测试样张记录。
- 必要时新增训练文档或调色基准表。

## 不处理
- 滑杆性能。
- 元素拖拽。
- 贴纸/马赛克交互。
- 字体系统。
- 导出体验。
- 移动端布局。

## 当前代码基线
当前实际滤镜入口集中在 `src/app.js`：
- `FILTER_CONTROL_DEFS`：叠加强度、亮度、对比度、饱和度、色温、色调偏移、肤色提白、腮红强度、黑发保护、褪色/雾感。
- `HSL_CHANNELS`：`master`、`skin`、`red`、`orange`、`yellow`、`green`、`cyan`、`blue`、`purple`。
- `HSL_AXES`：色相 `-40~40`、饱和度 `-70~55`、明度 `-32~32`。
- `DEFAULT_FILTERS`：原图为全中性参数，叠加强度为 `0`，HSL 全通道为 `0`。
- `FILTER_PRESETS`：当前实际使用 `original`、`cold-pink`、`cold-blue`、`gray-pink`、`mono`。
- `blendPresetFiltersByStrength()`：通过叠加强度把基础参数和所有 HSL 参数按比例回退到原图。
- `applySelectiveHsl()`：执行综合色、色相分区、肤色 HSL，并通过肤色/低饱和安全权重降低色块风险。
- `applyTonePipeline()`：依次处理基础亮度/对比度/饱和度、HSL、绿色色块修正、肤色提白/腮红、色温/色调/雾感、叠色、黑发暗部保护和最终腮红叠染。

`src/config/filterPresets.js` 仍存在旧模块化配置，但当前主页面实现以 `src/app.js` 内部参数为准；后续若迁移，需要先确认运行入口。

## 当前预设参数

### 原图
- 风格定义：不套滤镜，仅保留原图。
- 基础参数：`brightness 1`、`contrast 1`、`saturation 1`、`temperature 0`、`tint 0`、`skinWhiten 0`、`blushStrength 0`、`blackProtect 0`、`fade 0`、`overlayStrength 0`。
- HSL：全通道 `0`。

### 蕾粉 `cold-pink`
- 风格定义：苍白肤感、粉色底调、梦幻雾感；应低饱和粉紫、少女感明显，但不能把肤色阴影和手部染成色块。
- 基础参数：`brightness 1.07`、`contrast 0.92`、`saturation 0.82`、`temperature 1`、`tint 25`、`skinWhiten 0.52`、`blushStrength 0.57`、`blackProtect 0.5`、`fade 0.14`、`overlayColor #F5B9E4`、`overlayStrength 0.14`。
- HSL：`master h1 s-3 l6`、`skin h4 s11 l8`、`red h-3 s13 l3`、`orange h-6 s-13 l4`、`yellow h-8 s-50 l6`、`green h13 s-62 l7`、`cyan h10 s-34 l6`、`blue h7 s-17 l4`、`purple h-4 s10 l6`。

### 水色 `cold-blue`
- 风格定义：冰冷清透、白灰高亮、低饱和冷蓝；压黄绿脏色，但脸部不能泛青，黑发不能漂灰。
- 基础参数：`brightness 1.06`、`contrast 0.96`、`saturation 0.64`、`temperature -29`、`tint -6`、`skinWhiten 0.39`、`blushStrength 0.11`、`blackProtect 0.63`、`fade 0.11`、`overlayColor #CDEBFA`、`overlayStrength 0.14`。
- HSL：`master h-3 s-21 l6`、`skin h-3 s-17 l7`、`red h-4 s-27 l2`、`orange h-7 s-43 l3`、`yellow h20 s-67 l8`、`green h22 s-55 l7`、`cyan h4 s13 l7`、`blue h3 s11 l7`、`purple h-6 s-20 l3`。

### 灰粉 `gray-pink`
- 风格定义：去色清透、保留粉感、黑白灰氛围；应接近灰阶但保留妆面和少女感。
- 基础参数：`brightness 1.01`、`contrast 1.03`、`saturation 0.48`、`temperature -8`、`tint 6`、`skinWhiten 0.48`、`blushStrength 0.48`、`blackProtect 0.9`、`fade 0.08`、`overlayColor #E2D7DF`、`overlayStrength 0.04`、`overlayStrengthMax 0.1`。
- HSL：`master h0 s-34 l2`、`skin h4 s6 l11`、`red h0 s-10 l2`、`orange h0 s-64 l3`、`yellow h0 s-94 l4`、`green h0 s-96 l6`、`cyan h0 s-88 l4`、`blue h0 s-82 l3`、`purple h0 s-54 l2`。

### 黑白 `mono`
- 风格定义：高明度黑白灰、苍白肤感、深黑头发与服饰、暗红唇妆残色；接近参考图的干净黑白，而不是柔灰微粉。
- 基础参数：`brightness 1.04`、`contrast 1.14`、`saturation 0.18`、`temperature -4`、`tint 0`、`skinWhiten 0.54`、`blushStrength 0.26`、`blackProtect 0.94`、`fade 0.025`、`overlayColor #DCDDE3`、`overlayStrength 0.006`、`overlayStrengthMax 0.03`。
- HSL：`master h0 s-72 l2`、`skin h1 s-8 l12`、`red h0 s-42 l1`、`orange h0 s-76 l2`、`yellow h0 s-96 l3`、`green h0 s-98 l4`、`cyan h0 s-96 l2`、`blue h0 s-94 l1`、`purple h0 s-78 l1`。

## 当前问题
- 参数集中写在 `src/app.js`，可比较性和回滚粒度不够理想；`src/config/filterPresets.js` 与实际运行参数不一致。
- 手部没有独立语义分割，只能依靠肤色概率、主体区域和低饱和保护，仍需样张验证是否出现局部断层。
- 红色保真目前主要依赖 red HSL、肤色/唇色候选修正和低饱和补偿，没有独立 `redPreserve` 面板参数。
- 水色和灰粉的全局去饱和较强，需要持续检查唇色、红色配饰和腮红是否被压平。
- 蕾粉对肤色、低饱和阴影和唇边最敏感，需要重点观察绿点、粉块和鼻翼阴影脏色。
- 黑白已按 3 张参考图调整为更接近干净高明度黑白，但仍保留 `saturation 0.18` 和 red/skin 少量残色，用于保留暗红唇妆与极弱粉发/妆面信息；需继续确认是否比纯灰阶更适合用户样张。

## 训练方法
1. 每次只改一组目标：一个预设、一个问题类型或一个保护策略。
2. 每次调参前记录：样张编号、当前参数、目标问题、预期方向。
3. 每次调参后记录：修改字段、修改前后、主观评分、失败样张、是否保留。
4. 至少用以下样张矩阵复测：正面自拍、半身自拍、室内暗光、白墙/灰墙、黑发黑衣、红色配饰、手部入镜、强妆面/弱妆面。
5. 参数修改集中在 `FILTER_PRESETS`、`DEFAULT_FILTERS`、`applySelectiveHsl()` 或明确的保护函数；避免散落到 UI 或渲染无关逻辑。
6. 若单张照片变好但两张以上样张变差，默认不合入参数，只记录为候选。
7. 合入前运行 `node --check src/app.js`，并更新本文件的训练记录和 `TASKS.md`。

## 评估标准
- 风格：低饱和、冷调、灰粉、病弱感、少女感稳定可辨。
- 肤色：脸部和手部不出现绿块、粉块、紫斑、断层或脏灰。
- 黑发：黑发和黑衣保留暗部层次，不被叠色或雾感洗平。
- 红色：唇色、蝴蝶结、小配饰有识别度，不被水色/灰粉/黑白完全压没。
- 低饱和区：白墙、灰墙、白衣、皮肤高光不被 HSL 染成局部色块。
- 一致性：同一预设在不同样张上保持同一种审美方向，而不是依赖单张照片。
- 可回滚：每次修改能明确指出字段和原因，能还原到上一个稳定参数组。

## 调参记录模板
```md
### YYYY-MM-DD / 预设名 / 目标
- 样张：
- 修改前目标：
- 修改字段：
- 修改后结果：
- 通过样张：
- 失败样张：
- 决策：保留 / 回退 / 候选
- 验证：
```

## 调参记录

### 2026-04-30 / 黑白 `mono` / 接近 3 张参考图
- 样张：用户提供 3 张地雷系棚拍/镜自拍参考图，画面特征为高明度白场、深黑头发和服饰、低彩度黑白灰、唇妆暗红残色、肤色苍白。
- 修改前目标：旧黑白为 `saturation 0.32`、`master s-52`、肤色和红色保留较多，整体更像柔灰微粉，不够接近参考图的干净黑白。
- 修改字段：`description`、`brightness 1 -> 1.04`、`contrast 1.08 -> 1.14`、`saturation 0.32 -> 0.18`、`temperature -2 -> -4`、`skinWhiten 0.46 -> 0.54`、`blushStrength 0.42 -> 0.26`、`blackProtect 0.92 -> 0.94`、`fade 0.04 -> 0.025`、`overlayStrength 0.01 -> 0.006`；HSL 改为综合色和非红色通道更强去饱和，肤色提亮但降饱和，红色中度保留。
- 修改后结果：目标是更亮、更冷、更接近黑白灰，白衣/白墙更干净，黑发黑衣仍压得住，唇色和少量妆面只保留弱残色。
- 通过样张：待用真实导入照片复测。
- 失败样张：待记录。
- 决策：候选合入；需要下一轮 AB 对比确认是否过亮或唇色被压太低。
- 验证：`node --check src/app.js` 通过。

## 已完成
- 创建滤镜调色训练 v2 任务文档。
- 梳理当前实际滤镜代码入口、预设参数、已知问题、训练方法和验收标准。
- 按用户提供的 3 张参考图调整黑白 `mono` 预设为更干净的高明度黑白灰方向。

## 修改文件
- `src/app.js`
- `tasks/filter-training-v2.md`
- `TASKS.md`

## 验证结果
- `node --check src/app.js` 通过。

## 遗留风险
- 当前尚未接入固定测试样张目录和自动色彩统计脚本。
- 当前记录来自代码静态复查，仍需用真实自拍样张做 AB 验证。
