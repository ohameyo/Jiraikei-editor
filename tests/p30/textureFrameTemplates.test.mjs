import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const textureFrames = [
  {
    id: 'texture-band-square',
    name: '1:1 蕾丝星星',
    width: 1280,
    height: 1280,
  },
  {
    id: 'texture-band-vertical',
    name: '竖版4:3 蕾丝星星',
    width: 960,
    height: 1280,
  },
  {
    id: 'texture-glow-square',
    name: '1:1 蕾丝爱心',
    width: 1280,
    height: 1280,
  },
  {
    id: 'texture-glow-vertical',
    name: '竖版4:3 蕾丝爱心',
    width: 960,
    height: 1280,
  },
  {
    id: 'texture-charm-square',
    name: '1:1 韩系波点',
    width: 1280,
    height: 1280,
  },
  {
    id: 'texture-charm-vertical',
    name: '竖版4:3 韩系波点',
    width: 960,
    height: 1280,
  },
]

test('transparent texture templates are registered as top overlays with full-canvas photo clipping', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  for (const frame of textureFrames) {
    assert.match(app, new RegExp(`id:\\s*'${frame.id}'`), `missing ${frame.id}`)
    assert.match(app, new RegExp(`name:\\s*'${frame.name}'`), `missing ${frame.name}`)
    assert.match(app, new RegExp(`id:\\s*'${frame.id}'[\\s\\S]*?renderMode:\\s*'texture'`), `${frame.id} should render as texture`)
    assert.match(
      app,
      new RegExp(`id:\\s*'${frame.id}'[\\s\\S]*?photoWindow:\\s*\\{ x:\\s*0, y:\\s*0, width:\\s*${frame.width}, height:\\s*${frame.height} \\}`),
      `${frame.id} should clip photos to the whole template bounds`
    )
    await access(new URL(`../../assets/polaroid_frames/${frame.id}.png`, import.meta.url))
    await access(new URL(`../../assets/polaroid_frame_previews/${frame.id}.png`, import.meta.url))
  }

  assert.match(
    app,
    /textureBandSquare:[\s\S]*?name:\s*'1:1 蕾丝星星'[\s\S]*?textureBandVertical:[\s\S]*?name:\s*'竖版4:3 蕾丝星星'[\s\S]*?textureGlowSquare:[\s\S]*?name:\s*'1:1 蕾丝爱心'[\s\S]*?textureGlowVertical:[\s\S]*?name:\s*'竖版4:3 蕾丝爱心'[\s\S]*?textureCharmSquare:[\s\S]*?name:\s*'1:1 韩系波点'[\s\S]*?textureCharmVertical:[\s\S]*?name:\s*'竖版4:3 韩系波点'/
  )
  assert.doesNotMatch(app, /id:\s*'doodle-(heart|bow|minimal)-(square|vertical)'/)
  assert.doesNotMatch(app, /name:\s*'.*(星心|蝴蝶结|清透)覆膜'/)
})

test('texture template cards use a dark preview plate so pale overlay art is visible', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

  assert.match(app, /if \(frame\.renderMode === 'texture'\) btn\.classList\.add\('is-texture'\);/)
  assert.match(styles, /\.polaroid-frame-btn\.is-texture\s+\.polaroid-frame-preview\s*\{[\s\S]*background:\s*#211620/)
  assert.match(styles, /\.polaroid-frame-btn\.is-texture\s+\.polaroid-frame-preview\s*\{[\s\S]*border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/)
})

test('texture frames skip the polaroid paper fallback when their overlay asset is still loading', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /function shouldDrawPolaroidPaperFallback\(frame\)/)
  assert.match(app, /return frame\?\.renderMode !== 'texture';/)
  assert.match(app, /if \(shouldDrawPolaroidPaperFallback\(polaroidFrame\)\) \{\s*drawPolaroidFrameFallback/)
  assert.match(app, /if \(shouldDrawPolaroidPaperFallback\(polaroidEditor\.frame\)\) \{\s*drawPolaroidFrameFallback/)
})
