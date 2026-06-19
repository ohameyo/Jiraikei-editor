import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('profile modal avatar is addressable from production markup', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')

  assert.match(html, /id="profileAvatar"/)
})

test('production app upgrades profile avatar to a versioned asset url with logo fallback', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /profileAvatar:\s*document\.getElementById\('profileAvatar'\)/)
  assert.match(app, /function syncProfileAvatarAsset\(\)/)
  assert.match(app, /const avatarSrc = resolveAssetUrl\('\.\/assets\/profile-avatar\.png', '20260619-profile-avatar-1'\)/)
  assert.match(app, /const fallbackSrc = resolveAssetUrl\('\.\/assets\/logo\.png', '20260619-profile-avatar-1'\)/)
  assert.match(app, /els\.profileAvatar\.onerror = \(\) => \{/)
  assert.match(app, /els\.profileAvatar\.src = avatarSrc/)
  assert.match(app, /els\.profileAvatar\.src = fallbackSrc/)
  assert.match(app, /syncProfileAvatarAsset\(\);/)
})
