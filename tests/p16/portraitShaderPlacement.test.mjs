import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WebGLToneRenderer } from '../../src/tone/WebGLToneRenderer.js'
import { PASSTHROUGH_FRAGMENT_SHADER } from '../../src/tone/shaders.js'

test('manual blush controls are converted into normalized WebGL blush regions', () => {
  const renderer = new WebGLToneRenderer()
  const regions = renderer.getPortraitToneUniforms({
    blushManual: 1,
    blushLeftEnabled: 1,
    blushRightEnabled: 1,
    blushLeftX: 0.42,
    blushLeftY: 0.18,
    blushLeftRX: 0.052,
    blushLeftRY: 0.034,
    blushRightX: 0.57,
    blushRightY: 0.17,
    blushRightRX: 0.058,
    blushRightRY: 0.036,
    blushExtraEnabled: 0,
  }).blushRegions

  assert.equal(regions.length, 2)
  assert.deepEqual(regions[0].map((value) => Number(value.toFixed(3))), [0.42, 0.82, 0.052, 0.034])
  assert.deepEqual(regions[1].map((value) => Number(value.toFixed(3))), [0.57, 0.83, 0.058, 0.036])
})

test('face boxes are converted into cheek regions when blush is automatic', () => {
  const renderer = new WebGLToneRenderer()
  const uniforms = renderer.getPortraitToneUniforms(
    { blushManual: 0 },
    { faceBoxes: [{ x: 320, y: 120, width: 220, height: 260 }] },
    { width: 1000, height: 1400 },
  )

  assert.equal(uniforms.blushRegions.length, 2)
  assert.ok(uniforms.blushRegions[0][1] > 0.78, 'WebGL cheek y should be flipped from canvas face coordinates')
  assert.ok(uniforms.blushRegions[1][1] > 0.78, 'WebGL cheek y should be flipped from canvas face coordinates')
})

test('shader uses explicit blush regions and protects dark pixels after overlay operations', () => {
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /uniform int u_blushRegionCount;/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /uniform vec4 u_blushRegions\[4\];/)
  assert.match(PASSTHROUGH_FRAGMENT_SHADER, /ellipseBlushMask/)
  assert.doesNotMatch(PASSTHROUGH_FRAGMENT_SHADER, /abs\(uv\.x - 0\.36\)/)

  const overlayIndex = PASSTHROUGH_FRAGMENT_SHADER.indexOf('float overlayLuma')
  const protectIndex = PASSTHROUGH_FRAGMENT_SHADER.indexOf('float blackProtect =')
  assert.ok(overlayIndex > -1)
  assert.ok(protectIndex > overlayIndex, 'blackProtect should run after tint/fade/overlay so black hair is restored last')
})

test('production app exposes a bounded P16 portrait shader placement QA probe', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /runP16QaFromQuery/)
  assert.match(app, /v3p16qa/)
  assert.match(app, /p16QaResult/)
  assert.match(app, /manualBlushOnFace/)
  assert.match(app, /blackProtectPreservedDark/)
})
