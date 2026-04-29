# Vision Skill 接口约定

前端会自动尝试读取：
- `window.jiraiVisionSkill`
- 或 `window.__JIRAI_VISION_SKILL__`

若对象存在，优先调用（任选其一）：
- `analyzeImage(imageEl)`
- `detectPortrait(imageEl)`

返回结构：
```ts
{
  faceBoxes?: Array<{ x:number, y:number, width:number, height:number }>,
  faceLandmarks?: Array<Array<{ x:number, y:number }>>, // 可选，可传 0~1 归一化坐标
  personMask?:
    | HTMLCanvasElement
    | ImageData
    | { data: Uint8Array | Uint8ClampedArray, width:number, height:number }
    | HTMLImageElement
    | ImageBitmap
}
```

说明：
- `faceLandmarks` 目前主要用于后续精细腮红区域扩展（当前版本已接入字段）。
- `personMask` 会参与肤色提白/腮红的人像区域约束，减少背景误调。
- 未接入 skill 时，系统会回退到浏览器原生 `FaceDetector`（若可用）。
