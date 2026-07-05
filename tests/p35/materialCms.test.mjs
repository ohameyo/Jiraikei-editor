import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMaterialCmsPayload,
  findMaterialCmsOverride,
  getFeishuMaterialFieldBackfills,
  getFeishuMaterialIdBackfills,
  getNewCmsMaterials,
  isMaterialVisible,
  normalizeFeishuBitableRows,
  parseFeishuBaseUrl,
  sortMaterialItems,
} from '../../src/materialCms.js';

test('material cms generates a stable id from the Feishu row id across renames', () => {
  const first = buildMaterialCmsPayload([
    {
      record_id: 'recA',
      名称: '蕾丝猫耳',
      类型: '贴纸',
      状态: '上架',
      排序: '3',
      素材文件: 'cat-ear.png',
    },
  ]);

  const generatedId = Object.keys(first.items)[0];
  assert.match(generatedId, /^mat-sticker-[a-z0-9]+$/);
  assert.equal(first.items[generatedId].title, '蕾丝猫耳');

  const renamed = buildMaterialCmsPayload([
    {
      record_id: 'recA',
      名称: '黑猫耳',
      类型: '贴纸',
      状态: '上架',
      排序: '1',
      素材文件: 'cat-ear.png',
    },
  ], first.idMap);

  assert.deepEqual(Object.keys(renamed.items), [generatedId]);
  assert.equal(renamed.items[generatedId].title, '黑猫耳');
  assert.equal(renamed.items[generatedId].sortOrder, 1);
});

test('material cms preserves explicit Feishu material ids across table rebuilds', () => {
  const payload = buildMaterialCmsPayload([
    {
      record_id: 'recRebuilt',
      素材ID: 'mat-sticker-existing',
      名称: '重建后的素材',
      类型: '贴纸',
      状态: '上架',
      网页展示顺序: '8',
      素材文件: 'rebuilt.png',
    },
  ]);

  assert.deepEqual(Object.keys(payload.items), ['mat-sticker-existing']);
  assert.equal(payload.items['mat-sticker-existing'].sortOrder, 8);
  assert.equal(payload.idMap['feishu:recRebuilt'], 'mat-sticker-existing');
});

test('material cms normalizes new sticker, frame, and text rows for static app data', () => {
  const payload = buildMaterialCmsPayload([
    {
      record_id: 'recSticker',
      名称: '黑丝蝴蝶结',
      类型: '贴纸',
      分组: 'user-pack',
      状态: '上架',
      排序: 2,
      素材文件: 'black-bow.png',
      预览图: 'black-bow-preview.png',
    },
    {
      record_id: 'recFrame',
      名称: '梦核白边',
      类型: '相框',
      状态: '上架',
      排序: 1,
      素材文件: 'dream-frame.png',
      宽度: 1280,
      高度: 1280,
      模式: '覆膜',
    },
    {
      record_id: 'recText',
      名称: '天才小猫',
      类型: '文字',
      状态: '下架',
      排序: 4,
      文案: '天才小猫！',
    },
  ]);

  const items = Object.values(payload.items);
  assert.equal(items[0].src, './assets/user_stickers/black-bow.png');
  assert.equal(items[0].previewSrc, './assets/sticker_previews/user/black-bow-preview.png');
  assert.equal(items[1].src, './assets/polaroid_frames/dream-frame.png');
  assert.equal(items[1].previewSrc, './assets/polaroid_frame_previews/dream-frame.png');
  assert.equal(items[1].renderMode, 'texture');
  assert.deepEqual(items[1].photoWindow, { x: 0, y: 0, width: 1280, height: 1280 });
  assert.equal(items[2].content, '天才小猫！');
  assert.equal(isMaterialVisible(items[2]), false);
});

test('material cms exposes new active materials and source-key overrides in display order', () => {
  const cmsItems = {
    'mat-sticker-new': {
      id: 'mat-sticker-new',
      type: 'sticker',
      status: '上架',
      title: '新增贴纸',
      src: './assets/user_stickers/new.png',
      sortOrder: 2,
    },
    'mat-sticker-hidden': {
      id: 'mat-sticker-hidden',
      type: 'sticker',
      status: '下架',
      title: '隐藏贴纸',
      src: './assets/user_stickers/hidden.png',
      sortOrder: 1,
    },
    'mat-existing': {
      id: 'mat-existing',
      type: 'sticker',
      status: '上架',
      title: '改名后的旧素材',
      sourceKey: 'sticker:user:sel_01.png',
      sortOrder: 3,
    },
  };

  assert.equal(findMaterialCmsOverride(cmsItems, 'sticker:user:sel_01.png').title, '改名后的旧素材');
  assert.deepEqual(getNewCmsMaterials(cmsItems, 'sticker').map((item) => item.id), ['mat-sticker-new']);
  assert.deepEqual(
    sortMaterialItems([
      { id: 'fallback', cmsSortOrder: 5 },
      { id: 'first', cmsSortOrder: 1 },
      { id: 'middle', sortOrder: 3 },
    ]).map((item) => item.id),
    ['first', 'middle', 'fallback']
  );
});

test('material cms maps Feishu Bitable rows to existing formal material source keys', () => {
  const rows = normalizeFeishuBitableRows([
    {
      record_id: 'recSticker',
      素材ID: 'lab-face-cover-sel_01-png',
      中文显示名: 'GAME OVER',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      筛选分类: ['最新', '热门'],
      状态: ['上架'],
      排序: '2',
      英文文件名: 'sel_01.png',
      预览图路径: 'assets/sticker_previews/user/sel_01.png',
    },
    {
      record_id: 'recFrame',
      素材ID: 'lab-texture-band-square',
      中文显示名: '1:1 蕾丝星星',
      一级分类: ['相框'],
      二级分类: ['覆膜'],
      状态: ['上架'],
      排序: '34',
      英文文件名: 'texture-band-square.png',
    },
    {
      record_id: 'recText',
      素材ID: 'lab-preset-copy-1',
      中文显示名: '今日の私、満点！',
      一级分类: ['文字'],
      二级分类: ['文案'],
      状态: ['暂不上架'],
      排序: '40',
    },
  ]);

  assert.equal(rows[0].sourceKey, 'sticker:user:sel_01.png');
  assert.equal(rows[0].类型, '贴纸');
  assert.equal(rows[0].分组, 'face-cover');
  assert.equal(rows[1].sourceKey, 'frame:texture-band-square');
  assert.equal(rows[1].模式, '覆膜');
  assert.equal(rows[2].sourceKey, 'text:preset-copy-1');
  const framePayload = buildMaterialCmsPayload([rows[1]]);
  const frameItem = Object.values(framePayload.items)[0];
  assert.equal(frameItem.photoWindow, undefined);
  assert.equal(frameItem.width, undefined);
  assert.equal(isMaterialVisible(buildMaterialCmsPayload([rows[2]]).items[Object.keys(buildMaterialCmsPayload([rows[2]]).items)[0]]), false);
});

test('material cms inserts blank website display order rows after their material group', () => {
  const rows = normalizeFeishuBitableRows([
    {
      record_id: 'recA',
      中文显示名: '挡脸 A',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      排序: '1',
      网页展示顺序: '1',
      英文文件名: 'face-a.png',
    },
    {
      record_id: 'recC',
      中文显示名: '手绘 C',
      一级分类: ['贴纸'],
      二级分类: ['手绘贴纸'],
      状态: ['上架'],
      网页展示顺序: '2',
      英文文件名: 'hand-c.png',
    },
    {
      record_id: 'recB',
      中文显示名: '新增挡脸 B',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      网页展示顺序: '',
      英文文件名: 'face-b.png',
    },
  ]);

  assert.deepEqual(rows.map((row) => [row.record_id, row.排序]), [
    ['recA', 1],
    ['recC', 3],
    ['recB', 2],
  ]);
});

test('material cms leaves generated Feishu material ids as additions', () => {
  const [row] = normalizeFeishuBitableRows([
    {
      record_id: 'recNew',
      素材ID: 'mat-sticker-fixed',
      中文显示名: '新增黑蝴蝶',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      排序: '99',
      英文文件名: 'black-bow.png',
    },
  ]);
  const payload = buildMaterialCmsPayload([row]);
  const [item] = Object.values(payload.items);

  assert.equal(row.sourceKey, '');
  assert.match(item.id, /^mat-sticker-/);
  assert.equal(item.src, './assets/user_stickers/black-bow.png');
  assert.deepEqual(getNewCmsMaterials(payload.items, 'sticker').map((newItem) => newItem.title), ['新增黑蝴蝶']);
});

test('material cms creates Feishu material id backfills for blank material ids', () => {
  const backfills = getFeishuMaterialIdBackfills([
    {
      record_id: 'recFilled',
      素材ID: 'lab-face-cover-sel_01-png',
      中文显示名: '已有 ID',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      英文文件名: 'sel_01.png',
    },
    {
      record_id: 'recBlank',
      素材ID: '',
      中文显示名: '新增贴纸',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      英文文件名: 'new.png',
    },
  ]);

  assert.equal(backfills.length, 1);
  assert.equal(backfills[0].recordId, 'recBlank');
  assert.match(backfills[0].materialId, /^mat-sticker-[a-z0-9]+$/);
});

test('material cms creates Feishu field backfills for blank ids and grouped blank display orders', () => {
  const backfills = getFeishuMaterialFieldBackfills([
    {
      record_id: 'recOne',
      素材ID: 'mat-sticker-one',
      中文显示名: '挡脸一',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      排序: '1',
      网页展示顺序: '1',
    },
    {
      record_id: 'recThree',
      素材ID: 'mat-sticker-three',
      中文显示名: '手绘三',
      一级分类: ['贴纸'],
      二级分类: ['手绘贴纸'],
      状态: ['上架'],
      网页展示顺序: '',
    },
    {
      record_id: 'recTwo',
      素材ID: '',
      中文显示名: '新增挡脸二',
      一级分类: ['贴纸'],
      二级分类: ['挡脸贴纸'],
      状态: ['上架'],
      排序: '',
      网页展示顺序: '',
    },
  ]);

  assert.deepEqual(backfills.map((item) => item.recordId), ['recTwo', 'recThree']);
  assert.match(backfills[0].patch.素材ID, /^mat-sticker-[a-z0-9]+$/);
  assert.equal(backfills[0].patch.网页展示顺序, 2);
  assert.deepEqual(backfills[1].patch, { 网页展示顺序: 3 });
});

test('material cms parses Feishu Bitable URL parameters', () => {
  assert.deepEqual(
    parseFeishuBaseUrl('https://fcnc3levok4u.feishu.cn/base/A3cwb8VDaaaAECsA8wOc3gGKnFh?table=tbl8ZzFHh80OGPAh&view=vewqRL5IBF'),
    {
      baseToken: 'A3cwb8VDaaaAECsA8wOc3gGKnFh',
      tableId: 'tbl8ZzFHh80OGPAh',
      viewId: 'vewqRL5IBF',
    }
  );
});
