import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('loads the production app as a module and selects tone rendering at one boundary', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(html, /<script type="module" src="src\/app\.js"><\/script>/)
  assert.match(app, /from '\.\/tone\/index\.js'/)
  assert.match(app, /toneRuntime\.render\(/)
  assert.match(app, /__JIRAI_TONE_DIAGNOSTICS__/)
  assert.equal((app.match(/toneRuntime\.render\(/g) || []).length, 1)
})
