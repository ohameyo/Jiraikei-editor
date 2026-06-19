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
  assert.match(app, /runWhenIdle\(\(\) => \{\s*preloadStickerPreviewImages\(\);/)
  assert.match(app, /runWhenIdle\(\(\) => \{\s*preloadStickerImages\(\);/)
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
