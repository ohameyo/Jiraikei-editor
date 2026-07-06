import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production app avoids full sticker preloads during first screen warmup', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function preloadStickerPreviewImages\(/)
  assert.match(app, /if \(!isMobileViewport\(\)\) \{\s*runWhenIdle\(\(\) => \{\s*preloadStickerPreviewImages\(\);/)

  const warmupBody = app.match(/function scheduleFirstScreenWarmups\(\) \{[\s\S]*?\n  \}/)?.[0] || ''
  assert.doesNotMatch(warmupBody, /preloadStickerImages\(\);/)
  assert.match(app, /img\.loading = thumbIndex <= 8 \? 'eager' : 'lazy'/)
  assert.match(app, /img\.setAttribute\('fetchpriority', thumbIndex <= 8 \? 'high' : 'low'\)/)
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
