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

test('compare before image uses the frame photo window instead of stretching to frame canvas', async () => {
  const app = await readFile(appPath, 'utf8');
  const start = app.indexOf('function renderOriginalCanvas');
  const end = app.indexOf('function drawCanvasContain');
  const body = app.slice(start, end);

  assert.match(body, /const polaroidFrame = renderState\.polaroid\?\.enabled \? getPolaroidFrameConfig\(renderState\.polaroid\.frameId\) : null;/);
  assert.match(body, /const placement = getPolaroidPlacement\(polaroidFrame, canvas\.width, canvas\.height\);/);
  assert.match(body, /drawPhotoIntoPolaroidWindow\(ctx, renderState\.image\.element, polaroidFrame, sourceTransform, placement\.photoRect\);/);
  assert.match(body, /convertPolaroidTransformBetweenSources\([\s\S]*?renderState\.polaroid\.photoCanvas \|\| renderState\.polaroid\.photoCanvasSize \|\| renderState\.canvas,[\s\S]*?renderState\.image\.element/);
});

test('confirming a texture frame waits for the frame asset before applying it', async () => {
  const app = await readFile(appPath, 'utf8');
  const start = app.indexOf('els.polaroidConfirmBtn.onclick');
  const end = app.indexOf('if (els.polaroidCancelBtn)');
  const body = app.slice(start, end);

  assert.match(body, /els\.polaroidConfirmBtn\.onclick = async \(\) => \{/);
  assert.match(body, /await loadPolaroidFrameImage\(editor\.frame\.id\)\.catch\(\(\) => null\)/);
  assert.match(body, /if \(!frameImage && !shouldDrawPolaroidPaperFallback\(editor\.frame\)\) \{/);
  assert.match(body, /POLAROID_FRAME_CACHE\.set\(editor\.frame\.src, frameImage\);/);
  assert.match(body, /try \{/);
  assert.match(body, /finally \{/);
  assert.match(body, /confirmBtn\.disabled = false;/);
  assert.match(body, /confirmBtn\.textContent = originalText;/);
});

test('frame editor resets the confirm button when reopened or closed', async () => {
  const app = await readFile(appPath, 'utf8');
  const resetStart = app.indexOf('function resetPolaroidConfirmButton');
  const resetEnd = app.indexOf('function openPolaroidEditor', resetStart);
  const resetBody = app.slice(resetStart, resetEnd);
  const openStart = app.indexOf('function openPolaroidEditor');
  const openEnd = app.indexOf('function closePolaroidEditor', openStart);
  const openBody = app.slice(openStart, openEnd);
  const closeStart = app.indexOf('function closePolaroidEditor');
  const closeEnd = app.indexOf('function renderPolaroidPanel', closeStart);
  const closeBody = app.slice(closeStart, closeEnd);

  assert.match(resetBody, /els\.polaroidConfirmBtn\.disabled = false;/);
  assert.match(resetBody, /els\.polaroidConfirmBtn\.textContent = '确认';/);
  assert.match(openBody, /resetPolaroidConfirmButton\(\);/);
  assert.match(closeBody, /resetPolaroidConfirmButton\(\);/);
});
