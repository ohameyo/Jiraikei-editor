import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

function cssRule(styles, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = styles.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))
  assert.ok(match, `missing CSS rule for ${selector}`)
  return match[1]
}

test('polaroid cards reserve one shared preview row and a separate aligned label row', async () => {
  const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')
  const buttonRule = cssRule(styles, '.polaroid-frame-btn')
  const previewRule = cssRule(styles, '.polaroid-frame-preview')
  const thumbRule = cssRule(styles, '.polaroid-frame-thumb')
  const nameRule = cssRule(styles, '.polaroid-frame-name')

  assert.match(buttonRule, /grid-template-rows:\s*84px minmax\(28px,\s*auto\)/)
  assert.match(previewRule, /overflow:\s*hidden/)
  assert.match(previewRule, /width:\s*min\(var\(--polaroid-preview-width\), calc\(100% - 24px\)\)/)
  assert.match(previewRule, /padding:\s*4px/)
  assert.match(previewRule, /box-sizing:\s*border-box/)
  assert.match(previewRule, /position:\s*relative/)
  assert.match(thumbRule, /align-self:\s*center/)
  assert.match(thumbRule, /margin-top:\s*0/)
  assert.match(thumbRule, /position:\s*absolute/)
  assert.match(thumbRule, /max-width:\s*calc\(100% - 8px\)/)
  assert.match(thumbRule, /max-height:\s*calc\(100% - 8px\)/)
  assert.match(thumbRule, /transform:\s*translate\(-50%,\s*-50%\)/)
  assert.doesNotMatch(styles, /\.polaroid-frame-btn\.is-landscape\s+\.polaroid-frame-thumb\s*\{[\s\S]*translateY/)
  assert.match(nameRule, /text-align:\s*center/)
  assert.match(nameRule, /min-height:\s*28px/)
  assert.doesNotMatch(styles, /\.polaroid-frame-btn::before/)
})

test('polaroid card labels are rendered through a dedicated label element', async () => {
  const app = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8')

  assert.match(app, /const preview = document\.createElement\('span'\);/)
  assert.match(app, /preview\.className = 'polaroid-frame-preview';/)
  assert.match(app, /preview\.appendChild\(thumb\);/)
  assert.match(app, /const label = document\.createElement\('span'\);/)
  assert.match(app, /label\.className = 'polaroid-frame-name';/)
  assert.match(app, /label\.textContent = frame\.name;/)
})
