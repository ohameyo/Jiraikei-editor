import { createToneRuntime } from '../../src/tone/index.js';

const resultElement = document.querySelector('#result');

function createSourceCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  const pixels = new ImageData(
    new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 255, 255, 0, 128,
    ]),
    2,
    2,
  );
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function createTargetCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  return canvas;
}

function readPixels(canvas) {
  return Array.from(canvas.getContext('2d').getImageData(0, 0, 2, 2).data);
}

function cpuCopy(request) {
  request.targetContext.clearRect(0, 0, 2, 2);
  request.targetContext.drawImage(request.sourceCanvas, 0, 0);
}

async function run() {
  const sourceCanvas = createSourceCanvas();
  const gpuTarget = createTargetCanvas();
  const gpuRuntime = createToneRuntime({ enabled: true, cpuRender: cpuCopy });

  gpuRuntime.render({
    targetContext: gpuTarget.getContext('2d'),
    sourceCanvas,
    filters: {},
  });

  const expectedPixels = readPixels(sourceCanvas);
  const actualPixels = readPixels(gpuTarget);
  const gpuPassthrough = gpuRuntime.getDiagnostics();
  const passthroughMatches = expectedPixels.every(
    (value, index) => Math.abs(value - actualPixels[index]) <= 1,
  );

  gpuRuntime.render({
    targetContext: gpuTarget.getContext('2d'),
    sourceCanvas,
    filters: { skinWhiten: 0.01 },
  });

  const forcedTarget = createTargetCanvas();
  const forcedRuntime = createToneRuntime({
    enabled: true,
    forceFailure: true,
    cpuRender: cpuCopy,
  });
  forcedRuntime.render({
    targetContext: forcedTarget.getContext('2d'),
    sourceCanvas,
    filters: {},
  });

  const report = {
    passthroughMatches,
    gpuPassthrough,
    gpuThenEffectsFallback: gpuRuntime.getDiagnostics(),
    forcedFailureFallback: forcedRuntime.getDiagnostics(),
    forcedFailurePixelsMatch: readPixels(forcedTarget).every(
      (value, index) => value === expectedPixels[index],
    ),
  };
  const passed =
    report.passthroughMatches &&
    report.gpuPassthrough.selectedRenderer === 'gpu' &&
    report.gpuPassthrough.gpuRenderCount === 1 &&
    report.gpuThenEffectsFallback.gpuRenderCount === 1 &&
    report.gpuThenEffectsFallback.fallbackReason === 'effects-not-migrated' &&
    report.forcedFailureFallback.fallbackReason === 'gpu-render-failed' &&
    report.forcedFailureFallback.cpuFallbackCount === 1 &&
    report.forcedFailurePixelsMatch;

  document.body.dataset.status = passed ? 'passed' : 'failed';
  resultElement.textContent = JSON.stringify(report, null, 2);
}

run().catch((error) => {
  document.body.dataset.status = 'failed';
  resultElement.textContent = error.stack || error.message || String(error);
});
