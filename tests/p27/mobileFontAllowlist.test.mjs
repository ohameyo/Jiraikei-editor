import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('mobile font picker excludes the four heavy handwriting fonts while desktop keeps them registered', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /id: 'nonbiri-2'/)
  assert.match(app, /id: 'haru-tegaki-12'/)
  assert.match(app, /id: 'shigoto-memogaki'/)
  assert.match(app, /id: 'kyouryuno-guratan'/)
  assert.match(app, /const MOBILE_TEXT_FONT_IDS = new Set\(\['mushin', 'zhaizai-marker', 'fusion-pixel-jp', 'fusion-pixel-sc'\]\);/)
  assert.match(app, /const visibleFonts = isMobileViewport\(\) \? TEXT_FONTS\.filter\(\(font\) => MOBILE_TEXT_FONT_IDS\.has\(font\.id\)\) : TEXT_FONTS;/)
})
