import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PASSTHROUGH_FRAGMENT_SHADER,
  PASSTHROUGH_VERTEX_SHADER,
} from '../../src/tone/shaders.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'

test('uses WebGL2 GLSL passthrough shaders', () => {
  assert.match(PASSTHROUGH_VERTEX_SHADER, /#version 300 es/)
  assert.match(PASSTHROUGH_VERTEX_SHADER, /a_position/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /texture\(u_source/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /outColor/)
})

test('reports unsupported without creating persistent resources', () => {
  const renderer = new WebGLToneRenderer({
    canvasFactory: () => ({
      getContext: () => null,
    }),
  })

  assert.equal(renderer.isSupported(), false)
  assert.throws(
    () =>
      renderer.render({
        sourceCanvas: { width: 2, height: 2 },
        targetContext: { canvas: { width: 2, height: 2 } },
        size: { width: 2, height: 2 },
      }),
    /WebGL2 is unavailable/,
  )
  renderer.dispose()
})
