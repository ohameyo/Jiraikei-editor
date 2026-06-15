import { createToneRuntime } from '../../src/tone/index.js';
import { BASIC_TONE_RANGES, parseHexColor } from '../../src/tone/basicToneParameters.js';

const resultElement = document.querySelector('#result');
const DEFAULT_FILTERS = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  fade: 0,
  overlayStrength: 0,
  overlayColor: '#e7d3ea',
};

const SOURCE_PIXELS = [
  0, 0, 0, 255,
  64, 96, 128, 255,
  127, 127, 127, 255,
  255, 255, 255, 255,
  255, 32, 64, 255,
  32, 255, 96, 255,
  32, 64, 255, 255,
  200, 150, 120, 0,
];

function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function quantize(value) {
  return Math.round(clamp(value));
}

function mixByte(value, target, amount) {
  return quantize(value + (target - value) * clamp(amount, 0, 1));
}

function cpuReference(sourcePixels, filters) {
  const output = new Uint8ClampedArray(sourcePixels.length);
  const overlay = parseHexColor(filters.overlayColor).map((value) => value * 255);

  for (let i = 0; i < sourcePixels.length; i += 4) {
    const alpha = sourcePixels[i + 3];
    if (alpha < 1) {
      output.set(sourcePixels.slice(i, i + 4), i);
      continue;
    }

    let r = sourcePixels[i] * filters.brightness;
    let g = sourcePixels[i + 1] * filters.brightness;
    let b = sourcePixels[i + 2] * filters.brightness;
    r = (r - 128) * filters.contrast + 128;
    g = (g - 128) * filters.contrast + 128;
    b = (b - 128) * filters.contrast + 128;
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    r = quantize(luma + (r - luma) * filters.saturation);
    g = quantize(luma + (g - luma) * filters.saturation);
    b = quantize(luma + (b - luma) * filters.saturation);

    const temperatureAlpha = Math.abs(filters.temperature / 100) * 0.16;
    const temperatureColor =
      filters.temperature < 0 ? [154, 184, 255] : [255, 204, 148];
    r = mixByte(r, temperatureColor[0], temperatureAlpha);
    g = mixByte(g, temperatureColor[1], temperatureAlpha);
    b = mixByte(b, temperatureColor[2], temperatureAlpha);

    const tintAlpha = Math.abs(filters.tint / 100) * 0.14;
    const tintColor = filters.tint > 0 ? [242, 180, 236] : [188, 234, 255];
    r = mixByte(r, tintColor[0], tintAlpha);
    g = mixByte(g, tintColor[1], tintAlpha);
    b = mixByte(b, tintColor[2], tintAlpha);

    r = mixByte(r, 245, filters.fade);
    g = mixByte(g, 239, filters.fade);
    b = mixByte(b, 246, filters.fade);

    const overlayLuma = r * 0.299 + g * 0.587 + b * 0.114;
    const darkGuard = smoothstep(24, 96, overlayLuma);
    const midBoost = smoothstep(84, 196, overlayLuma);
    const overlayAlpha = clamp(
      filters.overlayStrength * (0.22 * darkGuard + 0.92 * midBoost),
      0,
      0.9,
    );
    const mixed = [
      r + (overlay[0] - r) * overlayAlpha,
      g + (overlay[1] - g) * overlayAlpha,
      b + (overlay[2] - b) * overlayAlpha,
    ];
    const lift = overlayAlpha * smoothstep(128, 255, overlayLuma) * 0.16;
    r = quantize(mixed[0] + (255 - mixed[0]) * lift);
    g = quantize(mixed[1] + (255 - mixed[1]) * lift);
    b = quantize(mixed[2] + (255 - mixed[2]) * lift);

    output.set([r, g, b, alpha], i);
  }

  return output;
}

function createSourceCanvas(scale = 1) {
  const base = document.createElement('canvas');
  base.width = 4;
  base.height = 2;
  base.getContext('2d').putImageData(
    new ImageData(new Uint8ClampedArray(SOURCE_PIXELS), 4, 2),
    0,
    0,
  );
  if (scale === 1) return base;

  const scaled = document.createElement('canvas');
  scaled.width = base.width * scale;
  scaled.height = base.height * scale;
  const ctx = scaled.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, scaled.width, scaled.height);
  return scaled;
}

function createGpuSession(sourceCanvas) {
  const target = document.createElement('canvas');
  target.width = sourceCanvas.width;
  target.height = sourceCanvas.height;
  const runtime = createToneRuntime({
    enabled: true,
    cpuRender() {
      throw new Error('Unexpected CPU fallback in P2 pixel matrix');
    },
  });
  return {
    render(filters) {
      runtime.render({
        targetContext: target.getContext('2d'),
        sourceCanvas,
        sourceKey: sourceCanvas,
        filters,
      });
      return {
        pixels: target.getContext('2d').getImageData(
          0,
          0,
          target.width,
          target.height,
        ).data,
        diagnostics: runtime.getDiagnostics(),
      };
    },
    diagnostics() {
      return runtime.getDiagnostics();
    },
  };
}

function comparePixels(actual, expected) {
  let maxDifference = 0;
  let totalDifference = 0;
  for (let i = 0; i < actual.length; i += 1) {
    const difference = Math.abs(actual[i] - expected[i]);
    maxDifference = Math.max(maxDifference, difference);
    totalDifference += difference;
  }
  return {
    maxDifference,
    meanDifference: totalDifference / actual.length,
  };
}

function expandedReference(sourceCanvas, filters) {
  const source = sourceCanvas.getContext('2d').getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  ).data;
  return cpuReference(source, filters);
}

async function run() {
  const cases = [];
  for (const [key, range] of Object.entries(BASIC_TONE_RANGES)) {
    for (const [point, value] of Object.entries({
      min: range.min,
      default: range.default,
      max: range.max,
    })) {
      cases.push({ name: `${key}:${point}`, filters: { ...DEFAULT_FILTERS, [key]: value } });
    }
  }

  const source = createSourceCanvas();
  const defaultTarget = document.createElement('canvas');
  defaultTarget.width = source.width;
  defaultTarget.height = source.height;
  const defaultRuntime = createToneRuntime({
    enabled: false,
    cpuRender(request) {
      request.targetContext.drawImage(request.sourceCanvas, 0, 0);
    },
  });
  defaultRuntime.render({
    targetContext: defaultTarget.getContext('2d'),
    sourceCanvas: source,
    filters: DEFAULT_FILTERS,
  });
  const defaultRenderer = defaultRuntime.getDiagnostics();

  const matrixSession = createGpuSession(source);
  const results = cases.map(({ name, filters }) => {
    const gpu = matrixSession.render(filters);
    return {
      name,
      ...comparePixels(gpu.pixels, expandedReference(source, filters)),
      renderer: gpu.diagnostics.selectedRenderer,
    };
  });

  const combinedFilters = {
    ...DEFAULT_FILTERS,
    brightness: 1.18,
    contrast: 0.82,
    saturation: 0.55,
    temperature: -42,
    tint: 31,
    fade: 0.22,
    overlayStrength: 0.28,
    overlayColor: '#F5B9E4',
  };
  const previewSource = createSourceCanvas(1);
  const exportSource = createSourceCanvas(2);
  const preview = createGpuSession(previewSource).render(combinedFilters);
  const exportRender = createGpuSession(exportSource).render(combinedFilters);
  const combined = {
    preview: comparePixels(
      preview.pixels,
      expandedReference(previewSource, combinedFilters),
    ),
    export: comparePixels(
      exportRender.pixels,
      expandedReference(exportSource, combinedFilters),
    ),
    previewRenderer: preview.diagnostics.selectedRenderer,
    exportRenderer: exportRender.diagnostics.selectedRenderer,
  };
  const matrixResources = matrixSession.diagnostics().gpuResources;

  const maxDifference = Math.max(
    ...results.map((result) => result.maxDifference),
    combined.preview.maxDifference,
    combined.export.maxDifference,
  );
  const passed =
    results.every(
      (result) => result.renderer === 'gpu' && result.maxDifference <= 3,
    ) &&
    combined.previewRenderer === 'gpu' &&
    combined.exportRenderer === 'gpu' &&
    combined.preview.maxDifference <= 3 &&
    combined.export.maxDifference <= 3 &&
    defaultRenderer.selectedRenderer === 'cpu' &&
    defaultRenderer.fallbackReason === 'gpu-disabled' &&
    matrixResources?.programBuildCount === 1 &&
    matrixResources?.textureUploadCount === 1 &&
    matrixResources?.uniformUpdateCount === cases.length;

  const report = {
    passed,
    maxDifference,
    cases: results,
    combined,
    defaultRenderer,
    matrixResources,
  };
  document.body.dataset.status = passed ? 'passed' : 'failed';
  resultElement.textContent = JSON.stringify(report, null, 2);
}

run().catch((error) => {
  document.body.dataset.status = 'failed';
  resultElement.textContent = error.stack || error.message || String(error);
});
