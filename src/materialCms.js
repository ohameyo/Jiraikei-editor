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

const HIDDEN_STATUS = new Set(['下架', '隐藏', '禁用', '否', 'false', 'off', 'disabled', '0']);

const FIELD_ALIASES = {
  recordId: ['record_id', 'recordId', '记录ID', '飞书记录ID', '行ID'],
  title: ['名称', '标题', '素材名称', 'title', 'name'],
  type: ['类型', '素材类型', 'type'],
  group: ['分组', '分类', 'group', 'packId', '贴纸包'],
  status: ['状态', '上下架', 'status'],
  sortOrder: ['排序', '顺序', 'order', 'sortOrder'],
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
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

export function normalizeMaterialType(value) {
  const key = String(value || '').trim();
  if (!key) return '';
  return TYPE_ALIASES.get(key) || TYPE_ALIASES.get(key.toLowerCase()) || key;
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
    item.packId = group || 'user-pack';
    item.src = normalizeAssetPath(readField(row, FIELD_ALIASES.src), type);
    item.previewSrc = normalizeAssetPath(readField(row, FIELD_ALIASES.previewSrc) || readField(row, FIELD_ALIASES.src), type, 'preview');
  }

  if (type === 'frame') {
    const width = toNumber(readField(row, FIELD_ALIASES.width), 1280);
    const height = toNumber(readField(row, FIELD_ALIASES.height), 1280);
    const mode = toText(readField(row, FIELD_ALIASES.mode));
    item.src = normalizeAssetPath(readField(row, FIELD_ALIASES.src), type);
    item.previewSrc = normalizeAssetPath(readField(row, FIELD_ALIASES.previewSrc) || readField(row, FIELD_ALIASES.src), type, 'preview');
    item.width = width;
    item.height = height;
    item.previewShape = toText(readField(row, FIELD_ALIASES.previewShape)) || (Math.abs(width - height) < 8 ? 'square' : width < height ? 'portrait' : 'landscape');
    item.renderMode = mode === '相框' || mode === 'frame' ? 'frame' : 'texture';
    item.photoWindow = { x: 0, y: 0, width, height };
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
