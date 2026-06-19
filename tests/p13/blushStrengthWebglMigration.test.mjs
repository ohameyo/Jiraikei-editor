import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  PASSTHROUGH_FRAGMENT_SHADER,
} from '../../src/tone/shaders.js'
import { ToneRendererSelector } from '../../src/tone/ToneRendererSelector.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'
import { getGpuToneEligibility } from '../../src/tone/toneRequest.js'

const blushRequest = {
  size: { width: 4, height: 3 },
  filters: {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    tint: 0,
    skinWhiten: 0,
    blushStrength: 0.45,
    blackProtect: 0,
    fade: 0,
    overlayStrength: 0,
  },
}

test('blushStrength is GPU eligible with migrated portrait effects', () => {
  assert.deepEqual(
    getGpuToneEligibility({ skinWhiten: 0.2, blushStrength: 0.45, blackProtect: 0.2 }),
    { eligible: true, reason: null },
  )
})

test('WebGL tone shader and parameters include blushStrength', () => {
  const renderer = new WebGLToneRenderer()

  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /uniform float u_blushStrength;/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /blushMask/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /u_blushStrength/)
  assert.equal(renderer.getToneParameters({ blushStrength: 2 }).blushStrength, 1)
  assert.equal(renderer.getToneParameters({ blushStrength: -1 }).blushStrength, 0)
})

test('selector uses GPU for migrated blushStrength requests', () => {
  const cpuCalls = []
  const gpuCalls = []
  const selector = new ToneRendererSelector({
    enabled: true,
    cpuRender(value) {
      cpuCalls.push(value)
      return 'cpu-result'
    },
    gpuRenderer: {
      isSupported: () => true,
      render(value) {
        gpuCalls.push(value)
        return 'gpu-result'
      },
    },
  })

  assert.equal(selector.render(blushRequest), 'gpu-result')
  assert.equal(cpuCalls.length, 0)
  assert.equal(gpuCalls.length, 1)
  assert.equal(selector.getDiagnostics().selectedRenderer, 'gpu')
})

test('production app exposes a bounded P13 blushStrength GPU QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP13QaFromQuery/)
  assert.match(app, /v3p13qa/)
  assert.match(app, /p13QaResult/)
  assert.match(app, /blushStrengthGpuSelected/)
  assert.match(app, /cpuStableForBlushStrength/)
})
