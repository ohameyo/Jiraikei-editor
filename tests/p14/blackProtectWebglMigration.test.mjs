import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  PASSTHROUGH_FRAGMENT_SHADER,
} from '../../src/tone/shaders.js'
import { ToneRendererSelector } from '../../src/tone/ToneRendererSelector.js'
import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'
import { getGpuToneEligibility } from '../../src/tone/toneRequest.js'

const blackProtectRequest = {
  size: { width: 4, height: 3 },
  filters: {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    tint: 0,
    skinWhiten: 0,
    blushStrength: 0,
    blackProtect: 0.72,
    fade: 0,
    overlayStrength: 0,
  },
}

test('blackProtect is GPU eligible after P14', () => {
  assert.deepEqual(
    getGpuToneEligibility({ skinWhiten: 0.2, blushStrength: 0.3, blackProtect: 0.72 }),
    { eligible: true, reason: null },
  )
})

test('WebGL tone shader and parameters include blackProtect', () => {
  const renderer = new WebGLToneRenderer()

  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /uniform float u_blackProtect;/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /blackProtectMask/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /u_blackProtect/)
  assert.equal(renderer.getToneParameters({ blackProtect: 2 }).blackProtect, 1)
  assert.equal(renderer.getToneParameters({ blackProtect: -1 }).blackProtect, 0)
})

test('selector uses GPU for migrated blackProtect requests', () => {
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

  assert.equal(selector.render(blackProtectRequest), 'gpu-result')
  assert.equal(cpuCalls.length, 0)
  assert.equal(gpuCalls.length, 1)
  assert.equal(selector.getDiagnostics().selectedRenderer, 'gpu')
})

test('production app exposes a bounded P14 blackProtect GPU QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP14QaFromQuery/)
  assert.match(app, /v3p14qa/)
  assert.match(app, /p14QaResult/)
  assert.match(app, /blackProtectGpuSelected/)
  assert.match(app, /cpuStableForBlackProtect/)
})
