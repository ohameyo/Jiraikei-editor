import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const appUrl = new URL('../../src/app.js', import.meta.url)
const indexUrl = new URL('../../index.html', import.meta.url)
const stylesUrl = new URL('../../styles.css', import.meta.url)

const expectedFrameIds = [
  'portrait-clean',
  'landscape-clean',
  'doodle-heart-square',
  'doodle-heart-vertical',
  'doodle-bow-square',
  'doodle-bow-vertical',
  'doodle-minimal-square',
  'doodle-minimal-vertical',
]

test('frame page exposes polaroid plus three square and three vertical frame templates', async () => {
  const app = await readFile(appUrl, 'utf8')
  const index = await readFile(indexUrl, 'utf8')

  assert.match(index, /<span class="nav-label">相框<\/span>/)
  assert.match(index, /<h2 class="panel-title">相框<\/h2>/)
  assert.match(index, /<div class="field-title">相框模板<\/div>/)

  for (const id of expectedFrameIds) {
    assert.match(app, new RegExp(`id:\\s*'${id}'`), `missing ${id}`)
    await access(new URL(`../../assets/polaroid_frames/${id}.png`, import.meta.url))
    await access(new URL(`../../assets/polaroid_frame_previews/${id}.png`, import.meta.url))
  }

  assert.match(app, /name:\s*'1:1 星心覆膜'/)
  assert.match(app, /name:\s*'竖版4:3 星心覆膜'/)
  assert.match(app, /name:\s*'1:1 蝴蝶结覆膜'/)
  assert.match(app, /name:\s*'竖版4:3 蝴蝶结覆膜'/)
  assert.match(app, /name:\s*'1:1 清透覆膜'/)
  assert.match(app, /name:\s*'竖版4:3 清透覆膜'/)
})

test('frame controls stay conditional and use frame language', async () => {
  const app = await readFile(appUrl, 'utf8')
  const panelStart = app.indexOf('function renderPolaroidPanel')
  const panelEnd = app.indexOf('function renderStickerPanel', panelStart)
  const panelSource = app.slice(panelStart, panelEnd)

  assert.match(panelSource, /if \(state\.polaroid\?\.enabled\) \{/)
  assert.match(panelSource, /editBtn\.textContent = '调整照片位置';/)
  assert.match(panelSource, /closeBtn\.textContent = '关闭相框';/)
  assert.doesNotMatch(panelSource, /关闭拍立得/)
})

test('frame grid supports square thumbnails without changing existing card layout', async () => {
  const styles = await readFile(stylesUrl, 'utf8')
  const app = await readFile(appUrl, 'utf8')

  assert.match(styles, /\.polaroid-frame-btn\.is-square\s*\{[\s\S]*--polaroid-preview-width:\s*76px/)
  assert.match(styles, /\.polaroid-frame-btn\.is-square\s*\{[\s\S]*--polaroid-thumb-width:\s*70px/)
  assert.match(styles, /\.polaroid-frame-btn\s*\{[\s\S]*grid-template-rows:\s*84px minmax\(28px,\s*auto\)/)
  assert.match(app, /getPolaroidFramePreviewClass\(frame\)/)
  assert.match(app, /btn\.classList\.add\(getPolaroidFramePreviewClass\(frame\)\)/)
})
