import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('polaroid preview cards pin the thumbnail stack to the top instead of vertically centering it', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(styles, /\.polaroid-frame-btn\s*\{[\s\S]*justify-items:\s*center/)
  assert.match(styles, /\.polaroid-frame-btn\s*\{[\s\S]*align-content:\s*start/)
  assert.match(styles, /\.polaroid-frame-btn\s*\{[\s\S]*grid-template-rows:\s*84px minmax\(28px,\s*auto\)/)
  assert.match(styles, /\.polaroid-frame-thumb\s*\{[\s\S]*margin-top:\s*0/)
})

test('mobile font previews only use custom classes after the font is truly ready', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /return MOBILE_TEXT_FONT_IDS\.has\(font\.id\) && fontFaceStatus\.get\(font\.id\) === 'ready';/)
})

test('canvas and overlay text use a renderable font-family guard', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function getRenderableTextFontFamily\(layer\)/)
  assert.match(app, /getCanvasTextFont\(layer, fontSize = layer\?\.fontSize \?\? 56\) \{\s*return `\$\{getCssTextFontWeight\(layer\)\} \$\{fontSize\}px \$\{getRenderableTextFontFamily\(layer\)\}`;/)
  assert.match(app, /preview\.style\.fontFamily = getRenderableTextFontFamily\(layer\);/)
})

test('mobile font load does not trust document.fonts.check as a ready shortcut', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /if \(!isMobileViewport\(\) && document\.fonts\.check\?\.\(`400 32px "\$\{runtimeFace\}"`, TEXT_FONT_ACTIVATION_SAMPLE\)\) \{/)
})
