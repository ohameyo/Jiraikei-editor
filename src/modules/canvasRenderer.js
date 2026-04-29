import { applyFrostedBlurMosaic, applyGridGlassMosaic } from './mosaicEffects.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawImageCover(ctx, image, cw, ch) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = cw / ch;

  let drawWidth;
  let drawHeight;
  let dx;
  let dy;

  if (imageRatio > canvasRatio) {
    drawHeight = ch;
    drawWidth = ch * imageRatio;
    dx = (cw - drawWidth) / 2;
    dy = 0;
  } else {
    drawWidth = cw;
    drawHeight = cw / imageRatio;
    dx = 0;
    dy = (ch - drawHeight) / 2;
  }

  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}

function applyGlobalTone(ctx, workingCanvas, filters) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const b = clamp(filters.brightness, 0.4, 1.6);
  const c = clamp(filters.contrast, 0.4, 1.8);
  const s = clamp(filters.saturation, 0, 1.8);
  const soft = clamp(filters.softness, 0, 12);

  ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s}) blur(${soft}px)`;
  ctx.drawImage(workingCanvas, 0, 0);
  ctx.filter = 'none';

  const temperature = clamp(filters.temperature, -100, 100) / 100;
  if (temperature !== 0) {
    const alpha = Math.abs(temperature) * 0.16;
    ctx.fillStyle = temperature < 0 ? `rgba(154, 184, 255, ${alpha})` : `rgba(255, 204, 148, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const tint = clamp(filters.tint, -100, 100) / 100;
  if (tint !== 0) {
    const alpha = Math.abs(tint) * 0.14;
    ctx.fillStyle = tint > 0 ? `rgba(242, 180, 236, ${alpha})` : `rgba(188, 234, 255, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const fade = clamp(filters.fade, 0, 1);
  if (fade > 0) {
    ctx.fillStyle = `rgba(245, 239, 246, ${fade})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const overlayStrength = clamp(filters.overlayStrength, 0, 1);
  if (overlayStrength > 0 && filters.overlayColor) {
    ctx.fillStyle = hexToRgba(filters.overlayColor, overlayStrength);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(232,220,234,${alpha})`;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function renderCanvas(ctx, state) {
  const { canvas, image, filters, layers } = state;
  ctx.canvas.width = canvas.width;
  ctx.canvas.height = canvas.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f2ecf3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!image.loaded || !image.element) {
    return;
  }

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = canvas.width;
  baseCanvas.height = canvas.height;
  const baseCtx = baseCanvas.getContext('2d');
  drawImageCover(baseCtx, image.element, canvas.width, canvas.height);

  applyGlobalTone(ctx, baseCanvas, filters);

  const preMosaicCanvas = document.createElement('canvas');
  preMosaicCanvas.width = canvas.width;
  preMosaicCanvas.height = canvas.height;
  const preMosaicCtx = preMosaicCanvas.getContext('2d');
  preMosaicCtx.drawImage(ctx.canvas, 0, 0);

  layers
    .filter((layer) => layer.type === 'mosaic' && layer.visible)
    .forEach((layer) => {
      ctx.save();
      ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
      if (layer.variant === 'frosted') {
        applyFrostedBlurMosaic(ctx, preMosaicCanvas, layer);
      } else {
        applyGridGlassMosaic(ctx, preMosaicCanvas, layer);
      }
      ctx.restore();
    });
}
