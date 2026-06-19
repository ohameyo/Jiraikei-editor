import assert from 'node:assert/strict'
import test from 'node:test'

import { ToneRendererSelector } from '../../src/tone/ToneRendererSelector.js'
import { isWebGLToneRequested } from '../../src/tone/toneFeatureSwitch.js'

const request = {
  size: { width: 4, height: 3 },
  filters: {
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
  },
}

const createCpuSpy = () => {
  const calls = []
  return {
    calls,
    render(value) {
      calls.push(value)
      return 'cpu-result'
    },
  }
}

test('parses the internal URL and storage switches', () => {
  assert.equal(
    isWebGLToneRequested(
      { search: '?v3gpu=1' },
      { getItem: () => null },
    ),
    true,
  )
  assert.equal(
    isWebGLToneRequested(
      { search: '' },
      { getItem: (key) => (key === 'jirai-v3-gpu' ? '1' : null) },
    ),
    true,
  )
  assert.equal(
    isWebGLToneRequested(
      { search: '?v3gpu=0' },
      { getItem: () => '1' },
    ),
    false,
  )
})

test('uses CPU when the GPU switch is disabled', () => {
  const cpu = createCpuSpy()
  const gpu = { isSupported: () => true, render: () => 'gpu-result' }
  const selector = new ToneRendererSelector({
    enabled: false,
    cpuRender: cpu.render.bind(cpu),
    gpuRenderer: gpu,
  })

  assert.equal(selector.render(request), 'cpu-result')
  assert.equal(cpu.calls.length, 1)
  assert.equal(selector.getDiagnostics().fallbackReason, 'gpu-disabled')
})

test('uses GPU for migrated portrait effects', () => {
  const cpu = createCpuSpy()
  const selector = new ToneRendererSelector({
    enabled: true,
    cpuRender: cpu.render.bind(cpu),
    gpuRenderer: { isSupported: () => true, render: () => 'gpu-result' },
  })

  selector.render({
    ...request,
    filters: { ...request.filters, skinWhiten: 0.2, blushStrength: 0.1, blackProtect: 0.1 },
  })

  assert.equal(cpu.calls.length, 0)
  assert.equal(selector.getDiagnostics().selectedRenderer, 'gpu')
  assert.equal(selector.getDiagnostics().fallbackReason, null)
})

test('uses CPU when WebGL2 is unavailable', () => {
  const cpu = createCpuSpy()
  const selector = new ToneRendererSelector({
    enabled: true,
    cpuRender: cpu.render.bind(cpu),
    gpuRenderer: { isSupported: () => false, render: () => 'gpu-result' },
  })

  selector.render(request)

  assert.equal(cpu.calls.length, 1)
  assert.equal(selector.getDiagnostics().fallbackReason, 'webgl2-unavailable')
})

test('falls back to CPU exactly once when GPU rendering fails', () => {
  const cpu = createCpuSpy()
  const selector = new ToneRendererSelector({
    enabled: true,
    cpuRender: cpu.render.bind(cpu),
    gpuRenderer: {
      isSupported: () => true,
      render() {
        throw new Error('context lost')
      },
    },
  })

  assert.equal(selector.render(request), 'cpu-result')
  assert.equal(cpu.calls.length, 1)
  assert.equal(selector.getDiagnostics().fallbackReason, 'gpu-render-failed')
  assert.equal(selector.getDiagnostics().lastError, 'context lost')
})

test('uses GPU for an eligible passthrough request', () => {
  const cpu = createCpuSpy()
  const gpuCalls = []
  const selector = new ToneRendererSelector({
    enabled: true,
    cpuRender: cpu.render.bind(cpu),
    gpuRenderer: {
      isSupported: () => true,
      render(value) {
        gpuCalls.push(value)
        return 'gpu-result'
      },
    },
  })

  assert.equal(selector.render(request), 'gpu-result')
  assert.equal(cpu.calls.length, 0)
  assert.equal(gpuCalls.length, 1)
  assert.deepEqual(selector.getDiagnostics(), {
    requestedRenderer: 'gpu',
    selectedRenderer: 'gpu',
    eligible: true,
    fallbackReason: null,
    width: 4,
    height: 3,
    gpuRenderCount: 1,
    cpuFallbackCount: 0,
    lastError: null,
    gpuResources: null,
  })
})
