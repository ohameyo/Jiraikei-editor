import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const htmlPath = new URL('../../material-sort.html', import.meta.url);
const cssPath = new URL('../../styles/material-sort.css', import.meta.url);
const adminScriptPath = new URL('../../src/materialSortAdmin.js', import.meta.url);
const apiPath = new URL('../../functions/api/material-order.js', import.meta.url);

test('material sort admin page is wired as a standalone management page', async () => {
  const html = await readFile(htmlPath, 'utf8');

  assert.match(html, /素材排序管理/);
  assert.match(html, /src\/materialSortAdmin\.js/);
  assert.match(html, /id="materialSortList"/);
  assert.match(html, /id="saveOrderBtn"/);
  assert.match(html, /打开飞书表格/);
  assert.match(html, /tblhl8dRA0HRY9cD/);
});

test('material sort admin page uses a five-column desktop grid', async () => {
  const css = await readFile(cssPath, 'utf8');

  assert.match(css, /\.sort-list\s*{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s);
});

test('material sort helpers expose current CMS items in display order', async () => {
  const { getMaterialSortRows, reindexRows } = await import(adminScriptPath);
  const rows = getMaterialSortRows({
    z: { id: 'z', title: '最后', type: 'sticker', sortOrder: 9 },
    a: { id: 'a', title: '最前', type: 'frame', sortOrder: 1 },
    m: { id: 'm', title: '中间', type: 'text', sortOrder: 5 },
  });

  assert.deepEqual(rows.map((row) => row.id), ['a', 'm', 'z']);
  assert.deepEqual(reindexRows([rows[2], rows[0]]).map((row) => [row.id, row.sortOrder]), [
    ['z', 1],
    ['a', 2],
  ]);
});

test('material order API normalizes drag order by array position', async () => {
  const { normalizeOrderItems } = await import(apiPath);

  assert.deepEqual(
    normalizeOrderItems([
      { id: 'mat-c', sortOrder: 100 },
      { id: 'mat-a', sortOrder: 2 },
      { id: 'mat-b', sortOrder: 1 },
    ]),
    [
      { id: 'mat-c', sortOrder: 1 },
      { id: 'mat-a', sortOrder: 2 },
      { id: 'mat-b', sortOrder: 3 },
    ]
  );
});

test('material order API can validate saves without Feishu writes in dry-run mode', async () => {
  const { onRequestPost } = await import(apiPath);
  const request = new Request('https://example.com/api/material-order', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        { id: 'mat-c', sortOrder: 100 },
        { id: 'mat-a', sortOrder: 2 },
      ],
    }),
  });

  const response = await onRequestPost({
    request,
    env: { MATERIAL_ORDER_DRY_RUN: 'true' },
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(json, {
    ok: true,
    dryRun: true,
    updated: 2,
    missingIds: [],
  });
});
