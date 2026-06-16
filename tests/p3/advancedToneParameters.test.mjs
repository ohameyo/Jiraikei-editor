import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADVANCED_TONE_SAMPLE_PIXELS,
  HSL_AXES,
  HSL_CHANNELS,
  PORTRAIT_TONE_RANGES,
  hslFilterKey,
  isAdvancedToneFilterKey,
} from '../../src/tone/advancedToneParameters.js'
import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'

test('records production HSL and portrait control bounds', () => {
  assert.deepEqual(HSL_AXES, [
    { axis: 'h', label: '色相', min: -40, default: 0, max: 40, step: 1 },
    { axis: 's', label: '饱和度', min: -70, default: 0, max: 55, step: 1 },
    { axis: 'l', label: '明度', min: -32, default: 0, max: 32, step: 1 },
  ])

  assert.deepEqual(PORTRAIT_TONE_RANGES, {
    skinWhiten: { min: 0, default: 0, max: 1, step: 0.01 },
    blushStrength: { min: 0, default: 0, max: 1, step: 0.01 },
    blackProtect: { min: 0, default: 0, max: 1, step: 0.01 },
  })
})

test('covers global, skin, lip, black, and split-color HSL channels', () => {
  assert.deepEqual(
    HSL_CHANNELS.map((channel) => channel.id),
    ['master', 'skin', 'lip', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'black'],
  )

  assert.equal(hslFilterKey('skin', 's'), 'hsl_skin_s')
  assert.equal(hslFilterKey('black', 'l'), 'hsl_black_l')
  assert.equal(isAdvancedToneFilterKey('hsl_lip_h'), true)
  assert.equal(isAdvancedToneFilterKey('blushStrength'), true)
  assert.equal(isAdvancedToneFilterKey('brightness'), false)
})

test('advanced tone samples cover required visual risk cases', () => {
  const requiredSamples = [
    'light-neutral',
    'dark-neutral',
    'black-white-ramp',
    'black-hair',
    'skin-fair',
    'skin-medium',
    'skin-deep',
    'lip-red',
  ]

  assert.deepEqual(
    requiredSamples.map((id) => ADVANCED_TONE_SAMPLE_PIXELS.some((sample) => sample.id === id)),
    requiredSamples.map(() => true),
  )

  for (const sample of ADVANCED_TONE_SAMPLE_PIXELS) {
    assert.equal(sample.rgb.length, 3)
    assert.ok(sample.rgb.every((value) => Number.isInteger(value) && value >= 0 && value <= 255))
  }
})

test('portrait-dependent advanced effects stay on CPU until shader parity exists', () => {
  for (const patch of [
    { hsl_skin_l: 1 },
    { hsl_lip_h: 1 },
    { hsl_black_l: -1 },
    { skinWhiten: 0.01 },
    { blushStrength: 0.01 },
    { blackProtect: 0.01 },
  ]) {
    assert.equal(
      getPassthroughEligibility(patch).reason,
      'effects-not-migrated',
    )
  }
})
