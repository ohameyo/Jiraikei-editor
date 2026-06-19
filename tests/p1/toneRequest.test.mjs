import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createToneRenderRequest,
  getPassthroughEligibility,
} from '../../src/tone/toneRequest.js'

const originalFilters = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  skinWhiten: 0,
  blushStrength: 0,
  blackProtect: 0,
  fade: 0,
  overlayStrength: 0,
  hsl_master_h: 0,
  hsl_red_s: 0,
}

test('normalizes one shared preview or export tone request', () => {
  const sourceCanvas = { width: 8, height: 6 }
  const targetContext = { canvas: { width: 8, height: 6 } }
  const filters = { ...originalFilters }
  const vision = { faceBoxes: [] }
  const sourceKey = {}

  const request = createToneRenderRequest({
    sourceCanvas,
    targetContext,
    filters,
    vision,
    sourceKey,
    mode: 'export',
    interactivePreview: true,
  })

  assert.equal(request.sourceCanvas, sourceCanvas)
  assert.equal(request.targetContext, targetContext)
  assert.equal(request.filters, filters)
  assert.equal(request.vision, vision)
  assert.equal(request.sourceKey, sourceKey)
  assert.equal(request.mode, 'export')
  assert.equal(request.interactivePreview, true)
  assert.deepEqual(request.size, { width: 8, height: 6 })
  assert.equal(Object.isFrozen(request), true)
})

test('allows migrated global and portrait tone effects', () => {
  assert.deepEqual(getPassthroughEligibility(originalFilters), {
    eligible: true,
    reason: null,
  })

  assert.equal(
    getPassthroughEligibility({ ...originalFilters, brightness: 1.01 }).eligible,
    true,
  )
  assert.equal(
    getPassthroughEligibility({ ...originalFilters, blackProtect: 0.1 }).eligible,
    true,
  )
  assert.equal(
    getPassthroughEligibility({ ...originalFilters, hsl_red_s: -1 }).eligible,
    true,
  )
  assert.equal(
    getPassthroughEligibility({ ...originalFilters, hsl_skin_s: '-1' }).eligible,
    true,
  )
})

test('ignores inactive blush placement fields', () => {
  const eligibility = getPassthroughEligibility({
    ...originalFilters,
    blushManual: 1,
    blushLeftX: 0.2,
    blushRightX: 0.8,
  })

  assert.equal(eligibility.eligible, true)
})
