export const BASIC_TONE_RANGES = Object.freeze({
  brightness: Object.freeze({ min: 0.6, default: 1, max: 1.3 }),
  contrast: Object.freeze({ min: 0.7, default: 1, max: 1.4 }),
  saturation: Object.freeze({ min: 0.3, default: 1, max: 1.2 }),
  temperature: Object.freeze({ min: -100, default: 0, max: 100 }),
  tint: Object.freeze({ min: -100, default: 0, max: 100 }),
  fade: Object.freeze({ min: 0, default: 0, max: 0.5 }),
  overlayStrength: Object.freeze({ min: 0, default: 0, max: 0.45 }),
});

const DEFAULT_OVERLAY_COLOR = '#e7d3ea';
const FALLBACK_OVERLAY_RGB = Object.freeze([239 / 255, 212 / 255, 230 / 255]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(value, range) {
  const numeric = Number(value);
  return clamp(
    Number.isFinite(numeric) ? numeric : range.default,
    range.min,
    range.max,
  );
}

export function parseHexColor(value) {
  const clean = String(value || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [...FALLBACK_OVERLAY_RGB];
  }

  return [
    Number.parseInt(clean.slice(0, 2), 16) / 255,
    Number.parseInt(clean.slice(2, 4), 16) / 255,
    Number.parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

export function normalizeBasicToneParameters(filters = {}) {
  const overlayColor =
    typeof filters.overlayColor === 'string'
      ? filters.overlayColor
      : DEFAULT_OVERLAY_COLOR;

  return {
    brightness: normalizeNumber(filters.brightness, BASIC_TONE_RANGES.brightness),
    contrast: normalizeNumber(filters.contrast, BASIC_TONE_RANGES.contrast),
    saturation: normalizeNumber(filters.saturation, BASIC_TONE_RANGES.saturation),
    temperature: normalizeNumber(filters.temperature, BASIC_TONE_RANGES.temperature),
    tint: normalizeNumber(filters.tint, BASIC_TONE_RANGES.tint),
    fade: normalizeNumber(filters.fade, BASIC_TONE_RANGES.fade),
    overlayStrength: normalizeNumber(
      filters.overlayStrength,
      BASIC_TONE_RANGES.overlayStrength,
    ),
    overlayColor,
    overlayColorRgb: parseHexColor(overlayColor),
  };
}
