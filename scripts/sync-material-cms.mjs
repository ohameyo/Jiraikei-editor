#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMaterialCmsPayload } from '../src/materialCms.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}

export function parseCsv(text) {
  const rows = [];
  let cell = '';
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  const [headers = [], ...body] = rows;
  return body.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index]?.trim() ?? ''])));
}

function parseRows(source, path) {
  if (path.endsWith('.csv')) return parseCsv(source);
  const parsed = JSON.parse(source);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.records)) return parsed.records;
  if (Array.isArray(parsed.rows)) return parsed.rows;
  return Object.values(parsed);
}

async function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

function serializeData(items) {
  return `// Generated from the Feishu Bitable material CMS.\n// Do not edit by hand; run scripts/sync-material-cms.mjs.\n\nexport const MATERIAL_CMS_ITEMS = ${JSON.stringify(items, null, 2)};\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ? resolve(repoRoot, args.input) : resolve(repoRoot, 'data/material-cms-source.json');
  const idMapPath = resolve(repoRoot, args['id-map'] || 'data/material-cms-id-map.json');
  const outPath = resolve(repoRoot, args.out || 'src/materialCmsData.js');
  const source = await readFile(inputPath, 'utf8');
  const rows = parseRows(source, inputPath);
  const existingIdMap = await readJsonIfExists(idMapPath, {});
  const payload = buildMaterialCmsPayload(rows, existingIdMap);

  await mkdir(dirname(outPath), { recursive: true });
  await mkdir(dirname(idMapPath), { recursive: true });
  await writeFile(outPath, serializeData(payload.items), 'utf8');
  await writeFile(idMapPath, `${JSON.stringify(payload.idMap, null, 2)}\n`, 'utf8');
  console.log(`Synced ${Object.keys(payload.items).length} material CMS items.`);
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
