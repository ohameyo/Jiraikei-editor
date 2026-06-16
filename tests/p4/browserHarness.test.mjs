import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('browser harness runs the shared P4 advanced tone QA scenarios', async () => {
  const harness = await readFile(new URL('../browser/p4-advanced-tone-qa.js', import.meta.url), 'utf8')
  const page = await readFile(new URL('../browser/p4-advanced-tone-qa.html', import.meta.url), 'utf8')

  assert.match(page, /p4-advanced-tone-qa\.js/)
  assert.match(harness, /ADVANCED_TONE_QA_SCENARIOS/)
  assert.match(harness, /ADVANCED_TONE_SAMPLE_PIXELS/)
  assert.match(harness, /validateAdvancedToneQaCoverage/)
  assert.match(harness, /fallbackReason === 'effects-not-migrated'/)
  assert.match(harness, /mode: 'export'/)
})
