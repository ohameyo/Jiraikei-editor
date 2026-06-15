import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyApplicationContract } from '../../scripts/verify-p0.mjs'

test('keeps the production editor controls and rendering surfaces', async () => {
  const result = await verifyApplicationContract()

  assert.deepEqual(result.missing, [])
  assert.equal(result.checks.navigation, 7)
  assert.equal(result.checks.hasCanvas, true)
  assert.equal(result.checks.hasOverlay, true)
  assert.equal(result.checks.hasUpload, true)
  assert.equal(result.checks.hasProperties, true)
  assert.equal(result.checks.hasCompare, true)
  assert.equal(result.checks.hasExport, true)
})

