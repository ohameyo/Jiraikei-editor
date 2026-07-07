import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('ios app prefers bundled local web editor with app lab fallback', async () => {
  const environment = await readFile(new URL('../../ios/JiraiKawa/JiraiKawa/Config/AppEnvironment.swift', import.meta.url), 'utf8')
  const webView = await readFile(new URL('../../ios/JiraiKawa/JiraiKawa/Web/EditorWebView.swift', import.meta.url), 'utf8')

  assert.match(environment, /Bundle\.main\.url\(forResource: "index", withExtension: "html"\)/)
  assert.match(environment, /static let activeEditorURL = bundledEditorURL \?\? appLabEditorURL/)
  assert.match(webView, /webView\.loadFileURL\(url, allowingReadAccessTo: url\.deletingLastPathComponent\(\)\)/)
  assert.match(webView, /if url\.isFileURL \{\s*decisionHandler\(\.allow\)/)
})

test('xcode project copies web editor files into app resources', async () => {
  const project = await readFile(new URL('../../ios/JiraiKawa/JiraiKawa.xcodeproj/project.pbxproj', import.meta.url), 'utf8')

  assert.match(project, /index\.html in Resources/)
  assert.match(project, /styles\.css in Resources/)
  assert.match(project, /src in Resources/)
  assert.match(project, /assets in Resources/)
  assert.match(project, /path = \.\.\/\.\.\/index\.html; sourceTree = SOURCE_ROOT;/)
  assert.match(project, /path = \.\.\/\.\.\/assets; sourceTree = SOURCE_ROOT;/)
})
