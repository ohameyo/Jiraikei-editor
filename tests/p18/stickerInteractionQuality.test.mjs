import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production app preloads sticker preview thumbnails before full sticker sources', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function preloadStickerPreviewImages\(/)
  assert.match(app, /runWhenIdle\(\(\) => \{\s*preloadStickerPreviewImages\(\);/)
  assert.match(app, /runWhenIdle\(\(\) => \{\s*preloadStickerImages\(\);/)

  const previewPreloadIndex = app.indexOf('preloadStickerPreviewImages();')
  const fullPreloadIndex = app.indexOf('preloadStickerImages();')
  assert.ok(previewPreloadIndex !== -1 && fullPreloadIndex !== -1, 'sticker preload hooks should exist')
  assert.ok(previewPreloadIndex < fullPreloadIndex, 'preview thumbnails should warm before full sticker assets')
})

test('overlay preview positioning clears conflicting inset constraints for sticker interaction', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function positionOverlayPreviewElement\(/)
  assert.match(app, /preview\.style\.right = 'auto'/)
  assert.match(app, /preview\.style\.bottom = 'auto'/)
  assert.match(app, /positionOverlayPreviewElement\(preview, previewSize\.w, previewSize\.h\)/)
  assert.match(app, /positionOverlayPreviewElement\(preview, w, h\)/)
})

test('sticker interaction previews can paint beyond the frame without clipping', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(styles, /\.overlay-preview\.sticker-preview\s*\{[\s\S]*?overflow:\s*visible/)
})
