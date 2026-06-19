export function shouldAutoEnterManualBlushFallback({
  isCurrentImport = false,
  isSameImage = false,
  activeTool = 'project',
  layerCount = 0,
  hasSelectedLayer = false,
  isSliderDragging = false,
  isTextEditing = false,
  isDirectManipulating = false,
} = {}) {
  if (!isCurrentImport || !isSameImage) return false;
  if (activeTool !== 'project') return false;
  if (layerCount > 0 || hasSelectedLayer) return false;
  if (isSliderDragging || isTextEditing || isDirectManipulating) return false;
  return true;
}
