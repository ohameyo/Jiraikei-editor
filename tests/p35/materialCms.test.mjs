import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMaterialCmsPayload,
  findMaterialCmsOverride,
  getNewCmsMaterials,
  isMaterialVisible,
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
