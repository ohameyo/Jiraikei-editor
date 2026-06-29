import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const stylesPath = new URL('../../styles.css', import.meta.url);

test('export preview image keeps the browser long-press save menu enabled', async () => {
  const styles = await readFile(stylesPath, 'utf8');
  const exportPreviewRule = styles.match(/#exportPreviewImage\s*\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(styles, /body\s*\{[\s\S]*-webkit-touch-callout:\s*none;/);
  assert.match(exportPreviewRule, /user-select:\s*auto;/);
  assert.match(exportPreviewRule, /-webkit-user-select:\s*auto;/);
  assert.match(exportPreviewRule, /-webkit-touch-callout:\s*default;/);
  assert.match(exportPreviewRule, /-webkit-user-drag:\s*auto;/);
});
