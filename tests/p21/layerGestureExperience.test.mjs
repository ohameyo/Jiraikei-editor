import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('pinch gestures can rotate selected layers directly', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.ok(app.includes('interaction.pinchStartAngle = pinch.angle;'))
  assert.ok(app.includes('const angleDelta = ((pinch.angle - (interaction.pinchStartAngle ?? pinch.angle)) * 180) / Math.PI;'))
  assert.ok(app.includes('patch.rotation = (interaction.startRotation ?? 0) + angleDelta;'))
})

test('direct manipulation keeps layer panels frozen while overlay preview is active', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /const allowLayerPanelRefresh = !isDirectManipulating;/)
  assert.match(app, /if \(allowLayerPanelRefresh\) \{[\s\S]*renderLayerControls\(state\);/)
  assert.match(app, /if \(allowLayerPanelRefresh\) \{[\s\S]*renderMobileLayerDock\(state\);/)
})

test('layer gestures use center snap guides and larger touch hit areas on mobile', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(app, /const SNAP_GUIDE_THRESHOLD = 0\.018;/)
  assert.match(app, /function applySnapToInteractionPatch\(/)
  assert.match(app, /showSnapGuides\(/)
  assert.match(styles, /\.overlay-guide/)
  assert.match(styles, /\.overlay-guide\.is-visible/)
  assert.match(styles, /\.overlay-handle::before\s*\{[\s\S]*inset:\s*-16px/)
})
