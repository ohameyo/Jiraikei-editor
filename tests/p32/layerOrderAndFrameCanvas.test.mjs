import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const appPath = new URL('../../src/app.js', import.meta.url);
const stylesPath = new URL('../../styles.css', import.meta.url);

test('layer controls expose up and down ordering actions', async () => {
  const app = await readFile(appPath, 'utf8');

  assert.match(app, /moveUpBtn\.textContent = '上移图层';/);
  assert.match(app, /moveUpBtn\.onclick = \(\) => store\.moveLayer\(selected\.id, 1\);/);
  assert.match(app, /moveDownBtn\.textContent = '下移图层';/);
  assert.match(app, /moveDownBtn\.onclick = \(\) => store\.moveLayer\(selected\.id, -1\);/);
  assert.match(app, /upBtn\.title = '上移图层';/);
  assert.match(app, /downBtn\.title = '下移图层';/);
});

test('mobile layer menu reserves controls for visibility, ordering, and delete', async () => {
  const styles = await readFile(stylesPath, 'utf8');

  assert.match(
    styles,
    /\.mobile-layer-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) repeat\(4,\s*auto\);/
  );
});

test('applying a frame resizes the edit canvas to the frame while preserving photo source size', async () => {
  const app = await readFile(appPath, 'utf8');

  assert.match(app, /function createPolaroidPhotoRenderState\(state\)/);
  assert.match(app, /photoCanvasSize:\s*state\.polaroid\.photoCanvasSize \? \{ \.\.\.state\.polaroid\.photoCanvasSize \} : null/);
  assert.match(app, /state\.polaroid\.photoCanvas = renderToneBaseCanvas\(createPolaroidPhotoRenderState\(state\), true\)\.canvas;/);
  assert.match(app, /state\.canvas\.width = frame\.width;\s*state\.canvas\.height = frame\.height;/);
});

test('switching frames while a frame is active keeps using the original photo source', async () => {
  const app = await readFile(appPath, 'utf8');

  assert.match(
    app,
    /const baseSource = state\.polaroid\?\.enabled && state\.polaroid\.photoCanvas \? state\.polaroid\.photoCanvas : state\.image\.element;/
  );
  assert.match(
    app,
    /\.then\(\(\) => renderToneBaseCanvas\(createPolaroidPhotoRenderState\(state\), true, \{ usePreviewScale: true \}\)\.canvas\)/
  );
});

test('layer rendering follows the actual layer array order instead of type buckets', async () => {
  const app = await readFile(appPath, 'utf8');
  const start = app.indexOf('function drawLayerStack');
  const end = app.indexOf('function renderEditedCanvas');
  const body = app.slice(start, end);

  assert.match(body, /renderState\.layers\s*\.\s*filter\(\(layer\) => layer\.visible && layer\.id !== skipLayerId\)/);
  assert.doesNotMatch(body, /layer\.type === 'mosaic'\)\s*\.forEach/);
  assert.doesNotMatch(body, /layer\.type === 'sticker'\)\s*\.forEach/);
  assert.doesNotMatch(body, /layer\.type === 'text'\)\s*\.forEach/);
});

test('blush selections are normalized to circles across image ratios', async () => {
  const app = await readFile(appPath, 'utf8');

  assert.match(app, /function makeCircularBlushControl\(control\)/);
  assert.match(app, /const radius = Math\.max\(1, Math\.min\(control\.rx, control\.ry\)\);/);
  assert.match(app, /left: makeCircularBlushControl\(\{/);
  assert.match(app, /right: makeCircularBlushControl\(\{/);
  assert.match(app, /rx: radius,\s*ry: radius,/);
});
