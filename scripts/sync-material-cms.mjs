#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  buildMaterialCmsPayload,
  feishuRecordListToRows,
  getFeishuMaterialIdBackfills,
  normalizeFeishuBitableRows,
  parseFeishuBaseUrl,
} from '../src/materialCms.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);

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
  if (parsed?.data?.fields && parsed?.data?.data) return normalizeFeishuBitableRows(parsed);
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

function resolveLarkCli(args) {
  if (args['lark-cli']) return resolve(repoRoot, args['lark-cli']);
  if (process.env.LARK_CLI) return process.env.LARK_CLI;
  const localSibling = resolve(repoRoot, '../.lark-cli/node_modules/.bin/lark-cli');
  if (existsSync(localSibling)) return localSibling;
  return 'lark-cli';
}

async function runLarkCli(larkCli, args) {
  const { stdout } = await execFileAsync(larkCli, args, { maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function fetchFeishuRows(args) {
  const { baseToken, tableId, viewId } = parseFeishuBaseUrl(args['feishu-url']);
  if (!baseToken || !tableId) throw new Error('Invalid --feishu-url: missing base token or table id.');
  const larkCli = resolveLarkCli(args);
  const allRows = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    // Reads records with lark-cli base +record-list.
    const result = await runLarkCli(larkCli, [
      'base',
      '+record-list',
      '--base-token',
      baseToken,
      '--table-id',
      tableId,
      ...(viewId ? ['--view-id', viewId] : []),
      '--limit',
      '200',
      '--offset',
      String(offset),
      '--format',
      'json',
      '--as',
      'user',
    ]);
    const rows = feishuRecordListToRows(result);
    allRows.push(...rows);
    hasMore = Boolean(result?.data?.has_more);
    offset += rows.length;
    if (!rows.length) break;
  }
  return { rows: allRows, normalizedRows: normalizeFeishuBitableRows(allRows), baseToken, tableId, larkCli };
}

function firstAttachmentToken(value) {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.file_token || '';
}

function localAssetTarget(path) {
  if (!path) return '';
  const cleanPath = String(path).replace(/^\.\//, '');
  if (!cleanPath.startsWith('assets/')) return '';
  return cleanPath;
}

function materialAssetTargets(row) {
  const fileName = String(row.素材文件 || '').trim();
  const previewPath = String(row.预览图 || '').trim();
  const fallbackFileName = fileName || basename(previewPath);
  const normalizedPreviewPath = localAssetTarget(previewPath);
  const previewTarget = normalizedPreviewPath || (fallbackFileName ? `assets/sticker_previews/user/${fallbackFileName}` : '');
  const framePreviewTarget = normalizedPreviewPath || (fallbackFileName ? `assets/polaroid_frame_previews/${fallbackFileName}` : '');
  if (!fallbackFileName) return [];
  if (row.类型 === '贴纸') {
    return [
      `assets/user_stickers/${fallbackFileName}`,
      previewTarget,
    ];
  }
  if (row.类型 === '相框') {
    return [
      `assets/polaroid_frames/${fallbackFileName}`,
      framePreviewTarget,
    ];
  }
  return [];
}

async function downloadFeishuAssets({ rows, normalizedRows, baseToken, tableId, larkCli, overwrite = false }) {
  for (let index = 0; index < normalizedRows.length; index += 1) {
    const sourceRow = rows[index] || {};
    const row = normalizedRows[index];
    const token = firstAttachmentToken(sourceRow.预览图);
    if (!token) continue;
    const targets = materialAssetTargets(row)
      .map(localAssetTarget)
      .filter(Boolean);
    const [sourceTarget, ...copyTargets] = targets;
    if (!sourceTarget) continue;
    const sourcePath = resolve(repoRoot, sourceTarget);
    await mkdir(dirname(sourcePath), { recursive: true });
    if (overwrite || !existsSync(sourcePath)) {
      // Downloads attachments with lark-cli base +record-download-attachment.
      await runLarkCli(larkCli, [
        'base',
        '+record-download-attachment',
        '--base-token',
        baseToken,
        '--table-id',
        tableId,
        '--record-id',
        sourceRow.record_id,
        '--file-token',
        token,
        '--output',
        sourceTarget,
        '--overwrite',
        '--format',
        'json',
        '--as',
        'user',
      ]);
    }
    for (const copyTarget of copyTargets) {
      const copyPath = resolve(repoRoot, copyTarget);
      if (copyTarget === sourceTarget || (!overwrite && existsSync(copyPath))) continue;
      await mkdir(dirname(copyPath), { recursive: true });
      await copyFile(sourcePath, copyPath);
    }
  }
}

async function backfillFeishuMaterialIds({ rows, baseToken, tableId, larkCli, idMap }) {
  const backfills = getFeishuMaterialIdBackfills(rows, idMap);
  for (const backfill of backfills) {
    // --backfill-material-ids uses lark-cli base +record-upsert because each row needs a different material id.
    await runLarkCli(larkCli, [
      'base',
      '+record-upsert',
      '--base-token',
      baseToken,
      '--table-id',
      tableId,
      '--record-id',
      backfill.recordId,
      '--json',
      JSON.stringify({ 素材ID: backfill.materialId }),
      '--format',
      'json',
      '--as',
      'user',
    ]);
  }
  return backfills;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const idMapPath = resolve(repoRoot, args['id-map'] || 'data/material-cms-id-map.json');
  const outPath = resolve(repoRoot, args.out || 'src/materialCmsData.js');
  const existingIdMap = await readJsonIfExists(idMapPath, {});
  let rows;
  let feishuSource = null;
  if (args['feishu-url']) {
    feishuSource = await fetchFeishuRows(args);
    if (args['backfill-material-ids']) {
      const backfills = await backfillFeishuMaterialIds({
        ...feishuSource,
        idMap: existingIdMap,
      });
      console.log(`Backfilled ${backfills.length} missing material IDs.`);
      if (backfills.length) feishuSource = await fetchFeishuRows(args);
    }
    rows = feishuSource.normalizedRows;
    if (args['download-assets']) {
      await downloadFeishuAssets({
        ...feishuSource,
        overwrite: Boolean(args['overwrite-assets']),
      });
    }
  } else {
    const inputPath = args.input ? resolve(repoRoot, args.input) : resolve(repoRoot, 'data/material-cms-source.json');
    const source = await readFile(inputPath, 'utf8');
    rows = parseRows(source, inputPath);
  }
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
