import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADVANCED_TONE_SAMPLE_PIXELS,
  PORTRAIT_TONE_RANGES,
  isAdvancedToneFilterKey,
} from '../../src/tone/advancedToneParameters.js'
import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'

test('records maintained portrait control bounds', () => {
  assert.deepEqual(PORTRAIT_TONE_RANGES, {
    skinWhiten: { min: 0, default: 0, max: 1, step: 0.01 },
    blushStrength: { min: 0, default: 0, max: 1, step: 0.01 },
    blackProtect: { min: 0, default: 0, max: 1, step: 0.01 },
  })
})

test('treats only maintained portrait controls as advanced tone keys', () => {
  assert.equal(isAdvancedToneFilterKey('hsl_lip_h'), false)
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

test('legacy HSL values are ignored after HSL shutdown', () => {
  assert.deepEqual(
    getPassthroughEligibility({
      hsl_master_h: 40,
      hsl_skin_l: 32,
      hsl_lip_h: -40,
      hsl_black_l: -32,
    }),
    { eligible: true, reason: null },
  )
})
