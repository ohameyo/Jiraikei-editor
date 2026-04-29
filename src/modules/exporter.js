import { renderCanvas } from './canvasRenderer.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawTextLayer(ctx, layer, canvas) {
  const x = (layer.x ?? 0.5) * canvas.width;
  const y = (layer.y ?? 0.5) * canvas.height;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((layer.rotation ?? 0) * Math.PI) / 180);
  ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
  ctx.font = `${layer.fontSize ?? 56}px ${layer.fontFamily ?? '"Avenir Next", sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (layer.shadowBlur) {
    ctx.shadowColor = layer.shadowColor ?? '#2f2532';
    ctx.shadowBlur = layer.shadowBlur;
  }

  if (layer.strokeWidth) {
    ctx.lineWidth = layer.strokeWidth;
    ctx.strokeStyle = layer.strokeColor ?? '#2f2532';
    ctx.strokeText(layer.content ?? '', 0, 0);
  }

  ctx.fillStyle = layer.color ?? '#ffeef5';
  ctx.fillText(layer.content ?? '', 0, 0);
  ctx.restore();
}

export async function exportPng(state) {
  const canvas = document.createElement('canvas');
  canvas.width = state.canvas.width;
  canvas.height = state.canvas.height;
  const ctx = canvas.getContext('2d');

  renderCanvas(ctx, state);

  const visibleLayers = state.layers.filter((layer) => layer.visible);
  for (const layer of visibleLayers) {
    if (layer.type === 'sticker') {
      const sticker = await loadImage(layer.src);
      const w = (layer.width ?? 0.2) * canvas.width;
      const h = (layer.height ?? 0.2) * canvas.height;
      const x = (layer.x ?? 0.5) * canvas.width;
      const y = (layer.y ?? 0.5) * canvas.height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(((layer.rotation ?? 0) * Math.PI) / 180);
      ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
      ctx.drawImage(sticker, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    if (layer.type === 'text') {
      drawTextLayer(ctx, layer, canvas);
    }
  }

  const link = document.createElement('a');
  link.download = `jirai-editor-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
