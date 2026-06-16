import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('does not expose the retired HSL panel', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.doesNotMatch(app, /id: 'hsl'/)
  assert.doesNotMatch(app, /label: 'HSL'/)
  assert.doesNotMatch(app, /hsl-channel-row/)
  assert.doesNotMatch(app, /hsl-channel-btn/)
})

test('keeps portrait sliders on the shared preview and export path', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /id: 'portrait'/)
  assert.match(app, /applyCanvasCssInteractionPreview\(store\.getState\(\)\)/)
  assert.equal((app.match(/toneRuntime\.render\(/g) || []).length, 1)
})
