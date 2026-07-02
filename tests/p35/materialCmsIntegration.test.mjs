import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const appPath = new URL('../../src/app.js', import.meta.url);
const dataPath = new URL('../../src/materialCmsData.js', import.meta.url);
const scriptPath = new URL('../../scripts/sync-material-cms.mjs', import.meta.url);

test('production app wires static material cms data into stickers, frames, and text presets', async () => {
  const app = await readFile(appPath, 'utf8');

  assert.match(app, /from '\.\/materialCmsData\.js';/);
  assert.match(app, /from '\.\/materialCms\.js';/);
  assert.match(app, /function buildCmsStickerItems\(packId\)/);
  assert.match(app, /getNewCmsMaterials\(MATERIAL_CMS_ITEMS, 'sticker'\)/);
  assert.match(app, /installCmsPolaroidFrames\(POLAROID_FRAMES\);/);
  assert.match(app, /function getPolaroidFrameEntries\(\)/);
  assert.match(app, /function buildTextPresetsWithCms\(basePresets\)/);
});

test('material cms generated data file is safe to import before the first sync', async () => {
  const data = await readFile(dataPath, 'utf8');

  assert.match(data, /export const MATERIAL_CMS_ITEMS = \{/);
});

test('material cms sync script writes static app data and an id map', async () => {
  const script = await readFile(scriptPath, 'utf8');

  assert.match(script, /buildMaterialCmsPayload/);
  assert.match(script, /material-cms-id-map\.json/);
  assert.match(script, /src\/materialCmsData\.js/);
  assert.match(script, /parseCsv/);
  assert.match(script, /fileURLToPath\(import\.meta\.url\) === resolve\(process\.argv\[1\]\)/);
});
