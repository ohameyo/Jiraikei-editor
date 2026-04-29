import { DEFAULT_FILTERS } from '../config/filterPresets.js';

let layerSeed = 1;

function createInitialState() {
  return {
    image: {
      element: null,
      loaded: false,
      naturalWidth: 0,
      naturalHeight: 0,
    },
    canvas: {
      width: 1080,
      height: 1350,
    },
    filters: { ...DEFAULT_FILTERS },
    layers: [],
    selectedLayerId: null,
    activePresetId: null,
  };
}

export function createStore() {
  const state = createInitialState();
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setImage(img) {
      state.image.element = img;
      state.image.loaded = Boolean(img);
      state.image.naturalWidth = img ? img.naturalWidth : 0;
      state.image.naturalHeight = img ? img.naturalHeight : 0;
      notify();
    },

    setFilters(partial, presetId = null) {
      state.filters = { ...state.filters, ...partial };
      state.activePresetId = presetId;
      notify();
    },

    addLayer(layer) {
      const next = {
        id: `layer-${layerSeed++}`,
        visible: true,
        opacity: 1,
        x: 0.5,
        y: 0.5,
        rotation: 0,
        ...layer,
      };
      state.layers.push(next);
      state.selectedLayerId = next.id;
      notify();
      return next;
    },

    updateLayer(id, partial) {
      const target = state.layers.find((layer) => layer.id === id);
      if (!target) return;
      Object.assign(target, partial);
      notify();
    },

    removeLayer(id) {
      state.layers = state.layers.filter((layer) => layer.id !== id);
      if (state.selectedLayerId === id) {
        state.selectedLayerId = state.layers.at(-1)?.id ?? null;
      }
      notify();
    },

    moveLayer(id, delta) {
      const index = state.layers.findIndex((layer) => layer.id === id);
      if (index < 0) return;
      const targetIndex = Math.max(0, Math.min(state.layers.length - 1, index + delta));
      if (index === targetIndex) return;
      const [layer] = state.layers.splice(index, 1);
      state.layers.splice(targetIndex, 0, layer);
      notify();
    },

    selectLayer(id) {
      state.selectedLayerId = id;
      notify();
    },

    reset(resetFilters) {
      state.layers = [];
      state.selectedLayerId = null;
      state.activePresetId = null;
      if (resetFilters) {
        state.filters = { ...DEFAULT_FILTERS };
      }
      notify();
    },
  };
}
