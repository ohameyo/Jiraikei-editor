import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('polaroid frame cards expose reusable preview shape hooks', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(app, /function getPolaroidFramePreviewClass\(frame\)/)
  assert.match(app, /btn\.classList\.add\(getPolaroidFramePreviewClass\(frame\)\)/)
  assert.match(styles, /\.polaroid-frame-btn\.is-portrait\s*\{[\s\S]*--polaroid-preview-width:\s*60px/)
  assert.match(styles, /\.polaroid-frame-btn\.is-landscape\s*\{[\s\S]*--polaroid-preview-width:\s*92px/)
  assert.match(styles, /\.polaroid-frame-btn\.is-square\s*\{[\s\S]*--polaroid-preview-width:\s*76px/)
  assert.match(styles, /\.polaroid-frame-preview\s*\{/)
})

test('polaroid preview and canvas use a fallback frame while full frame assets are still loading', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function drawPolaroidFrameFallback\(/)
  assert.match(app, /drawPolaroidFrameFallback\(ctx,\s*polaroidEditor\.frame,\s*placement\.frameRect,\s*placement\.photoRect\)/)
  assert.match(app, /drawPolaroidFrameFallback\(ctx,\s*polaroidFrame,\s*placement\.frameRect,\s*placement\.photoRect\)/)
})

test('late polaroid frame loads trigger a repaint when polaroid mode is already active', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /if \(store\.getState\(\)\.polaroid\?\.enabled && store\.getState\(\)\.polaroid\.frameId === frame\.id\) \{\s*renderAfterAsyncAssetReady\(\);/)
})

test('stickers keep preview metadata and use it as an immediate render fallback', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /previewSrc: sticker\.previewSrc \|\| null/)
  assert.match(app, /previewFallbackSrc: sticker\.previewFallbackSrc \|\| null/)
  assert.match(app, /const previewImage = layer\.previewSrc \? STICKER_PREVIEW_CACHE\.get\(layer\.previewSrc\) : null;/)
  assert.match(app, /if \(!sourceImage && previewImage\) return previewImage;/)
  assert.match(app, /if \(!STICKER_IMAGE_CACHE\.has\(layer\.src\) && layer\.previewSrc\) return layer\.previewSrc;/)
})
