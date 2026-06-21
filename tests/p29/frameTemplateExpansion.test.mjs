import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const appUrl = new URL('../../src/app.js', import.meta.url)
const indexUrl = new URL('../../index.html', import.meta.url)
const stylesUrl = new URL('../../styles.css', import.meta.url)

const expectedFrameIds = [
  'portrait-clean',
  'landscape-clean',
  'texture-band-square',
  'texture-band-vertical',
  'texture-glow-square',
  'texture-glow-vertical',
  'texture-charm-square',
  'texture-charm-vertical',
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

  assert.match(app, /name:\s*'1:1 蕾丝星星'/)
  assert.match(app, /name:\s*'竖版4:3 蕾丝星星'/)
  assert.match(app, /name:\s*'1:1 蕾丝爱心'/)
  assert.match(app, /name:\s*'竖版4:3 蕾丝爱心'/)
  assert.match(app, /name:\s*'1:1 韩系波点'/)
  assert.match(app, /name:\s*'竖版4:3 韩系波点'/)
  assert.match(
    app,
    /textureBandSquare:[\s\S]*?name:\s*'1:1 蕾丝星星'[\s\S]*?textureBandVertical:[\s\S]*?name:\s*'竖版4:3 蕾丝星星'[\s\S]*?textureGlowSquare:[\s\S]*?name:\s*'1:1 蕾丝爱心'[\s\S]*?textureGlowVertical:[\s\S]*?name:\s*'竖版4:3 蕾丝爱心'[\s\S]*?textureCharmSquare:[\s\S]*?name:\s*'1:1 韩系波点'[\s\S]*?textureCharmVertical:[\s\S]*?name:\s*'竖版4:3 韩系波点'/
  )
  assert.doesNotMatch(app, /id:\s*'doodle-(heart|bow|minimal)-(square|vertical)'/)
  assert.doesNotMatch(app, /name:\s*'.*(星心|蝴蝶结|清透)覆膜'/)
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
