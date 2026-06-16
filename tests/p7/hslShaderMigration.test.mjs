import assert from 'node:assert/strict'
import test from 'node:test'

import { HSL_CHANNELS } from '../../src/tone/advancedToneParameters.js'
import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'
import { PASSTHROUGH_FRAGMENT_SHADER } from '../../src/tone/shaders.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'

const migratedHslChannels = ['master', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple']

test('allows global and split-color HSL on the GPU path', () => {
  assert.deepEqual(
    getPassthroughEligibility({
      hsl_master_h: 12,
      hsl_master_s: -24,
      hsl_master_l: 8,
      hsl_red_h: -5,
      hsl_orange_s: 18,
      hsl_yellow_l: -8,
      hsl_green_h: 9,
      hsl_cyan_s: -16,
      hsl_blue_l: 11,
      hsl_purple_h: -14,
    }),
    { eligible: true, reason: null },
  )
})

test('keeps skin, lip, and black HSL on CPU until masks are shader-ready', () => {
  for (const patch of [
    { hsl_skin_h: 1 },
    { hsl_lip_s: -1 },
    { hsl_black_l: 1 },
  ]) {
    assert.equal(getPassthroughEligibility(patch).reason, 'effects-not-migrated')
  }
})

test('normalizes migrated HSL values for shader uniforms', () => {
  const renderer = new WebGLToneRenderer()
  const parameters = renderer.getToneParameters({
    hsl_master_h: 99,
    hsl_master_s: -99,
    hsl_master_l: 99,
    hsl_red_h: -99,
    hsl_blue_s: 99,
    hsl_purple_l: -99,
    hsl_skin_h: 12,
  })

  assert.equal(parameters.hsl.master.h, 40)
  assert.equal(parameters.hsl.master.s, -70)
  assert.equal(parameters.hsl.master.l, 32)
  assert.equal(parameters.hsl.red.h, -40)
  assert.equal(parameters.hsl.blue.s, 55)
  assert.equal(parameters.hsl.purple.l, -32)
  assert.equal(parameters.hsl.skin, undefined)
})

test('declares migrated HSL uniforms and channel metadata in the shader', () => {
  for (const channel of migratedHslChannels) {
    assert.match(PASSTHROUGH_FRAGMENT_SHADER, new RegExp(`uniform vec3 u_hsl_${channel};`))
  }

  for (const channel of HSL_CHANNELS.filter((item) => item.center !== undefined)) {
    assert.match(PASSTHROUGH_FRAGMENT_SHADER, new RegExp(`${channel.center.toFixed(1)}`))
    assert.match(PASSTHROUGH_FRAGMENT_SHADER, new RegExp(`${channel.width.toFixed(1)}`))
  }

  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /applyMigratedHsl/)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /u_hsl_skin/)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /u_hsl_lip/)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /u_hsl_black/)
})
