import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('sticker thumbnails hide the placeholder after image load', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(app, /btn\.classList\.add\('is-loaded'\)/)
  assert.match(app, /btn\.classList\.add\('is-error'\)/)
  assert.match(styles, /\.sticker-btn\.is-loaded::before\s*\{[\s\S]*?opacity:\s*0/)
})

test('mobile sticker images use card-relative sizing instead of tiny fixed thumbnails', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')
  const mobileStickerImageRule = styles.match(/@media \(pointer: coarse\),[\s\S]*?\.sticker-btn img\s*\{([\s\S]*?)\n  \}/)

  assert.ok(mobileStickerImageRule, 'mobile sticker image rule should exist')
  assert.match(mobileStickerImageRule[1], /height:\s*min\(72%,\s*72px\)/)
  assert.doesNotMatch(mobileStickerImageRule[1], /height:\s*24px/)
})

test('polaroid thumbnails have a visible contrast preview surface', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(styles, /\.polaroid-frame-preview\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.96\)/)
  assert.match(styles, /\.polaroid-frame-preview\s*\{[\s\S]*overflow:\s*hidden/)
  assert.match(styles, /\.polaroid-frame-thumb\s*\{[\s\S]*object-fit:\s*contain/)
})
