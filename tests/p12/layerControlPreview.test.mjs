import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DIRECT_MANIPULATION_FRAME_ACTIONS,
  getLayerControlFrameAction,
  shouldCommitLayerControlOnEnd,
} from '../../src/interaction/directManipulationPolicy.js'

test('layer control sliders preview without committing while dragging', () => {
  assert.equal(
    getLayerControlFrameAction({
      isSliderDragging: true,
      phase: 'preview',
      hasPreviewPatch: true,
    }),
    DIRECT_MANIPULATION_FRAME_ACTIONS.previewOnly,
  )

  assert.equal(
    shouldCommitLayerControlOnEnd({
      isSliderDragging: true,
      phase: 'preview',
      hasPreviewPatch: true,
    }),
    false,
  )
})

test('layer control sliders commit once on drag end', () => {
  assert.equal(
    getLayerControlFrameAction({
      isSliderDragging: false,
      phase: 'commit',
      hasPreviewPatch: true,
    }),
    DIRECT_MANIPULATION_FRAME_ACTIONS.commitRender,
  )

  assert.equal(
    shouldCommitLayerControlOnEnd({
      isSliderDragging: false,
      phase: 'commit',
      hasPreviewPatch: true,
    }),
    true,
  )
})

test('production layer controls use overlay previews before store updates', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function makeLayerPreviewSlider/)
  assert.match(app, /overlayController\.previewLayerPatch/)
  assert.match(app, /overlayController\.beginLayerControlPreview/)
  assert.match(app, /overlayController\.finishLayerControlPreview/)
  assert.match(app, /shouldCommitLayerControlOnEnd\(/)
  assert.match(app, /commitOnEnd:\s*true/)

  const layerControlsStart = app.indexOf('function renderLayerControls')
  const renderLayerListStart = app.indexOf('function renderLayerList')
  assert.notEqual(layerControlsStart, -1)
  assert.notEqual(renderLayerListStart, -1)
  const layerControlsBody = app.slice(layerControlsStart, renderLayerListStart)
  assert.match(layerControlsBody, /makeLayerPreviewSlider\(\{/)
  assert.match(layerControlsBody, /patchForValue/)
})

test('production app exposes a bounded P12 layer control QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP12QaFromQuery/)
  assert.match(app, /v3p12qa/)
  assert.match(app, /p12QaResult/)
  assert.match(app, /renderEventsDuringLayerControlDrag/)
  assert.match(app, /committedFontSize/)
})

test('production app remains syntactically valid after P12 edits', () => {
  const appPath = fileURLToPath(new URL('../../src/app.js', import.meta.url))
  const result = spawnSync(process.execPath, ['--check', appPath], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
