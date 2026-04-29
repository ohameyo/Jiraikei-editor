function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRectPx(layer, canvas) {
  const w = clamp(layer.width ?? 0.24, 0.05, 0.95) * canvas.width;
  const h = clamp(layer.height ?? 0.24, 0.05, 0.95) * canvas.height;
  const x = clamp(layer.x ?? 0.5, 0, 1) * canvas.width - w / 2;
  const y = clamp(layer.y ?? 0.5, 0, 1) * canvas.height - h / 2;
  return { x, y, w, h };
}

function drawFeatherMask(ctx, rect, feather) {
  const { x, y, w, h } = rect;
  const f = Math.min(feather, w / 2, h / 2);

  ctx.fillStyle = '#000';
  ctx.fillRect(x + f, y + f, w - f * 2, h - f * 2);

  const edges = [
    [x + f, y, w - f * 2, f, x + f, y + f],
    [x + f, y + h - f, w - f * 2, f, x + f, y + h - f],
    [x, y + f, f, h - f * 2, x + f, y + f],
    [x + w - f, y + f, f, h - f * 2, x + w - f, y + f],
  ];

  edges.forEach(([ex, ey, ew, eh, gx, gy]) => {
    const grad = ctx.createLinearGradient(
      ex === x ? ex : ex + ew,
      ey === y ? ey : ey + eh,
      gx,
      gy
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(ex, ey, ew, eh);
  });

  const corners = [
    [x + f, y + f, x + f, y + f],
    [x + w - f, y + f, x + w - f, y + f],
    [x + f, y + h - f, x + f, y + h - f],
    [x + w - f, y + h - f, x + w - f, y + h - f],
  ];

  corners.forEach(([cx, cy, gx, gy]) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, gx, gy, f);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, f, 0, Math.PI * 2);
    ctx.fill();
  });
}

function withMaskedRegion(ctx, rect, feather, paint) {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = ctx.canvas.width;
  maskCanvas.height = ctx.canvas.height;
  const maskCtx = maskCanvas.getContext('2d');

  drawFeatherMask(maskCtx, rect, feather);

  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = ctx.canvas.width;
  layerCanvas.height = ctx.canvas.height;
  const layerCtx = layerCanvas.getContext('2d');

  paint(layerCtx, rect);

  layerCtx.globalCompositeOperation = 'destination-in';
  layerCtx.drawImage(maskCanvas, 0, 0);

  ctx.drawImage(layerCanvas, 0, 0);
}

export function applyFrostedBlurMosaic(ctx, sourceCanvas, layer) {
  const rect = getRectPx(layer, ctx.canvas);
  const feather = (layer.feather ?? 0.1) * Math.min(rect.w, rect.h);
  const blurAmount = clamp(layer.intensity ?? 10, 2, 36);

  withMaskedRegion(ctx, rect, feather, (targetCtx) => {
    targetCtx.filter = `blur(${blurAmount}px) saturate(0.78)`;
    targetCtx.drawImage(sourceCanvas, 0, 0);
    targetCtx.filter = 'none';

    targetCtx.fillStyle = `rgba(244, 236, 247, ${clamp(layer.haze ?? 0.24, 0, 0.7)})`;
    targetCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
}

function drawPixelatedRegion(targetCtx, sourceCanvas, rect, cellSize) {
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = Math.max(2, Math.floor(rect.w / cellSize));
  sampleCanvas.height = Math.max(2, Math.floor(rect.h / cellSize));
  const sampleCtx = sampleCanvas.getContext('2d');
  sampleCtx.imageSmoothingEnabled = true;

  sampleCtx.drawImage(
    sourceCanvas,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    0,
    0,
    sampleCanvas.width,
    sampleCanvas.height
  );

  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(sampleCanvas, 0, 0, sampleCanvas.width, sampleCanvas.height, rect.x, rect.y, rect.w, rect.h);
  targetCtx.imageSmoothingEnabled = true;
}

export function applyGridGlassMosaic(ctx, sourceCanvas, layer) {
  const rect = getRectPx(layer, ctx.canvas);
  const feather = (layer.feather ?? 0.04) * Math.min(rect.w, rect.h);
  const cell = clamp(layer.cellSize ?? 8, 4, 24);
  const lineAlpha = clamp(layer.gridAlpha ?? 0.28, 0.05, 0.7);

  withMaskedRegion(ctx, rect, feather, (targetCtx) => {
    drawPixelatedRegion(targetCtx, sourceCanvas, rect, cell);

    targetCtx.fillStyle = 'rgba(26, 22, 35, 0.16)';
    targetCtx.fillRect(rect.x, rect.y, rect.w, rect.h);

    targetCtx.strokeStyle = `rgba(220, 220, 232, ${lineAlpha})`;
    targetCtx.lineWidth = 1;

    for (let x = rect.x; x <= rect.x + rect.w; x += cell) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, rect.y);
      targetCtx.lineTo(x, rect.y + rect.h);
      targetCtx.stroke();
    }

    for (let y = rect.y; y <= rect.y + rect.h; y += cell) {
      targetCtx.beginPath();
      targetCtx.moveTo(rect.x, y);
      targetCtx.lineTo(rect.x + rect.w, y);
      targetCtx.stroke();
    }

    targetCtx.strokeStyle = 'rgba(20, 20, 30, 0.35)';
    targetCtx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  });
}
