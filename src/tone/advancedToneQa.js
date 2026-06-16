import { hslFilterKey } from './advancedToneParameters.js';

export const ADVANCED_TONE_QA_SAMPLE_GROUPS = Object.freeze([
  'light',
  'dark',
  'black-white',
  'black-hair',
  'skin-tone',
  'lip',
]);

const BASE_FILTERS = Object.freeze({
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  fade: 0,
  overlayStrength: 0,
  overlayColor: '#e7d3ea',
  skinWhiten: 0,
  blushStrength: 0,
  blackProtect: 0,
});

export const ADVANCED_TONE_QA_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'global-hsl',
    label: '综合色 HSL',
    requiredGroups: Object.freeze(['light', 'dark', 'black-white', 'skin-tone']),
    filters: Object.freeze({
      [hslFilterKey('master', 'h')]: 12,
      [hslFilterKey('master', 's')]: -24,
      [hslFilterKey('master', 'l')]: 10,
    }),
  }),
  Object.freeze({
    id: 'split-color-hsl',
    label: '分色 HSL',
    requiredGroups: Object.freeze(['light', 'skin-tone', 'lip']),
    filters: Object.freeze({
      [hslFilterKey('red', 'h')]: -8,
      [hslFilterKey('red', 's')]: 18,
      [hslFilterKey('orange', 's')]: -22,
      [hslFilterKey('yellow', 'l')]: 9,
      [hslFilterKey('blue', 's')]: -18,
    }),
  }),
  Object.freeze({
    id: 'skin-lip-hsl',
    label: '肤色与唇色',
    requiredGroups: Object.freeze(['skin-tone', 'lip']),
    filters: Object.freeze({
      [hslFilterKey('skin', 'h')]: 6,
      [hslFilterKey('skin', 's')]: 12,
      [hslFilterKey('skin', 'l')]: 10,
      [hslFilterKey('lip', 'h')]: -7,
      [hslFilterKey('lip', 's')]: 16,
      [hslFilterKey('lip', 'l')]: 4,
    }),
  }),
  Object.freeze({
    id: 'whiten-blush',
    label: '美白与腮红',
    requiredGroups: Object.freeze(['skin-tone', 'lip']),
    filters: Object.freeze({
      skinWhiten: 0.52,
      blushStrength: 0.58,
    }),
  }),
  Object.freeze({
    id: 'black-protect-smooth',
    label: '黑色保护与暗部平滑',
    requiredGroups: Object.freeze(['dark', 'black-white', 'black-hair']),
    filters: Object.freeze({
      blackProtect: 0.92,
      [hslFilterKey('black', 's')]: -36,
      [hslFilterKey('black', 'l')]: -5,
    }),
  }),
  Object.freeze({
    id: 'combined-export-parity',
    label: '高级调色综合导出一致性',
    requiredGroups: Object.freeze([...ADVANCED_TONE_QA_SAMPLE_GROUPS]),
    filters: Object.freeze({
      brightness: 1.08,
      contrast: 0.94,
      saturation: 0.74,
      temperature: -12,
      tint: 8,
      fade: 0.08,
      skinWhiten: 0.38,
      blushStrength: 0.34,
      blackProtect: 0.78,
      [hslFilterKey('master', 's')]: -18,
      [hslFilterKey('skin', 'l')]: 8,
      [hslFilterKey('lip', 's')]: 10,
      [hslFilterKey('black', 'l')]: -3,
    }),
  }),
]);

export function getAdvancedToneQaScenarioIds() {
  return ADVANCED_TONE_QA_SCENARIOS.map((scenario) => scenario.id);
}

export function buildAdvancedToneQaFilters(scenarioId) {
  const scenario = ADVANCED_TONE_QA_SCENARIOS.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new RangeError(`Unknown advanced tone QA scenario: ${scenarioId}`);
  }
  return {
    ...BASE_FILTERS,
    ...scenario.filters,
  };
}

export function validateAdvancedToneQaCoverage(samples, requiredGroups = ADVANCED_TONE_QA_SAMPLE_GROUPS) {
  const coveredGroups = new Set((samples || []).map((sample) => sample.group).filter(Boolean));
  const missingGroups = requiredGroups.filter((group) => !coveredGroups.has(group));
  return {
    ok: missingGroups.length === 0,
    missingGroups,
  };
}
