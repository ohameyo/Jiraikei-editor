const NEUTRAL_FILTERS = Object.freeze({
  skinWhiten: 0,
  blushStrength: 0,
  blackProtect: 0,
});

const EPSILON = 1e-6;

export function getGpuToneEligibility(filters = {}) {
  for (const [key, expected] of Object.entries(NEUTRAL_FILTERS)) {
    const actual = filters[key] ?? expected;
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > EPSILON) {
      return { eligible: false, reason: 'effects-not-migrated' };
    }
  }

  for (const [key, value] of Object.entries(filters)) {
    if (key.startsWith('hsl_')) {
      continue;
    }
  }

  return { eligible: true, reason: null };
}

export const getPassthroughEligibility = getGpuToneEligibility;

export function createToneRenderRequest({
  targetContext,
  sourceCanvas,
  sourceKey,
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
    sourceKey: sourceKey ?? sourceCanvas,
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
