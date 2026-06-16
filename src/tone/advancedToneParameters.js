export const PORTRAIT_TONE_RANGES = Object.freeze({
  skinWhiten: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
  blushStrength: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
  blackProtect: Object.freeze({ min: 0, default: 0, max: 1, step: 0.01 }),
});

export const ADVANCED_TONE_SAMPLE_PIXELS = Object.freeze([
  Object.freeze({ id: 'light-neutral', label: '浅色高光', group: 'light', rgb: Object.freeze([238, 232, 226]) }),
  Object.freeze({ id: 'dark-neutral', label: '深色灰阶', group: 'dark', rgb: Object.freeze([55, 51, 56]) }),
  Object.freeze({ id: 'black-white-ramp', label: '黑白过渡', group: 'black-white', rgb: Object.freeze([128, 128, 128]) }),
  Object.freeze({ id: 'black-hair', label: '黑发暗部', group: 'black-hair', rgb: Object.freeze([24, 22, 27]) }),
  Object.freeze({ id: 'skin-fair', label: '浅肤色', group: 'skin-tone', rgb: Object.freeze([239, 198, 174]) }),
  Object.freeze({ id: 'skin-medium', label: '中肤色', group: 'skin-tone', rgb: Object.freeze([188, 126, 91]) }),
  Object.freeze({ id: 'skin-deep', label: '深肤色', group: 'skin-tone', rgb: Object.freeze([107, 67, 49]) }),
  Object.freeze({ id: 'lip-red', label: '唇色红区', group: 'lip', rgb: Object.freeze([171, 58, 77]) }),
]);

export function isAdvancedToneFilterKey(key) {
  return Object.hasOwn(PORTRAIT_TONE_RANGES, key);
}
