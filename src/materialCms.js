const TYPE_ALIASES = new Map([
  ['贴纸', 'sticker'],
  ['贴纸素材', 'sticker'],
  ['sticker', 'sticker'],
  ['stickers', 'sticker'],
  ['相框', 'frame'],
  ['相框素材', 'frame'],
  ['覆膜', 'frame'],
  ['frame', 'frame'],
  ['polaroid', 'frame'],
  ['文字', 'text'],
  ['文案', 'text'],
  ['text', 'text'],
]);

const HIDDEN_STATUS = new Set(['下架', '隐藏', '禁用', '暂不上架', '待替换', '否', 'false', 'off', 'disabled', '0']);

const FIELD_ALIASES = {
  recordId: ['record_id', 'recordId', '记录ID', '飞书记录ID', '行ID'],
  materialId: ['素材ID', 'materialId', 'cmsId', 'id'],
  title: ['名称', '标题', '素材名称', 'title', 'name'],
  type: ['类型', '素材类型', 'type'],
  group: ['分组', '分类', 'group', 'packId', '贴纸包'],
  status: ['状态', '上下架', 'status'],
  sortOrder: ['网页展示顺序', '展示顺序', '页面展示顺序', '排序', '顺序', 'order', 'sortOrder'],
  sourceKey: ['源素材Key', 'sourceKey', '替换素材', '替换Key'],
  src: ['素材文件', '素材路径', '文件名或资源路径', '资源路径', '图片', 'src', 'fileName'],
  previewSrc: ['预览图', '预览图路径', 'previewSrc'],
  width: ['宽度', 'width'],
  height: ['高度', 'height'],
  mode: ['模式', '渲染模式', 'renderMode'],
  previewShape: ['预览形状', 'previewShape'],
  content: ['文案', '文字内容', 'content'],
  author: ['作者', 'author'],
  style: ['样式', 'style'],
};

function readField(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
      return row[name];
    }
  }
  return '';
}

function toText(value) {
  if (Array.isArray(value)) return toText(value[0]);
  if (value && typeof value === 'object') {
    return String(value.text || value.name || value.fileName || value.path || value.url || '').trim();
  }
  return String(value ?? '').trim();
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function parseMaybeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function hashString(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function slugify(input, fallback = 'item') {
  const slug = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function ensureLocalAssetPath(path) {
  const value = toText(path);
  if (!value) return '';
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('./')) return value;
  if (value.startsWith('assets/')) return `./${value}`;
  return value;
}

function normalizeAssetPath(value, type, kind = 'src') {
  const path = ensureLocalAssetPath(value);
  if (!path) return '';
  if (path.startsWith('./') || path.startsWith('/') || /^(https?:)?\/\//.test(path)) return path;
  if (type === 'frame') {
    return kind === 'preview'
      ? `./assets/polaroid_frame_previews/${path}`
      : `./assets/polaroid_frames/${path}`;
  }
  if (type === 'sticker') {
    return kind === 'preview'
      ? `./assets/sticker_previews/user/${path}`
      : `./assets/user_stickers/${path}`;
  }
  return path;
}

function withoutExtension(fileName) {
  return String(fileName || '').replace(/\.[^.]+$/, '');
}

function splitFileExtension(fileName) {
  const text = String(fileName || '');
  const slashIndex = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  const dotIndex = text.lastIndexOf('.');
  if (dotIndex <= slashIndex + 1) return { base: text, extension: '' };
  return {
    base: text.slice(0, dotIndex),
    extension: text.slice(dotIndex),
  };
}

function replacePathFileName(path, fileName) {
  const text = String(path || '');
  const slashIndex = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  if (slashIndex < 0) return fileName;
  return `${text.slice(0, slashIndex + 1)}${fileName}`;
}

function makeUniqueMaterialFileName(fileName, row, index) {
  const { base, extension } = splitFileExtension(basenameFromPath(fileName));
  const suffix = slugify(
    toText(row.素材ID) || toText(row.record_id) || hashString(`${index}:${fileName}`),
    `row-${index + 1}`
  );
  return `${base}-${suffix}${extension}`;
}

function disambiguateDuplicateAssetFileNames(rows) {
  const seen = new Set();
  return rows.map((row, index) => {
    const fileName = toText(row.素材文件);
    const previewPath = toText(row.预览图);
    const assetReference = fileName || basenameFromPath(previewPath);
    const type = normalizeMaterialType(row.类型);
    if (!assetReference || !['sticker', 'frame'].includes(type)) return row;
    if (/^(https?:)?\/\//.test(assetReference) || assetReference.startsWith('/')) return row;

    const key = `${type}:${assetReference}`;
    if (!seen.has(key)) {
      seen.add(key);
      return fileName ? row : { ...row, 素材文件: assetReference };
    }

    const uniqueFileName = makeUniqueMaterialFileName(assetReference, row, index);
    const nextPreviewPath = !previewPath || basenameFromPath(previewPath) === basenameFromPath(assetReference)
      ? replacePathFileName(previewPath || assetReference, uniqueFileName)
      : previewPath;
    return {
      ...row,
      素材文件: replacePathFileName(fileName || assetReference, uniqueFileName),
      预览图: nextPreviewPath,
    };
  });
}

function basenameFromPath(path) {
  const text = String(path || '');
  const slashIndex = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  return slashIndex >= 0 ? text.slice(slashIndex + 1) : text;
}

function normalizeFeishuSelect(value) {
  return toText(value);
}

function normalizeFeishuGroup(type, group) {
  const groupText = normalizeFeishuSelect(group);
  if (type === '贴纸') {
    if (groupText === '手绘贴纸') return 'hand-drawn';
    if (groupText === '挡脸贴纸') return 'face-cover';
  }
  if (type === '文字') {
    if (groupText === '颜文字') return 'kaomoji';
    if (groupText === '文案') return 'copy';
  }
  if (type === '相框') {
    if (groupText === '覆膜') return 'overlay';
    if (groupText === '相框') return 'frame';
  }
  return groupText;
}

function inferFeishuSourceKey(row) {
  const materialId = toText(row.素材ID);
  const type = normalizeFeishuSelect(row.一级分类 || row.类型);
  const group = normalizeFeishuSelect(row.二级分类 || row.分组);
  const fileName = toText(row.英文文件名 || row.素材文件);
  if (!materialId || !materialId.startsWith('lab-')) return '';
  if (type === '贴纸' && fileName) {
    return group === '手绘贴纸' ? `sticker:hand-drawn:${fileName}` : `sticker:user:${fileName}`;
  }
  if (type === '相框' && fileName) {
    return `frame:${withoutExtension(fileName)}`;
  }
  const presetMatch = materialId.match(/^lab-(preset-copy-\d+)$/);
  if (type === '文字' && presetMatch) return `text:${presetMatch[1]}`;
  return '';
}

export function normalizeMaterialType(value) {
  const key = String(value || '').trim();
  if (!key) return '';
  return TYPE_ALIASES.get(key) || TYPE_ALIASES.get(key.toLowerCase()) || key;
}

export function parseFeishuBaseUrl(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);
  const baseIndex = parts.indexOf('base');
  const baseToken = baseIndex >= 0 ? parts[baseIndex + 1] : '';
  return {
    baseToken,
    tableId: parsed.searchParams.get('table') || '',
    viewId: parsed.searchParams.get('view') || '',
  };
}

export function feishuRecordListToRows(envelope) {
  const data = envelope?.data || envelope;
  const fields = data?.fields || [];
  const records = data?.data || [];
  const recordIds = data?.record_id_list || [];
  return records.map((cells, rowIndex) => ({
    record_id: recordIds[rowIndex] || '',
    ...Object.fromEntries(fields.map((field, cellIndex) => [field, cells[cellIndex] ?? ''])),
  }));
}

export function normalizeFeishuBitableRows(rowsOrEnvelope) {
  const rows = Array.isArray(rowsOrEnvelope) ? rowsOrEnvelope : feishuRecordListToRows(rowsOrEnvelope);
  const displayOrders = getGroupedFeishuDisplayOrders(rows);
  const normalizedRows = rows.map((row, index) => {
    const type = normalizeFeishuSelect(row.一级分类 || row.类型);
    const group = normalizeFeishuGroup(type, row.二级分类 || row.分组);
    const fileName = toText(row.英文文件名 || row.素材文件);
    const previewPath = toText(row.预览图路径 || row.预览图);
    const normalized = {
      record_id: row.record_id,
      素材ID: toText(row.素材ID),
      名称: toText(row.中文显示名 || row.名称 || row.素材ID),
      类型: type,
      分组: group,
      状态: normalizeFeishuSelect(row.状态),
      排序: displayOrders[index] ?? index + 1,
      素材文件: fileName,
      预览图: previewPath,
      作者: toText(row.作者),
      sourceKey: inferFeishuSourceKey(row),
    };
    if (type === '相框') {
      normalized.模式 = normalizeFeishuSelect(row.二级分类) === '相框' ? '相框' : '覆膜';
    }
    if (type === '文字') {
      normalized.文案 = toText(row.中文显示名 || row.文案 || row.素材ID);
    }
    return normalized;
  });
  return disambiguateDuplicateAssetFileNames(normalizedRows);
}

function getGroupedFeishuDisplayOrders(rows) {
  const entries = rows.map((row, index) => {
    const type = normalizeFeishuSelect(row.一级分类 || row.类型);
    const group = normalizeFeishuGroup(type, row.二级分类 || row.分组);
    return {
      index,
      type,
      group,
      explicit: hasValue(row.网页展示顺序),
      order: toNumber(row.网页展示顺序, index + 1),
    };
  });

  const placed = entries
    .filter((entry) => entry.explicit)
    .sort((a, b) => {
      const orderDelta = a.order - b.order;
      if (orderDelta) return orderDelta;
      return a.index - b.index;
    });

  entries
    .filter((entry) => !entry.explicit)
    .forEach((entry) => {
      const insertAfterIndex = placed.findLastIndex((item) => (
        item.type === entry.type && item.group === entry.group
      ));
      placed.splice(insertAfterIndex >= 0 ? insertAfterIndex + 1 : placed.length, 0, entry);
    });

  const displayOrders = [];
  placed.forEach((entry, index) => {
    displayOrders[entry.index] = index + 1;
  });
  return displayOrders;
}

export function isMaterialVisible(item) {
  const status = String(item?.status || '上架').trim();
  return !HIDDEN_STATUS.has(status) && !HIDDEN_STATUS.has(status.toLowerCase());
}

export function materialCmsEntries(cmsItems, type = '') {
  const entries = Array.isArray(cmsItems) ? cmsItems : Object.values(cmsItems || {});
  const normalizedType = normalizeMaterialType(type);
  return entries
    .filter(Boolean)
    .map((item) => ({ ...item, type: normalizeMaterialType(item.type) }))
    .filter((item) => !normalizedType || item.type === normalizedType);
}

export function getMaterialSortValue(item, fallback = 9999) {
  const raw = item?.cmsSortOrder ?? item?.sortOrder ?? item?.order ?? item?.latestRank;
  return toNumber(raw, fallback);
}

export function sortMaterialItems(items) {
  return [...items].sort((a, b) => {
    const orderDelta = getMaterialSortValue(a) - getMaterialSortValue(b);
    if (orderDelta) return orderDelta;
    return String(a.id || a.name || a.title || '').localeCompare(String(b.id || b.name || b.title || ''));
  });
}

export function findMaterialCmsOverride(cmsItems, sourceKey) {
  if (!sourceKey) return null;
  return materialCmsEntries(cmsItems).find((item) => (
    item.sourceKey === sourceKey
    || item.replaces === sourceKey
    || item.baseKey === sourceKey
  )) || null;
}

export function applyMaterialCmsOverride(item, cmsItems, sourceKey, fallbackSort = 9999) {
  const cms = findMaterialCmsOverride(cmsItems, sourceKey);
  if (!cms) {
    return {
      ...item,
      status: item.status || '上架',
      cmsSortOrder: item.cmsSortOrder ?? fallbackSort,
      sourceKey,
    };
  }
  const title = cms.title || cms.name || item.name || item.title;
  return {
    ...item,
    ...cms,
    id: cms.id || item.id,
    name: title,
    title,
    status: cms.status || '上架',
    cmsId: cms.id,
    cmsSortOrder: getMaterialSortValue(cms, fallbackSort),
    sourceKey,
  };
}

export function getNewCmsMaterials(cmsItems, type = '') {
  return sortMaterialItems(
    materialCmsEntries(cmsItems, type)
      .filter(isMaterialVisible)
      .filter((item) => !item.sourceKey && !item.replaces && !item.baseKey)
  );
}

export function getMaterialRecordKey(row, index = 0) {
  const recordId = toText(readField(row, FIELD_ALIASES.recordId));
  if (recordId) return `feishu:${recordId}`;
  const sourceKey = toText(readField(row, FIELD_ALIASES.sourceKey));
  if (sourceKey) return `source:${sourceKey}`;
  const src = toText(readField(row, FIELD_ALIASES.src));
  if (src) return `src:${src}`;
  return `row:${index + 1}`;
}

export function createMaterialStableId(row, idMap = {}, index = 0) {
  const materialId = toText(readField(row, FIELD_ALIASES.materialId));
  if (materialId) return materialId;
  const type = normalizeMaterialType(readField(row, FIELD_ALIASES.type)) || 'item';
  const recordKey = getMaterialRecordKey(row, index);
  if (idMap[recordKey]) return idMap[recordKey];
  return `mat-${slugify(type)}-${hashString(recordKey)}`;
}

export function normalizeMaterialRow(row, index = 0, idMap = {}) {
  const type = normalizeMaterialType(readField(row, FIELD_ALIASES.type));
  if (!type) return null;
  const id = createMaterialStableId(row, idMap, index);
  const title = toText(readField(row, FIELD_ALIASES.title)) || `素材 ${index + 1}`;
  const status = toText(readField(row, FIELD_ALIASES.status)) || '上架';
  const sortOrder = toNumber(readField(row, FIELD_ALIASES.sortOrder), index + 1);
  const group = toText(readField(row, FIELD_ALIASES.group));
  const sourceKey = toText(readField(row, FIELD_ALIASES.sourceKey));
  const item = {
    id,
    title,
    type,
    group,
    status,
    sortOrder,
    author: toText(readField(row, FIELD_ALIASES.author)) || '小天使',
  };
  if (sourceKey) item.sourceKey = sourceKey;

  if (type === 'sticker') {
    const stickerSrc = readField(row, FIELD_ALIASES.src);
    const stickerPreviewSrc = readField(row, FIELD_ALIASES.previewSrc);
    item.packId = group || 'user-pack';
    item.src = normalizeAssetPath(stickerSrc || stickerPreviewSrc, type);
    item.previewSrc = normalizeAssetPath(stickerPreviewSrc || stickerSrc, type, 'preview');
  }

  if (type === 'frame') {
    const widthField = readField(row, FIELD_ALIASES.width);
    const heightField = readField(row, FIELD_ALIASES.height);
    const hasExplicitGeometry = widthField !== '' || heightField !== '';
    const width = toNumber(widthField, 1280);
    const height = toNumber(heightField, 1280);
    const mode = toText(readField(row, FIELD_ALIASES.mode));
    item.src = normalizeAssetPath(readField(row, FIELD_ALIASES.src), type);
    item.previewSrc = normalizeAssetPath(readField(row, FIELD_ALIASES.previewSrc) || readField(row, FIELD_ALIASES.src), type, 'preview');
    item.renderMode = mode === '相框' || mode === 'frame' ? 'frame' : 'texture';
    if (!sourceKey || hasExplicitGeometry) {
      item.width = width;
      item.height = height;
      item.previewShape = toText(readField(row, FIELD_ALIASES.previewShape)) || (Math.abs(width - height) < 8 ? 'square' : width < height ? 'portrait' : 'landscape');
      item.photoWindow = { x: 0, y: 0, width, height };
    }
  }

  if (type === 'text') {
    item.content = toText(readField(row, FIELD_ALIASES.content)) || title;
    item.style = parseMaybeJson(readField(row, FIELD_ALIASES.style), {});
  }

  return item;
}

export function buildMaterialCmsPayload(rows, existingIdMap = {}) {
  const idMap = { ...existingIdMap };
  const items = {};
  rows.forEach((row, index) => {
    const recordKey = getMaterialRecordKey(row, index);
    const id = createMaterialStableId(row, idMap, index);
    idMap[recordKey] = id;
    const item = normalizeMaterialRow(row, index, idMap);
    if (item) items[item.id] = item;
  });
  return { items, idMap };
}

export function getFeishuMaterialIdBackfills(rowsOrEnvelope, existingIdMap = {}) {
  return getFeishuMaterialFieldBackfills(rowsOrEnvelope, existingIdMap)
    .filter((backfill) => backfill.patch.素材ID)
    .map((backfill) => ({
      recordId: backfill.recordId,
      materialId: backfill.patch.素材ID,
    }));
}

export function getFeishuMaterialFieldBackfills(rowsOrEnvelope, existingIdMap = {}) {
  const rows = Array.isArray(rowsOrEnvelope) ? rowsOrEnvelope : feishuRecordListToRows(rowsOrEnvelope);
  const normalizedRows = normalizeFeishuBitableRows(rows);
  return rows.map((row, index) => {
    const recordId = toText(row.record_id);
    if (!recordId) return null;
    const patch = {};
    if (!toText(row.素材ID)) {
      patch.素材ID = createMaterialStableId(normalizedRows[index], existingIdMap, index);
    }
    const expectedSortOrder = normalizedRows[index]?.排序 ?? index + 1;
    if (toNumber(row.网页展示顺序, 0) !== expectedSortOrder) {
      patch.网页展示顺序 = expectedSortOrder;
    }
    if (!Object.keys(patch).length) return null;
    return { recordId, patch };
  }).filter(Boolean).sort((a, b) => {
    const orderDelta = toNumber(a.patch.网页展示顺序, Number.MAX_SAFE_INTEGER)
      - toNumber(b.patch.网页展示顺序, Number.MAX_SAFE_INTEGER);
    if (orderDelta) return orderDelta;
    return a.recordId.localeCompare(b.recordId);
  });
}
