export const FILTER_CONTROL_DEFS = [
  { key: 'brightness', label: '亮度', min: 0.6, max: 1.3, step: 0.01 },
  { key: 'contrast', label: '对比度', min: 0.7, max: 1.4, step: 0.01 },
  { key: 'saturation', label: '饱和度', min: 0.3, max: 1.2, step: 0.01 },
  { key: 'temperature', label: '色温', min: -100, max: 100, step: 1 },
  { key: 'tint', label: '色调偏移', min: -100, max: 100, step: 1 },
  { key: 'fade', label: '褪色 / 雾感', min: 0, max: 0.5, step: 0.01 },
  { key: 'softness', label: '柔化', min: 0, max: 8, step: 0.1 },
  { key: 'overlayStrength', label: '叠加强度', min: 0, max: 0.45, step: 0.01 },
];

export const DEFAULT_FILTERS = {
  brightness: 0.96,
  contrast: 1.04,
  saturation: 0.8,
  temperature: -16,
  tint: 14,
  fade: 0.16,
  softness: 1.2,
  overlayColor: '#e7d3ea',
  overlayStrength: 0.08,
};

export const FILTER_PRESETS = [
  {
    id: 'cold-pink',
    name: '冷粉梦境',
    description: '苍白肤感 + 粉色底调 + 梦幻雾感',
    filters: {
      brightness: 0.98,
      contrast: 1.02,
      saturation: 0.72,
      temperature: -12,
      tint: 24,
      fade: 0.19,
      softness: 1.8,
      overlayColor: '#f2d6e9',
      overlayStrength: 0.14,
    },
  },
  {
    id: 'cold-blue',
    name: '冷蓝阴郁',
    description: '冰冷清透 + 轻微暗调 + 冷感氛围',
    filters: {
      brightness: 0.93,
      contrast: 1.12,
      saturation: 0.66,
      temperature: -36,
      tint: 8,
      fade: 0.14,
      softness: 1.1,
      overlayColor: '#d8e3f4',
      overlayStrength: 0.18,
    },
  },
  {
    id: 'cold-purple',
    name: '冷紫人偶',
    description: '薰衣草色调 + 动漫感 + 优雅病弱感',
    filters: {
      brightness: 0.95,
      contrast: 1.06,
      saturation: 0.74,
      temperature: -24,
      tint: 34,
      fade: 0.18,
      softness: 1.5,
      overlayColor: '#dfd3f6',
      overlayStrength: 0.16,
    },
  },
];
