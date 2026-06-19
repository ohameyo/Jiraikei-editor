import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const stickerFile = 'face-cover-lace-heart.png'

test('face cover sticker is the first regular sticker and has a preview asset', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const fullAsset = new URL(`../../assets/user_stickers/${stickerFile}`, import.meta.url)
  const previewAsset = new URL(`../../assets/sticker_previews/user/${stickerFile}`, import.meta.url)

  assert.match(app, /const USER_STICKER_FILES = \[\s*'face-cover-lace-heart\.png'/)
  await access(fullAsset)
  await access(previewAsset)
})
