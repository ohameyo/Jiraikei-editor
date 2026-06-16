import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADVANCED_TONE_QA_SCENARIOS,
  ADVANCED_TONE_QA_SAMPLE_GROUPS,
  buildAdvancedToneQaFilters,
  getAdvancedToneQaScenarioIds,
  validateAdvancedToneQaCoverage,
} from '../../src/tone/advancedToneQa.js'
import { ADVANCED_TONE_SAMPLE_PIXELS } from '../../src/tone/advancedToneParameters.js'
import { getPassthroughEligibility } from '../../src/tone/toneRequest.js'

test('declares advanced tone QA sample groups for P4 risk areas', () => {
  assert.deepEqual(ADVANCED_TONE_QA_SAMPLE_GROUPS, [
    'light',
    'dark',
    'black-white',
    'black-hair',
    'skin-tone',
    'lip',
  ])

  const coverage = validateAdvancedToneQaCoverage(ADVANCED_TONE_SAMPLE_PIXELS)
  assert.equal(coverage.ok, true)
  assert.deepEqual(coverage.missingGroups, [])
})

test('declares QA scenarios for HSL, skin, lip, black protection, blush, and smoothing', () => {
  assert.deepEqual(getAdvancedToneQaScenarioIds(), [
    'global-hsl',
    'split-color-hsl',
    'skin-lip-hsl',
    'whiten-blush',
    'black-protect-smooth',
    'combined-export-parity',
  ])

  for (const scenario of ADVANCED_TONE_QA_SCENARIOS) {
    assert.ok(scenario.label)
    assert.ok(scenario.requiredGroups.length > 0)
    assert.equal(validateAdvancedToneQaCoverage(ADVANCED_TONE_SAMPLE_PIXELS, scenario.requiredGroups).ok, true)
  }
})

test('builds advanced filters with the expected P7 GPU migration boundary', () => {
  for (const scenario of ADVANCED_TONE_QA_SCENARIOS) {
    const filters = buildAdvancedToneQaFilters(scenario.id)
    const eligibility = getPassthroughEligibility(filters)
    if (scenario.id === 'global-hsl' || scenario.id === 'split-color-hsl') {
      assert.equal(eligibility.eligible, true, scenario.id)
    } else {
      assert.equal(eligibility.reason, 'effects-not-migrated', scenario.id)
    }
  }
})
