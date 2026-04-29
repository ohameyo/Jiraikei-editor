import { createStore } from './core/store.js';
import { FILTER_CONTROL_DEFS, FILTER_PRESETS, DEFAULT_FILTERS } from './config/filterPresets.js';
import { STICKER_PACKS } from './config/stickerPacks.js';
import { TEXT_TEMPLATES, DEFAULT_TEXT_STYLE } from './config/textTemplates.js';
import { renderCanvas } from './modules/canvasRenderer.js';
import { createOverlayLayer } from './modules/overlayLayer.js';
import { exportPng } from './modules/exporter.js';
import { makeColorInput, makeSlider, makeTextInput } from './ui/controls.js';

const store = createStore();

const els = {
  canvas: document.getElementById('editorCanvas'),
  canvasEmpty: document.getElementById('canvasEmpty'),
  overlayLayer: document.getElementById('overlayLayer'),
  imageUpload: document.getElementById('imageUpload'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  exportBtn: document.getElementById('exportBtn'),
  presetButtons: document.getElementById('presetButtons'),
  addFrostedMosaicBtn: document.getElementById('addFrostedMosaicBtn'),
  addGridMosaicBtn: document.getElementById('addGridMosaicBtn'),
  stickerPackList: document.getElementById('stickerPackList'),
  addTextLayerBtn: document.getElementById('addTextLayerBtn'),
  textTemplateList: document.getElementById('textTemplateList'),
  filterControls: document.getElementById('filterControls'),
  layerControls: document.getElementById('layerControls'),
  layerList: document.getElementById('layerList'),
};

const ctx = els.canvas.getContext('2d');
const overlayController = createOverlayLayer(els.overlayLayer, store);

function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = String(reader.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addMosaic(variant) {
  store.addLayer({
    type: 'mosaic',
    name: variant === 'frosted' ? '雾化模糊马赛克' : '网格玻璃马赛克',
    variant,
    width: 0.26,
    height: 0.2,
    feather: variant === 'frosted' ? 0.16 : 0.06,
    intensity: variant === 'frosted' ? 14 : 8,
    haze: 0.26,
    cellSize: 8,
    gridAlpha: 0.3,
  });
}

function addSticker(sticker) {
  store.addLayer({
    type: 'sticker',
    name: `贴纸：${sticker.name}`,
    src: sticker.src,
    width: 0.18,
    height: 0.18,
  });
}

function addText(content = '前 / 后') {
  store.addLayer({
    type: 'text',
    name: '文字图层',
    width: 0.4,
    height: 0.1,
    content,
    ...DEFAULT_TEXT_STYLE,
  });
}

function renderPresetButtons(state) {
  els.presetButtons.innerHTML = '';

  FILTER_PRESETS.forEach((preset) => {
    const button = document.createElement('button');
    button.className = 'preset-chip';
    if (state.activePresetId === preset.id) {
      button.style.borderColor = '#c68ba7';
      button.style.background = '#fff0f8';
    }
    button.textContent = `${preset.name} - ${preset.description}`;
    button.onclick = () => store.setFilters(preset.filters, preset.id);
    els.presetButtons.appendChild(button);
  });
}

function renderStickerPanel() {
  els.stickerPackList.innerHTML = '';

  STICKER_PACKS.forEach((pack) => {
    const packEl = document.createElement('div');
    packEl.className = 'sticker-pack';

    const title = document.createElement('h4');
    title.textContent = pack.name;

    const grid = document.createElement('div');
    grid.className = 'sticker-grid';

    pack.stickers.forEach((sticker) => {
      const btn = document.createElement('button');
      btn.className = 'sticker-btn';
      btn.title = sticker.name;

      const img = document.createElement('img');
      img.src = sticker.src;
      img.alt = sticker.name;

      btn.appendChild(img);
      btn.onclick = () => addSticker(sticker);
      grid.appendChild(btn);
    });

    packEl.append(title, grid);
    els.stickerPackList.appendChild(packEl);
  });
}

function renderTextTemplates() {
  els.textTemplateList.innerHTML = '';

  TEXT_TEMPLATES.forEach((template) => {
    const btn = document.createElement('button');
    btn.textContent = template;
    btn.onclick = () => addText(template);
    els.textTemplateList.appendChild(btn);
  });
}

function renderFilterControls(state) {
  els.filterControls.innerHTML = '';

  FILTER_CONTROL_DEFS.forEach((control) => {
    els.filterControls.appendChild(
      makeSlider({
        ...control,
        value: state.filters[control.key],
        onInput: (value) => store.setFilters({ [control.key]: value }, null),
      })
    );
  });

  els.filterControls.appendChild(
    makeColorInput({
      label: '叠加颜色',
      value: state.filters.overlayColor,
      onInput: (value) => store.setFilters({ overlayColor: value }, null),
    })
  );
}

function pushSharedLayerControls(layer, node) {
  node.appendChild(
    makeSlider({ label: '横向位置', min: 0, max: 1, step: 0.01, value: layer.x ?? 0.5, onInput: (v) => store.updateLayer(layer.id, { x: v }) })
  );
  node.appendChild(
    makeSlider({ label: '纵向位置', min: 0, max: 1, step: 0.01, value: layer.y ?? 0.5, onInput: (v) => store.updateLayer(layer.id, { y: v }) })
  );
  node.appendChild(
    makeSlider({ label: '旋转', min: -180, max: 180, step: 1, value: layer.rotation ?? 0, onInput: (v) => store.updateLayer(layer.id, { rotation: v }) })
  );
  node.appendChild(
    makeSlider({ label: '不透明度', min: 0, max: 1, step: 0.01, value: layer.opacity ?? 1, onInput: (v) => store.updateLayer(layer.id, { opacity: v }) })
  );
}

function renderLayerControls(state) {
  const selected = state.layers.find((layer) => layer.id === state.selectedLayerId);
  els.layerControls.innerHTML = '';

  if (!selected) {
    els.layerControls.classList.add('muted');
    els.layerControls.textContent = '请选择一个马赛克、贴纸或文字图层。';
    return;
  }

  els.layerControls.classList.remove('muted');

  const title = document.createElement('div');
  title.textContent = selected.name;
  title.style.fontWeight = '600';
  els.layerControls.appendChild(title);

  pushSharedLayerControls(selected, els.layerControls);

  if (selected.type !== 'text') {
    els.layerControls.appendChild(
      makeSlider({ label: '宽度', min: 0.05, max: 0.8, step: 0.01, value: selected.width ?? 0.2, onInput: (v) => store.updateLayer(selected.id, { width: v }) })
    );
    els.layerControls.appendChild(
      makeSlider({ label: '高度', min: 0.05, max: 0.8, step: 0.01, value: selected.height ?? 0.2, onInput: (v) => store.updateLayer(selected.id, { height: v }) })
    );
  }

  if (selected.type === 'mosaic') {
    els.layerControls.appendChild(
      makeSlider({ label: '羽化', min: 0.01, max: 0.4, step: 0.01, value: selected.feather ?? 0.1, onInput: (v) => store.updateLayer(selected.id, { feather: v }) })
    );

    if (selected.variant === 'frosted') {
      els.layerControls.appendChild(
        makeSlider({ label: '模糊强度', min: 2, max: 36, step: 1, value: selected.intensity ?? 14, onInput: (v) => store.updateLayer(selected.id, { intensity: v }) })
      );
      els.layerControls.appendChild(
        makeSlider({ label: '雾感', min: 0, max: 0.7, step: 0.01, value: selected.haze ?? 0.2, onInput: (v) => store.updateLayer(selected.id, { haze: v }) })
      );
    } else {
      els.layerControls.appendChild(
        makeSlider({ label: '网格大小', min: 4, max: 24, step: 1, value: selected.cellSize ?? 8, onInput: (v) => store.updateLayer(selected.id, { cellSize: v }) })
      );
      els.layerControls.appendChild(
        makeSlider({ label: '网格透明度', min: 0.05, max: 0.7, step: 0.01, value: selected.gridAlpha ?? 0.3, onInput: (v) => store.updateLayer(selected.id, { gridAlpha: v }) })
      );
    }
  }

  if (selected.type === 'text') {
    els.layerControls.appendChild(
      makeTextInput({ label: '文案', value: selected.content ?? '', multiline: true, onInput: (v) => store.updateLayer(selected.id, { content: v }) })
    );

    els.layerControls.appendChild(
      makeSlider({ label: '字号', min: 16, max: 160, step: 1, value: selected.fontSize ?? 56, onInput: (v) => store.updateLayer(selected.id, { fontSize: v }) })
    );

    els.layerControls.appendChild(
      makeColorInput({ label: '文字颜色', value: selected.color ?? '#ffeef5', onInput: (v) => store.updateLayer(selected.id, { color: v }) })
    );

    els.layerControls.appendChild(
      makeColorInput({ label: '描边颜色', value: selected.strokeColor ?? '#2f2532', onInput: (v) => store.updateLayer(selected.id, { strokeColor: v }) })
    );

    els.layerControls.appendChild(
      makeSlider({ label: '描边宽度', min: 0, max: 16, step: 1, value: selected.strokeWidth ?? 4, onInput: (v) => store.updateLayer(selected.id, { strokeWidth: v }) })
    );

    els.layerControls.appendChild(
      makeColorInput({ label: '阴影颜色', value: selected.shadowColor ?? '#2f2532', onInput: (v) => store.updateLayer(selected.id, { shadowColor: v }) })
    );

    els.layerControls.appendChild(
      makeSlider({ label: '阴影模糊', min: 0, max: 40, step: 1, value: selected.shadowBlur ?? 8, onInput: (v) => store.updateLayer(selected.id, { shadowBlur: v }) })
    );

    els.layerControls.appendChild(
      makeTextInput({ label: '字体', value: selected.fontFamily ?? '', onInput: (v) => store.updateLayer(selected.id, { fontFamily: v }) })
    );
  }
}

function renderLayerList(state) {
  els.layerList.innerHTML = '';

  [...state.layers].reverse().forEach((layer) => {
    const row = document.createElement('div');
    row.className = 'layer-row';
    if (state.selectedLayerId === layer.id) row.classList.add('selected');

    const titleBtn = document.createElement('button');
    titleBtn.textContent = `${layer.visible ? '●' : '○'} ${layer.name}`;
    titleBtn.style.textAlign = 'left';
    titleBtn.onclick = () => store.selectLayer(layer.id);

    const actions = document.createElement('div');
    actions.className = 'layer-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = layer.visible ? '隐藏' : '显示';
    toggleBtn.onclick = () => store.updateLayer(layer.id, { visible: !layer.visible });

    const upBtn = document.createElement('button');
    upBtn.textContent = '↑';
    upBtn.onclick = () => store.moveLayer(layer.id, 1);

    const downBtn = document.createElement('button');
    downBtn.textContent = '↓';
    downBtn.onclick = () => store.moveLayer(layer.id, -1);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => store.removeLayer(layer.id);

    actions.append(toggleBtn, upBtn, downBtn, deleteBtn);
    row.append(titleBtn, actions);
    els.layerList.appendChild(row);
  });
}

function render(state) {
  renderCanvas(ctx, state);
  overlayController.render();

  els.canvasEmpty.style.display = state.image.loaded ? 'none' : 'grid';

  renderPresetButtons(state);
  renderFilterControls(state);
  renderLayerControls(state);
  renderLayerList(state);
}

function bindEvents() {
  els.imageUpload.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = await loadLocalImage(file);
    store.setImage(image);
  };

  els.addFrostedMosaicBtn.onclick = () => addMosaic('frosted');
  els.addGridMosaicBtn.onclick = () => addMosaic('grid-glass');
  els.addTextLayerBtn.onclick = () => addText();

  els.resetAllBtn.onclick = () => {
    store.reset(true);
    store.setFilters({ ...DEFAULT_FILTERS }, null);
  };

  els.exportBtn.onclick = async () => {
    const state = store.getState();
    if (!state.image.loaded) {
      alert('请先上传图片。');
      return;
    }
    await exportPng(state);
  };
}

function init() {
  renderStickerPanel();
  renderTextTemplates();
  bindEvents();
  store.subscribe(render);
  render(store.getState());
}

init();
