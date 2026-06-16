import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'
import { PASSTHROUGH_FRAGMENT_SHADER } from '../../src/tone/shaders.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'

test('does not expose HSL controls in the production app', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.doesNotMatch(app, /id: 'hsl'/)
  assert.doesNotMatch(app, /label: 'HSL'/)
  assert.doesNotMatch(app, /hsl-channel-row/)
  assert.doesNotMatch(app, /hsl-channel-btn/)
  assert.doesNotMatch(app, /activeFilterPanel = 'hsl'/)
  assert.doesNotMatch(app, /hslKey/)
  assert.doesNotMatch(app, /HSL_CHANNELS/)
  assert.doesNotMatch(app, /HSL_AXES/)
})

test('treats legacy hsl filter values as ignored and GPU eligible', () => {
  assert.deepEqual(
    getPassthroughEligibility({
      hsl_master_h: 40,
      hsl_red_s: -70,
      hsl_skin_l: 32,
      hsl_lip_h: -40,
      hsl_black_l: -32,
    }),
    { eligible: true, reason: null },
  )
})

test('removes HSL shader uniforms and normalized parameters', () => {
  const renderer = new WebGLToneRenderer()

  assert.equal(renderer.getToneParameters({ hsl_master_h: 40 }).hsl, undefined)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /u_hsl_/)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /applyMigratedHsl/)
})
