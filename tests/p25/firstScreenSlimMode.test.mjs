import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('first screen markup only preloads the profile avatar asset', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')

  assert.match(html, /<link rel="preload" as="image" href="\.\/assets\/profile-avatar\.png" \/>/)
  assert.doesNotMatch(html, /polaroid_frame_previews\/portrait-clean\.png/)
  assert.doesNotMatch(html, /polaroid_frame_previews\/landscape-clean\.png/)
})

test('first screen init defers non-critical warmups behind a dedicated scheduler', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function scheduleFirstScreenWarmups\(\)/)
  assert.match(app, /if \(!isMobileViewport\(\)\) \{\s*runWhenIdle\(\(\) => \{\s*preloadStickerPreviewImages\(\);/)
  assert.doesNotMatch(app.match(/function scheduleFirstScreenWarmups\(\) \{[\s\S]*?\n  \}/)?.[0] || '', /preloadStickerImages\(\);/)
  assert.match(app, /scheduleFirstScreenWarmups\(\);/)
  assert.doesNotMatch(app, /buildPixelStickerPack\(\);\s*preloadStickerPreviewImages\(\);/)
})

test('init no longer eagerly renders every secondary panel on desktop', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.doesNotMatch(
    app,
    /else \{\s*ensureStickerPanelRendered\(\);\s*ensurePolaroidPanelRendered\(\);\s*ensureTextTemplatesRendered\(\);\s*\}/,
  )
  assert.match(app, /if \(activeTool === 'stickers'\) ensureStickerPanelRendered\(\);/)
  assert.match(app, /if \(activeTool === 'polaroid'\) \{/)
  assert.match(app, /if \(activeTool === 'text'\) ensureTextTemplatesRendered\(\);/)
})

test('versioned material assets use long-lived cache headers', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const headers = await readFile(new URL('../../_headers', import.meta.url), 'utf8')

  assert.match(app, /const STICKER_PREVIEW_VERSION = '20260707-fast-sticker-previews-1'/)
  assert.match(headers, /\/assets\/\*/)
  assert.match(headers, /Cache-Control: public, max-age=31536000, immutable/)
})
