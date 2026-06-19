import { getGpuToneEligibility } from './toneRequest.js';

const LIGHTWEIGHT_LIMITS = Object.freeze({
  mobile: Object.freeze({ maxSide: 560, maxPixels: 280000 }),
  desktop: Object.freeze({ maxSide: 920, maxPixels: 680000 }),
});

const FULL_LIMITS = Object.freeze({
  mobile: Object.freeze({ maxSide: 1100, maxPixels: 1100000 }),
  desktop: Object.freeze({ maxSide: 1700, maxPixels: 2200000 }),
});

export function getPreviewScaleLimits({
  lightweight = false,
  mobilePreview = false,
  pressure = 0,
} = {}) {
  const limits = lightweight
    ? (mobilePreview ? LIGHTWEIGHT_LIMITS.mobile : LIGHTWEIGHT_LIMITS.desktop)
    : (mobilePreview ? FULL_LIMITS.mobile : FULL_LIMITS.desktop);
  const pressureScale = lightweight ? Math.max(0.78, Math.min(1, 1 - pressure * 0.08)) : 1;
  return {
    maxSide: limits.maxSide * pressureScale,
    maxPixels: limits.maxPixels * pressureScale,
  };
}

export function shouldDeferExpensiveToneRender({
  isSliderDragging = false,
  filters = {},
  webglToneRequested = false,
  polaroidEnabled = false,
} = {}) {
  if (!isSliderDragging || polaroidEnabled) return false;
  if (!webglToneRequested) return true;
  return !getGpuToneEligibility(filters).eligible;
}
