import { MATERIAL_CMS_ITEMS } from './materialCmsData.js';

const TYPE_LABELS = {
  all: '全部',
  sticker: '贴纸',
  frame: '相框',
  text: '文字',
};

const ORDER_ENDPOINT = '/api/material-order';
const ADMIN_TOKEN_STORAGE_KEY = 'jiraiMaterialAdminToken';

function toNumber(value, fallback = 9999) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function text(value) {
  return String(value ?? '').trim();
}

function assetPath(path) {
  const value = text(path);
  if (!value) return '';
  if (value.startsWith('./') || value.startsWith('/') || /^https?:\/\//.test(value)) return value;
  return `./${value}`;
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type || '素材';
}

export function getMaterialSortRows(items = MATERIAL_CMS_ITEMS) {
  return Object.values(items || {})
    .filter(Boolean)
    .map((item) => ({
      id: text(item.id),
      title: text(item.title || item.name || item.id),
      type: text(item.type),
      group: text(item.group || item.packId),
      status: text(item.status || '上架'),
      src: assetPath(item.previewSrc || item.src),
      sourceKey: text(item.sourceKey),
      sortOrder: toNumber(item.sortOrder ?? item.cmsSortOrder, 9999),
    }))
    .filter((item) => item.id)
    .sort((a, b) => {
      const orderDelta = a.sortOrder - b.sortOrder;
      if (orderDelta) return orderDelta;
      return a.title.localeCompare(b.title, 'zh-Hans-CN');
    });
}

export function reindexRows(rows) {
  return rows.map((row, index) => ({ ...row, sortOrder: index + 1 }));
}

function getTypeCounts(rows) {
  return rows.reduce((counts, row) => {
    counts.all += 1;
    counts[row.type] = (counts[row.type] || 0) + 1;
    return counts;
  }, { all: 0 });
}

function matchesQuery(row, query) {
  if (!query) return true;
  const haystack = [row.title, row.id, row.group, row.status, row.sourceKey].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function moveItem(rows, fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return rows;
  const next = [...rows];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return reindexRows(next);
}

function createState() {
  const rows = reindexRows(getMaterialSortRows());
  return {
    initialRows: rows,
    rows,
    filter: 'all',
    query: '',
    dragId: '',
    dirty: false,
    saving: false,
  };
}

function setStatus(message, tone = '') {
  const status = document.getElementById('materialSaveStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function filteredRows(state) {
  return state.rows.filter((row) => (
    (state.filter === 'all' || row.type === state.filter)
    && matchesQuery(row, state.query)
  ));
}

function renderTabs(state) {
  const tabs = document.getElementById('materialTypeTabs');
  if (!tabs) return;
  const counts = getTypeCounts(state.rows);
  const types = ['all', 'sticker', 'frame', 'text'].filter((type) => type === 'all' || counts[type]);
  tabs.replaceChildren(...types.map((type) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-tab${state.filter === type ? ' active' : ''}`;
    button.textContent = `${typeLabel(type)} ${counts[type] || 0}`;
    button.dataset.type = type;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', state.filter === type ? 'true' : 'false');
    return button;
  }));
}

function createThumb(row) {
  const thumb = document.createElement('div');
  thumb.className = `sort-thumb${row.type === 'text' || !row.src ? ' text-thumb' : ''}`;
  if (row.src && row.type !== 'text') {
    const img = document.createElement('img');
    img.src = row.src;
    img.alt = row.title;
    img.loading = 'lazy';
    thumb.append(img);
  } else {
    thumb.textContent = 'Aa';
  }
  return thumb;
}

function createItem(row, index, visibleCount) {
  const item = document.createElement('li');
  item.className = 'sort-item';
  item.draggable = true;
  item.dataset.id = row.id;

  const handle = document.createElement('span');
  handle.className = 'sort-handle';
  handle.textContent = '↕';
  handle.setAttribute('aria-hidden', 'true');

  const title = document.createElement('div');
  title.className = 'sort-title';
  title.innerHTML = `
    <strong></strong>
    <code></code>
    <div class="sort-meta">
      <span class="sort-chip"></span>
      <span class="sort-chip"></span>
      <span class="sort-chip"></span>
    </div>
  `;
  title.querySelector('strong').textContent = row.title;
  title.querySelector('code').textContent = row.id;
  const chips = title.querySelectorAll('.sort-chip');
  chips[0].textContent = typeLabel(row.type);
  chips[1].textContent = row.group || '未分组';
  chips[2].textContent = row.status || '上架';

  const actions = document.createElement('div');
  actions.className = 'sort-actions';
  actions.innerHTML = `
    <span class="order-badge"></span>
    <button class="move-button" type="button" data-action="up" aria-label="上移">↑</button>
    <button class="move-button" type="button" data-action="down" aria-label="下移">↓</button>
  `;
  actions.querySelector('.order-badge').textContent = row.sortOrder;
  actions.querySelector('[data-action="up"]').disabled = index === 0;
  actions.querySelector('[data-action="down"]').disabled = index === visibleCount - 1;

  item.append(handle, createThumb(row), title, actions);
  return item;
}

function renderList(state) {
  const list = document.getElementById('materialSortList');
  const summary = document.getElementById('materialSortSummary');
  if (!list || !summary) return;
  const rows = filteredRows(state);
  summary.textContent = `共 ${state.rows.length} 个素材，当前显示 ${rows.length} 个。保存后需重新同步并部署网页，正式站才会更新。`;
  if (!rows.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = '没有匹配的素材';
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...rows.map((row, index) => createItem(row, index, rows.length)));
}

function render(state) {
  renderTabs(state);
  renderList(state);
}

function markDirty(state) {
  state.dirty = true;
  setStatus('有未保存排序', 'dirty');
}

function reorderByVisibleIndexes(state, visibleFromIndex, visibleToIndex) {
  const visible = filteredRows(state);
  const fromRow = visible[visibleFromIndex];
  const toRow = visible[visibleToIndex];
  if (!fromRow || !toRow) return;
  const fromIndex = state.rows.findIndex((row) => row.id === fromRow.id);
  const toIndex = state.rows.findIndex((row) => row.id === toRow.id);
  state.rows = moveItem(state.rows, fromIndex, toIndex);
  markDirty(state);
  render(state);
}

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
}

function setAdminToken(token) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }
}

async function saveOrder(state, retrying = false) {
  if (state.saving) return;
  state.saving = true;
  setStatus('保存中...', 'saving');
  const token = getAdminToken();
  try {
    const response = await fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
      },
      body: JSON.stringify({
        items: state.rows.map((row) => ({ id: row.id, sortOrder: row.sortOrder })),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 && !retrying) {
      const nextToken = window.prompt('请输入素材管理密码');
      setAdminToken(text(nextToken));
      state.saving = false;
      if (nextToken) return saveOrder(state, true);
    }
    if (!response.ok || !result.ok) {
      throw new Error(result.message || result.error || `保存失败：${response.status}`);
    }
    state.dirty = false;
    const missing = Array.isArray(result.missingIds) && result.missingIds.length
      ? `，${result.missingIds.length} 个素材未在飞书找到`
      : '';
    setStatus(`已保存 ${result.updated} 个素材${missing}`, 'saved');
  } catch (error) {
    setStatus(error.message || '保存失败', 'error');
  } finally {
    state.saving = false;
  }
}

function bindEvents(state) {
  document.getElementById('materialSearchInput')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderList(state);
  });

  document.getElementById('materialTypeTabs')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-type]');
    if (!button) return;
    state.filter = button.dataset.type;
    render(state);
  });

  document.getElementById('resetOrderBtn')?.addEventListener('click', () => {
    state.rows = state.initialRows;
    state.dirty = false;
    setStatus('已恢复当前网页顺序');
    render(state);
  });

  document.getElementById('saveOrderBtn')?.addEventListener('click', () => {
    saveOrder(state);
  });

  const list = document.getElementById('materialSortList');
  list?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    const item = event.target.closest('.sort-item');
    if (!button || !item) return;
    const rows = filteredRows(state);
    const visibleIndex = rows.findIndex((row) => row.id === item.dataset.id);
    const delta = button.dataset.action === 'up' ? -1 : 1;
    reorderByVisibleIndexes(state, visibleIndex, visibleIndex + delta);
  });

  list?.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.sort-item');
    if (!item) return;
    state.dragId = item.dataset.id;
    item.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', state.dragId);
  });

  list?.addEventListener('dragover', (event) => {
    const item = event.target.closest('.sort-item');
    if (!item || !state.dragId || item.dataset.id === state.dragId) return;
    event.preventDefault();
    const rect = item.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    item.classList.toggle('drop-before', !after);
    item.classList.toggle('drop-after', after);
  });

  list?.addEventListener('dragleave', (event) => {
    const item = event.target.closest('.sort-item');
    item?.classList.remove('drop-before', 'drop-after');
  });

  list?.addEventListener('drop', (event) => {
    const item = event.target.closest('.sort-item');
    if (!item || !state.dragId || item.dataset.id === state.dragId) return;
    event.preventDefault();
    const visible = filteredRows(state);
    const fromVisibleIndex = visible.findIndex((row) => row.id === state.dragId);
    let toVisibleIndex = visible.findIndex((row) => row.id === item.dataset.id);
    const rect = item.getBoundingClientRect();
    if (event.clientY > rect.top + rect.height / 2) toVisibleIndex += 1;
    if (fromVisibleIndex < toVisibleIndex) toVisibleIndex -= 1;
    item.classList.remove('drop-before', 'drop-after');
    reorderByVisibleIndexes(state, fromVisibleIndex, toVisibleIndex);
  });

  list?.addEventListener('dragend', () => {
    state.dragId = '';
    list.querySelectorAll('.sort-item').forEach((item) => {
      item.classList.remove('dragging', 'drop-before', 'drop-after');
    });
  });
}

function init() {
  const state = createState();
  render(state);
  bindEvents(state);
  setStatus('未修改');
}

if (typeof document !== 'undefined') {
  init();
}
