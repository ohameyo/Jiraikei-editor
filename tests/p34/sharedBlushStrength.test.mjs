import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const appPath = new URL('../../src/app.js', import.meta.url);

test('manual blush groups share the portrait blush strength slider in the CPU path', async () => {
  const app = await readFile(appPath, 'utf8');
  const start = app.indexOf('function applyTonePipeline');
  const end = app.indexOf('function renderToneBaseCanvas', start);
  const body = app.slice(start, end);

  assert.match(body, /const manualBlushActive = Number\(filters\.blushManual \?\? 0\) > 0\.5;/);
  assert.match(body, /const blushRegionWeight = getBlushRegionWeight\(px, py, blushRegions\);/);
  assert.match(body, /const manualRegionToneMask = clamp\(/);
  assert.match(body, /const blushPlacementWeight = manualBlushActive\s*\? manualRegionToneMask\s*: skinMask;/);
  assert.match(body, /const blush = blushStrength \* blushPlacementWeight \* blushRegionWeight;/);
});
