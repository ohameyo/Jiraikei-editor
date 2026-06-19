import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  getPreviewScaleLimits,
  shouldDeferExpensiveToneRender,
} from '../../src/tone/interactiveTonePolicy.js'

test('defers expensive tone rendering while a slider is dragging without WebGL', () => {
  assert.equal(
    shouldDeferExpensiveToneRender({
      isSliderDragging: true,
      activeSliderFilterKey: 'blackProtect',
      filters: { blackProtect: 0.3 },
      webglToneRequested: false,
    }),
    true,
  )

  assert.equal(
    shouldDeferExpensiveToneRender({
      isSliderDragging: false,
      activeSliderFilterKey: 'blackProtect',
      filters: { blackProtect: 0.3 },
      webglToneRequested: false,
    }),
    false,
  )
})

test('does not defer GPU eligible basic filter previews', () => {
  assert.equal(
    shouldDeferExpensiveToneRender({
      isSliderDragging: true,
      activeSliderFilterKey: 'brightness',
      filters: {
        brightness: 1.08,
        contrast: 1,
        saturation: 1,
        temperature: 0,
        tint: 0,
        skinWhiten: 0,
        blushStrength: 0,
        blackProtect: 0,
        fade: 0,
        overlayStrength: 0,
      },
      webglToneRequested: true,
    }),
    false,
  )
})

test('uses smaller mobile lightweight preview limits than desktop', () => {
  const mobile = getPreviewScaleLimits({ lightweight: true, mobilePreview: true })
  const desktop = getPreviewScaleLimits({ lightweight: true, mobilePreview: false })
  const fullMobile = getPreviewScaleLimits({ lightweight: false, mobilePreview: true })

  assert.equal(mobile.maxSide < desktop.maxSide, true)
  assert.equal(mobile.maxPixels < desktop.maxPixels, true)
  assert.equal(mobile.maxSide < fullMobile.maxSide, true)
  assert.equal(mobile.maxPixels <= 300000, true)
})

test('production scheduler gates expensive interactive tone renders', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /shouldDeferExpensiveToneRender\(/)
  assert.equal((app.match(/shouldDeferExpensiveToneRender\(/g) || []).length >= 2, true)
  assert.match(app, /deferExpensiveToneRender/)
  assert.match(app, /requestRenderWithProcessingLead\(store\.getState\(\)\)/)
})

test('production app exposes a bounded P9 interaction QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP9QaFromQuery/)
  assert.match(app, /v3p9qa/)
  assert.match(app, /p9QaResult/)
  assert.match(app, /cpuStableDuringDrag/)
  assert.match(app, /cpuRenderedAfterCommit/)
})

test('async asset refreshes use the interaction-aware render path', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /renderAfterAsyncAssetReady/)
  assert.doesNotMatch(app, /\.then\(\(\) => render\(store\.getState\(\)\)\)/)
  assert.doesNotMatch(app, /refreshTextFontDependentPanels\(\);\n\s*render\(store\.getState\(\)\)/)
})

test('production app remains syntactically valid after QA hook edits', () => {
  const appPath = fileURLToPath(new URL('../../src/app.js', import.meta.url))
  const result = spawnSync(process.execPath, ['--check', appPath], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
