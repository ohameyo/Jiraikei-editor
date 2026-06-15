import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BASIC_TONE_RANGES,
  normalizeBasicToneParameters,
  parseHexColor,
} from '../../src/tone/basicToneParameters.js'
import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'

const defaults = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  fade: 0,
  overlayStrength: 0,
  overlayColor: '#e7d3ea',
}

test('records production minimum, default, and maximum values', () => {
  assert.deepEqual(BASIC_TONE_RANGES, {
    brightness: { min: 0.6, default: 1, max: 1.3 },
    contrast: { min: 0.7, default: 1, max: 1.4 },
    saturation: { min: 0.3, default: 1, max: 1.2 },
    temperature: { min: -100, default: 0, max: 100 },
    tint: { min: -100, default: 0, max: 100 },
    fade: { min: 0, default: 0, max: 0.5 },
    overlayStrength: { min: 0, default: 0, max: 0.45 },
  })
})

test('normalizes migrated parameters to production control bounds', () => {
  assert.deepEqual(normalizeBasicToneParameters(defaults), {
    ...defaults,
    overlayColorRgb: [231 / 255, 211 / 255, 234 / 255],
  })

  const below = normalizeBasicToneParameters({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: -200,
    tint: -200,
    fade: -1,
    overlayStrength: -1,
  })
  assert.equal(below.brightness, 0.6)
  assert.equal(below.contrast, 0.7)
  assert.equal(below.saturation, 0.3)
  assert.equal(below.temperature, -100)
  assert.equal(below.tint, -100)
  assert.equal(below.fade, 0)
  assert.equal(below.overlayStrength, 0)

  const above = normalizeBasicToneParameters({
    brightness: 2,
    contrast: 2,
    saturation: 2,
    temperature: 200,
    tint: 200,
    fade: 1,
    overlayStrength: 1,
  })
  assert.equal(above.brightness, 1.3)
  assert.equal(above.contrast, 1.4)
  assert.equal(above.saturation, 1.2)
  assert.equal(above.temperature, 100)
  assert.equal(above.tint, 100)
  assert.equal(above.fade, 0.5)
  assert.equal(above.overlayStrength, 0.45)
})

test('parses six-digit overlay colors and falls back safely', () => {
  assert.deepEqual(parseHexColor('#F5B9E4'), [245 / 255, 185 / 255, 228 / 255])
  assert.deepEqual(parseHexColor('bad'), [239 / 255, 212 / 255, 230 / 255])
})

test('allows migrated global filters and rejects non-migrated effects', () => {
  assert.deepEqual(
    getPassthroughEligibility({
      ...defaults,
      brightness: 1.3,
      contrast: 0.7,
      saturation: 0.3,
      temperature: -100,
      tint: 100,
      fade: 0.5,
      overlayStrength: 0.45,
    }),
    { eligible: true, reason: null },
  )

  for (const patch of [
    { skinWhiten: 0.01 },
    { blushStrength: 0.01 },
    { blackProtect: 0.01 },
    { hsl_master_s: -1 },
  ]) {
    assert.equal(
      getPassthroughEligibility({ ...defaults, ...patch }).reason,
      'effects-not-migrated',
    )
  }
})
