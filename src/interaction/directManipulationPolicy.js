export const DIRECT_MANIPULATION_FRAME_ACTIONS = Object.freeze({
  previewOnly: 'preview-only',
  commitRender: 'commit-render',
  idleRender: 'idle-render',
});

export function getDirectManipulationFrameAction({
  isDirectManipulating = false,
  phase = 'preview',
  hasPendingPatch = false,
} = {}) {
  if (!isDirectManipulating) return DIRECT_MANIPULATION_FRAME_ACTIONS.idleRender;
  if (phase === 'commit' && hasPendingPatch) return DIRECT_MANIPULATION_FRAME_ACTIONS.commitRender;
  return DIRECT_MANIPULATION_FRAME_ACTIONS.previewOnly;
}

export function shouldQueueCanvasRenderForDirectManipulation(options = {}) {
  return getDirectManipulationFrameAction(options) !== DIRECT_MANIPULATION_FRAME_ACTIONS.previewOnly;
}

export function shouldSuppressPostManipulationOverlayClearClick({
  lastInteractionEndedAt = 0,
  now = Date.now(),
  thresholdMs = 180,
} = {}) {
  if (!lastInteractionEndedAt || !Number.isFinite(lastInteractionEndedAt)) return false;
  return now - lastInteractionEndedAt <= thresholdMs;
}

export function getLayerControlFrameAction({
  isSliderDragging = false,
  phase = 'preview',
  hasPreviewPatch = false,
} = {}) {
  if (phase === 'commit' && hasPreviewPatch) return DIRECT_MANIPULATION_FRAME_ACTIONS.commitRender;
  if (isSliderDragging && phase === 'preview') return DIRECT_MANIPULATION_FRAME_ACTIONS.previewOnly;
  return DIRECT_MANIPULATION_FRAME_ACTIONS.idleRender;
}

export function shouldCommitLayerControlOnEnd(options = {}) {
  return getLayerControlFrameAction(options) === DIRECT_MANIPULATION_FRAME_ACTIONS.commitRender;
}
