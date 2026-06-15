import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const manifestUrl = new URL('../../docs/baseline/production-source.json', import.meta.url)

test('records the exact deployed production source', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))

  assert.equal(manifest.productionUrl, 'https://jirai.pages.dev')
  assert.equal(
    manifest.sourceCommit,
    '1e5ab7220bf320e5943f3b86cb1c32025fcda660',
  )
  assert.deepEqual(manifest.primaryFiles, {
    'index.html': '8bca0c72faa382fc1bc9209ac8524bf5f94373d1942736cd9cb3d86f78141b92',
    'src/app.js': '6fd022275eb3a3f324bc8aae86b9fa2b99e827b07e3b35ab778d1c39f772a80c',
    'styles.css': 'fd3926cc09c802903ca233c4a2b17f658321d49ad1fa46d4318213767c57ab07',
  })
})

