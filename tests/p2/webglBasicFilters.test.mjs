import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PASSTHROUGH_FRAGMENT_SHADER,
} from '../../src/tone/shaders.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'

test('declares every migrated basic filter uniform', () => {
  for (const uniform of [
    'u_brightness',
    'u_contrast',
    'u_saturation',
    'u_temperature',
    'u_tint',
    'u_fade',
    'u_overlayStrength',
    'u_overlayColor',
  ]) {
    assert.match(PASSTHROUGH_FRAGMENT_SHADER, new RegExp(`uniform .* ${uniform};`))
  }
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /dot\(color\.rgb, vec3\(0\.299, 0\.587, 0\.114\)\)/)
})

test('normalizes filter values before writing uniforms', () => {
  const renderer = new WebGLToneRenderer()
  assert.deepEqual(
    renderer.getToneParameters({
      brightness: 2,
      contrast: 0,
      saturation: 0,
      temperature: -200,
      tint: 200,
      fade: 1,
      overlayStrength: 1,
      overlayColor: '#F5B9E4',
    }),
    {
      brightness: 1.3,
      contrast: 0.7,
      saturation: 0.3,
      temperature: -100,
      tint: 100,
      fade: 0.5,
      overlayStrength: 0.45,
      overlayColor: '#F5B9E4',
      overlayColorRgb: [245 / 255, 185 / 255, 228 / 255],
    },
  )
})

test('starts with zero resource work before the first render', () => {
  const renderer = new WebGLToneRenderer()
  assert.deepEqual(renderer.getDiagnostics(), {
    programBuildCount: 0,
    textureUploadCount: 0,
    uniformUpdateCount: 0,
  })
})
