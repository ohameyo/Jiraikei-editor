import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('uses transient GPU previews for migrated filter sliders', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /MIGRATED_GPU_FILTER_KEYS/)
  assert.match(app, /queueGpuTonePreview\(/)
  assert.match(app, /sliderPreviewFilters/)
  assert.match(app, /window\.requestAnimationFrame/)
  assert.match(app, /isMigratedGpuFilter\(control\.key\)/)
  assert.match(app, /sourceKey: renderState\.image\.element/)
})

test('keeps preview and export on the shared tone runtime boundary', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.equal((app.match(/toneRuntime\.render\(/g) || []).length, 1)
  assert.match(app, /mode: options\.mode/)
  assert.match(app, /mode: 'export'/)
})
