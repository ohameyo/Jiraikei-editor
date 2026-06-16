export const HSL_CHANNELS = Object.freeze([
  Object.freeze({ id: 'master', name: '综合色', swatch: '#e7c8ac' }),
  Object.freeze({ id: 'skin', name: '肤色', swatch: '#f4c3a0' }),
  Object.freeze({ id: 'lip', name: '唇色', swatch: '#d95f77' }),
  Object.freeze({ id: 'red', name: '红', swatch: '#e86a70', center: 0, width: 34 }),
  Object.freeze({ id: 'orange', name: '橙', swatch: '#f0a35a', center: 28, width: 32 }),
  Object.freeze({ id: 'yellow', name: '黄', swatch: '#e9dc63', center: 56, width: 34 }),
  Object.freeze({ id: 'green', name: '绿', swatch: '#6ccd68', center: 122, width: 38 }),
  Object.freeze({ id: 'cyan', name: '青', swatch: '#53c8d8', center: 182, width: 38 }),
  Object.freeze({ id: 'blue', name: '蓝', swatch: '#6079e8', center: 228, width: 36 }),
  Object.freeze({ id: 'purple', name: '紫', swatch: '#a66ae5', center: 286, width: 38 }),
  Object.freeze({ id: 'black', name: '黑', swatch: '#2f2b34' }),
]);

export const HSL_AXES = Object.freeze([
  Object.freeze({ axis: 'h', label: '色相', min: -40, default: 0, max: 40, step: 1 }),
  Object.freeze({ axis: 's', label: '饱和度', min: -70, default: 0, max: 55, step: 1 }),
  Object.freeze({ axis: 'l', label: '明度', min: -32, default: 0, max: 32, step: 1 }),
]);

export const PORTRAIT_TONE_RANGES = Object.freeze({
  skinWhiten: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
  blushStrength: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
  blackProtect: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
});

export const ADVANCED_TONE_SAMPLE_PIXELS = Object.freeze([
  Object.freeze({ id: 'light-neutral', label: '浅色高光', rgb: Object.freeze([238, 232, 226]) }),
  Object.freeze({ id: 'dark-neutral', label: '深色灰阶', rgb: Object.freeze([55, 51, 56]) }),
  Object.freeze({ id: 'black-white-ramp', label: '黑白过渡', rgb: Object.freeze([128, 128, 128]) }),
  Object.freeze({ id: 'black-hair', label: '黑发暗部', rgb: Object.freeze([24, 22, 27]) }),
  Object.freeze({ id: 'skin-fair', label: '浅肤色', rgb: Object.freeze([239, 198, 174]) }),
  Object.freeze({ id: 'skin-medium', label: '中肤色', rgb: Object.freeze([188, 126, 91]) }),
  Object.freeze({ id: 'skin-deep', label: '深肤色', rgb: Object.freeze([107, 67, 49]) }),
  Object.freeze({ id: 'lip-red', label: '唇色红区', rgb: Object.freeze([171, 58, 77]) }),
]);

export function hslFilterKey(channelId, axis) {
  return `hsl_${channelId}_${axis}`;
}

export function hslFilterKeys() {
  return HSL_CHANNELS.flatMap((channel) =>
    HSL_AXES.map(({ axis }) => hslFilterKey(channel.id, axis)),
  );
}

export function isAdvancedToneFilterKey(key) {
  return (
    hslFilterKeys().includes(key) ||
    Object.hasOwn(PORTRAIT_TONE_RANGES, key)
  );
}
