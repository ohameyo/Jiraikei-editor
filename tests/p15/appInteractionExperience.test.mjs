import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  APP_INTERACTION_EXPERIENCE_TARGETS,
  summarizeAppInteractionExperience,
} from '../../src/interaction/appInteractionExperiencePolicy.js'

test('P15 app interaction summary requires instant filter and layer feedback', () => {
  const summary = summarizeAppInteractionExperience({
    tone: {
      cpuFallbacksDuringPreview: 0,
      gpuRendersDuringPreview: 1,
      cpuFallbacksAfterCommit: 0,
      selectedRendererAfterCommit: 'gpu',
    },
    layerMove: {
      renderEventsDuringDrag: 0,
      storeStableDuringDrag: true,
      committed: true,
      commitRendered: true,
    },
    layerControl: {
      renderEventsDuringDrag: 0,
      storeStableDuringDrag: true,
      overlayPreviewVisible: true,
      committed: true,
      commitRendered: true,
    },
  })

  assert.equal(APP_INTERACTION_EXPERIENCE_TARGETS.maxCpuFallbacksDuringPreview, 0)
  assert.equal(APP_INTERACTION_EXPERIENCE_TARGETS.maxLayerCanvasRendersDuringDrag, 0)
  assert.equal(summary.passed, true)
  assert.equal(summary.tonePreviewInstant, true)
  assert.equal(summary.layerMoveInstant, true)
  assert.equal(summary.layerControlInstant, true)
})

test('P15 app interaction summary rejects hidden regressions', () => {
  const summary = summarizeAppInteractionExperience({
    tone: {
      cpuFallbacksDuringPreview: 1,
      gpuRendersDuringPreview: 0,
      cpuFallbacksAfterCommit: 1,
      selectedRendererAfterCommit: 'cpu',
    },
    layerMove: {
      renderEventsDuringDrag: 1,
      storeStableDuringDrag: false,
      committed: false,
      commitRendered: false,
    },
    layerControl: {
      renderEventsDuringDrag: 1,
      storeStableDuringDrag: false,
      overlayPreviewVisible: false,
      committed: false,
      commitRendered: false,
    },
  })

  assert.equal(summary.passed, false)
  assert.equal(summary.tonePreviewInstant, false)
  assert.equal(summary.layerMoveInstant, false)
  assert.equal(summary.layerControlInstant, false)
})

test('production app exposes the P15 app-level interaction QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /summarizeAppInteractionExperience/)
  assert.match(app, /runP15QaFromQuery/)
  assert.match(app, /v3p15qa/)
  assert.match(app, /p15QaResult/)
  assert.match(app, /tonePreviewInstant/)
  assert.match(app, /layerMoveInstant/)
  assert.match(app, /layerControlInstant/)
})

test('P5 real fixture QA now expects the migrated GPU portrait path', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /selectedRenderer === 'gpu'/)
  assert.match(app, /fallbackReason === null/)
  assert.doesNotMatch(app, /selectedRenderer === 'cpu'[\s\S]*fallbackReason === 'effects-not-migrated'/)
})

test('production app remains syntactically valid after P15 edits', () => {
  const appPath = fileURLToPath(new URL('../../src/app.js', import.meta.url))
  const result = spawnSync(process.execPath, ['--check', appPath], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
