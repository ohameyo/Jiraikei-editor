import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { onRequestPost } from '../../functions/analytics.js'

test('analytics endpoint stores anonymous visitor id for DAU queries', async () => {
  const writes = []
  const visitorId = 'jv1_1234567890abcdef'
  const request = new Request('https://example.com/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'app_open',
      path: '/',
      language: 'zh-CN',
      visitorId,
      viewportWidth: 390,
      viewportHeight: 844,
      isMobile: true,
      payload: { referrerType: 'direct' },
    }),
  })

  const response = await onRequestPost({
    request,
    env: {
      ANALYTICS: {
        writeDataPoint(dataPoint) {
          writes.push(dataPoint)
        },
      },
    },
  })

  assert.equal(response.status, 200)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].indexes[0], 'app_open')
  assert.equal(writes[0].blobs[17], visitorId)
})

test('production analytics events include a persistent anonymous visitor id', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /ANALYTICS_VISITOR_ID_KEY/)
  assert.match(app, /function getAnalyticsVisitorId\(\)/)
  assert.match(app, /visitorId:\s*getAnalyticsVisitorId\(\)/)
})
