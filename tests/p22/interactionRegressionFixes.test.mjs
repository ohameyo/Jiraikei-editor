import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { shouldSuppressPostManipulationOverlayClearClick } from '../../src/interaction/directManipulationPolicy.js'
import { shouldAutoEnterManualBlushFallback } from '../../src/interaction/portraitFallbackPolicy.js'

test('overlay clear click is suppressed right after direct manipulation ends', () => {
  assert.equal(
    shouldSuppressPostManipulationOverlayClearClick({
      lastInteractionEndedAt: 1000,
      now: 1120,
    }),
    true,
  )

  assert.equal(
    shouldSuppressPostManipulationOverlayClearClick({
      lastInteractionEndedAt: 1000,
      now: 1260,
    }),
    false,
  )

  assert.equal(
    shouldSuppressPostManipulationOverlayClearClick({
      lastInteractionEndedAt: 0,
      now: 1120,
    }),
    false,
  )
})

test('manual blush fallback only auto-enters while portrait flow is still active and idle', () => {
  assert.equal(
    shouldAutoEnterManualBlushFallback({
      isCurrentImport: true,
      isSameImage: true,
      activeTool: 'project',
      layerCount: 0,
      hasSelectedLayer: false,
      isSliderDragging: false,
      isTextEditing: false,
      isDirectManipulating: false,
    }),
    true,
  )

  assert.equal(
    shouldAutoEnterManualBlushFallback({
      isCurrentImport: true,
      isSameImage: true,
      activeTool: 'stickers',
      layerCount: 0,
      hasSelectedLayer: false,
      isSliderDragging: false,
      isTextEditing: false,
      isDirectManipulating: false,
    }),
    false,
  )

  assert.equal(
    shouldAutoEnterManualBlushFallback({
      isCurrentImport: true,
      isSameImage: true,
      activeTool: 'project',
      layerCount: 1,
      hasSelectedLayer: true,
      isSliderDragging: false,
      isTextEditing: false,
      isDirectManipulating: false,
    }),
    false,
  )

  assert.equal(
    shouldAutoEnterManualBlushFallback({
      isCurrentImport: true,
      isSameImage: true,
      activeTool: 'project',
      layerCount: 0,
      hasSelectedLayer: false,
      isSliderDragging: false,
      isTextEditing: false,
      isDirectManipulating: true,
    }),
    false,
  )
})

test('production app wires direct-manipulation and blush-fallback guards', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /shouldSuppressPostManipulationOverlayClearClick/)
  assert.match(app, /shouldAutoEnterManualBlushFallback/)
  assert.match(app, /if \(!portrait\.autoBlushDetected && shouldAutoEnterManualBlushFallback\(/)
  assert.match(app, /if \(shouldSuppressPostManipulationOverlayClearClick\(\{[\s\S]*lastInteractionEndedAt:[\s\S]*Date\.now\(\)/)
})
