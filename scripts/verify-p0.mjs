import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const readProjectFile = (path) => readFile(resolve(root, path), 'utf8')

const sha256 = async (path) => {
  const contents = await readFile(resolve(root, path))
  return createHash('sha256').update(contents).digest('hex')
}

export const verifyApplicationContract = async () => {
  const html = await readProjectFile('index.html')
  const app = await readProjectFile('src/app.js')
  const navigation = [...html.matchAll(/data-tool="[^"]+"/g)].length
  const requirements = {
    navigation: navigation === 7,
    hasCanvas: html.includes('id="editorCanvas"'),
    hasOverlay: html.includes('id="overlayLayer"'),
    hasUpload:
      html.includes('id="imageUpload"') && html.includes('id="canvasImageUpload"'),
    hasProperties:
      html.includes('class="PropertyPanel panel"') &&
      html.includes('id="layerControls"'),
    hasCompare:
      html.includes('id="compareBtn"') && app.includes('compareBtn'),
    hasExport:
      html.includes('id="exportBtn"') && app.includes('exportBtn'),
  }

  return {
    checks: {
      navigation,
      hasCanvas: requirements.hasCanvas,
      hasOverlay: requirements.hasOverlay,
      hasUpload: requirements.hasUpload,
      hasProperties: requirements.hasProperties,
      hasCompare: requirements.hasCompare,
      hasExport: requirements.hasExport,
    },
    missing: Object.entries(requirements)
      .filter(([, present]) => !present)
      .map(([name]) => name),
  }
}

export const verifyProductionHashes = async () => {
  const manifest = JSON.parse(
    await readProjectFile('docs/baseline/production-source.json'),
  )
  const mismatches = []

  for (const [path, expected] of Object.entries(manifest.primaryFiles)) {
    const actual = await sha256(path)
    if (actual !== expected) mismatches.push({ path, expected, actual })
  }

  return { manifest, mismatches }
}

export const verifyP0 = async () => {
  const contract = await verifyApplicationContract()
  const production = await verifyProductionHashes()

  return {
    contract,
    production: {
      url: production.manifest.productionUrl,
      commit: production.manifest.sourceCommit,
      mismatches: production.mismatches,
    },
    ok: contract.missing.length === 0 && production.mismatches.length === 0,
  }
}

const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isCli) {
  const result = await verifyP0()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exitCode = 1
}
