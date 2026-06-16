import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('browser entry opens the real app P5 QA mode', async () => {
  const page = await readFile(new URL('../browser/p5-real-fixture-qa.html', import.meta.url), 'utf8')

  assert.match(page, /index\.html\?v3gpu=1&v3p5qa=1/)
  assert.match(page, /V3 app QA mode/)
})

test('production app exposes a bounded P5 QA hook for fixture import', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /window\.__JIRAI_V3_QA__/)
  assert.match(app, /loadFixture/)
  assert.match(app, /createAdvancedToneFixtureCanvas/)
  assert.match(app, /setVisionData/)
  assert.match(app, /activeFilterPanel = 'hsl'/)
  assert.match(app, /p5QaResult/)
  assert.match(app, /runP5QaFromQuery/)
})
