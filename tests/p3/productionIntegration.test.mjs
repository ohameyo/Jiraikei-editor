import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('exposes the advanced HSL panel beside basic and portrait controls', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /id: 'hsl'/)
  assert.match(app, /label: 'HSL'/)
  assert.match(app, /hsl-channel-row/)
  assert.match(app, /HSL_CHANNELS\.forEach\(\(channel\)/)
  assert.match(app, /hslKey\(activeChannel, item\.axis\)/)
})

test('keeps advanced sliders on the shared CPU preview and export path', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /panel: 'hsl'/)
  assert.match(app, /applyCanvasCssInteractionPreview\(store\.getState\(\)\)/)
  assert.equal((app.match(/toneRuntime\.render\(/g) || []).length, 1)
})
