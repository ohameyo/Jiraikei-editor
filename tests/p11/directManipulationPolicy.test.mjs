import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DIRECT_MANIPULATION_FRAME_ACTIONS,
  getDirectManipulationFrameAction,
  shouldQueueCanvasRenderForDirectManipulation,
} from '../../src/interaction/directManipulationPolicy.js'

test('direct manipulation previews stay DOM-only until commit', () => {
  assert.equal(
    getDirectManipulationFrameAction({
      isDirectManipulating: true,
      phase: 'preview',
      hasPendingPatch: true,
    }),
    DIRECT_MANIPULATION_FRAME_ACTIONS.previewOnly,
  )

  assert.equal(
    shouldQueueCanvasRenderForDirectManipulation({
      isDirectManipulating: true,
      phase: 'preview',
      hasPendingPatch: true,
    }),
    false,
  )
})

test('direct manipulation commit performs a single canvas render', () => {
  assert.equal(
    getDirectManipulationFrameAction({
      isDirectManipulating: true,
      phase: 'commit',
      hasPendingPatch: true,
    }),
    DIRECT_MANIPULATION_FRAME_ACTIONS.commitRender,
  )

  assert.equal(
    shouldQueueCanvasRenderForDirectManipulation({
      isDirectManipulating: true,
      phase: 'commit',
      hasPendingPatch: true,
    }),
    true,
  )
})

test('idle updates can still use the normal canvas render path', () => {
  assert.equal(
    getDirectManipulationFrameAction({
      isDirectManipulating: false,
      phase: 'preview',
      hasPendingPatch: false,
    }),
    DIRECT_MANIPULATION_FRAME_ACTIONS.idleRender,
  )
})

test('production layer preview path does not queue canvas renders while moving', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /shouldQueueCanvasRenderForDirectManipulation\(/)
  assert.match(app, /phase:\s*'preview'/)
  assert.match(app, /phase:\s*'commit'/)

  const applyPreviewStart = app.indexOf('function applyInteractionPreview')
  const startBlushStart = app.indexOf('function startBlushInteraction')
  assert.notEqual(applyPreviewStart, -1)
  assert.notEqual(startBlushStart, -1)
  const applyPreviewBody = app.slice(applyPreviewStart, startBlushStart)
  assert.doesNotMatch(applyPreviewBody, /requestRenderWithProcessingLead\(store\.getState\(\)\)/)
})

test('production app exposes a bounded P11 direct manipulation QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP11QaFromQuery/)
  assert.match(app, /v3p11qa/)
  assert.match(app, /p11QaResult/)
  assert.match(app, /renderEventsDuringDrag/)
  assert.match(app, /committedLayerPosition/)
})

test('production app remains syntactically valid after P11 edits', () => {
  const appPath = fileURLToPath(new URL('../../src/app.js', import.meta.url))
  const result = spawnSync(process.execPath, ['--check', appPath], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
