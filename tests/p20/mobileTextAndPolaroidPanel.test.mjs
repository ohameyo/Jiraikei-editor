import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('mobile font picker eagerly requests visible font previews', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /if \(isMobileViewport\(\)\) \{\s*visibleFonts\.forEach\(\(font\) => mountFontWarmupProbe\(font\)\);/)
  assert.match(app, /visibleFonts\.forEach\(\(font\) => \{\s*ensureTextFontLoaded\(font\)\.catch\(\(\) => \{\}\);/)
})

test('polaroid frame cards use a clean white preview surface without gray texture bleed', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(styles, /\.polaroid-frame-preview\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.96\)/)
  assert.doesNotMatch(styles, /\.polaroid-frame-preview\s*\{[\s\S]*repeating-linear-gradient/)
})
