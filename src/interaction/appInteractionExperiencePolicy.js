export const APP_INTERACTION_EXPERIENCE_TARGETS = Object.freeze({
  maxCpuFallbacksDuringPreview: 0,
  maxCpuFallbacksAfterCommit: 0,
  minGpuRendersDuringPreview: 1,
  maxLayerCanvasRendersDuringDrag: 0,
});

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function summarizeAppInteractionExperience({
  tone = {},
  layerMove = {},
  layerControl = {},
} = {}) {
  const tonePreviewInstant =
    asNumber(tone.cpuFallbacksDuringPreview) <= APP_INTERACTION_EXPERIENCE_TARGETS.maxCpuFallbacksDuringPreview &&
    asNumber(tone.gpuRendersDuringPreview) >= APP_INTERACTION_EXPERIENCE_TARGETS.minGpuRendersDuringPreview &&
    asNumber(tone.cpuFallbacksAfterCommit) <= APP_INTERACTION_EXPERIENCE_TARGETS.maxCpuFallbacksAfterCommit &&
    tone.selectedRendererAfterCommit === 'gpu';

  const layerMoveInstant =
    asNumber(layerMove.renderEventsDuringDrag) <= APP_INTERACTION_EXPERIENCE_TARGETS.maxLayerCanvasRendersDuringDrag &&
    Boolean(layerMove.storeStableDuringDrag) &&
    Boolean(layerMove.committed) &&
    Boolean(layerMove.commitRendered);

  const layerControlInstant =
    asNumber(layerControl.renderEventsDuringDrag) <= APP_INTERACTION_EXPERIENCE_TARGETS.maxLayerCanvasRendersDuringDrag &&
    Boolean(layerControl.storeStableDuringDrag) &&
    Boolean(layerControl.overlayPreviewVisible) &&
    Boolean(layerControl.committed) &&
    Boolean(layerControl.commitRendered);

  return {
    passed: tonePreviewInstant && layerMoveInstant && layerControlInstant,
    tonePreviewInstant,
    layerMoveInstant,
    layerControlInstant,
    targets: APP_INTERACTION_EXPERIENCE_TARGETS,
  };
}
