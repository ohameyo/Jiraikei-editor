import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { isWebGLToneRequested } from '../../src/tone/toneFeatureSwitch.js'

test('requests WebGL tone rendering by default in V3', () => {
  assert.equal(
    isWebGLToneRequested(
      { search: '' },
      { getItem: () => null },
    ),
    true,
  )

  assert.equal(
    isWebGLToneRequested(
      { search: '?v3gpu=0' },
      { getItem: () => '1' },
    ),
    false,
  )

  assert.equal(
    isWebGLToneRequested(
      { search: '' },
      { getItem: (key) => (key === 'jirai-v3-gpu' ? '0' : null) },
    ),
    false,
  )
})

test('slider dragging uses lightweight preview sizing', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /const lightweight = isSliderDragging \|\| isDirectManipulating \|\| isTextEditing/)
  assert.match(app, /MOBILE_LIGHTWEIGHT_RENDER_MS/)
  assert.match(app, /DESKTOP_LIGHTWEIGHT_RENDER_MS/)
})
