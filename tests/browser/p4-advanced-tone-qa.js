import { createToneRuntime } from '../../src/tone/index.js';
import { ADVANCED_TONE_SAMPLE_PIXELS } from '../../src/tone/advancedToneParameters.js';
import {
  ADVANCED_TONE_QA_SCENARIOS,
  buildAdvancedToneQaFilters,
  validateAdvancedToneQaCoverage,
} from '../../src/tone/advancedToneQa.js';

const resultElement = document.querySelector('#result');
const sampleCanvas = document.querySelector('#samples');

function createSampleCanvas(scale = 1) {
  const width = ADVANCED_TONE_SAMPLE_PIXELS.length;
  const base = document.createElement('canvas');
  base.width = width;
  base.height = 1;
  const data = new Uint8ClampedArray(width * 4);
  ADVANCED_TONE_SAMPLE_PIXELS.forEach((sample, index) => {
    const offset = index * 4;
    data[offset] = sample.rgb[0];
    data[offset + 1] = sample.rgb[1];
    data[offset + 2] = sample.rgb[2];
    data[offset + 3] = 255;
  });
  base.getContext('2d').putImageData(new ImageData(data, width, 1), 0, 0);
  if (scale === 1) return base;

  const scaled = document.createElement('canvas');
  scaled.width = width * scale;
  scaled.height = scale;
  const scaledContext = scaled.getContext('2d');
  scaledContext.imageSmoothingEnabled = false;
  scaledContext.drawImage(base, 0, 0, scaled.width, scaled.height);
  return scaled;
}

function drawVisibleSamples() {
  const context = sampleCanvas.getContext('2d');
  const cellWidth = sampleCanvas.width / ADVANCED_TONE_SAMPLE_PIXELS.length;
  ADVANCED_TONE_SAMPLE_PIXELS.forEach((sample, index) => {
    context.fillStyle = `rgb(${sample.rgb.join(',')})`;
    context.fillRect(index * cellWidth, 0, cellWidth, sampleCanvas.height);
  });
}

function copyCpuRender(request) {
  request.targetContext.clearRect(0, 0, request.size.width, request.size.height);
  request.targetContext.drawImage(request.sourceCanvas, 0, 0);
}

function renderScenario({ scenario, mode, scale }) {
  const sourceCanvas = createSampleCanvas(scale);
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = sourceCanvas.width;
  targetCanvas.height = sourceCanvas.height;
  const runtime = createToneRuntime({
    enabled: true,
    cpuRender: copyCpuRender,
  });

  runtime.render({
    targetContext: targetCanvas.getContext('2d'),
    sourceCanvas,
    sourceKey: sourceCanvas,
    filters: buildAdvancedToneQaFilters(scenario.id),
    mode,
  });

  return {
    mode,
    width: targetCanvas.width,
    height: targetCanvas.height,
    diagnostics: runtime.getDiagnostics(),
  };
}

function scenarioMatchesP7MigrationBoundary(item) {
  const gpuExpected = item.id === 'global-hsl' || item.id === 'split-color-hsl';
  const preview = item.preview.diagnostics;
  const exportRender = item.export.diagnostics;
  if (gpuExpected) {
    return (
      preview.selectedRenderer === 'gpu' &&
      preview.fallbackReason === null &&
      exportRender.selectedRenderer === 'gpu' &&
      exportRender.fallbackReason === null
    );
  }

  return (
    preview.selectedRenderer === 'cpu' &&
    preview.fallbackReason === 'effects-not-migrated' &&
    exportRender.selectedRenderer === 'cpu' &&
    exportRender.fallbackReason === 'effects-not-migrated'
  );
}

async function run() {
  drawVisibleSamples();
  const coverage = validateAdvancedToneQaCoverage(ADVANCED_TONE_SAMPLE_PIXELS);
  const cases = ADVANCED_TONE_QA_SCENARIOS.map((scenario) => {
    const preview = renderScenario({ scenario, mode: 'preview', scale: 1 });
    const exportRender = renderScenario({ scenario, mode: 'export', scale: 3 });
    return {
      id: scenario.id,
      label: scenario.label,
      requiredGroups: scenario.requiredGroups,
      preview,
      export: exportRender,
    };
  });

  const passed =
    coverage.ok &&
    cases.every((item) =>
      scenarioMatchesP7MigrationBoundary(item) &&
      item.export.width === item.preview.width * 3 &&
      item.export.height === item.preview.height * 3
    );

  resultElement.textContent = JSON.stringify(
    {
      passed,
      coverage,
      sampleCount: ADVANCED_TONE_SAMPLE_PIXELS.length,
      cases,
    },
    null,
    2,
  );
}

run().catch((error) => {
  resultElement.textContent = JSON.stringify({
    passed: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2);
});
