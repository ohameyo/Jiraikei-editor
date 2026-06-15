const NEUTRAL_FILTERS = Object.freeze({
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  skinWhiten: 0,
  blushStrength: 0,
  blackProtect: 0,
  fade: 0,
  overlayStrength: 0,
});

const EPSILON = 1e-6;

export function getPassthroughEligibility(filters = {}) {
  for (const [key, expected] of Object.entries(NEUTRAL_FILTERS)) {
    const actual = filters[key] ?? expected;
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > EPSILON) {
      return { eligible: false, reason: 'effects-not-migrated' };
    }
  }

  for (const [key, value] of Object.entries(filters)) {
    if (key.startsWith('hsl_')) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || Math.abs(numericValue) > EPSILON) {
        return { eligible: false, reason: 'effects-not-migrated' };
      }
    }
  }

  return { eligible: true, reason: null };
}

export function createToneRenderRequest({
  targetContext,
  sourceCanvas,
  filters = {},
  vision = {},
  mode = 'preview',
  interactivePreview = false,
}) {
  if (!targetContext || !sourceCanvas) {
    throw new TypeError('Tone rendering requires a target context and source canvas');
  }

  return Object.freeze({
    targetContext,
    sourceCanvas,
    filters,
    vision,
    mode: mode === 'export' ? 'export' : 'preview',
    interactivePreview: Boolean(interactivePreview),
    size: Object.freeze({
      width: sourceCanvas.width,
      height: sourceCanvas.height,
    }),
  });
}
