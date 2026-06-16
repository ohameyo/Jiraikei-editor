import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADVANCED_TONE_FIXTURE_RISK_TAGS,
  ADVANCED_TONE_FIXTURES,
  ADVANCED_TONE_VISUAL_QA_SCENARIOS,
  getAdvancedToneFixtureIds,
  validateAdvancedToneFixtureCoverage,
} from '../../src/tone/advancedToneFixtures.js'

test('declares curated photo-like fixtures for P5 visual QA', () => {
  assert.deepEqual(getAdvancedToneFixtureIds(), [
    'fair-skin-black-hair',
    'medium-skin-dark-clothes',
    'deep-skin-red-lip',
  ])

  for (const fixture of ADVANCED_TONE_FIXTURES) {
    assert.ok(fixture.label)
    assert.equal(fixture.width, 320)
    assert.equal(fixture.height, 420)
    assert.ok(fixture.faceBox)
    assert.ok(fixture.riskTags.length >= 3)
  }
})

test('covers the required P5 real-image risk tags', () => {
  assert.deepEqual(ADVANCED_TONE_FIXTURE_RISK_TAGS, [
    'light-skin',
    'medium-skin',
    'deep-skin',
    'black-hair',
    'dark-clothes',
    'red-lip',
    'heavy-blush',
    'whitening',
    'export-parity',
  ])

  assert.deepEqual(validateAdvancedToneFixtureCoverage(), {
    ok: true,
    missingTags: [],
  })
})

test('pairs each fixture with visual QA scenarios', () => {
  assert.deepEqual(
    ADVANCED_TONE_VISUAL_QA_SCENARIOS.map((scenario) => scenario.id),
    [
      'whiten-heavy-blush-check',
      'black-hair-dark-clothes-check',
      'combined-export-check',
    ],
  )

  for (const scenario of ADVANCED_TONE_VISUAL_QA_SCENARIOS) {
    assert.ok(scenario.fixtureIds.length > 0)
    assert.ok(Object.keys(scenario.filters).length > 0)
  }
})
