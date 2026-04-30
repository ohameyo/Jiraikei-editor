(function () {
  const FIXED_CANVAS = { width: 1080, height: 1350 };
  const EDIT_CANVAS_MAX_SIDE = 2400;
  const EDIT_CANVAS_MAX_PIXELS = 3200000;
  const ANALYTICS_ENDPOINT = '/analytics';
  const ANALYTICS_EVENT_NAMES = new Set([
    'app_open',
    'tool_select',
    'image_upload_success',
    'filter_preset_apply',
    'filter_adjust',
    'sticker_add',
    'text_add',
    'compare_toggle',
    'export_preview_open',
    'download_png',
  ]);

  function sanitizeAnalyticsPayload(payload = {}) {
    const safe = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (!/^[a-zA-Z0-9_]{1,40}$/.test(key)) return;
      if (value === null || value === undefined) return;
      if (typeof value === 'boolean') {
        safe[key] = value;
        return;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        safe[key] = value;
        return;
      }
      if (typeof value === 'string') {
        safe[key] = value.slice(0, 80);
      }
    });
    return safe;
  }

  function getAnalyticsContext() {
    return {
      path: window.location.pathname || '/',
      viewportWidth: Math.round(window.innerWidth || 0),
      viewportHeight: Math.round(window.innerHeight || 0),
      isMobile: isMobileLayoutViewport(),
      language: (navigator.language || '').slice(0, 16),
    };
  }

  function trackEvent(name, payload = {}) {
    if (!ANALYTICS_EVENT_NAMES.has(name)) return;
    const body = JSON.stringify({
      name,
      timestamp: new Date().toISOString(),
      ...getAnalyticsContext(),
      payload: sanitizeAnalyticsPayload(payload),
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) return;
      }
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  window.trackEvent = trackEvent;

  const FILTER_CONTROL_DEFS = [
    { key: 'overlayStrength', label: '叠加强度', min: 0, max: 0.45, step: 0.01 },
    { key: 'brightness', label: '亮度', min: 0.6, max: 1.6, step: 0.01 },
    { key: 'contrast', label: '对比度', min: 0.7, max: 1.4, step: 0.01 },
    { key: 'saturation', label: '饱和度', min: 0.3, max: 1.2, step: 0.01 },
    { key: 'temperature', label: '色温', min: -100, max: 100, step: 1 },
    { key: 'tint', label: '色调偏移', min: -100, max: 100, step: 1 },
    { key: 'skinWhiten', label: '肤色提白', min: 0, max: 1, step: 0.01 },
    { key: 'blushStrength', label: '腮红强度', min: 0, max: 1, step: 0.01 },
    { key: 'blackProtect', label: '黑发保护', min: 0, max: 1, step: 0.01 },
    { key: 'fade', label: '褪色 / 雾感', min: 0, max: 0.5, step: 0.01 },
  ];

  const HSL_CHANNELS = [
    { id: 'master', name: '综合色', swatch: '#e7c8ac' },
    { id: 'skin', name: '肤色', swatch: '#f4c3a0' },
    { id: 'red', name: '红', swatch: '#e86a70', center: 0, width: 34 },
    { id: 'orange', name: '橙', swatch: '#f0a35a', center: 28, width: 32 },
    { id: 'yellow', name: '黄', swatch: '#e9dc63', center: 56, width: 34 },
    { id: 'green', name: '绿', swatch: '#6ccd68', center: 122, width: 38 },
    { id: 'cyan', name: '青', swatch: '#53c8d8', center: 182, width: 38 },
    { id: 'blue', name: '蓝', swatch: '#6079e8', center: 228, width: 36 },
    { id: 'purple', name: '紫', swatch: '#a66ae5', center: 286, width: 38 },
  ];

  const HSL_AXES = [
    { axis: 'h', label: '色相', min: -40, max: 40, step: 1 },
    { axis: 's', label: '饱和度', min: -70, max: 55, step: 1 },
    { axis: 'l', label: '明度', min: -32, max: 32, step: 1 },
  ];

  function hslKey(channelId, axis) {
    return `hsl_${channelId}_${axis}`;
  }

  function hslFilterKeys() {
    return HSL_CHANNELS.flatMap((channel) => HSL_AXES.map(({ axis }) => hslKey(channel.id, axis)));
  }

  function buildHslPatch(config = {}) {
    const patch = {};
    HSL_CHANNELS.forEach((channel) => {
      const channelConfig = config[channel.id] || {};
      HSL_AXES.forEach(({ axis }) => {
        patch[hslKey(channel.id, axis)] = Number(channelConfig[axis] ?? 0);
      });
    });
    return patch;
  }

  const DEFAULT_FILTERS = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    tint: 0,
    skinWhiten: 0,
    blushStrength: 0,
    blushManual: 0,
    blushLeftEnabled: 1,
    blushRightEnabled: 1,
    blushLeftX: 0.36,
    blushLeftY: 0.45,
    blushLeftRX: 0.115,
    blushLeftRY: 0.085,
    blushRightX: 0.64,
    blushRightY: 0.45,
    blushRightRX: 0.115,
    blushRightRY: 0.085,
    blushExtraEnabled: 0,
    blushExtraLeftEnabled: 1,
    blushExtraRightEnabled: 1,
    blushExtraLeftX: 0.59,
    blushExtraLeftY: 0.45,
    blushExtraLeftRX: 0.105,
    blushExtraLeftRY: 0.08,
    blushExtraRightX: 0.73,
    blushExtraRightY: 0.45,
    blushExtraRightRX: 0.105,
    blushExtraRightRY: 0.08,
    blackProtect: 0,
    fade: 0,
    overlayColor: '#e7d3ea',
    overlayStrength: 0,
    hslActiveChannel: 'master',
    ...Object.fromEntries(HSL_CHANNELS.flatMap((channel) => HSL_AXES.map(({ axis }) => [hslKey(channel.id, axis), 0]))),
  };

  const BLUSH_REGION_KEYS = [
    'blushManual',
    'blushLeftEnabled',
    'blushRightEnabled',
    'blushLeftX',
    'blushLeftY',
    'blushLeftRX',
    'blushLeftRY',
    'blushRightX',
    'blushRightY',
    'blushRightRX',
    'blushRightRY',
    'blushExtraEnabled',
    'blushExtraLeftEnabled',
    'blushExtraRightEnabled',
    'blushExtraLeftX',
    'blushExtraLeftY',
    'blushExtraLeftRX',
    'blushExtraLeftRY',
    'blushExtraRightX',
    'blushExtraRightY',
    'blushExtraRightRX',
    'blushExtraRightRY',
  ];

  function preserveManualBlushRegion(currentFilters, nextFilters) {
    if (Number(currentFilters?.blushManual ?? 0) <= 0.5) return { ...nextFilters };
    const preserved = {};
    BLUSH_REGION_KEYS.forEach((key) => {
      preserved[key] = currentFilters[key] ?? DEFAULT_FILTERS[key];
    });
    return { ...nextFilters, ...preserved };
  }

  function blendPresetFiltersByStrength(preset, strengthValue) {
    const presetFilters = preset?.filters || preset || {};
    const maxOverlay = Number(preset?.overlayStrengthMax ?? FILTER_CONTROL_DEFS.find((item) => item.key === 'overlayStrength')?.max ?? 0.45);
    const overlayStrength = clamp(Number(strengthValue ?? 0), 0, maxOverlay);
    const baseOverlay = Math.abs(Number(presetFilters?.overlayStrength ?? 0)) || 0.0001;
    const ratio = clamp(overlayStrength / baseOverlay, 0, 1.6);
    const partial = { overlayStrength };
    const blendKeys = [
      ...FILTER_CONTROL_DEFS.map((item) => item.key).filter((key) => key !== 'overlayStrength'),
      ...hslFilterKeys(),
    ];
    blendKeys.forEach((key) => {
      const presetValue = presetFilters?.[key];
      const defaultValue = DEFAULT_FILTERS[key];
      if (typeof presetValue === 'number' && typeof defaultValue === 'number') {
        partial[key] = lerp(defaultValue, presetValue, ratio);
      }
    });
    return partial;
  }

  const FILTER_PRESETS = [
    {
      id: 'original',
      name: '原图',
      description: '不套用滤镜，仅保留原图',
      filters: { ...DEFAULT_FILTERS },
    },
    {
      id: 'cold-pink',
      name: '蕾粉',
      description: '苍白肤感 + 粉色底调 + 梦幻雾感',
      filters: {
        brightness: 1.07,
        contrast: 0.92,
        saturation: 0.82,
        temperature: 1,
        tint: 25,
        skinWhiten: 0.52,
        blushStrength: 0.57,
        blackProtect: 0.5,
        fade: 0.14,
        overlayColor: '#F5B9E4',
        overlayStrength: 0.14,
        ...buildHslPatch({
          master: { h: 1, s: -3, l: 6 },
          skin: { h: 4, s: 11, l: 8 },
          red: { h: -3, s: 13, l: 3 },
          orange: { h: -6, s: -13, l: 4 },
          yellow: { h: -8, s: -50, l: 6 },
          green: { h: 13, s: -62, l: 7 },
          cyan: { h: 10, s: -34, l: 6 },
          blue: { h: 7, s: -17, l: 4 },
          purple: { h: -4, s: 10, l: 6 },
        }),
      },
    },
    {
      id: 'cold-blue',
      name: '水色',
      description: '冰冷清透 + 轻微暗调 + 冷感氛围',
      filters: {
        brightness: 1.06,
        contrast: 0.96,
        saturation: 0.64,
        temperature: -29,
        tint: -6,
        skinWhiten: 0.39,
        blushStrength: 0.11,
        blackProtect: 0.63,
        fade: 0.11,
        overlayColor: '#CDEBFA',
        overlayStrength: 0.14,
        ...buildHslPatch({
          master: { h: -3, s: -21, l: 6 },
          skin: { h: -3, s: -17, l: 7 },
          red: { h: -4, s: -27, l: 2 },
          orange: { h: -7, s: -43, l: 3 },
          yellow: { h: 20, s: -67, l: 8 },
          green: { h: 22, s: -55, l: 7 },
          cyan: { h: 4, s: 13, l: 7 },
          blue: { h: 3, s: 11, l: 7 },
          purple: { h: -6, s: -20, l: 3 },
        }),
      },
    },
    {
      id: 'gray-pink',
      name: '灰粉',
      description: '去色清透 + 保留粉感 + 黑白灰氛围',
      overlayStrengthMax: 0.1,
      filters: {
        brightness: 1.31,
        contrast: 1.03,
        saturation: 0.48,
        temperature: -8,
        tint: 6,
        skinWhiten: 0.48,
        blushStrength: 0.48,
        blackProtect: 0.9,
        fade: 0.08,
        overlayColor: '#E2D7DF',
        overlayStrength: 0.04,
        ...buildHslPatch({
          master: { h: 0, s: -34, l: 2 },
          skin: { h: 4, s: 6, l: 11 },
          red: { h: 0, s: -10, l: 2 },
          orange: { h: 0, s: -64, l: 3 },
          yellow: { h: 0, s: -94, l: 4 },
          green: { h: 0, s: -96, l: 6 },
          cyan: { h: 0, s: -88, l: 4 },
          blue: { h: 0, s: -82, l: 3 },
          purple: { h: 0, s: -54, l: 2 },
        }),
      },
    },
    {
      id: 'mono',
      name: '黑白',
      description: '高明度黑白灰 + 苍白肤感 + 暗红唇妆',
      overlayStrengthMax: 0.03,
      filters: {
        brightness: 1.35,
        contrast: 1.14,
        saturation: 0.18,
        temperature: -4,
        tint: 0,
        skinWhiten: 0.54,
        blushStrength: 0.26,
        blackProtect: 0.94,
        fade: 0.025,
        overlayColor: '#DCDDE3',
        overlayStrength: 0.006,
        ...buildHslPatch({
          master: { h: 0, s: -72, l: 2 },
          skin: { h: 1, s: -8, l: 12 },
          red: { h: 0, s: -42, l: 1 },
          orange: { h: 0, s: -76, l: 2 },
          yellow: { h: 0, s: -96, l: 3 },
          green: { h: 0, s: -98, l: 4 },
          cyan: { h: 0, s: -96, l: 2 },
          blue: { h: 0, s: -94, l: 1 },
          purple: { h: 0, s: -78, l: 1 },
        }),
      },
    },
  ];

  const USER_STICKER_FILES = [
    'sel_01.png',
    'sel_03.png',
    'sel_04.png',
    'sel_05.png',
    'sel_06.png',
    'sel_07.png',
    'sel_08.png',
    'sel_09.png',
    'sel_10.png',
    'sel_11.png',
    'sel_12.png',
    'sel_13.png',
  ];
  const USER_STICKER_VERSION = '20260429-no-sel02';

  const TEXT_PRESETS = [
    '今日の私、満点！',
    '自分が一番かわいいかも！',
    '世界一かわいい～',
    '天才的にかわいい！',
    'かわいくてごめん～',
    '推しは最高！',
    '推ししか勝たん！',
    '推ししか見えない',
    '推し依存症',
    'ずっと応援してるよ',
    '推し大好きすぎる',
  ].map((content, index) => ({
    id: `preset-copy-${index + 1}`,
    name: content,
    content,
    fontId: 'mushin',
    style: {
      color: '#ffffff',
      strokeColor: '#FF40FF',
      shadowColor: '#000000',
      fontSize: 62,
      strokeWidth: 6,
      shadowBlur: 0,
      bgColor: '#2a1d2a',
      bgOpacity: 0,
      bgPadding: 12,
      bgRadius: 16,
      textAlign: 'left',
    },
  }));

  const TEXT_FONT_FALLBACK = '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", "PingFang SC", sans-serif';

  const DEFAULT_TEXT_STYLE = {
    content: '>w<',
    color: '#ffffff',
    strokeColor: '#FF40FF',
    shadowColor: '#000000',
    fontSize: 56,
    strokeWidth: 6,
    shadowBlur: 0,
    bgColor: '#2a1d2a',
    bgOpacity: 0,
    bgPadding: 12,
    bgRadius: 16,
    fontFamily: `"Zhaizai Marker", ${TEXT_FONT_FALLBACK}`,
    textAlign: 'left',
  };

  const TEXT_FONTS = [
    { id: 'system', name: '系统默认', family: `"Avenir Next", ${TEXT_FONT_FALLBACK}`, className: 'text-font-system' },
    { id: 'mushin', name: '無心（日文）', family: `"Mushin", ${TEXT_FONT_FALLBACK}`, face: 'Mushin', src: './assets/fonts/mushin.otf', mobileFamily: `"Mushin Mobile", "Mushin", ${TEXT_FONT_FALLBACK}`, mobileFace: 'Mushin Mobile', mobileSrc: './assets/fonts/mushin-mobile.woff2', className: 'text-font-mushin' },
    { id: 'zhaizai-marker', name: '宅在家麦克笔（中文）', family: `"Zhaizai Marker", ${TEXT_FONT_FALLBACK}`, face: 'Zhaizai Marker', src: './assets/fonts/zhaizai-marker.ttf', mobileFamily: `"Zhaizai Marker Mobile", "Zhaizai Marker", ${TEXT_FONT_FALLBACK}`, mobileFace: 'Zhaizai Marker Mobile', mobileSrc: './assets/fonts/zhaizai-marker-mobile.woff2', className: 'text-font-zhaizai-marker' },
    { id: 'fusion-pixel-sc', name: '缝合像素（中文）', family: `"Fusion Pixel SC", ${TEXT_FONT_FALLBACK}`, face: 'Fusion Pixel SC', src: './assets/fonts/fusion-pixel-sc.otf', mobileFamily: `"Fusion Pixel SC Mobile", "Fusion Pixel SC", ${TEXT_FONT_FALLBACK}`, mobileFace: 'Fusion Pixel SC Mobile', mobileSrc: './assets/fonts/fusion-pixel-sc-mobile.woff2', className: 'text-font-fusion-pixel-sc' },
    { id: 'fusion-pixel-jp', name: '缝合像素（日文）', family: `"Fusion Pixel JP", ${TEXT_FONT_FALLBACK}`, face: 'Fusion Pixel JP', src: './assets/fonts/fusion-pixel-jp.otf', mobileFamily: `"Fusion Pixel JP Mobile", "Fusion Pixel JP", ${TEXT_FONT_FALLBACK}`, mobileFace: 'Fusion Pixel JP Mobile', mobileSrc: './assets/fonts/fusion-pixel-jp-mobile.woff2', className: 'text-font-fusion-pixel-jp' },
    { id: 'wafu-pop', name: '和風ぽっぷ', family: `"Wafu Pop", ${TEXT_FONT_FALLBACK}`, face: 'Wafu Pop', src: './assets/fonts/wafu-pop.ttf', className: 'text-font-wafu-pop' },
    { id: 'darts-font', name: 'ダーツフォント', family: `"Darts Font", ${TEXT_FONT_FALLBACK}`, face: 'Darts Font', src: './assets/fonts/darts-font.ttf', className: 'text-font-darts-font' },
    { id: 'nagino', name: 'なぎの', family: `"Nagino", ${TEXT_FONT_FALLBACK}`, face: 'Nagino', src: './assets/fonts/nagino.otf', className: 'text-font-nagino' },
  ];
  const TEXT_FONT_PREVIEW_SAMPLE = '今日の私';
  const TEXT_FONT_ACTIVATION_SAMPLE = '今日の私、満点!';
  const FONT_LOAD_TIMEOUT_MS = 2600;
  const FONT_ASSET_VERSION = '20260429-textfonts-3';
  const MOBILE_TEXT_FONT_IDS = new Set(['mushin', 'zhaizai-marker', 'fusion-pixel-jp', 'fusion-pixel-sc']);
  const TEXT_FONT_WARMUP_ORDER = ['mushin', 'zhaizai-marker', 'fusion-pixel-jp', 'fusion-pixel-sc', 'darts-font', 'nagino', 'wafu-pop'];

  const MOSAIC_TOOL_DEFAULTS = {
    variant: 'frosted',
    feather: 0.14,
    featherRange: 1,
    strength: 14,
    whiteOpacity: 0.34,
  };

  const STICKER_IMAGE_CACHE = new Map();
  const MOBILE_SLIDER_COMMIT_MS = 64;
  const MOBILE_LIGHTWEIGHT_RENDER_MS = 96;
  const DESKTOP_SLIDER_COMMIT_MS = 16;
  const DESKTOP_LIGHTWEIGHT_RENDER_MS = 24;
  const INTERACTIVE_RENDER_BUDGET_MS = 56;
  let stickerPacks = [];
  let isSliderDragging = false;
  let isTextEditing = false;
  let isDirectManipulating = false;
  let activeTransformLayerId = null;
  let interactiveRenderPressure = 0;
  let sliderDragStartFilters = null;
  let sliderPreviewFilters = null;
  let blushPreviewEnabled = false;
  let blushEditMode = false;
  let blushFallbackNoticeShown = false;
  const loadedFontFaces = new Set();
  const loadingFontFaces = new Map();
  const fontFaceStatus = new Map([['system', 'ready']]);
  const queuedFontPreviewWarmups = new Set();
  const fontWarmupProbes = new Map();
  let fontPreviewWarmupChain = Promise.resolve();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Font load timed out')), ms);
      promise
        .then(resolve, reject)
        .finally(() => window.clearTimeout(timer));
    });
  }

  function getRuntimeFontFace(font) {
    return isMobileViewport() ? font?.mobileFace || font?.face : font?.face;
  }

  function getRuntimeFontFamily(font) {
    return isMobileViewport() ? font?.mobileFamily || font?.family : font?.family;
  }

  function getRuntimeFontSrc(font) {
    return isMobileViewport() ? font?.mobileSrc || font?.src : font?.src;
  }

  function getVersionedFontUrl(font) {
    const src = getRuntimeFontSrc(font);
    if (!src) return '';
    const url = new URL(src, window.location.href);
    if (url.protocol !== 'file:') url.searchParams.set('v', FONT_ASSET_VERSION);
    return url.href;
  }

  function getFontLoadTimeoutMs() {
    return isMobileViewport() ? 45000 : FONT_LOAD_TIMEOUT_MS;
  }

  function shouldApplyFontPreviewClass(font) {
    if (!font?.className) return false;
    if (!isMobileViewport()) return true;
    if (font.id === 'system') return true;
    return MOBILE_TEXT_FONT_IDS.has(font.id) && fontFaceStatus.get(font.id) !== 'error';
  }

  function mountFontWarmupProbe(font) {
    if (!font?.id || !font.className || fontWarmupProbes.has(font.id)) return;
    const probe = document.createElement('span');
    probe.className = `font-warmup-probe ${font.className}`;
    probe.textContent = `${TEXT_FONT_ACTIVATION_SAMPLE} 今日の私 >w<`;
    document.body.appendChild(probe);
    fontWarmupProbes.set(font.id, probe);
  }

  async function ensureTextFontLoaded(font) {
    const runtimeFace = getRuntimeFontFace(font);
    const runtimeSrc = getRuntimeFontSrc(font);
    if (!font || font.id === 'system' || !runtimeSrc || !runtimeFace || loadedFontFaces.has(font.id)) {
      if (font?.id) fontFaceStatus.set(font.id, 'ready');
      return;
    }
    if (!document.fonts?.load) {
      fontFaceStatus.set(font.id, 'error');
      return;
    }
    if (loadingFontFaces.has(font.id)) return loadingFontFaces.get(font.id);
    if (document.fonts.check?.(`400 32px "${runtimeFace}"`, TEXT_FONT_ACTIVATION_SAMPLE)) {
      loadedFontFaces.add(font.id);
      fontFaceStatus.set(font.id, 'ready');
      return;
    }
    fontFaceStatus.set(font.id, 'loading');
    mountFontWarmupProbe(font);
    const fontUrl = getVersionedFontUrl(font);
    const cssLoad = () => document.fonts.load(`400 32px "${runtimeFace}"`, TEXT_FONT_ACTIVATION_SAMPLE);
    const jsLoad = () => {
      if (!('FontFace' in window) || !document.fonts?.add) return Promise.reject(new Error('FontFace unavailable'));
      return new FontFace(runtimeFace, `url("${fontUrl}")`, { style: 'normal', weight: '400', display: 'swap' })
        .load()
        .then((loadedFace) => {
          document.fonts.add(loadedFace);
          return cssLoad();
        });
    };
    const timeoutMs = getFontLoadTimeoutMs();
    const loadPromise = withTimeout(cssLoad(), timeoutMs)
      .catch(() => withTimeout(jsLoad(), timeoutMs))
      .then((loadedFace) => {
        loadedFontFaces.add(font.id);
        fontFaceStatus.set(font.id, 'ready');
        render(store.getState());
        return loadedFace;
      })
      .catch(() => {
        fontFaceStatus.set(font.id, 'error');
      })
      .finally(() => {
        loadingFontFaces.delete(font.id);
        render(store.getState());
      });
    loadingFontFaces.set(font.id, loadPromise);
    return loadPromise;
  }

  function scheduleFontPreviewWarmup(priorityFontId = activeTextFontId) {
    const orderedIds = [
      priorityFontId,
      'mushin',
      ...(isMobileViewport() ? TEXT_FONT_WARMUP_ORDER.filter((id) => MOBILE_TEXT_FONT_IDS.has(id)) : TEXT_FONT_WARMUP_ORDER),
    ].filter(Boolean);
    const uniqueFonts = [];
    const seenIds = new Set(['system']);
    orderedIds.forEach((id) => {
      if (seenIds.has(id)) return;
      seenIds.add(id);
      const font = TEXT_FONTS.find((item) => item.id === id);
      if (font) uniqueFonts.push(font);
    });

    uniqueFonts.forEach((font, index) => {
      if (loadedFontFaces.has(font.id) || loadingFontFaces.has(font.id) || queuedFontPreviewWarmups.has(font.id)) return;
      queuedFontPreviewWarmups.add(font.id);
      fontPreviewWarmupChain = fontPreviewWarmupChain
        .then(() => new Promise((resolve) => window.setTimeout(resolve, isMobileViewport() ? (index === 0 ? 0 : 320) : 100)))
        .then(
          () =>
            new Promise((resolve) => {
              runWhenIdle(() => {
                ensureTextFontLoaded(font)
                  .then(() => render(store.getState()))
                  .finally(() => {
                    queuedFontPreviewWarmups.delete(font.id);
                    resolve();
                  });
              }, isMobileViewport() ? 1800 : 700);
            })
        );
    });
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return `rgba(232,220,234,${alpha})`;
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case rn:
          h = ((gn - bn) / d) % 6;
          break;
        case gn:
          h = (bn - rn) / d + 2;
          break;
        default:
          h = (rn - gn) / d + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;
    if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
    else if (hp < 2) [r1, g1, b1] = [x, c, 0];
    else if (hp < 3) [r1, g1, b1] = [0, c, x];
    else if (hp < 4) [r1, g1, b1] = [0, x, c];
    else if (hp < 5) [r1, g1, b1] = [x, 0, c];
    else [r1, g1, b1] = [c, 0, x];
    const m = l - c / 2;
    return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function getTextLayerName(content) {
    const text = String(content || '').replace(/\s+/g, ' ').trim();
    return text || '文字';
  }

  function hueDistance(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function getHueChannelWeight(h, sat, channel) {
    const dist = hueDistance(h, channel.center);
    const width = channel.width || 36;
    const base = 1 - smoothstep(width * 0.62, width, dist);
    // 低饱和区色相不稳定，避免肤色和手部出现分区色块。
    const chroma = smoothstep(0.05, 0.24, sat);
    return clamp(base * chroma, 0, 1);
  }

  function applySelectiveHsl(r, g, b, filters, skinMask, hasFaceContext = true) {
    let [h, s, l] = rgbToHsl(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255));
    const baseH = h;
    const baseS = s;
    const hslSafety = 1 - clamp(skinMask * 0.78 + smoothstep(0, 0.22, 0.22 - s) * 0.55, 0, 0.86);

    const masterH = clamp(Number(filters[hslKey('master', 'h')] ?? 0), -40, 40);
    const masterS = clamp(Number(filters[hslKey('master', 's')] ?? 0), -70, 55);
    const masterL = clamp(Number(filters[hslKey('master', 'l')] ?? 0), -32, 32);
    const masterSafety = Math.max(hslSafety, skinMask > 0.0001 ? 0.42 : 0.68);
    h = (h + masterH * 1.35 * masterSafety + 360) % 360;
    s = clamp(s * (1 + (masterS / 100) * masterSafety * 1.12), 0, 1);
    l = clamp(l + (masterL / 100) * 0.34 * masterSafety, 0, 1);

    HSL_CHANNELS.forEach((channel) => {
      if (channel.id === 'master' || channel.id === 'skin') return;
      if (Math.max(s, baseS) < 0.045) return;
      const channelSat = Math.max(s, baseS * 0.82);
      const w = getHueChannelWeight(baseH, channelSat, channel);
      if (w <= 0.0001) return;
      const contextScale = hasFaceContext ? Math.max(hslSafety, 0.5) : Math.max(hslSafety, 0.32);
      const ch = clamp(Number(filters[hslKey(channel.id, 'h')] ?? 0), -40, 40);
      const cs = clamp(Number(filters[hslKey(channel.id, 's')] ?? 0), -70, 55);
      const cl = clamp(Number(filters[hslKey(channel.id, 'l')] ?? 0), -32, 32);
      h = (h + ch * 1.2 * w * contextScale + 360) % 360;
      s = clamp(s * (1 + (cs / 100) * w * contextScale * 1.08), 0, 1);
      l = clamp(l + (cl / 100) * 0.28 * w * contextScale, 0, 1);
    });

    if (skinMask > 0.0001) {
      const sh = clamp(Number(filters[hslKey('skin', 'h')] ?? 0), -24, 24);
      const ss = clamp(Number(filters[hslKey('skin', 's')] ?? 0), -36, 30);
      const sl = clamp(Number(filters[hslKey('skin', 'l')] ?? 0), -18, 18);
      h = (h + sh * 0.95 * skinMask + 360) % 360;
      s = clamp(s * (1 + (ss / 100) * skinMask * 0.85), 0, 1);
      l = clamp(l + (sl / 100) * 0.22 * skinMask, 0, 1);
    }

    return hslToRgb(h, s, l);
  }

  function deriveCanvasSizeFromImage(img) {
    const width = Math.max(1, img?.naturalWidth || FIXED_CANVAS.width);
    const height = Math.max(1, img?.naturalHeight || FIXED_CANVAS.height);
    const bySide = EDIT_CANVAS_MAX_SIDE / Math.max(width, height);
    const byArea = Math.sqrt(EDIT_CANVAS_MAX_PIXELS / Math.max(1, width * height));
    const scale = Math.min(1, bySide, byArea);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }

  function createHistorySnapshot(state) {
    return {
      image: {
        element: state.image.element,
        loaded: state.image.loaded,
        naturalWidth: state.image.naturalWidth,
        naturalHeight: state.image.naturalHeight,
        faceBoxes: (state.image.faceBoxes || []).map((box) => ({ ...box })),
        faceLandmarks: (state.image.faceLandmarks || []).map((face) => face.map((pt) => ({ ...pt }))),
        personMaskCanvas: state.image.personMaskCanvas || null,
        autoBlushDetected: Boolean(state.image.autoBlushDetected),
      },
      canvas: {
        width: state.canvas.width,
        height: state.canvas.height,
      },
      filters: { ...state.filters },
      layers: state.layers.map((layer) => ({ ...layer })),
      selectedLayerId: state.selectedLayerId,
      activePresetId: state.activePresetId,
      imageTransform: { ...state.image.transform },
      compareMode: Boolean(state.compareMode),
      compareLabels: state.compareLabels !== false,
      renderToken: state.renderToken,
      toneToken: state.toneToken,
    };
  }

  function createStore() {
    const state = {
      image: {
        element: null,
        loaded: false,
        naturalWidth: 0,
        naturalHeight: 0,
        faceBoxes: [],
        faceLandmarks: [],
        personMaskCanvas: null,
        autoBlushDetected: false,
        transform: { scale: 1 },
      },
      canvas: { ...FIXED_CANVAS },
      filters: { ...DEFAULT_FILTERS },
      layers: [],
      selectedLayerId: null,
      activePresetId: 'original',
      compareMode: false,
      compareLabels: true,
      comparePeekOriginal: false,
      renderToken: 0,
      toneToken: 0,
      history: {
        past: [],
        future: [],
      },
    };

    const listeners = new Set();

    function notify() {
      listeners.forEach((listener) => listener(state));
    }

    function pushHistory() {
      state.history.past.push(createHistorySnapshot(state));
      if (state.history.past.length > 60) state.history.past.shift();
      state.history.future = [];
    }

    function restoreSnapshot(snapshot) {
      state.image.element = snapshot.image.element;
      state.image.loaded = snapshot.image.loaded;
      state.image.naturalWidth = snapshot.image.naturalWidth;
      state.image.naturalHeight = snapshot.image.naturalHeight;
      state.image.faceBoxes = (snapshot.image.faceBoxes || []).map((box) => ({ ...box }));
      state.image.faceLandmarks = (snapshot.image.faceLandmarks || []).map((face) => face.map((pt) => ({ ...pt })));
      state.image.personMaskCanvas = snapshot.image.personMaskCanvas || null;
      state.image.autoBlushDetected = Boolean(snapshot.image.autoBlushDetected);
      state.canvas.width = snapshot.canvas?.width ?? state.canvas.width;
      state.canvas.height = snapshot.canvas?.height ?? state.canvas.height;
      state.filters = { ...snapshot.filters };
      state.layers = snapshot.layers.map((layer) => ({ ...layer }));
      state.selectedLayerId = snapshot.selectedLayerId;
      state.activePresetId = snapshot.activePresetId;
      state.image.transform = { ...snapshot.imageTransform };
      state.compareMode = Boolean(snapshot.compareMode);
      state.compareLabels = snapshot.compareLabels !== false;
      state.renderToken = snapshot.renderToken ?? state.renderToken;
      state.toneToken = snapshot.toneToken ?? state.toneToken ?? state.renderToken;
    }

    function bumpRenderToken() {
      state.renderToken += 1;
    }

    function bumpToneRenderToken() {
      state.toneToken += 1;
      bumpRenderToken();
    }

    return {
      getState() {
        return state;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      selectLayerSilent(id) {
        state.selectedLayerId = id;
      },
      canUndo() {
        return state.history.past.length > 0;
      },
      canRedo() {
        return state.history.future.length > 0;
      },
      undo() {
        if (!state.history.past.length) return;
        state.history.future.push(createHistorySnapshot(state));
        const snapshot = state.history.past.pop();
        restoreSnapshot(snapshot);
        notify();
      },
      redo() {
        if (!state.history.future.length) return;
        state.history.past.push(createHistorySnapshot(state));
        const snapshot = state.history.future.pop();
        restoreSnapshot(snapshot);
        notify();
      },
      setImage(img) {
        state.image.element = img;
        state.image.loaded = Boolean(img);
        state.image.naturalWidth = img ? img.naturalWidth : 0;
        state.image.naturalHeight = img ? img.naturalHeight : 0;
        state.image.faceBoxes = [];
        state.image.faceLandmarks = [];
        state.image.personMaskCanvas = null;
        state.image.autoBlushDetected = false;
        if (img) {
          const nextCanvas = deriveCanvasSizeFromImage(img);
          state.canvas.width = nextCanvas.width;
          state.canvas.height = nextCanvas.height;
        } else {
          state.canvas.width = FIXED_CANVAS.width;
          state.canvas.height = FIXED_CANVAS.height;
        }
        state.image.transform = { scale: 1 };
        bumpToneRenderToken();
        state.history.past = [];
        state.history.future = [];
        notify();
      },
      clearCanvas() {
        pushHistory();
        state.image.element = null;
        state.image.loaded = false;
        state.image.naturalWidth = 0;
        state.image.naturalHeight = 0;
        state.image.faceBoxes = [];
        state.image.faceLandmarks = [];
        state.image.personMaskCanvas = null;
        state.image.autoBlushDetected = false;
        state.canvas.width = FIXED_CANVAS.width;
        state.canvas.height = FIXED_CANVAS.height;
        state.image.transform = { scale: 1 };
        state.filters = { ...DEFAULT_FILTERS };
        state.layers = [];
        state.selectedLayerId = null;
        state.activePresetId = 'original';
        state.compareMode = false;
        state.compareLabels = true;
        state.comparePeekOriginal = false;
        bumpToneRenderToken();
        notify();
      },
      setCompareMode(value, labels = true) {
        state.compareMode = Boolean(value);
        state.compareLabels = state.compareMode ? labels !== false : true;
        notify();
      },
      cycleCompareMode() {
        if (!state.compareMode) {
          state.compareMode = true;
          state.compareLabels = true;
        } else if (state.compareLabels !== false) {
          state.compareLabels = false;
        } else {
          state.compareMode = false;
          state.compareLabels = true;
        }
        notify();
      },
      setComparePeekOriginal(value) {
        state.comparePeekOriginal = Boolean(value);
        notify();
      },
      setVisionData({ faceBoxes = [], faceLandmarks = [], personMaskCanvas = null, autoBlushDetected = false } = {}) {
        state.image.faceBoxes = (faceBoxes || []).map((box) => ({ ...box }));
        state.image.faceLandmarks = (faceLandmarks || []).map((face) => face.map((pt) => ({ ...pt })));
        state.image.personMaskCanvas = personMaskCanvas || null;
        state.image.autoBlushDetected = Boolean(autoBlushDetected);
        bumpToneRenderToken();
        notify();
      },
      beginStep() {
        pushHistory();
      },
      setFilters(partial, presetId = null, recordHistory = true) {
        if (recordHistory) pushHistory();
        state.filters = { ...state.filters, ...partial };
        if (presetId !== null) state.activePresetId = presetId;
        const changesOnlyPanelState = Object.keys(partial || {}).every((key) => key === 'hslActiveChannel');
        if (changesOnlyPanelState) bumpRenderToken();
        else bumpToneRenderToken();
        notify();
      },
      setImageScale(scale, recordHistory = true) {
        if (recordHistory) pushHistory();
        state.image.transform = { scale: clamp(scale, 1, 3) };
        bumpToneRenderToken();
        notify();
      },
      resetEdits() {
        pushHistory();
        state.filters = preserveManualBlushRegion(state.filters, DEFAULT_FILTERS);
        state.activePresetId = 'original';
        state.layers = [];
        state.selectedLayerId = null;
        state.compareMode = false;
        state.compareLabels = true;
        state.comparePeekOriginal = false;
        state.image.transform = { scale: 1 };
        bumpToneRenderToken();
        notify();
      },
      addLayer(layer) {
        pushHistory();
        const id = `layer-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const next = {
          id,
          visible: true,
          opacity: 1,
          x: 0.5,
          y: 0.5,
          rotation: 0,
          ...layer,
        };
        state.layers.push(next);
        state.selectedLayerId = id;
        bumpRenderToken();
        notify();
      },
      updateLayer(id, partial, recordHistory = false) {
        const target = state.layers.find((layer) => layer.id === id);
        if (!target) return;
        if (recordHistory) pushHistory();
        if (target.type === 'text' && Object.prototype.hasOwnProperty.call(partial, 'content')) {
          partial = { ...partial, name: getTextLayerName(partial.content) };
        }
        Object.assign(target, partial);
        bumpRenderToken();
        notify();
      },
      removeLayer(id) {
        pushHistory();
        state.layers = state.layers.filter((layer) => layer.id !== id);
        if (state.selectedLayerId === id) state.selectedLayerId = state.layers.at(-1)?.id ?? null;
        bumpRenderToken();
        notify();
      },
      duplicateLayer(id) {
        const source = state.layers.find((layer) => layer.id === id);
        if (!source) return;
        pushHistory();
        const next = {
          ...source,
          id: `layer-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: `${source.name} 副本`,
          x: clamp((source.x ?? 0.5) + 0.03, 0, 1),
          y: clamp((source.y ?? 0.5) + 0.03, 0, 1),
        };
        state.layers.push(next);
        state.selectedLayerId = next.id;
        bumpRenderToken();
        notify();
      },
      moveLayer(id, delta) {
        const index = state.layers.findIndex((layer) => layer.id === id);
        if (index < 0) return;
        const targetIndex = clamp(index + delta, 0, state.layers.length - 1);
        if (targetIndex === index) return;
        pushHistory();
        const [layer] = state.layers.splice(index, 1);
        state.layers.splice(targetIndex, 0, layer);
        bumpRenderToken();
        notify();
      },
      selectLayer(id) {
        if (state.selectedLayerId === id) return;
        state.selectedLayerId = id;
        notify();
      },
    };
  }

  function drawImageContain(ctx, image, cw, ch, extraScale = 1) {
    const scale = Math.min(cw / image.naturalWidth, ch / image.naturalHeight) * extraScale;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = (cw - drawWidth) / 2;
    const dy = (ch - drawHeight) / 2;
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  }

  function drawImageCover(ctx, image, cw, ch, extraScale = 1) {
    const scale = Math.min(cw / image.naturalWidth, ch / image.naturalHeight) * extraScale;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = (cw - drawWidth) / 2;
    const dy = (ch - drawHeight) / 2;
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  }

  function drawImageFill(ctx, image, cw, ch, extraScale = 1) {
    const scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight) * extraScale;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = (cw - drawWidth) / 2;
    const dy = (ch - drawHeight) / 2;
    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  }

  function getFaceRegionWeight(x, y, faceBoxes) {
    if (!faceBoxes || !faceBoxes.length) return 0;
    let best = 0;
    for (const box of faceBoxes) {
      const expandX = box.width * 0.28;
      const expandY = box.height * 0.34;
      const minX = box.x - expandX;
      const maxX = box.x + box.width + expandX;
      const minY = box.y - expandY;
      const maxY = box.y + box.height + expandY;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const nx = Math.abs((x - cx) / Math.max(1, (box.width / 2 + expandX)));
      const ny = Math.abs((y - cy) / Math.max(1, (box.height / 2 + expandY)));
      const radial = Math.sqrt(nx * nx + ny * ny);
      const w = 1 - smoothstep(0.72, 1.25, radial);
      if (w > best) best = w;
    }
    return clamp(best, 0, 1);
  }

  function buildBlushRegions(faceBoxes, faceLandmarks, canvasWidth, canvasHeight) {
    if (!faceBoxes?.length) return [];
    const regions = [];

    const toAbsPoint = (pt) => {
      if (!pt) return null;
      const x = pt.x <= 1 && pt.x >= 0 ? pt.x * canvasWidth : pt.x;
      const y = pt.y <= 1 && pt.y >= 0 ? pt.y * canvasHeight : pt.y;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    };

    const getByIndex = (landmarks, idx) => toAbsPoint(Array.isArray(landmarks) ? landmarks[idx] : null);

    faceBoxes.forEach((box, faceIndex) => {
      const fallback = {
        leftX: box.x + box.width * 0.37,
        rightX: box.x + box.width * 0.63,
        cy: box.y + box.height * 0.44,
        rx: Math.max(8, box.width * 0.115),
        ry: Math.max(8, box.height * 0.09),
      };

      const landmarks = Array.isArray(faceLandmarks) ? faceLandmarks[faceIndex] : null;
      const nose = getByIndex(landmarks, 1);
      const leftEdge = getByIndex(landmarks, 234);
      const rightEdge = getByIndex(landmarks, 454);
      const leftEye = getByIndex(landmarks, 33);
      const rightEye = getByIndex(landmarks, 263);
      const mouth = getByIndex(landmarks, 13);
      const chin = getByIndex(landmarks, 152);

      if (nose && leftEdge && rightEdge && leftEye && rightEye && mouth) {
        const eyeMidY = (leftEye.y + rightEye.y) * 0.5;
        const baseLeftX = lerp(nose.x, leftEdge.x, 0.5);
        const baseRightX = lerp(nose.x, rightEdge.x, 0.5);
        let cy = lerp(eyeMidY, nose.y, 0.68);
        if (chin) {
          cy = Math.min(cy, chin.y - box.height * 0.16);
        }
        const rx = Math.max(8, Math.abs(nose.x - leftEdge.x) * 0.26);
        const ry = Math.max(8, Math.abs(mouth.y - eyeMidY) * 0.42);
        regions.push({
          leftX: clamp(baseLeftX, 0, canvasWidth),
          rightX: clamp(baseRightX, 0, canvasWidth),
          cy: clamp(cy, 0, canvasHeight),
          rx,
          ry,
        });
        return;
      }
      regions.push({
        leftX: clamp(fallback.leftX, 0, canvasWidth),
        rightX: clamp(fallback.rightX, 0, canvasWidth),
        cy: clamp(fallback.cy, 0, canvasHeight),
        rx: fallback.rx,
        ry: fallback.ry,
      });
    });

    return regions;
  }

  function getAutoBlushControls(faceBoxes, faceLandmarks, canvasWidth, canvasHeight) {
    const regions = buildBlushRegions(faceBoxes, faceLandmarks, canvasWidth, canvasHeight);
    const region = regions[0];
    if (!region) return null;
    return {
      regions,
      left: { x: region.leftX, y: region.cy, rx: region.rx, ry: region.ry, enabled: true },
      right: { x: region.rightX, y: region.cy, rx: region.rx, ry: region.ry, enabled: true },
    };
  }

  function getBlushControlsFromFilters(filters, canvasWidth, canvasHeight) {
    const controls = {
      left: {
        x: clamp(Number(filters.blushLeftX ?? DEFAULT_FILTERS.blushLeftX), 0, 1) * canvasWidth,
        y: clamp(Number(filters.blushLeftY ?? 0.45), 0, 1) * canvasHeight,
        rx: clamp(Number(filters.blushLeftRX ?? DEFAULT_FILTERS.blushLeftRX), 0.01, 0.25) * canvasWidth,
        ry: clamp(Number(filters.blushLeftRY ?? DEFAULT_FILTERS.blushLeftRY), 0.01, 0.2) * canvasHeight,
        enabled: Number(filters.blushLeftEnabled ?? 1) > 0.5,
      },
      right: {
        x: clamp(Number(filters.blushRightX ?? DEFAULT_FILTERS.blushRightX), 0, 1) * canvasWidth,
        y: clamp(Number(filters.blushRightY ?? 0.45), 0, 1) * canvasHeight,
        rx: clamp(Number(filters.blushRightRX ?? DEFAULT_FILTERS.blushRightRX), 0.01, 0.25) * canvasWidth,
        ry: clamp(Number(filters.blushRightRY ?? DEFAULT_FILTERS.blushRightRY), 0.01, 0.2) * canvasHeight,
        enabled: Number(filters.blushRightEnabled ?? 1) > 0.5,
      },
    };
    if (Number(filters.blushExtraEnabled ?? 0) > 0.5) {
      controls.extraLeft = {
        x: clamp(Number(filters.blushExtraLeftX ?? DEFAULT_FILTERS.blushExtraLeftX), 0, 1) * canvasWidth,
        y: clamp(Number(filters.blushExtraLeftY ?? DEFAULT_FILTERS.blushExtraLeftY), 0, 1) * canvasHeight,
        rx: clamp(Number(filters.blushExtraLeftRX ?? DEFAULT_FILTERS.blushExtraLeftRX), 0.01, 0.25) * canvasWidth,
        ry: clamp(Number(filters.blushExtraLeftRY ?? DEFAULT_FILTERS.blushExtraLeftRY), 0.01, 0.2) * canvasHeight,
        enabled: Number(filters.blushExtraLeftEnabled ?? 1) > 0.5,
      };
      controls.extraRight = {
        x: clamp(Number(filters.blushExtraRightX ?? DEFAULT_FILTERS.blushExtraRightX), 0, 1) * canvasWidth,
        y: clamp(Number(filters.blushExtraRightY ?? DEFAULT_FILTERS.blushExtraRightY), 0, 1) * canvasHeight,
        rx: clamp(Number(filters.blushExtraRightRX ?? DEFAULT_FILTERS.blushExtraRightRX), 0.01, 0.25) * canvasWidth,
        ry: clamp(Number(filters.blushExtraRightRY ?? DEFAULT_FILTERS.blushExtraRightRY), 0.01, 0.2) * canvasHeight,
        enabled: Number(filters.blushExtraRightEnabled ?? 1) > 0.5,
      };
    }
    return controls;
  }

  function getActiveBlushControls(filters, faceBoxes, faceLandmarks, canvasWidth, canvasHeight) {
    const manual = Number(filters.blushManual ?? 0) > 0.5;
    const auto = getAutoBlushControls(faceBoxes, faceLandmarks, canvasWidth, canvasHeight);
    if (!manual) return auto;
    return getBlushControlsFromFilters(filters, canvasWidth, canvasHeight);
  }

  function controlsToBlushRegions(controls) {
    if (!controls) return [];
    if (Array.isArray(controls.regions) && controls.regions.length) {
      return controls.regions
        .map((region) => ({
          leftX: Number(region.leftX),
          rightX: Number(region.rightX),
          cy: Number(region.cy),
          rx: Number(region.rx),
          ry: Number(region.ry),
        }))
        .filter((region) =>
          [region.leftX, region.rightX, region.cy, region.rx, region.ry].every(Number.isFinite) &&
          region.rx > 0 &&
          region.ry > 0
        );
    }
    const regions = [];
    if (controls.left?.enabled) regions.push({ leftX: controls.left.x, rightX: controls.left.x, cy: controls.left.y, rx: controls.left.rx, ry: controls.left.ry });
    if (controls.right?.enabled) regions.push({ leftX: controls.right.x, rightX: controls.right.x, cy: controls.right.y, rx: controls.right.rx, ry: controls.right.ry });
    if (controls.extraLeft?.enabled) regions.push({ leftX: controls.extraLeft.x, rightX: controls.extraLeft.x, cy: controls.extraLeft.y, rx: controls.extraLeft.rx, ry: controls.extraLeft.ry });
    if (controls.extraRight?.enabled) regions.push({ leftX: controls.extraRight.x, rightX: controls.extraRight.x, cy: controls.extraRight.y, rx: controls.extraRight.rx, ry: controls.extraRight.ry });
    return regions;
  }

  function getBlushRegionWeight(x, y, blushRegions) {
    if (!blushRegions || !blushRegions.length) return 0;
    let best = 0;
    for (const region of blushRegions) {
      const leftDx = (x - region.leftX) / region.rx;
      const rightDx = (x - region.rightX) / region.rx;
      const dy = (y - region.cy) / region.ry;
      const leftDist = Math.sqrt(leftDx * leftDx + dy * dy);
      const rightDist = Math.sqrt(rightDx * rightDx + dy * dy);
      const softBlushWeight = (dist) => {
        const gaussian = Math.exp(-dist * dist * 1.36);
        const tail = 1 - smoothstep(1.38, 1.96, dist);
        return gaussian * tail;
      };
      const leftW = softBlushWeight(leftDist);
      const rightW = softBlushWeight(rightDist);
      best = Math.max(best, leftW, rightW);
    }
    return clamp(best, 0, 1);
  }

  function applyVisibleBlushOverlay(targetCtx, filters, blushRegions, faceBoxes) {
    const blushStrength = clamp(filters.blushStrength ?? 0, 0, 1);
    if (blushStrength <= 0.001 || !blushRegions?.length) return;

    const canvasWidth = targetCtx.canvas.width;
    const imageData = targetCtx.getImageData(0, 0, canvasWidth, targetCtx.canvas.height);
    const data = imageData.data;
    const strengthCurve = Math.pow(blushStrength, 0.82);
    const masterDesat = Math.max(0, -Number(filters[hslKey('master', 's')] ?? 0)) / 100;
    const lowSaturationBoost = clamp((1 - clamp(Number(filters.saturation ?? 1), 0, 1)) * 0.42 + masterDesat * 0.26, 0, 0.62);
    const hasFaceBoxes = Array.isArray(faceBoxes) && faceBoxes.length > 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 1) continue;
      const idx = i / 4;
      const px = idx % canvasWidth;
      const py = Math.floor(idx / canvasWidth);
      const regionWeight = getBlushRegionWeight(px, py, blushRegions);
      if (regionWeight <= 0.001) continue;

      const faceWeight = hasFaceBoxes ? getFaceRegionWeight(px, py, faceBoxes) : 0.72;
      const placementGuard = hasFaceBoxes ? clamp(0.42 + faceWeight * 0.58, 0, 1) : 0.72;
      const blush = regionWeight * placementGuard * strengthCurve * (1 + lowSaturationBoost);
      if (blush <= 0.001) continue;

      const r = data[i];
      const g = data[i + 1];
      const bl = data[i + 2];
      const luma = clamp((r * 0.299 + g * 0.587 + bl * 0.114) / 255, 0, 1);
      const targetR = lerp(230, 255, luma);
      const targetG = lerp(112, 174, luma);
      const targetB = lerp(172, 226, luma);
      const tint = clamp(0.08 + blushStrength * 0.24 + lowSaturationBoost * 0.08, 0, 0.42) * blush;
      const lift = clamp(0.03 + blushStrength * 0.08 + lowSaturationBoost * 0.035, 0, 0.15) * blush;

      data[i] = clamp(lerp(r, targetR, tint) + (255 - r) * lift, 0, 255);
      data[i + 1] = clamp(lerp(g, targetG, tint * 0.82) + (244 - g) * lift * 0.44, 0, 255);
      data[i + 2] = clamp(lerp(bl, targetB, tint) + (255 - bl) * lift * 0.7, 0, 255);
    }

    targetCtx.putImageData(imageData, 0, 0);
  }

  function getSubjectRegionWeight(x, y, faceBoxes) {
    if (!faceBoxes || !faceBoxes.length) return 0;
    let best = 0;
    for (const box of faceBoxes) {
      // 以人脸为锚点，估计人物主体区域（包含手臂/肩颈），避免背景肤色物体被错误保真。
      const cx = box.x + box.width * 0.5;
      const cy = box.y + box.height * 1.08;
      const rx = Math.max(24, box.width * 0.98);
      const ry = Math.max(36, box.height * 2.05);
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const dist = Math.sqrt(nx * nx + ny * ny);
      const w = 1 - smoothstep(0.84, 1.26, dist);
      if (w > best) best = w;
    }
    return clamp(best, 0, 1);
  }

  function estimateFaceBoxHeuristic(image) {
    if (!image?.naturalWidth || !image?.naturalHeight) return [];
    try {
      const sampleW = 320;
      const ratio = image.naturalHeight / image.naturalWidth;
      const sampleH = Math.max(180, Math.round(sampleW * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, sampleW, sampleH);
      const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
      const mask = new Uint8Array(sampleW * sampleH);
      const xStart = Math.floor(sampleW * 0.08);
      const xEnd = Math.floor(sampleW * 0.92);
      const yStart = Math.floor(sampleH * 0.02);
      const yEnd = Math.floor(sampleH * 0.82);

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const i = (y * sampleW + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
          const isSkin = cb >= 77 && cb <= 129 && cr >= 132 && cr <= 184 && luma >= 46 && luma <= 244;
          if (isSkin) mask[y * sampleW + x] = 1;
        }
      }

      const visited = new Uint8Array(sampleW * sampleH);
      const queue = new Int32Array(sampleW * sampleH);
      const components = [];

      const dirs = [-1, 1, -sampleW, sampleW];
      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const start = y * sampleW + x;
          if (!mask[start] || visited[start]) continue;
          let qh = 0;
          let qt = 0;
          queue[qt++] = start;
          visited[start] = 1;
          let count = 0;
          let minX = sampleW;
          let minY = sampleH;
          let maxX = 0;
          let maxY = 0;
          let sumX = 0;
          let sumY = 0;
          let sumL = 0;
          let sumL2 = 0;

          while (qh < qt) {
            const idx = queue[qh++];
            const py = Math.floor(idx / sampleW);
            const px = idx - py * sampleW;
            count += 1;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
            sumX += px;
            sumY += py;
            const di = idx * 4;
            const luma = data[di] * 0.299 + data[di + 1] * 0.587 + data[di + 2] * 0.114;
            sumL += luma;
            sumL2 += luma * luma;

            for (let k = 0; k < 4; k += 1) {
              const ni = idx + dirs[k];
              if (ni < 0 || ni >= mask.length || visited[ni] || !mask[ni]) continue;
              const ny = Math.floor(ni / sampleW);
              const nx = ni - ny * sampleW;
              if (nx < xStart || nx >= xEnd || ny < yStart || ny >= yEnd) continue;
              // 横向跨行邻接过滤
              if ((dirs[k] === -1 || dirs[k] === 1) && ny !== py) continue;
              visited[ni] = 1;
              queue[qt++] = ni;
            }
          }

          if (count < 260) continue;
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          const areaRatio = (bw * bh) / (sampleW * sampleH);
          const fillRatio = count / Math.max(1, bw * bh);
          const aspect = bw / Math.max(1, bh);
          if (areaRatio < 0.015 || areaRatio > 0.42) continue;
          if (aspect < 0.45 || aspect > 1.7) continue;
          if (fillRatio < 0.23) continue;

          const cx = sumX / count;
          const cy = sumY / count;
          const centerDx = Math.abs(cx / sampleW - 0.5);
          const centerDy = Math.abs(cy / sampleH - 0.42);
          const centerScore = 1 - clamp((centerDx * 1.1 + centerDy * 1.4), 0, 1);
          const upperScore = 1 - smoothstep(0.5, 0.86, cy / sampleH);
          const sizeScore = 1 - smoothstep(0.06, 0.36, areaRatio);
          const meanL = sumL / count;
          const variance = Math.max(0, sumL2 / count - meanL * meanL);
          const detailScore = smoothstep(110, 980, variance);
          const score = centerScore * 1.45 + upperScore * 1.05 + sizeScore * 0.75 + detailScore * 1.25;

          components.push({ minX, minY, maxX, maxY, score });
        }
      }

      if (!components.length) return [];
      components.sort((a, b) => b.score - a.score);
      const top = components[0];
      const bw = top.maxX - top.minX + 1;
      const bh = top.maxY - top.minY + 1;
      const padX = bw * 0.18;
      const padY = bh * 0.22;
      const x = clamp(top.minX - padX, 0, sampleW - 1);
      const y = clamp(top.minY - padY, 0, sampleH - 1);
      const w = clamp(bw + padX * 2, 1, sampleW - x);
      const h = clamp(bh + padY * 2, 1, sampleH - y);

      const sx = image.naturalWidth / sampleW;
      const sy = image.naturalHeight / sampleH;
      return [{ x: x * sx, y: y * sy, width: w * sx, height: h * sy }];
    } catch {
      return [];
    }
  }

  async function detectFaceBoxesWithNative(image) {
    if (!image || typeof window.FaceDetector !== 'function') return [];
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
      const faces = await detector.detect(image);
      return faces
        .map((face) => {
          const box = face?.boundingBox;
          if (!box || box.width < 16 || box.height < 16) return null;
          return {
            x: clamp(box.x, 0, image.naturalWidth),
            y: clamp(box.y, 0, image.naturalHeight),
            width: clamp(box.width, 1, image.naturalWidth),
            height: clamp(box.height, 1, image.naturalHeight),
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function normalizeMaskToCanvas(mask, width, height) {
    if (!mask) return null;
    if (mask instanceof HTMLCanvasElement) return mask;
    const canvas = document.createElement('canvas');

    if (mask instanceof ImageData) {
      canvas.width = mask.width;
      canvas.height = mask.height;
      canvas.getContext('2d').putImageData(mask, 0, 0);
      return canvas;
    }

    if (mask && typeof mask === 'object' && mask.data && mask.width && mask.height) {
      canvas.width = mask.width;
      canvas.height = mask.height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(mask.width, mask.height);
      const src = mask.data;
      if (src.length === mask.width * mask.height) {
        for (let i = 0; i < src.length; i += 1) {
          const p = i * 4;
          imgData.data[p] = 255;
          imgData.data[p + 1] = 255;
          imgData.data[p + 2] = 255;
          imgData.data[p + 3] = clamp(src[i], 0, 255);
        }
      } else if (src.length === mask.width * mask.height * 4) {
        imgData.data.set(src);
      } else {
        return null;
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }

    if (mask instanceof HTMLImageElement || mask instanceof ImageBitmap || mask instanceof HTMLVideoElement) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(mask, 0, 0, width, height);
      return canvas;
    }

    return null;
  }

  function normalizeFaceBoxes(boxes, image) {
    if (!Array.isArray(boxes)) return [];
    return boxes
      .map((box) => {
        if (!box) return null;
        const width = Number(box.width ?? box.w ?? 0);
        const height = Number(box.height ?? box.h ?? 0);
        const x = Number(box.x ?? box.left ?? 0);
        const y = Number(box.y ?? box.top ?? 0);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) return null;
        if (width < 12 || height < 12) return null;
        return {
          x: clamp(x, 0, image.naturalWidth),
          y: clamp(y, 0, image.naturalHeight),
          width: clamp(width, 1, image.naturalWidth),
          height: clamp(height, 1, image.naturalHeight),
        };
      })
      .filter(Boolean);
  }

  function getPrimaryFaceIndex(boxes, image) {
    if (!Array.isArray(boxes) || !boxes.length) return -1;
    const iw = Math.max(1, image?.naturalWidth || 1);
    const ih = Math.max(1, image?.naturalHeight || 1);
    const scored = boxes.map((box, idx) => {
      const cx = (box.x + box.width / 2) / iw;
      const cy = (box.y + box.height / 2) / ih;
      const area = (box.width * box.height) / (iw * ih);
      const centerScore = 1 - clamp(Math.abs(cx - 0.5) * 0.95 + Math.abs(cy - 0.42) * 1.25, 0, 1);
      const areaScore = 1 - smoothstep(0.01, 0.28, area);
      return { idx, score: centerScore * 1.5 + areaScore * 0.9 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.idx ?? -1;
  }

  function sortFacesByPriority(faceBoxes, faceLandmarks, image) {
    if (!Array.isArray(faceBoxes) || faceBoxes.length <= 1) {
      return {
        faceBoxes: faceBoxes || [],
        faceLandmarks: faceLandmarks || [],
      };
    }
    const primaryIndex = getPrimaryFaceIndex(faceBoxes, image);
    if (primaryIndex < 0) {
      return {
        faceBoxes,
        faceLandmarks: faceLandmarks || [],
      };
    }
    const order = faceBoxes
      .map((_, index) => index)
      .sort((a, b) => {
        if (a === primaryIndex) return -1;
        if (b === primaryIndex) return 1;
        const areaA = faceBoxes[a].width * faceBoxes[a].height;
        const areaB = faceBoxes[b].width * faceBoxes[b].height;
        return areaB - areaA;
      });
    return {
      faceBoxes: order.map((index) => faceBoxes[index]),
      faceLandmarks: order.map((index) => faceLandmarks?.[index]).filter(Boolean),
    };
  }

  function normalizeFaceLandmarks(landmarks, image) {
    if (!Array.isArray(landmarks)) return [];
    return landmarks
      .map((face) => {
        if (!Array.isArray(face)) return null;
        const points = face
          .map((pt) => {
            if (!pt) return null;
            const rawX = Number(pt.x);
            const rawY = Number(pt.y);
            if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
            const x = rawX <= 1 && rawX >= 0 ? rawX * image.naturalWidth : rawX;
            const y = rawY <= 1 && rawY >= 0 ? rawY * image.naturalHeight : rawY;
            return { x: clamp(x, 0, image.naturalWidth), y: clamp(y, 0, image.naturalHeight) };
          })
          .filter(Boolean);
        return points.length ? points : null;
      })
      .filter(Boolean);
  }

  async function analyzePortraitWithSkill(image) {
    if (!window.jiraiVisionSkill && !window.__JIRAI_VISION_SKILL__) {
      await loadVisionSkill();
    }
    const skill = window.jiraiVisionSkill || window.__JIRAI_VISION_SKILL__;
    if (!skill) return null;
    try {
      if (typeof skill.analyzeImage === 'function') {
        const result = await skill.analyzeImage(image);
        return result || null;
      }
      if (typeof skill.detectPortrait === 'function') {
        const result = await skill.detectPortrait(image);
        return result || null;
      }
    } catch {}
    return null;
  }

  function loadVisionSkill() {
    if (window.jiraiVisionSkill || window.__JIRAI_VISION_SKILL__) return Promise.resolve();
    if (visionSkillLoadPromise) return visionSkillLoadPromise;
    visionSkillLoadPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'src/vision-skill.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
    return visionSkillLoadPromise;
  }

  async function detectPortraitData(image) {
    const nativeBoxes = await detectFaceBoxesWithNative(image);
    const skillResult = await analyzePortraitWithSkill(image);
    const skillBoxesRaw = Array.isArray(skillResult?.faceBoxes) && skillResult.faceBoxes.length ? skillResult.faceBoxes : null;
    const skillLandmarksRaw = Array.isArray(skillResult?.faceLandmarks) && skillResult.faceLandmarks.length ? skillResult.faceLandmarks : null;
    let faceBoxes = normalizeFaceBoxes(skillBoxesRaw || nativeBoxes, image);
    const faceLandmarks = normalizeFaceLandmarks(skillLandmarksRaw || [], image);
    if (!faceBoxes.length && faceLandmarks.length) {
      faceBoxes = faceLandmarks
        .map((points) => {
          if (!points.length) return null;
          let minX = image.naturalWidth;
          let minY = image.naturalHeight;
          let maxX = 0;
          let maxY = 0;
          points.forEach((pt) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
          });
          if (maxX - minX < 12 || maxY - minY < 12) return null;
          const padX = (maxX - minX) * 0.12;
          const padY = (maxY - minY) * 0.16;
          return {
            x: clamp(minX - padX, 0, image.naturalWidth),
            y: clamp(minY - padY, 0, image.naturalHeight),
            width: clamp(maxX - minX + padX * 2, 1, image.naturalWidth),
            height: clamp(maxY - minY + padY * 2, 1, image.naturalHeight),
          };
        })
        .filter(Boolean);
    }
    const autoBlushDetected = faceBoxes.length > 0;
    if (!faceBoxes.length) {
      faceBoxes = estimateFaceBoxHeuristic(image);
    }
    const sortedFaces = sortFacesByPriority(faceBoxes, faceLandmarks, image);
    faceBoxes = sortedFaces.faceBoxes;
    faceLandmarks.splice(0, faceLandmarks.length, ...sortedFaces.faceLandmarks);
    const personMaskCanvas = null;
    return { faceBoxes, faceLandmarks, personMaskCanvas, autoBlushDetected };
  }

  function applyTonePipeline(targetCtx, baseCanvas, filters, vision = {}) {
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    const b = clamp(filters.brightness, 0.4, 1.6);
    const c = clamp(filters.contrast, 0.4, 1.8);
    const s = clamp(filters.saturation, 0, 1.8);
    const skinWhiten = clamp(filters.skinWhiten ?? 0, 0, 1);
    const blushStrength = clamp(filters.blushStrength ?? 0, 0, 1);
    const faceBoxes = vision.faceBoxes || [];
    const personMaskCanvas = null;
    const baseCtx = baseCanvas.getContext('2d');
    const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data;
    const maskData = personMaskCanvas
      ? (() => {
          try {
            const maskCtx = personMaskCanvas.getContext('2d');
            return maskCtx.getImageData(0, 0, personMaskCanvas.width, personMaskCanvas.height).data;
          } catch {
            return null;
          }
        })()
      : null;
    const maskW = personMaskCanvas?.width || 0;
    const maskH = personMaskCanvas?.height || 0;
    const hasFaceBoxes = Array.isArray(faceBoxes) && faceBoxes.length > 0;
    const blushControls = getActiveBlushControls(
      filters,
      faceBoxes,
      vision.faceLandmarks || [],
      targetCtx.canvas.width,
      targetCtx.canvas.height
    );
    const blushRegions = controlsToBlushRegions(blushControls);
    targetCtx.drawImage(baseCanvas, 0, 0);
    const imageData = targetCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    const data = imageData.data;
    const canvasWidth = targetCtx.canvas.width;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 1) continue;
      const or = baseData[i];
      const og = baseData[i + 1];
      const ob = baseData[i + 2];
      const oLuma = or * 0.299 + og * 0.587 + ob * 0.114;
      const oCb = 128 - 0.168736 * or - 0.331264 * og + 0.5 * ob;
      const oCr = 128 + 0.5 * or - 0.418688 * og - 0.081312 * ob;
      const [oHue, oSat, oLight] = rgbToHsl(or, og, ob);
      let r = data[i] * b;
      let g = data[i + 1] * b;
      let bl = data[i + 2] * b;
      r = (r - 128) * c + 128;
      g = (g - 128) * c + 128;
      bl = (bl - 128) * c + 128;
      const luma = r * 0.299 + g * 0.587 + bl * 0.114;
      r = luma + (r - luma) * s;
      g = luma + (g - luma) * s;
      bl = luma + (bl - luma) * s;
      const idx = i / 4;
      const px = idx % canvasWidth;
      const py = Math.floor(idx / canvasWidth);
      let personWeight = 1;
      if (maskData && maskW > 0 && maskH > 0) {
        // 双线性采样，避免低分辨率人像 mask 在图上产生块状伪影。
        const fx = (px / Math.max(1, canvasWidth - 1)) * (maskW - 1);
        const fy = (py / Math.max(1, targetCtx.canvas.height - 1)) * (maskH - 1);
        const x0 = clamp(Math.floor(fx), 0, maskW - 1);
        const x1 = clamp(x0 + 1, 0, maskW - 1);
        const y0 = clamp(Math.floor(fy), 0, maskH - 1);
        const y1 = clamp(y0 + 1, 0, maskH - 1);
        const tx = fx - x0;
        const ty = fy - y0;
        const a00 = (maskData[(y0 * maskW + x0) * 4 + 3] || 0) / 255;
        const a10 = (maskData[(y0 * maskW + x1) * 4 + 3] || 0) / 255;
        const a01 = (maskData[(y1 * maskW + x0) * 4 + 3] || 0) / 255;
        const a11 = (maskData[(y1 * maskW + x1) * 4 + 3] || 0) / 255;
        const top = lerp(a00, a10, tx);
        const bottom = lerp(a01, a11, tx);
        personWeight = clamp(lerp(top, bottom, ty), 0, 1);
      }
      const personWeightSoft = smoothstep(0.3, 0.86, personWeight);
      const subjectWeight = getSubjectRegionWeight(px, py, faceBoxes);
      const faceWeight = hasFaceBoxes
        ? getFaceRegionWeight(px, py, faceBoxes) * (0.3 + 0.7 * personWeightSoft)
        : 0;
      // 连续肤色评分：基于原图像素，避免在调色后使用硬阈值导致块状伪影。
      const cbScore = smoothstep(74, 86, oCb) * (1 - smoothstep(130, 144, oCb));
      const crScore = smoothstep(128, 140, oCr) * (1 - smoothstep(182, 196, oCr));
      const satScore = smoothstep(0.04, 0.14, oSat) * (1 - smoothstep(0.66, 0.9, oSat));
      const lumaScore = smoothstep(52, 88, oLuma) * (1 - smoothstep(236, 250, oLuma));
      const hueDistA = hueDistance(oHue, 16);
      const hueDistB = hueDistance(oHue, 28);
      const hueScore = Math.max(1 - smoothstep(26, 58, hueDistA), 1 - smoothstep(24, 56, hueDistB));
      const skinProb = clamp(cbScore * crScore * satScore * lumaScore * (0.48 + 0.52 * hueScore), 0, 1);
      const skinMask = skinProb * faceWeight;
      const skinAreaMask = clamp(skinProb * Math.max(faceWeight, subjectWeight * 0.36), 0, 1);
      [r, g, bl] = applySelectiveHsl(r, g, bl, filters, skinMask, hasFaceBoxes);

      const [nhAfterProtect, nsAfterProtect, nlAfterProtect] = rgbToHsl(r, g, bl);
      const greenSpeckHue = Math.max(
        1 - smoothstep(26, 70, hueDistance(nhAfterProtect, 120)),
        1 - smoothstep(24, 62, hueDistance(nhAfterProtect, 172))
      );
      const originalSkinOrLip = clamp(
        skinAreaMask + smoothstep(0.04, 0.24, oSat) * Math.max(
          1 - smoothstep(34, 74, hueDistance(oHue, 12)),
          1 - smoothstep(36, 78, hueDistance(oHue, 346))
        ) * 0.72,
        0,
        1
      );
      const lowChromaSpeck = 1 - smoothstep(0.16, 0.34, nsAfterProtect);
      const greenSpeckFix = clamp(greenSpeckHue * originalSkinOrLip * lowChromaSpeck * 0.5, 0, 1);
      if (greenSpeckFix > 0.001) {
        const targetH = oSat > 0.08 ? oHue : 8;
        const targetS = Math.max(nsAfterProtect * 0.82, Math.min(0.34, oSat * 0.82 + 0.04));
        const targetL = nlAfterProtect * 0.78 + oLight * 0.22;
        const [sr2, sg2, sb2] = hslToRgb(targetH, clamp(targetS, 0, 1), clamp(targetL, 0, 1));
        r = lerp(r, sr2, greenSpeckFix);
        g = lerp(g, sg2, greenSpeckFix);
        bl = lerp(bl, sb2, greenSpeckFix);
      }

      if (skinWhiten > 0 || blushStrength > 0) {
        if (skinMask > 0.01) {
          const faceContextWhitenScale = hasFaceBoxes ? 1 : 0.45;
          const w = skinWhiten * faceWeight * faceContextWhitenScale;
          r = lerp(r, 255, 0.2 * w);
          g = lerp(g, 248, 0.18 * w);
          bl = lerp(bl, 255, 0.22 * w);
          const blush = blushStrength * faceWeight * getBlushRegionWeight(px, py, blushRegions);
          r += 22 * blush;
          g -= 5 * blush;
          bl += 12 * blush;
          g = lerp(g, (r + bl) * 0.5, 0.06 * w);
        }
      }
      data[i] = clamp(r, 0, 255);
      data[i + 1] = clamp(g, 0, 255);
      data[i + 2] = clamp(bl, 0, 255);
    }
    targetCtx.putImageData(imageData, 0, 0);

    const fillOnOpaque = (fillStyle) => {
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'source-atop';
      targetCtx.fillStyle = fillStyle;
      targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
      targetCtx.restore();
    };

    const temperature = clamp(filters.temperature, -100, 100) / 100;
    if (temperature !== 0) {
      const alpha = Math.abs(temperature) * 0.16;
      fillOnOpaque(temperature < 0 ? `rgba(154,184,255,${alpha})` : `rgba(255,204,148,${alpha})`);
    }

    const tint = clamp(filters.tint, -100, 100) / 100;
    if (tint !== 0) {
      const alpha = Math.abs(tint) * 0.14;
      fillOnOpaque(tint > 0 ? `rgba(242,180,236,${alpha})` : `rgba(188,234,255,${alpha})`);
    }

    const fade = clamp(filters.fade, 0, 1);
    if (fade > 0) {
      fillOnOpaque(`rgba(245,239,246,${fade})`);
    }

    const overlayStrength = clamp(filters.overlayStrength, 0, 1);
    if (overlayStrength > 0 && filters.overlayColor) {
      // 叠色改为亮度分区：暗部弱叠，中高亮更明显，减少黑发黑衣被整体染色。
      const overlayData = targetCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
      const px = overlayData.data;
      const clean = filters.overlayColor.replace('#', '');
      const or = Number.parseInt(clean.slice(0, 2), 16) || 239;
      const og = Number.parseInt(clean.slice(2, 4), 16) || 212;
      const ob = Number.parseInt(clean.slice(4, 6), 16) || 230;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 1) continue;
        const r = px[i];
        const g = px[i + 1];
        const b2 = px[i + 2];
        const luma = r * 0.299 + g * 0.587 + b2 * 0.114;
        const darkGuard = smoothstep(24, 96, luma);
        const midBoost = smoothstep(84, 196, luma);
        const alpha = clamp(overlayStrength * (0.22 * darkGuard + 0.92 * midBoost), 0, 0.9);
        if (alpha <= 0.0001) continue;
        // 近似 soft-light 风格：先正常混色，再轻微提亮高光，保留原明度结构。
        const nr = lerp(r, or, alpha);
        const ng = lerp(g, og, alpha);
        const nb = lerp(b2, ob, alpha);
        const lift = alpha * smoothstep(128, 255, luma) * 0.16;
        px[i] = clamp(nr + (255 - nr) * lift, 0, 255);
        px[i + 1] = clamp(ng + (255 - ng) * lift, 0, 255);
        px[i + 2] = clamp(nb + (255 - nb) * lift, 0, 255);
      }
      targetCtx.putImageData(overlayData, 0, 0);
    }

    const blackProtect = clamp(filters.blackProtect ?? 0, 0, 1);
    if (blackProtect > 0) {
      const darkData = targetCtx.getImageData(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
      const pixels = darkData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 1 || baseData[i + 3] < 1) continue;
        const r = pixels[i];
        const g = pixels[i + 1];
        const bl = pixels[i + 2];
        const br = baseData[i];
        const bg = baseData[i + 1];
        const bb = baseData[i + 2];
        const baseLuma = br * 0.299 + bg * 0.587 + bb * 0.114;
        const maxC = Math.max(br, bg, bb);
        const minC = Math.min(br, bg, bb);
        const sat = maxC - minC;
        const shadow = 1 - smoothstep(44, 152, baseLuma);
        const chromaProtect = 1 - sat / 255;
        const protect = shadow * (0.52 + 0.48 * chromaProtect) * blackProtect;
        if (protect <= 0.001) continue;
        pixels[i] = clamp(lerp(r, br, protect * 0.82), 0, 255);
        pixels[i + 1] = clamp(lerp(g, bg, protect * 0.82), 0, 255);
        pixels[i + 2] = clamp(lerp(bl, bb, protect * 0.82), 0, 255);
      }
      targetCtx.putImageData(darkData, 0, 0);

      // 暗部去块：仅在低亮度、低饱和区域轻度平滑，减少黑衣/黑发的压缩色块感。
      const shadowSmooth = blackProtect * 0.34;
      if (shadowSmooth > 0.01) {
        const w = targetCtx.canvas.width;
        const h = targetCtx.canvas.height;

        const down = document.createElement('canvas');
        down.width = Math.max(2, Math.round(w * 0.56));
        down.height = Math.max(2, Math.round(h * 0.56));
        const dctx = down.getContext('2d');
        dctx.imageSmoothingEnabled = true;
        dctx.imageSmoothingQuality = 'high';
        dctx.drawImage(targetCtx.canvas, 0, 0, w, h, 0, 0, down.width, down.height);

        const softCanvas = document.createElement('canvas');
        softCanvas.width = w;
        softCanvas.height = h;
        const sctx = softCanvas.getContext('2d');
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(down, 0, 0, down.width, down.height, 0, 0, w, h);

        const currentData = targetCtx.getImageData(0, 0, w, h);
        const currentPx = currentData.data;
        const smoothPx = sctx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < currentPx.length; i += 4) {
          if (currentPx[i + 3] < 1 || baseData[i + 3] < 1) continue;
          const br = baseData[i];
          const bg = baseData[i + 1];
          const bb = baseData[i + 2];
          const baseLuma = br * 0.299 + bg * 0.587 + bb * 0.114;
          const maxC = Math.max(br, bg, bb);
          const minC = Math.min(br, bg, bb);
          const sat = maxC - minC;
          const shadow = 1 - smoothstep(62, 146, baseLuma);
          const neutral = 1 - clamp(sat / 124, 0, 1);
          const t = shadow * neutral * shadowSmooth;
          if (t <= 0.001) continue;
          currentPx[i] = clamp(lerp(currentPx[i], smoothPx[i], t), 0, 255);
          currentPx[i + 1] = clamp(lerp(currentPx[i + 1], smoothPx[i + 1], t), 0, 255);
          currentPx[i + 2] = clamp(lerp(currentPx[i + 2], smoothPx[i + 2], t), 0, 255);
          // 轻微抖动降低暗部色带/色块可见度（稳定伪随机，避免闪烁）。
          const idx = i / 4;
          const hash = (idx * 1103515245 + 12345) & 255;
          const noise = ((hash / 255) * 2 - 1) * (0.9 * t);
          currentPx[i] = clamp(currentPx[i] + noise, 0, 255);
          currentPx[i + 1] = clamp(currentPx[i + 1] + noise * 0.92, 0, 255);
          currentPx[i + 2] = clamp(currentPx[i + 2] + noise * 0.88, 0, 255);
        }
        targetCtx.putImageData(currentData, 0, 0);
      }
    }

    applyVisibleBlushOverlay(targetCtx, filters, blushRegions, faceBoxes);
  }

  function drawBlushPreview(ctx, state) {
    if (!blushPreviewEnabled) return;
    if (!state.image.loaded) return;
    const blushControls = getActiveBlushControls(
      state.filters,
      state.image.faceBoxes || [],
      state.image.faceLandmarks || [],
      state.canvas.width,
      state.canvas.height
    );
    const blushRegions = controlsToBlushRegions(blushControls);
    if (!blushRegions.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    blushRegions.forEach((region) => {
      const paint = (cx) => {
        const grad = ctx.createRadialGradient(cx, region.cy, region.rx * 0.04, cx, region.cy, region.rx * 1.72);
        grad.addColorStop(0, 'rgba(255, 130, 190, 0.24)');
        grad.addColorStop(0.34, 'rgba(250, 150, 205, 0.14)');
        grad.addColorStop(0.68, 'rgba(250, 160, 214, 0.045)');
        grad.addColorStop(1, 'rgba(250, 170, 220, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, region.cy, region.rx * 1.62, region.ry * 1.62, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      paint(region.leftX);
      paint(region.rightX);
    });
    ctx.restore();
  }

  function getLayerMetrics(layer, canvas) {
    const w = clamp(layer.width ?? 0.24, 0.04, 0.95) * canvas.width;
    const h = clamp(layer.height ?? 0.24, 0.04, 0.95) * canvas.height;
    const cx = clamp(layer.x ?? 0.5, 0, 1) * canvas.width;
    const cy = clamp(layer.y ?? 0.5, 0, 1) * canvas.height;
    return { cx, cy, w, h, x: cx - w / 2, y: cy - h / 2 };
  }

  function getStickerMetrics(layer, cw, ch) {
    const widthNorm = clamp(layer.width ?? 0.18, 0.03, 0.95);
    let ratio = layer.aspectRatio;
    if (!ratio && layer.src) {
      const img = STICKER_IMAGE_CACHE.get(layer.src);
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        ratio = img.naturalHeight / img.naturalWidth;
      }
    }
    if (!ratio || !Number.isFinite(ratio) || ratio <= 0) {
      const heightNorm = clamp(layer.height ?? 0.18, 0.03, 0.95);
      return {
        widthNorm,
        heightNorm,
        w: widthNorm * cw,
        h: heightNorm * ch,
      };
    }
    const heightNorm = clamp((widthNorm * cw * ratio) / ch, 0.03, 0.95);
    return {
      widthNorm,
      heightNorm,
      w: widthNorm * cw,
      h: heightNorm * ch,
    };
  }

  function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width / 2, height / 2)));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function getTextLayout(ctx, layer) {
    const fontSize = layer.fontSize ?? 56;
    const rawLines = String(layer.content ?? '').split(/\r?\n/);
    const lines = rawLines.length ? rawLines : [''];
    const lineHeight = fontSize * 1.22;
    const widths = lines.map((line) => ctx.measureText(line || ' ').width);
    const textWidth = Math.max(1, ...widths);
    const textHeight = lineHeight * Math.max(1, lines.length);
    return { lines, fontSize, lineHeight, textWidth, textHeight };
  }

  function getTextBoxMetrics(layout, layer, scale = 1) {
    const strokePad = Math.max(0, (layer.strokeWidth ?? 0) * scale);
    const shadowPad = (layer.shadowBlur ?? 0) > 0 ? Math.max(0, (layer.shadowBlur ?? 0) * scale) : 0;
    const bgPad = (layer.bgOpacity ?? 0) > 0 ? Math.max(0, (layer.bgPadding ?? 18) * scale) : 0;
    const visualPadX = Math.max(strokePad, shadowPad, bgPad);
    const visualPadY = Math.max(strokePad, shadowPad, bgPad * 0.7);
    return {
      w: layout.textWidth + visualPadX * 2,
      h: layout.textHeight + visualPadY * 2,
      padX: visualPadX,
      padY: visualPadY,
    };
  }

  function makeTextStrokeShadow(layer, scale = 1) {
    const strokeWidth = Math.max(0, (layer.strokeWidth ?? 0) * scale);
    const strokeColor = layer.strokeColor ?? '#2f2532';
    const shadowBlur = Math.max(0, (layer.shadowBlur ?? 0) * scale);
    const shadowColor = layer.shadowColor ?? '#2f2532';
    const shadows = [];
    if (strokeWidth > 0.1) {
      const r = Math.max(1, Math.min(3, strokeWidth * 0.72));
      const d = Number((r * 0.72).toFixed(2));
      const o = Number(r.toFixed(2));
      shadows.push(
        `${o}px 0 0 ${strokeColor}`,
        `${-o}px 0 0 ${strokeColor}`,
        `0 ${o}px 0 ${strokeColor}`,
        `0 ${-o}px 0 ${strokeColor}`,
        `${d}px ${d}px 0 ${strokeColor}`,
        `${-d}px ${d}px 0 ${strokeColor}`,
        `${d}px ${-d}px 0 ${strokeColor}`,
        `${-d}px ${-d}px 0 ${strokeColor}`,
      );
    }
    if (shadowBlur > 0.1) {
      shadows.push(`0 0 ${Math.max(1, shadowBlur)}px ${shadowColor}`);
    }
    return shadows.length ? shadows.join(', ') : 'none';
  }

  const textMeasureCanvas = document.createElement('canvas');
  const textMeasureCtx = textMeasureCanvas.getContext('2d');
  const HEART_PATH_POINTS = [
    ['M', 0, -0.24],
    ['C', -0.06, -0.54, -0.42, -0.64, -0.68, -0.45],
    ['C', -1.02, -0.18, -0.98, 0.33, -0.28, 0.78],
    ['C', -0.14, 0.88, -0.04, 0.95, 0, 1],
    ['C', 0.04, 0.95, 0.14, 0.88, 0.28, 0.78],
    ['C', 0.98, 0.33, 1.02, -0.18, 0.68, -0.45],
    ['C', 0.42, -0.64, 0.06, -0.54, 0, -0.24],
  ];

  function heartPathToSvgD(scale = 100) {
    return HEART_PATH_POINTS.map((segment) => {
      const [command, ...values] = segment;
      return `${command}${values.map((value) => Number((value * scale).toFixed(3))).join(' ')}`;
    }).join(' ');
  }

  function drawShapePath(ctx, shape, width, height) {
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }

    if (shape === 'heart') {
      const sx = width / 2;
      const sy = height / 2;
      ctx.beginPath();
      HEART_PATH_POINTS.forEach((segment) => {
        const [command, ...values] = segment;
        if (command === 'M') {
          ctx.moveTo(values[0] * sx, values[1] * sy);
          return;
        }
        ctx.bezierCurveTo(
          values[0] * sx,
          values[1] * sy,
          values[2] * sx,
          values[3] * sy,
          values[4] * sx,
          values[5] * sy
        );
      });
      ctx.closePath();
      return;
    }

    drawRoundedRectPath(ctx, -width / 2, -height / 2, width, height, Math.min(width, height) * 0.2);
  }

  function createLayerMask(canvas, layer) {
    const metrics = getLayerMetrics(layer, canvas);
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    const featherStrength = clamp(layer.feather ?? 0.12, 0, 0.8);
    const featherRange = clamp(layer.featherRange ?? 1, 0, 3);
    const steps = Math.max(0, Math.round(featherStrength * 18 + featherRange * 4));
    const maxScale = 1 + featherRange * 0.55;

    maskCtx.save();
    maskCtx.translate(metrics.cx, metrics.cy);
    maskCtx.rotate(((layer.rotation ?? 0) * Math.PI) / 180);
    if (steps > 0) {
      for (let i = steps; i >= 1; i -= 1) {
        const t = i / steps;
        const scale = 1 + (maxScale - 1) * t;
        const alpha = Math.max(0.008, (1 - t) * featherStrength * 0.55);
        maskCtx.save();
        maskCtx.scale(scale, scale);
        maskCtx.fillStyle = `rgba(255,255,255,${alpha})`;
        drawShapePath(maskCtx, layer.shape ?? 'rect', metrics.w, metrics.h);
        maskCtx.fill();
        maskCtx.restore();
      }
    }
    maskCtx.fillStyle = '#fff';
    drawShapePath(maskCtx, layer.shape ?? 'rect', metrics.w, metrics.h);
    maskCtx.fill();
    maskCtx.restore();
    return maskCanvas;
  }

  function withLayerMask(ctx, layer, paint) {
    const metrics = getLayerMetrics(layer, ctx.canvas);
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = ctx.canvas.width;
    layerCanvas.height = ctx.canvas.height;
    const layerCtx = layerCanvas.getContext('2d');
    paint(layerCtx, metrics);
    const maskCanvas = createLayerMask(ctx.canvas, layer);
    layerCtx.globalCompositeOperation = 'destination-in';
    layerCtx.drawImage(maskCanvas, 0, 0);
    ctx.drawImage(layerCanvas, 0, 0);
  }

  function applyFrostedBlurMosaic(ctx, sourceCanvas, layer) {
    const blurAmount = clamp(layer.intensity ?? 14, 2, 36);
    withLayerMask(ctx, layer, (targetCtx) => {
      targetCtx.filter = `blur(${blurAmount}px) saturate(0.78)`;
      targetCtx.drawImage(sourceCanvas, 0, 0);
      targetCtx.filter = 'none';
      targetCtx.fillStyle = `rgba(255,255,255,${clamp(layer.whiteOpacity ?? 0.34, 0, 1)})`;
      targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    });
  }

  function applyGridGlassMosaic(ctx, sourceCanvas, layer) {
    const cell = clamp(layer.cellSize ?? 8, 4, 24);
    const gridStrength = clamp(layer.gridAlpha ?? 0.3, 0, 1);
    const lineAlpha = layer.shape === 'heart' ? 0 : lerp(0.08, 0.9, gridStrength);
    const textureAlpha = layer.shape === 'heart' ? 0 : lerp(0.03, 0.34, gridStrength);

    withLayerMask(ctx, layer, (targetCtx) => {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = Math.max(2, Math.floor(targetCtx.canvas.width / cell));
      sampleCanvas.height = Math.max(2, Math.floor(targetCtx.canvas.height / cell));
      const sampleCtx = sampleCanvas.getContext('2d');

      sampleCtx.drawImage(sourceCanvas, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height, 0, 0, sampleCanvas.width, sampleCanvas.height);

      targetCtx.imageSmoothingEnabled = false;
      targetCtx.drawImage(sampleCanvas, 0, 0, sampleCanvas.width, sampleCanvas.height, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
      targetCtx.imageSmoothingEnabled = true;

      if (textureAlpha > 0) {
        targetCtx.save();
        targetCtx.globalCompositeOperation = 'multiply';
        targetCtx.fillStyle = `rgba(92,86,108,${textureAlpha})`;
        targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
        targetCtx.restore();
      }

      targetCtx.fillStyle = `rgba(255,255,255,${clamp(layer.whiteOpacity ?? 0.34, 0, 1)})`;
      targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);

      if (lineAlpha > 0) {
        targetCtx.strokeStyle = `rgba(228,228,238,${lineAlpha})`;
        targetCtx.lineWidth = 1;
        for (let x = 0; x <= targetCtx.canvas.width; x += cell) {
          targetCtx.beginPath();
          targetCtx.moveTo(x, 0);
          targetCtx.lineTo(x, targetCtx.canvas.height);
          targetCtx.stroke();
        }
        for (let y = 0; y <= targetCtx.canvas.height; y += cell) {
          targetCtx.beginPath();
          targetCtx.moveTo(0, y);
          targetCtx.lineTo(targetCtx.canvas.width, y);
          targetCtx.stroke();
        }
      }
    });
  }

  function getPreviewScaleForState(state) {
    if (!state.image.loaded || !state.canvas.width || !state.canvas.height) return 1;
    const mobilePreview = isMobileLayoutViewport();
    const lightweight = isDirectManipulating || isTextEditing;
    const pressureScale = lightweight ? clamp(1 - interactiveRenderPressure * 0.08, 0.78, 1) : 1;
    const maxSide = (lightweight ? (mobilePreview ? 720 : 980) : (mobilePreview ? 1100 : 1700)) * pressureScale;
    const maxPixels = (lightweight ? (mobilePreview ? 420000 : 760000) : (mobilePreview ? 1100000 : 2200000)) * pressureScale;
    const bySide = maxSide / Math.max(state.canvas.width, state.canvas.height);
    const byArea = Math.sqrt(maxPixels / Math.max(1, state.canvas.width * state.canvas.height));
    return clamp(Math.min(1, bySide, byArea), 0.12, 1);
  }

  function applyCanvasCssInteractionPreview(state) {
    if (!els?.canvas) return;
    if (!isSliderDragging || !sliderDragStartFilters || !state.image.loaded) {
      els.canvas.style.filter = '';
      return;
    }
    const current = sliderPreviewFilters || state.filters || {};
    const start = sliderDragStartFilters;
    const brightness = clamp((current.brightness ?? 1) / Math.max(0.01, start.brightness ?? 1), 0.72, 1.32);
    const contrast = clamp((current.contrast ?? 1) / Math.max(0.01, start.contrast ?? 1), 0.72, 1.42);
    let saturation = clamp((current.saturation ?? 1) / Math.max(0.01, start.saturation ?? 1), 0.45, 1.7);
    const temperatureDelta = clamp(((current.temperature ?? 0) - (start.temperature ?? 0)) / 100, -1, 1);
    const tintDelta = clamp(((current.tint ?? 0) - (start.tint ?? 0)) / 100, -1, 1);
    const fadeDelta = clamp((current.fade ?? 0) - (start.fade ?? 0), -0.5, 0.5);
    const sepia = clamp(Math.max(temperatureDelta, 0) * 0.18 + Math.abs(tintDelta) * 0.08 + Math.max(fadeDelta, 0) * 0.16, 0, 0.34);
    let hueRotate = tintDelta * 10 - temperatureDelta * 8;
    let previewBrightness = brightness + Math.max(temperatureDelta, 0) * 0.03 + Math.max(fadeDelta, 0) * 0.08;
    HSL_CHANNELS.forEach((channel) => {
      hueRotate += ((current[hslKey(channel.id, 'h')] ?? 0) - (start[hslKey(channel.id, 'h')] ?? 0)) * 0.35;
      saturation *= 1 + (((current[hslKey(channel.id, 's')] ?? 0) - (start[hslKey(channel.id, 's')] ?? 0)) / 100) * 0.45;
      previewBrightness += (((current[hslKey(channel.id, 'l')] ?? 0) - (start[hslKey(channel.id, 'l')] ?? 0)) / 100) * 0.18;
    });
    hueRotate = clamp(hueRotate, -28, 28);
    saturation = clamp(saturation, 0.35, 1.9);
    previewBrightness = clamp(previewBrightness, 0.72, 1.42);
    els.canvas.style.filter = `brightness(${previewBrightness}) contrast(${contrast}) saturate(${saturation}) sepia(${sepia}) hue-rotate(${hueRotate}deg)`;
  }

  function cancelQueuedRenderWork() {
    if (pendingRenderFrame) {
      window.cancelAnimationFrame(pendingRenderFrame);
      pendingRenderFrame = 0;
    }
    if (pendingRenderTimer) {
      window.clearTimeout(pendingRenderTimer);
      pendingRenderTimer = 0;
    }
  }

  function scaleLayerForPreview(layer, scale) {
    if (scale >= 0.999) return layer;
    const next = { ...layer };
    if (layer.type === 'text') {
      next.fontSize = Math.max(8, (layer.fontSize ?? 56) * scale);
      next.strokeWidth = Math.max(0, (layer.strokeWidth ?? 4) * scale);
      next.shadowBlur = Math.max(0, (layer.shadowBlur ?? 8) * scale);
      next.bgPadding = Math.max(0, (layer.bgPadding ?? 18) * scale);
      next.bgRadius = Math.max(0, (layer.bgRadius ?? 16) * scale);
    }
    if (layer.type === 'mosaic') {
      next.intensity = Math.max(1, (layer.intensity ?? 14) * scale);
      next.cellSize = Math.max(2, (layer.cellSize ?? 8) * scale);
    }
    return next;
  }

  function createPreviewRenderState(state) {
    const scale = getPreviewScaleForState(state);
    if (scale >= 0.999) return state;
    const scalePoint = (pt) => ({ x: pt.x * scale, y: pt.y * scale });
    return {
      ...state,
      canvas: {
        width: Math.max(1, Math.round(state.canvas.width * scale)),
        height: Math.max(1, Math.round(state.canvas.height * scale)),
      },
      image: {
        ...state.image,
        faceBoxes: (state.image.faceBoxes || []).map((box) => ({
          x: box.x * scale,
          y: box.y * scale,
          width: box.width * scale,
          height: box.height * scale,
        })),
        faceLandmarks: (state.image.faceLandmarks || []).map((face) => face.map(scalePoint)),
      },
      layers: state.layers.map((layer) => scaleLayerForPreview(layer, scale)),
      previewScale: scale,
    };
  }

  function renderToneBaseCanvas(state, transparent = false, options = {}) {
    const renderState = options.usePreviewScale ? createPreviewRenderState(state) : state;
    const canvas = document.createElement('canvas');
    canvas.width = renderState.canvas.width;
    canvas.height = renderState.canvas.height;
    const ctx = canvas.getContext('2d');

    if (!renderState.image.loaded || !renderState.image.element) {
      if (!transparent) {
        ctx.fillStyle = '#f2ecf3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return { canvas, renderState };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = options.usePreviewScale ? 'medium' : 'high';

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;
    const baseCtx = baseCanvas.getContext('2d');
    baseCtx.imageSmoothingEnabled = true;
    baseCtx.imageSmoothingQuality = options.usePreviewScale ? 'medium' : 'high';
    // 画布尺寸与原图像素一致，基底始终 1:1 覆盖，禁止自动补边/扩展。
    baseCtx.drawImage(renderState.image.element, 0, 0, canvas.width, canvas.height);

    try {
      applyTonePipeline(ctx, baseCanvas, renderState.filters, {
        faceBoxes: renderState.image.faceBoxes || [],
        faceLandmarks: renderState.image.faceLandmarks || [],
        personMaskCanvas: renderState.image.personMaskCanvas || null,
        interactivePreview: Boolean(options.interactivePreview),
      });
    } catch (error) {
      console.error('Tone render failed, showing original image:', error);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseCanvas, 0, 0);
    }

    return { canvas, renderState };
  }

  function drawLayerStack(ctx, renderState, options = {}) {
    const skipLayerId = options.skipLayerId || null;
    const preMosaic = document.createElement('canvas');
    preMosaic.width = ctx.canvas.width;
    preMosaic.height = ctx.canvas.height;
    preMosaic.getContext('2d').drawImage(ctx.canvas, 0, 0);

    renderState.layers
      .filter((layer) => layer.visible && layer.id !== skipLayerId && layer.type === 'mosaic')
      .forEach((layer) => {
        ctx.save();
        ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
        if (layer.variant === 'frosted') {
          applyFrostedBlurMosaic(ctx, preMosaic, layer);
        } else {
          applyGridGlassMosaic(ctx, preMosaic, layer);
        }
        ctx.restore();
      });

    renderState.layers
      .filter((layer) => layer.visible && layer.id !== skipLayerId && layer.type === 'sticker')
      .forEach((layer) => {
        const metrics = getStickerMetrics(layer, ctx.canvas.width, ctx.canvas.height);
        const w = metrics.w;
        const h = metrics.h;
        const x = (layer.x ?? 0.5) * ctx.canvas.width;
        const y = (layer.y ?? 0.5) * ctx.canvas.height;
        const img = STICKER_IMAGE_CACHE.get(layer.src);
        if (!img || !img.complete) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((layer.rotation ?? 0) * Math.PI) / 180);
        ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      });

    renderState.layers
      .filter((layer) => layer.visible && layer.id !== skipLayerId && layer.type === 'text')
      .forEach((layer) => {
        const x = (layer.x ?? 0.5) * ctx.canvas.width;
        const y = (layer.y ?? 0.5) * ctx.canvas.height;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((layer.rotation ?? 0) * Math.PI) / 180);
        ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
        ctx.font = `${layer.fontSize ?? 56}px ${layer.fontFamily ?? '"Avenir Next", sans-serif'}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const layout = getTextLayout(ctx, layer);
        const bgOpacity = clamp(layer.bgOpacity ?? 0, 0, 1);
        if (bgOpacity > 0) {
          const padding = layer.bgPadding ?? 18;
          const boxW = layout.textWidth + padding * 2;
          const boxH = layout.textHeight + padding * 1.4;
          ctx.fillStyle = hexToRgba(layer.bgColor ?? '#2a1d2a', bgOpacity);
          drawRoundedRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, layer.bgRadius ?? 16);
          ctx.fill();
        }
        ctx.shadowColor = layer.shadowColor ?? '#2f2532';
        ctx.shadowBlur = layer.shadowBlur ?? 8;
        ctx.lineWidth = layer.strokeWidth ?? 4;
        ctx.strokeStyle = layer.strokeColor ?? '#2f2532';
        ctx.fillStyle = layer.color ?? '#ffeef5';
        const firstY = -layout.textHeight / 2 + layout.lineHeight / 2;
        const align = ['left', 'center', 'right'].includes(layer.textAlign) ? layer.textAlign : 'center';
        const textX = align === 'left' ? -layout.textWidth / 2 : align === 'right' ? layout.textWidth / 2 : 0;
        ctx.textAlign = align;
        layout.lines.forEach((line, index) => {
          const y = firstY + index * layout.lineHeight;
          ctx.strokeText(line, textX, y);
          ctx.fillText(line, textX, y);
        });
        ctx.restore();
      });
  }

  function renderEditedCanvas(state, transparent = false, options = {}) {
    const { canvas, renderState } = renderToneBaseCanvas(state, transparent, options);
    const ctx = canvas.getContext('2d');
    drawLayerStack(ctx, renderState, { skipLayerId: options.skipLayerId || null });
    return canvas;
  }

  function renderOriginalCanvas(state, transparent = false, options = {}) {
    const renderState = options.usePreviewScale ? createPreviewRenderState(state) : state;
    const canvas = document.createElement('canvas');
    canvas.width = renderState.canvas.width;
    canvas.height = renderState.canvas.height;
    const ctx = canvas.getContext('2d');
    if (renderState.image.loaded && renderState.image.element) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = options.usePreviewScale ? 'medium' : 'high';
      ctx.drawImage(renderState.image.element, 0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }

  function drawCanvasContain(ctx, sourceCanvas, x, y, w, h) {
    const scale = Math.min(w / sourceCanvas.width, h / sourceCanvas.height);
    const dw = sourceCanvas.width * scale;
    const dh = sourceCanvas.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(sourceCanvas, dx, dy, dw, dh);
    return { x: dx, y: dy, w: dw, h: dh };
  }

  function getCompareLabelStyle(paneWidth) {
    const width = Math.max(1, paneWidth || 1);
    const fontSize = clamp(Math.round(width * 0.075), 14, 120);
    return {
      fontSize,
      insetX: Math.round(fontSize * 0.7),
      insetY: Math.round(fontSize * 0.52),
      lineWidth: clamp(Math.round(fontSize * 0.12), 2, 10),
    };
  }

  function renderCanvas(ctx, state) {
    const previewState = createPreviewRenderState(state);
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = previewState.canvas.width;
    outputCanvas.height = previewState.canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    const commitOutput = () => {
      if (ctx.canvas.width !== outputCanvas.width) ctx.canvas.width = outputCanvas.width;
      if (ctx.canvas.height !== outputCanvas.height) ctx.canvas.height = outputCanvas.height;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(outputCanvas, 0, 0);
    };

    if (!previewState.image.loaded || !previewState.image.element) {
      outputCtx.fillStyle = '#f2ecf3';
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      commitOutput();
      return;
    }

    const drawOriginalFallback = () => {
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      outputCtx.drawImage(renderOriginalCanvas(state, false, { usePreviewScale: true }), 0, 0);
    };

    const ensureCache = () => {
      const hiddenLayerId = activeTransformLayerId || null;
      const interactivePreview = isSliderDragging || isTextEditing;
      if (
        previewRenderCache.renderToken === state.renderToken &&
        previewRenderCache.toneToken === state.toneToken &&
        previewRenderCache.width === previewState.canvas.width &&
        previewRenderCache.height === previewState.canvas.height &&
        previewRenderCache.hiddenLayerId === hiddenLayerId &&
        previewRenderCache.interactivePreview === interactivePreview
      ) {
        return;
      }
      const toneChanged =
        previewRenderCache.toneToken !== state.toneToken ||
        previewRenderCache.width !== previewState.canvas.width ||
        previewRenderCache.height !== previewState.canvas.height ||
        previewRenderCache.interactivePreview !== interactivePreview;
      previewRenderCache.renderToken = state.renderToken;
      previewRenderCache.toneToken = state.toneToken;
      previewRenderCache.width = previewState.canvas.width;
      previewRenderCache.height = previewState.canvas.height;
      previewRenderCache.hiddenLayerId = hiddenLayerId;
      previewRenderCache.interactivePreview = interactivePreview;
      if (toneChanged) {
        previewRenderCache.original = null;
        previewRenderCache.toneBase = null;
      }
      previewRenderCache.edited = null;
    };

    const getOriginal = () => {
      ensureCache();
      if (!previewRenderCache.original) {
        previewRenderCache.original = renderOriginalCanvas(state, false, { usePreviewScale: true });
      }
      return previewRenderCache.original;
    };

    const getEdited = () => {
      ensureCache();
      if (!previewRenderCache.edited) {
        if (!previewRenderCache.toneBase) {
          previewRenderCache.toneBase = renderToneBaseCanvas(state, false, {
            usePreviewScale: true,
            interactivePreview: isSliderDragging || isTextEditing,
          }).canvas;
        }
        const edited = document.createElement('canvas');
        edited.width = previewRenderCache.toneBase.width;
        edited.height = previewRenderCache.toneBase.height;
        const editedCtx = edited.getContext('2d');
        editedCtx.drawImage(previewRenderCache.toneBase, 0, 0);
        drawLayerStack(editedCtx, previewState, { skipLayerId: activeTransformLayerId || null });
        previewRenderCache.edited = edited;
      }
      return previewRenderCache.edited;
    };

    if (state.comparePeekOriginal) {
      try {
        outputCtx.drawImage(getOriginal(), 0, 0);
      } catch (error) {
        console.error('Original preview render failed:', error);
        drawOriginalFallback();
      }
      drawBlushPreview(outputCtx, previewState);
      commitOutput();
      return;
    }

    if (!state.compareMode) {
      try {
        outputCtx.drawImage(getEdited(), 0, 0);
      } catch (error) {
        console.error('Edited preview render failed, showing original image:', error);
        drawOriginalFallback();
      }
      drawBlushPreview(outputCtx, previewState);
      commitOutput();
      return;
    }

    const original = getOriginal();
    const edited = getEdited();

    const w = outputCanvas.width;
    const h = outputCanvas.height;
    const gap = 0;
    const paneWidth = (w - gap) / 2;

    outputCtx.clearRect(0, 0, w, h);

    const beforeRect = drawCanvasContain(outputCtx, original, 0, 0, paneWidth, h);
    const afterRect = drawCanvasContain(outputCtx, edited, paneWidth + gap, 0, paneWidth, h);

    // 对比模式下仅在 AFTER 区域绘制预览，避免 BEFORE 被污染。
    if (blushPreviewEnabled && previewState.image.faceBoxes?.length) {
      outputCtx.save();
      const scale = Math.min(afterRect.w / previewState.canvas.width, afterRect.h / previewState.canvas.height);
      const tx = afterRect.x + (afterRect.w - previewState.canvas.width * scale) / 2;
      const ty = afterRect.y + (afterRect.h - previewState.canvas.height * scale) / 2;
      outputCtx.translate(tx, ty);
      outputCtx.scale(scale, scale);
      drawBlushPreview(outputCtx, previewState);
      outputCtx.restore();
    }

    if (state.compareLabels !== false) {
      const compareStyle = getCompareLabelStyle(Math.min(beforeRect.w, afterRect.w));
      outputCtx.save();
      outputCtx.font = `700 ${compareStyle.fontSize}px "Avenir Next", "PingFang SC", sans-serif`;
      outputCtx.textBaseline = 'top';
      outputCtx.lineWidth = compareStyle.lineWidth;
      outputCtx.strokeStyle = 'rgba(236, 170, 210, 0.95)';
      outputCtx.fillStyle = '#ffffff';
      outputCtx.strokeText('BEFORE', beforeRect.x + compareStyle.insetX, beforeRect.y + compareStyle.insetY);
      outputCtx.fillText('BEFORE', beforeRect.x + compareStyle.insetX, beforeRect.y + compareStyle.insetY);
      outputCtx.strokeText('AFTER', afterRect.x + compareStyle.insetX, afterRect.y + compareStyle.insetY);
      outputCtx.fillText('AFTER', afterRect.x + compareStyle.insetX, afterRect.y + compareStyle.insetY);
      outputCtx.restore();
    }
    commitOutput();
  }

  function makeSlider({ label, min, max, step, value, onInput, onPreview, onBegin, onEnd, commitOnEnd, rangeClass = '', trackGradient = '' }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-item slider-control';

    const title = document.createElement('label');
    title.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    if (rangeClass) input.classList.add(rangeClass);
    if (trackGradient) input.style.setProperty('--hsl-track', trackGradient);

    const syncRangeProgress = () => {
      const minValue = Number(input.min);
      const maxValue = Number(input.max);
      const currentValue = Number(input.value);
      const pct = ((currentValue - minValue) / Math.max(0.0001, maxValue - minValue)) * 100;
      input.style.setProperty('--range-progress', `${clamp(pct, 0, 100)}%`);
    };
    syncRangeProgress();

    let started = false;
    let pendingSliderFrame = 0;
    let pendingSliderTimer = 0;
    let lastSliderCommitAt = 0;
    let latestSliderValue = Number(input.value);
    let pointerId = null;
    let lastSliderRect = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let sliderIntent = 'pending';
    const useIntentLock = isMobileLayoutViewport();
    const commitOnEndOnly = commitOnEnd ?? useIntentLock;
    const startOnce = () => {
      if (started) return;
      started = true;
      isSliderDragging = true;
      cancelQueuedRenderWork();
      sliderDragStartFilters = { ...store.getState().filters };
      onBegin?.();
    };
    const flushSliderInput = () => {
      pendingSliderFrame = 0;
      if (pendingSliderTimer) {
        window.clearTimeout(pendingSliderTimer);
        pendingSliderTimer = 0;
      }
      lastSliderCommitAt = performance.now();
      onInput(latestSliderValue);
    };

    const queueSliderInput = (v) => {
      latestSliderValue = v;
      syncRangeProgress();
      onPreview?.(v);
      if (commitOnEndOnly) return;
      const now = performance.now();
      const commitMs = isMobileViewport() ? MOBILE_SLIDER_COMMIT_MS : DESKTOP_SLIDER_COMMIT_MS;
      const gap = now - lastSliderCommitAt;
      if (gap >= commitMs) {
        flushSliderInput();
      } else if (!pendingSliderTimer) {
        pendingSliderTimer = window.setTimeout(() => {
          pendingSliderTimer = 0;
          if (!pendingSliderFrame) pendingSliderFrame = window.requestAnimationFrame(flushSliderInput);
        }, commitMs - gap);
      }
    };

    const snapToStep = (raw) => {
      const minValue = Number(input.min);
      const maxValue = Number(input.max);
      const stepValue = Number(input.step) || 1;
      const stepped = Math.round((raw - minValue) / stepValue) * stepValue + minValue;
      const decimals = Math.max(0, (String(input.step).split('.')[1] || '').length);
      return Number(clamp(stepped, minValue, maxValue).toFixed(decimals));
    };

    const setValueFromClientX = (clientX) => {
      const rect = lastSliderRect || input.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      const next = snapToStep(Number(input.min) + pct * (Number(input.max) - Number(input.min)));
      input.value = String(next);
      queueSliderInput(next);
    };

    input.oninput = () => {
      if (pointerId !== null) return;
      startOnce();
      queueSliderInput(Number(input.value));
    };
    const finishDrag = () => {
      if (!isSliderDragging && !started && pointerId === null) return;
      const shouldCommit = started && (!commitOnEndOnly || sliderIntent === 'horizontal');
      pointerId = null;
      lastSliderRect = null;
      sliderIntent = 'pending';
      if (pendingSliderFrame) {
        window.cancelAnimationFrame(pendingSliderFrame);
        pendingSliderFrame = 0;
      }
      if (pendingSliderTimer) {
        window.clearTimeout(pendingSliderTimer);
        pendingSliderTimer = 0;
      }
      if (shouldCommit) onInput(latestSliderValue);
      isSliderDragging = false;
      started = false;
      if (shouldCommit) onEnd?.();
      if (pendingRenderTimer) {
        window.clearTimeout(pendingRenderTimer);
        pendingRenderTimer = 0;
      }
      if (pendingRenderFrame) {
        window.cancelAnimationFrame(pendingRenderFrame);
        pendingRenderFrame = 0;
      }
      sliderDragStartFilters = null;
      sliderPreviewFilters = null;
      if (els?.canvas) els.canvas.style.filter = '';
      if (shouldCommit) {
        if (commitOnEndOnly) {
          window.setTimeout(() => {
            runWhenIdle(() => render(store.getState()), 120);
          }, 32);
        } else {
          render(store.getState());
        }
      }
    };
    const beginPointerDrag = (event) => {
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      sliderIntent = useIntentLock ? 'pending' : 'horizontal';
      lastSliderRect = input.getBoundingClientRect();
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      input.setPointerCapture?.(event.pointerId);
      if (!useIntentLock) {
        event.preventDefault();
        startOnce();
        setValueFromClientX(event.clientX);
      }
    };
    const movePointerDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      if (sliderIntent === 'pending') {
        const dx = Math.abs(event.clientX - pointerStartX);
        const dy = Math.abs(event.clientY - pointerStartY);
        if (dy > 8 && dy > dx * 1.15) {
          finishDrag();
          return;
        }
        if (dx < 6 && dy < 6) return;
        if (dx < dy * 1.15) return;
        sliderIntent = 'horizontal';
        startOnce();
      }
      if (sliderIntent !== 'horizontal') return;
      event.preventDefault();
      setValueFromClientX(event.clientX);
    };
    input.addEventListener('pointerdown', beginPointerDrag);
    input.addEventListener('pointermove', movePointerDrag);
    wrapper.addEventListener('pointerdown', (event) => {
      if (event.target === input) return;
      beginPointerDrag(event);
    });
    wrapper.addEventListener('pointermove', movePointerDrag);
    wrapper.addEventListener('pointerup', finishDrag);
    wrapper.addEventListener('pointercancel', finishDrag);
    input.addEventListener('pointerup', finishDrag);
    input.addEventListener('pointercancel', finishDrag);
    input.addEventListener('blur', finishDrag);

    wrapper.append(title, input);
    return wrapper;
  }

  function makeColorInput({ label, value, onInput, onBegin, onEnd }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-item';

    const title = document.createElement('label');
    title.textContent = label;

    const row = document.createElement('div');
    row.className = 'color-input-row';
    const swatch = document.createElement('label');
    swatch.className = 'color-swatch';
    const safeValue = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#e7d3ea';
    swatch.style.background = safeValue;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = safeValue;
    input.className = 'native-color-input';
    let started = false;
    let latestValue = safeValue;
    const startOnce = () => {
      if (started) return;
      started = true;
      onBegin?.();
    };
    const commitValue = () => {
      if (input.value === latestValue) return;
      startOnce();
      latestValue = input.value;
      swatch.style.background = input.value;
      onInput(input.value);
    };
    const finish = () => {
      if (!started) return;
      started = false;
      onEnd?.(latestValue);
    };
    input.oninput = commitValue;
    input.onchange = () => {
      commitValue();
      finish();
    };
    input.onblur = finish;

    swatch.appendChild(input);
    row.appendChild(swatch);
    wrapper.append(title, row);
    return wrapper;
  }

  function makeTextInput({ label, value, onInput, onBegin, onEnd, multiline = false }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-item';

    const title = document.createElement('label');
    title.textContent = label;

    const input = multiline ? document.createElement('textarea') : document.createElement('input');
    if (!multiline) input.type = 'text';
    input.value = value;
    let started = false;
    let pendingValue = value;
    let pendingInputFrame = 0;
    const startEditing = () => {
      if (started) return;
      started = true;
      isTextEditing = true;
      onBegin?.();
    };
    const flushInput = () => {
      if (pendingInputFrame) {
        window.cancelAnimationFrame(pendingInputFrame);
        pendingInputFrame = 0;
      }
      onInput(pendingValue);
    };
    input.onfocus = startEditing;
    input.oninput = () => {
      startEditing();
      pendingValue = input.value;
      if (pendingInputFrame) return;
      pendingInputFrame = window.requestAnimationFrame(() => {
        pendingInputFrame = 0;
        onInput(pendingValue);
      });
    };
    input.onblur = () => {
      started = false;
      isTextEditing = false;
      flushInput();
      onEnd?.();
      if (pendingRenderTimer) {
        window.clearTimeout(pendingRenderTimer);
        pendingRenderTimer = 0;
      }
      render(store.getState());
    };

    wrapper.append(title, input);
    return wrapper;
  }

  function makeSelectInput({ label, value, options, onInput }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-item';
    const title = document.createElement('label');
    title.textContent = label;
    const select = document.createElement('select');
    options.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = value;
    select.onchange = () => onInput(select.value);
    wrapper.append(title, select);
    return wrapper;
  }

  function makeFontPicker({ label, value, onInput }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-item font-picker-control';

    const title = document.createElement('label');
    title.textContent = label;

    const grid = document.createElement('div');
    grid.className = 'font-picker-grid';
    const visibleFonts = isMobileViewport() ? TEXT_FONTS.filter((font) => MOBILE_TEXT_FONT_IDS.has(font.id)) : TEXT_FONTS;
    if (isMobileViewport()) visibleFonts.forEach((font) => mountFontWarmupProbe(font));
    visibleFonts.forEach((font) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'font-picker-btn';
      btn.classList.toggle('is-active', font.id === value);
      const status = fontFaceStatus.get(font.id) || (font.src ? 'idle' : 'ready');
      btn.dataset.fontStatus = status;
      btn.title = status === 'error' ? `${font.name} 加载失败，将使用系统字体兜底` : font.name;
      const name = document.createElement('span');
      name.className = 'font-picker-name';
      name.textContent = font.name;
      const sample = document.createElement('span');
      const useFontPreview = shouldApplyFontPreviewClass(font);
      sample.className = `font-picker-sample ${useFontPreview ? font.className : ''}`.trim();
      sample.style.setProperty('--font-preview-family', useFontPreview ? getRuntimeFontFamily(font) : TEXT_FONTS[0].family);
      sample.textContent = TEXT_FONT_PREVIEW_SAMPLE;
      btn.append(name, sample);
      btn.onclick = () => {
        onInput(font.id);
        ensureTextFontLoaded(font).then(() => render(store.getState()));
      };
      grid.appendChild(btn);
    });
    scheduleFontPreviewWarmup(value);

    wrapper.append(title, grid);
    return wrapper;
  }

  function createOverlayLayer(overlayEl, store) {
    let interaction = null;
    let pendingTransformCanvasFrame = 0;
    let pendingInteractionPreviewFrame = 0;
    let queuedInteractionPatch = null;
    const MIN_TOUCH_FRAME = { w: 54, h: 54 };

    function minOverlayFrame(bounds, minSize = MIN_TOUCH_FRAME) {
      if (!isMobileViewport()) return { w: 0, h: 0 };
      const width = Math.min(Math.max(minSize.w, 44), Math.max(44, bounds.width * 0.22));
      const height = Math.min(Math.max(minSize.h, 44), Math.max(44, bounds.height * 0.18));
      return { w: width, h: height };
    }

    function comfortableManualBlushControls(canvasWidth, canvasHeight) {
      return {
        left: {
          x: canvasWidth * DEFAULT_FILTERS.blushLeftX,
          y: canvasHeight * DEFAULT_FILTERS.blushLeftY,
          rx: canvasWidth * DEFAULT_FILTERS.blushLeftRX,
          ry: canvasHeight * DEFAULT_FILTERS.blushLeftRY,
          enabled: true,
        },
        right: {
          x: canvasWidth * DEFAULT_FILTERS.blushRightX,
          y: canvasHeight * DEFAULT_FILTERS.blushRightY,
          rx: canvasWidth * DEFAULT_FILTERS.blushRightRX,
          ry: canvasHeight * DEFAULT_FILTERS.blushRightRY,
          enabled: true,
        },
      };
    }

    function getExtraBlushDefaults(state) {
      const canvasWidth = Math.max(1, state.canvas.width);
      const canvasHeight = Math.max(1, state.canvas.height);
      const autoRegions = state.image.autoBlushDetected
        ? buildBlushRegions(
            state.image.faceBoxes || [],
            state.image.faceLandmarks || [],
            canvasWidth,
            canvasHeight
          )
        : [];
      const region = autoRegions[1];
      if (region) {
        return {
          blushExtraLeftX: region.leftX / canvasWidth,
          blushExtraLeftY: region.cy / canvasHeight,
          blushExtraLeftRX: region.rx / canvasWidth,
          blushExtraLeftRY: region.ry / canvasHeight,
          blushExtraRightX: region.rightX / canvasWidth,
          blushExtraRightY: region.cy / canvasHeight,
          blushExtraRightRX: region.rx / canvasWidth,
          blushExtraRightRY: region.ry / canvasHeight,
        };
      }
      return {
        blushExtraLeftX: DEFAULT_FILTERS.blushExtraLeftX,
        blushExtraLeftY: DEFAULT_FILTERS.blushExtraLeftY,
        blushExtraLeftRX: DEFAULT_FILTERS.blushExtraLeftRX,
        blushExtraLeftRY: DEFAULT_FILTERS.blushExtraLeftRY,
        blushExtraRightX: DEFAULT_FILTERS.blushExtraRightX,
        blushExtraRightY: DEFAULT_FILTERS.blushExtraRightY,
        blushExtraRightRX: DEFAULT_FILTERS.blushExtraRightRX,
        blushExtraRightRY: DEFAULT_FILTERS.blushExtraRightRY,
      };
    }

    function isBlushEditActive(state) {
      return activeTool === 'project' && blushEditMode && state.image.loaded;
    }

    function ensureManualBlushSetup() {
      const state = store.getState();
      if ((state.filters.blushManual ?? 0) > 0.5) return true;
      const controls = state.image.autoBlushDetected
        ? getAutoBlushControls(
            state.image.faceBoxes || [],
            state.image.faceLandmarks || [],
            state.canvas.width,
            state.canvas.height
          )
        : comfortableManualBlushControls(state.canvas.width, state.canvas.height);
      const partial = {
        blushManual: 1,
        blushLeftEnabled: controls?.left?.enabled === false ? 0 : 1,
        blushRightEnabled: controls?.right?.enabled === false ? 0 : 1,
        blushLeftX: (controls?.left?.x ?? state.canvas.width * DEFAULT_FILTERS.blushLeftX) / state.canvas.width,
        blushLeftY: (controls?.left?.y ?? state.canvas.height * DEFAULT_FILTERS.blushLeftY) / state.canvas.height,
        blushLeftRX: (controls?.left?.rx ?? state.canvas.width * DEFAULT_FILTERS.blushLeftRX) / state.canvas.width,
        blushLeftRY: (controls?.left?.ry ?? state.canvas.height * DEFAULT_FILTERS.blushLeftRY) / state.canvas.height,
        blushRightX: (controls?.right?.x ?? state.canvas.width * DEFAULT_FILTERS.blushRightX) / state.canvas.width,
        blushRightY: (controls?.right?.y ?? state.canvas.height * DEFAULT_FILTERS.blushRightY) / state.canvas.height,
        blushRightRX: (controls?.right?.rx ?? state.canvas.width * DEFAULT_FILTERS.blushRightRX) / state.canvas.width,
        blushRightRY: (controls?.right?.ry ?? state.canvas.height * DEFAULT_FILTERS.blushRightRY) / state.canvas.height,
      };
      if (controls?.regions?.[1]) {
        Object.assign(partial, {
          blushExtraEnabled: 1,
          blushExtraLeftEnabled: 1,
          blushExtraRightEnabled: 1,
          ...getExtraBlushDefaults(state),
        });
      }
      store.setFilters(partial, state.activePresetId ?? 'original', true);
      return true;
    }

    function patchBlush(side, patch, recordHistory = false) {
      const prefixMap = {
        left: 'blushLeft',
        right: 'blushRight',
        extraLeft: 'blushExtraLeft',
        extraRight: 'blushExtraRight',
      };
      const prefix = prefixMap[side] || 'blushLeft';
      const partial = {};
      if (side === 'extraLeft' || side === 'extraRight') partial.blushExtraEnabled = 1;
      Object.entries(patch).forEach(([key, value]) => {
        partial[`${prefix}${key}`] = value;
      });
      if ((side === 'extraLeft' || side === 'extraRight') && Number(patch.Enabled ?? 1) <= 0.5) {
        partial.blushExtraEnabled = 0;
      }
      partial.blushManual = 1;
      store.setFilters(partial, store.getState().activePresetId ?? 'original', recordHistory);
    }

    function addExtraBlushGroup() {
      const state = store.getState();
      if (!state.image.loaded) {
        alert('请先上传图片。');
        return;
      }
      ensureManualBlushSetup();
      const nextState = store.getState();
      store.setFilters(
        {
          blushManual: 1,
          blushExtraEnabled: 1,
          blushExtraLeftEnabled: 1,
          blushExtraRightEnabled: 1,
          ...getExtraBlushDefaults(nextState),
        },
        nextState.activePresetId ?? 'original',
        true
      );
      blushPreviewEnabled = true;
      blushEditMode = true;
      render(store.getState());
    }

    function sizePx(layer, bounds) {
      if (layer.type === 'sticker') {
        const metrics = getStickerMetrics(layer, bounds.width, bounds.height);
        return { w: metrics.w, h: metrics.h };
      }
      if (layer.type === 'text') {
        const state = store.getState();
        const canvasWidth = Math.max(1, state.canvas?.width || bounds.width || 1);
        const displayScale = bounds.width / canvasWidth;
        const fontSize = (layer.fontSize ?? 56) * displayScale;
        textMeasureCtx.font = `${fontSize}px ${layer.fontFamily ?? '"Avenir Next", sans-serif'}`;
        const layout = getTextLayout(textMeasureCtx, { ...layer, fontSize });
        const metrics = getTextBoxMetrics(layout, layer, displayScale);
        return {
          w: Math.max(24, metrics.w),
          h: Math.max(18, metrics.h),
        };
      }
      return {
        w: (layer.width ?? 0.2) * bounds.width,
        h: (layer.height ?? 0.2) * bounds.height,
      };
    }

    function startInteraction(event, mode, layer, frameRect) {
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      store.beginStep();
      isDirectManipulating = true;
      cancelQueuedRenderWork();
      const cx = (layer.x ?? 0.5) * frameRect.width;
      const cy = (layer.y ?? 0.5) * frameRect.height;
      const dx = event.clientX - frameRect.left - cx;
      const dy = event.clientY - frameRect.top - cy;
      interaction = {
        kind: 'layer',
        id: layer.id,
        layerType: layer.type,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startLayerX: layer.x ?? 0.5,
        startLayerY: layer.y ?? 0.5,
        startWidth: layer.width ?? 0.2,
        startHeight: layer.height ?? 0.2,
        startFontSize: layer.fontSize ?? 56,
        startRotation: layer.rotation ?? 0,
        startDist: Math.max(1, Math.hypot(dx, dy)),
        startAbsDx: Math.max(1, Math.abs(dx)),
        startAbsDy: Math.max(1, Math.abs(dy)),
        startAngle: Math.atan2(dy, dx),
        frameRect,
        startLayer: { ...layer },
        startDisplay: sizePx(layer, frameRect),
        element: event.currentTarget?.closest?.('.overlay-item') || event.currentTarget,
        pointers: new Map([[event.pointerId, { clientX: event.clientX, clientY: event.clientY }]]),
        pendingPatch: null,
        previewStarted: false,
      };
    }

    function getPinchPoints(currentInteraction = interaction) {
      if (!currentInteraction?.pointers || currentInteraction.pointers.size < 2) return null;
      const points = Array.from(currentInteraction.pointers.values()).slice(0, 2);
      const [a, b] = points;
      const centerX = (a.clientX + b.clientX) / 2;
      const centerY = (a.clientY + b.clientY) / 2;
      return {
        centerX,
        centerY,
        distance: Math.max(1, Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)),
      };
    }

    function startPinchInteraction() {
      if (!interaction || interaction.kind !== 'layer') return;
      const pinch = getPinchPoints();
      if (!pinch) return;
      const currentPatch = interaction.pendingPatch || {};
      interaction.mode = 'pinch';
      interaction.pinchStartDistance = pinch.distance;
      interaction.pinchStartCenterX = pinch.centerX;
      interaction.pinchStartCenterY = pinch.centerY;
      interaction.pinchStartLayerX = currentPatch.x ?? interaction.startLayerX;
      interaction.pinchStartLayerY = currentPatch.y ?? interaction.startLayerY;
      interaction.pinchStartWidth = currentPatch.width ?? interaction.startWidth;
      interaction.pinchStartHeight = currentPatch.height ?? interaction.startHeight;
      interaction.pinchStartFontSize = currentPatch.fontSize ?? interaction.startFontSize;
    }

    function addInteractionPointer(event) {
      if (!interaction?.pointers || interaction.pointers.has(event.pointerId)) return;
      try {
        interaction.element?.setPointerCapture?.(event.pointerId);
      } catch {}
      interaction.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (interaction.kind === 'layer' && interaction.pointers.size >= 2) {
        startPinchInteraction();
      }
    }

    function addCanvasPinchPointer(event) {
      if (!interaction?.pointers || interaction.kind !== 'layer' || interaction.mode === 'rotate') return;
      if (interaction.pointers.has(event.pointerId)) return;
      event.preventDefault();
      event.stopPropagation();
      addInteractionPointer(event);
    }

    function updateInteractionPointer(event) {
      if (!interaction?.pointers?.has(event.pointerId)) return false;
      interaction.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      return true;
    }

    function applyInteractionPreview(patch) {
      if (!interaction || interaction.kind !== 'layer') return;
      interaction.pendingPatch = { ...(interaction.pendingPatch || {}), ...patch };
      const layer = { ...interaction.startLayer, ...interaction.pendingPatch };
      const element = interaction.element;
      if (!element) return;
      if (!interaction.previewStarted) {
        interaction.previewStarted = true;
        element.classList.add('is-transforming');
      }
      const dx = ((layer.x ?? interaction.startLayerX) - interaction.startLayerX) * interaction.frameRect.width;
      const dy = ((layer.y ?? interaction.startLayerY) - interaction.startLayerY) * interaction.frameRect.height;
      let scaleX = 1;
      let scaleY = 1;
      if (interaction.layerType === 'text' && layer.fontSize !== undefined) {
        const fontScale = (layer.fontSize || interaction.startFontSize) / Math.max(1, interaction.startFontSize);
        scaleX = fontScale;
        scaleY = fontScale;
      } else {
        if (layer.width !== undefined) scaleX = layer.width / Math.max(0.0001, interaction.startWidth);
        if (layer.height !== undefined) scaleY = layer.height / Math.max(0.0001, interaction.startHeight);
        if (interaction.layerType === 'sticker') scaleY = scaleX;
      }
      const rotation = layer.rotation ?? interaction.startRotation;
      element.style.setProperty('--handle-scale-x', `${1 / Math.max(0.2, Math.abs(scaleX))}`);
      element.style.setProperty('--handle-scale-y', `${1 / Math.max(0.2, Math.abs(scaleY))}`);
      element.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    }

    function startBlushInteraction(event, side, mode, control, frameRect) {
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      store.beginStep();
      isDirectManipulating = true;
      const dx = event.clientX - frameRect.left - control.x;
      const dy = event.clientY - frameRect.top - control.y;
      interaction = {
        kind: 'blush',
        side,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startCx: control.x / frameRect.width,
        startCy: control.y / frameRect.height,
        startRx: control.rx / frameRect.width,
        startRy: control.ry / frameRect.height,
        startDist: Math.max(1, Math.hypot(dx, dy)),
        frameRect,
        element: event.currentTarget?.closest?.('.blush-control') || event.currentTarget,
        pendingPatch: null,
      };
      interaction.element?.classList.add('is-transforming');
    }

    function finishInteraction(event) {
      if (!interaction && !isDirectManipulating) return;
      if (event?.pointerId !== undefined && interaction?.kind === 'layer' && interaction.pointers?.has(event.pointerId)) {
        interaction.pointers.delete(event.pointerId);
        if (interaction.pointers.size > 0) return;
      }
      if (pendingInteractionPreviewFrame) {
        window.cancelAnimationFrame(pendingInteractionPreviewFrame);
        pendingInteractionPreviewFrame = 0;
      }
      flushQueuedInteractionPreview();
      const current = interaction;
      if (pendingTransformCanvasFrame) {
        window.cancelAnimationFrame(pendingTransformCanvasFrame);
        pendingTransformCanvasFrame = 0;
      }
      current?.element?.classList.remove('is-transforming');
      activeTransformLayerId = null;
      previewRenderCache.hiddenLayerId = null;
      isDirectManipulating = false;
      if (current?.kind === 'blush' && current.pendingPatch) {
        patchBlush(current.side, current.pendingPatch, false);
      }
      if (current?.kind === 'layer' && current.pendingPatch) {
        store.updateLayer(current.id, current.pendingPatch);
      }
      current?.pointers?.clear?.();
      interaction = null;
      const selectedLayer = store.getState().layers.find((layer) => layer.id === store.getState().selectedLayerId);
      if (selectedLayer && isMobileViewport()) {
        mobileLayerControlsExpanded = true;
      }
      render(store.getState());
    }

    function applyBlushInteractionPreview(patch) {
      if (!interaction || interaction.kind !== 'blush') return;
      interaction.pendingPatch = { ...(interaction.pendingPatch || {}), ...patch };
      const nextX = interaction.pendingPatch.X ?? interaction.startCx;
      const nextY = interaction.pendingPatch.Y ?? interaction.startCy;
      const nextRx = interaction.pendingPatch.RX ?? interaction.startRx;
      const nextRy = interaction.pendingPatch.RY ?? interaction.startRy;
      const dx = (nextX - interaction.startCx) * interaction.frameRect.width;
      const dy = (nextY - interaction.startCy) * interaction.frameRect.height;
      const scaleX = nextRx / Math.max(0.0001, interaction.startRx);
      const scaleY = nextRy / Math.max(0.0001, interaction.startRy);
      const element = interaction.element;
      if (!element) return;
      element.style.setProperty('--handle-scale-x', `${1 / Math.max(0.2, Math.abs(scaleX))}`);
      element.style.setProperty('--handle-scale-y', `${1 / Math.max(0.2, Math.abs(scaleY))}`);
      element.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
    }

    function flushQueuedInteractionPreview() {
      if (!queuedInteractionPatch || !interaction) return;
      const patch = queuedInteractionPatch;
      queuedInteractionPatch = null;
      if (interaction.kind === 'blush') {
        applyBlushInteractionPreview(patch);
      } else {
        applyInteractionPreview(patch);
      }
    }

    function queueInteractionPreview(patch) {
      queuedInteractionPatch = { ...(queuedInteractionPatch || {}), ...patch };
      if (pendingInteractionPreviewFrame) return;
      pendingInteractionPreviewFrame = window.requestAnimationFrame(() => {
        pendingInteractionPreviewFrame = 0;
        flushQueuedInteractionPreview();
      });
    }

    function attachMoveHandler(el, layer, frameRect) {
      el.onpointerdown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (interaction?.kind === 'layer' && interaction.mode !== 'rotate') {
          addInteractionPointer(event);
          return;
        }
        startInteraction(event, 'move', layer, frameRect);
        if (isMobileViewport()) {
          store.selectLayerSilent(layer.id);
          revealLayerControlsFor(layer);
        } else {
          store.selectLayer(layer.id);
          revealLayerControlsFor(layer);
        }
      };
    }

    function makeHandle(type, layer, frameRect) {
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = `overlay-handle ${type}`;
      if (type === 'delete') {
        handle.textContent = '×';
        handle.onpointerdown = (event) => {
          event.preventDefault();
          event.stopPropagation();
          store.removeLayer(layer.id);
        };
        return handle;
      }
      if (type === 'copy') {
        handle.textContent = '⧉';
        handle.onpointerdown = (event) => {
          event.preventDefault();
          event.stopPropagation();
          store.duplicateLayer(layer.id);
        };
        return handle;
      }
      if (type === 'rotate') {
        handle.textContent = '↻';
        handle.title = '旋转';
      }
      handle.onpointerdown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        startInteraction(event, type, layer, frameRect);
        if (isMobileViewport()) {
          store.selectLayerSilent(layer.id);
          revealLayerControlsFor(layer);
        } else {
          store.selectLayer(layer.id);
          revealLayerControlsFor(layer);
        }
      };
      return handle;
    }

    function appendLayerPreview(item, layer, frameRect) {
      if (layer.type === 'sticker') {
        const preview = document.createElement('div');
        preview.className = 'overlay-preview sticker-preview';
        const img = document.createElement('img');
        img.src = layer.src;
        img.alt = '';
        preview.appendChild(img);
        item.appendChild(preview);
        return;
      }
      if (layer.type === 'text') {
        const preview = document.createElement('div');
        preview.className = 'overlay-preview text-preview';
        const canvasWidth = Math.max(1, store.getState().canvas?.width || frameRect.width || 1);
        const displayScale = frameRect.width / canvasWidth;
        const fontSize = Math.max(8, (layer.fontSize ?? 56) * displayScale);
        preview.textContent = layer.content || '';
        preview.style.fontFamily = layer.fontFamily ?? '"Avenir Next", sans-serif';
        preview.style.fontSize = `${fontSize}px`;
        preview.style.color = layer.color ?? '#ffeef5';
        preview.style.webkitTextStroke = `${Math.max(0, (layer.strokeWidth ?? 0) * displayScale)}px ${layer.strokeColor ?? '#2f2532'}`;
        preview.style.textShadow = makeTextStrokeShadow(layer, displayScale);
        preview.style.textAlign = ['left', 'center', 'right'].includes(layer.textAlign) ? layer.textAlign : 'left';
        item.appendChild(preview);
        return;
      }
      if (layer.type === 'mosaic') {
        const preview = document.createElement('div');
        const shape = ['circle', 'heart'].includes(layer.shape) ? layer.shape : 'rect';
        preview.className = `overlay-preview mosaic-preview mosaic-shape-${shape}`;
        if (shape === 'heart') {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          svg.setAttribute('viewBox', '-50 -50 100 100');
          svg.setAttribute('aria-hidden', 'true');
          path.setAttribute('class', 'mosaic-heart-path');
          path.setAttribute('d', `${heartPathToSvgD(50)} Z`);
          svg.appendChild(path);
          preview.appendChild(svg);
        }
        item.appendChild(preview);
      }
    }

    function isInteractiveLayerRenderable(layer, frameRect) {
      if (!layer || !layer.visible || !['mosaic', 'sticker', 'text'].includes(layer.type)) return false;
      if ((layer.opacity ?? 1) <= 0.001) return false;
      const x = Number(layer.x ?? 0.5);
      const y = Number(layer.y ?? 0.5);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      if (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02) return false;
      if (layer.type === 'text' && !String(layer.content ?? '').trim()) return false;
      if (layer.type === 'sticker' && !layer.src) return false;
      const { w, h } = sizePx(layer, frameRect);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w < 2 || h < 2) return false;
      const boxLeft = x * frameRect.width - w / 2;
      const boxTop = y * frameRect.height - h / 2;
      const boxRight = boxLeft + w;
      const boxBottom = boxTop + h;
      const visibleW = Math.max(0, Math.min(frameRect.width, boxRight) - Math.max(0, boxLeft));
      const visibleH = Math.max(0, Math.min(frameRect.height, boxBottom) - Math.max(0, boxTop));
      const visibleRatio = (visibleW * visibleH) / Math.max(1, w * h);
      return visibleRatio >= 0.32;
    }

    function render() {
      const state = store.getState();
      overlayEl.innerHTML = '';

      const frameRect = overlayEl.getBoundingClientRect();
      const activeId = state.selectedLayerId;
      const interactiveLayers = isBlushEditActive(state)
        ? []
        : state.layers.filter((layer) => isInteractiveLayerRenderable(layer, frameRect));
      interactiveLayers.sort((a, b) => {
        if (a.id === activeId) return 1;
        if (b.id === activeId) return -1;
        return 0;
      });
      interactiveLayers.forEach((layer) => {

        const item = document.createElement('div');
        item.className = `overlay-item overlay-${layer.type}`;
        if (state.selectedLayerId === layer.id) item.classList.add('selected');

        const { w, h } = sizePx(layer, frameRect);
        const minFrame = minOverlayFrame(frameRect);
        const frameW = Math.max(w, minFrame.w);
        const frameH = Math.max(h, minFrame.h);
        const x = (layer.x ?? 0.5) * frameRect.width;
        const y = (layer.y ?? 0.5) * frameRect.height;

        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        item.style.width = `${frameW}px`;
        item.style.height = `${frameH}px`;
        item.style.opacity = `${layer.opacity ?? 1}`;
        item.style.transform = `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)`;

        if (layer.type === 'mosaic') {
          item.style.background = 'transparent';
          item.style.border = 'none';
          item.style.borderRadius = layer.shape === 'circle' ? '999px' : layer.shape === 'heart' ? '46% 46% 52% 52%' : '14px';
        }
        appendLayerPreview(item, layer, frameRect);
        const preview = item.querySelector('.overlay-preview');
        if (preview) {
          preview.style.width = `${w}px`;
          preview.style.height = `${h}px`;
          preview.style.left = '50%';
          preview.style.top = '50%';
          preview.style.transform = 'translate(-50%, -50%)';
        }

        item.onclick = (event) => {
          event.stopPropagation();
          store.selectLayer(layer.id);
          revealLayerControlsFor(layer);
          render(store.getState());
        };

        attachMoveHandler(item, layer, frameRect);

        if (state.selectedLayerId === layer.id) {
          item.appendChild(makeHandle('scale', layer, frameRect));
          if (layer.type === 'mosaic') {
            item.appendChild(makeHandle('stretch-x', layer, frameRect));
            item.appendChild(makeHandle('stretch-y', layer, frameRect));
          }
          item.appendChild(makeHandle('copy', layer, frameRect));
          item.appendChild(makeHandle('rotate', layer, frameRect));
          item.appendChild(makeHandle('delete', layer, frameRect));
        }

        overlayEl.appendChild(item);
      });

      if (isBlushEditActive(state)) {
        ensureManualBlushSetup();
        const controls = getActiveBlushControls(
          store.getState().filters,
          store.getState().image.faceBoxes || [],
          store.getState().image.faceLandmarks || [],
          frameRect.width,
          frameRect.height
        );
        const blushItems = [
          { side: 'left', control: controls?.left, label: '左腮红' },
          { side: 'right', control: controls?.right, label: '右腮红' },
          { side: 'extraLeft', control: controls?.extraLeft, label: '第二组左腮红' },
          { side: 'extraRight', control: controls?.extraRight, label: '第二组右腮红' },
        ];
        blushItems.forEach(({ side, control, label }) => {
          if (!control || !control.enabled) return;
          const item = document.createElement('div');
          const sideClass = side === 'left' || side === 'extraLeft' ? 'blush-left' : 'blush-right';
          const groupClass = side === 'extraLeft' || side === 'extraRight' ? 'blush-extra' : 'blush-primary';
          item.className = `overlay-item blush-control ${sideClass} ${groupClass} selected`;
          const minFrame = minOverlayFrame(frameRect, { w: 84, h: 64 });
          const blushW = control.rx * 2;
          const blushH = control.ry * 2;
          item.style.left = `${control.x}px`;
          item.style.top = `${control.y}px`;
          item.style.width = `${Math.max(blushW, minFrame.w)}px`;
          item.style.height = `${Math.max(blushH, minFrame.h)}px`;
          item.style.transform = 'translate(-50%, -50%)';
          item.title = label;
          const preview = document.createElement('div');
          preview.className = 'overlay-preview blush-preview';
          preview.style.width = `${blushW}px`;
          preview.style.height = `${blushH}px`;
          preview.style.left = '50%';
          preview.style.top = '50%';
          preview.style.transform = 'translate(-50%, -50%)';
          item.appendChild(preview);
          item.onpointerdown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            startBlushInteraction(event, side, 'move', control, frameRect);
          };

          const scaleHandle = document.createElement('button');
          scaleHandle.type = 'button';
          scaleHandle.className = 'overlay-handle scale blush-scale';
          scaleHandle.onpointerdown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            startBlushInteraction(event, side, 'scale', control, frameRect);
          };

          const deleteHandle = document.createElement('button');
          deleteHandle.type = 'button';
          deleteHandle.className = 'overlay-handle delete blush-delete';
          deleteHandle.textContent = '×';
          deleteHandle.onpointerdown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            store.beginStep();
            patchBlush(side, { Enabled: 0 }, false);
          };

          item.append(scaleHandle, deleteHandle);
          overlayEl.appendChild(item);
        });
      }
    }

    overlayEl.onpointerdown = (event) => {
      addCanvasPinchPointer(event);
    };

    overlayEl.onpointermove = (event) => {
      if (!interaction) return;
      updateInteractionPointer(event);
      if (interaction.kind === 'blush') {
        if (interaction.mode === 'move') {
          const dx = (event.clientX - interaction.startX) / interaction.frameRect.width;
          const dy = (event.clientY - interaction.startY) / interaction.frameRect.height;
          queueInteractionPreview({
            X: clamp(interaction.startCx + dx, 0, 1),
            Y: clamp(interaction.startCy + dy, 0, 1),
          });
          return;
        }
        if (interaction.mode === 'scale') {
          const cx = interaction.startCx * interaction.frameRect.width;
          const cy = interaction.startCy * interaction.frameRect.height;
          const dx = event.clientX - interaction.frameRect.left - cx;
          const dy = event.clientY - interaction.frameRect.top - cy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const ratio = clamp(dist / interaction.startDist, 0.35, 3.2);
          queueInteractionPreview({
            RX: clamp(interaction.startRx * ratio, 0.01, 0.25),
            RY: clamp(interaction.startRy * ratio, 0.01, 0.2),
          });
          return;
        }
      }

      if (interaction.mode === 'pinch') {
        const pinch = getPinchPoints();
        if (!pinch) return;
        const ratio = clamp(pinch.distance / Math.max(1, interaction.pinchStartDistance || pinch.distance), 0.2, 6);
        const centerDx = (pinch.centerX - (interaction.pinchStartCenterX ?? pinch.centerX)) / interaction.frameRect.width;
        const centerDy = (pinch.centerY - (interaction.pinchStartCenterY ?? pinch.centerY)) / interaction.frameRect.height;
        const patch = {
          x: clamp((interaction.pinchStartLayerX ?? interaction.startLayerX) + centerDx, 0, 1),
          y: clamp((interaction.pinchStartLayerY ?? interaction.startLayerY) + centerDy, 0, 1),
        };
        if (interaction.layerType === 'text') {
          const nextFontSize = clamp(Math.round((interaction.pinchStartFontSize ?? interaction.startFontSize ?? 56) * ratio), 12, 260);
          patch.fontSize = nextFontSize;
          patch.width = clamp((interaction.pinchStartWidth ?? interaction.startWidth) * ratio, 0.04, 0.95);
          patch.height = clamp((interaction.pinchStartHeight ?? interaction.startHeight) * ratio, 0.04, 0.95);
        } else if (interaction.layerType === 'sticker') {
          patch.width = clamp((interaction.pinchStartWidth ?? interaction.startWidth) * ratio, 0.04, 0.95);
        } else {
          patch.width = clamp((interaction.pinchStartWidth ?? interaction.startWidth) * ratio, 0.04, 0.95);
          patch.height = clamp((interaction.pinchStartHeight ?? interaction.startHeight) * ratio, 0.04, 0.95);
        }
        queueInteractionPreview(patch);
        return;
      }

      if (interaction.mode === 'move') {
        const dx = (event.clientX - interaction.startX) / interaction.frameRect.width;
        const dy = (event.clientY - interaction.startY) / interaction.frameRect.height;
        queueInteractionPreview({
          x: clamp(interaction.startLayerX + dx, 0, 1),
          y: clamp(interaction.startLayerY + dy, 0, 1),
        });
        return;
      }

      if (interaction.mode === 'scale') {
        const cx = (interaction.startLayerX ?? 0.5) * interaction.frameRect.width;
        const cy = (interaction.startLayerY ?? 0.5) * interaction.frameRect.height;
        const dx = event.clientX - interaction.frameRect.left - cx;
        const dy = event.clientY - interaction.frameRect.top - cy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const ratio = clamp(dist / interaction.startDist, 0.2, 6);
        if (interaction.layerType === 'sticker') {
          queueInteractionPreview({
            width: clamp(interaction.startWidth * ratio, 0.04, 0.95),
          });
          return;
        }
        if (interaction.layerType === 'text') {
          const nextFontSize = clamp(Math.round((interaction.startFontSize ?? 56) * ratio), 12, 260);
          queueInteractionPreview({
            fontSize: nextFontSize,
            width: clamp(interaction.startWidth * ratio, 0.04, 0.95),
            height: clamp(interaction.startHeight * ratio, 0.04, 0.95),
          });
          return;
        }
        queueInteractionPreview({
          width: clamp(interaction.startWidth * ratio, 0.04, 0.95),
          height: clamp(interaction.startHeight * ratio, 0.04, 0.95),
        });
        return;
      }

      if (interaction.mode === 'stretch-x') {
        const cx = (interaction.startLayerX ?? 0.5) * interaction.frameRect.width;
        const dx = Math.max(1, Math.abs(event.clientX - interaction.frameRect.left - cx));
        const ratio = clamp(dx / interaction.startAbsDx, 0.2, 6);
        queueInteractionPreview({
          width: clamp(interaction.startWidth * ratio, 0.04, 0.95),
        });
        return;
      }

      if (interaction.mode === 'stretch-y') {
        const cy = (interaction.startLayerY ?? 0.5) * interaction.frameRect.height;
        const dy = Math.max(1, Math.abs(event.clientY - interaction.frameRect.top - cy));
        const ratio = clamp(dy / interaction.startAbsDy, 0.2, 6);
        queueInteractionPreview({
          height: clamp(interaction.startHeight * ratio, 0.04, 0.95),
        });
        return;
      }

      if (interaction.mode === 'rotate') {
        const cx = interaction.startLayerX * interaction.frameRect.width;
        const cy = interaction.startLayerY * interaction.frameRect.height;
        const dx = event.clientX - interaction.frameRect.left - cx;
        const dy = event.clientY - interaction.frameRect.top - cy;
        const angle = Math.atan2(dy, dx);
        const delta = ((angle - interaction.startAngle) * 180) / Math.PI;
        queueInteractionPreview({ rotation: interaction.startRotation + delta });
      }
    };

    overlayEl.onpointerup = (event) => {
      finishInteraction(event);
    };

    overlayEl.onpointercancel = (event) => {
      finishInteraction(event);
    };

    overlayEl.onclick = () => {
      store.selectLayer(null);
      mobileLayerControlsExpanded = false;
    };

    return { render, ensureManualBlushSetup, addExtraBlushGroup, finishInteraction };
  }

  function canvasToBlob(canvas, type = 'image/png', quality) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('blob-empty'));
            return;
          }
          resolve(blob);
        }, type, quality);
      } catch (error) {
        reject(error);
      }
    });
  }

  function buildExportCanvas(state, safeFontMode = false, safeSizeMode = false) {
    let canvas;
    let ctx;
    const exportState = safeFontMode
      ? {
          ...state,
          layers: state.layers.map((layer) =>
            layer.type === 'text'
              ? { ...layer, fontFamily: '"PingFang SC", "Noto Sans SC", sans-serif' }
              : { ...layer }
          ),
	        }
	      : state;
    const renderOptions = { usePreviewScale: safeSizeMode };
    if (exportState.compareMode) {
      const original = renderOriginalCanvas(exportState, true, renderOptions);
      const edited = renderEditedCanvas(exportState, true, renderOptions);
      canvas = document.createElement('canvas');
      canvas.width = original.width + edited.width;
      canvas.height = Math.max(original.height, edited.height);
      ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(original, 0, 0);
      ctx.drawImage(edited, original.width, 0);
      if (exportState.compareLabels !== false) {
        const compareStyle = getCompareLabelStyle(original.width);
        ctx.save();
        ctx.font = `700 ${compareStyle.fontSize}px "Avenir Next", "PingFang SC", sans-serif`;
        ctx.textBaseline = 'top';
        ctx.lineWidth = compareStyle.lineWidth;
        ctx.strokeStyle = 'rgba(236, 170, 210, 0.95)';
        ctx.fillStyle = '#ffffff';
        ctx.strokeText('BEFORE', compareStyle.insetX, compareStyle.insetY);
        ctx.fillText('BEFORE', compareStyle.insetX, compareStyle.insetY);
        ctx.strokeText('AFTER', original.width + compareStyle.insetX, compareStyle.insetY);
        ctx.fillText('AFTER', original.width + compareStyle.insetX, compareStyle.insetY);
        ctx.restore();
      }
    } else {
      canvas = renderEditedCanvas(exportState, true, renderOptions);
    }
    return canvas;
  }

  function isMobileLikeBrowser() {
    return isMobileLayoutViewport();
  }

  function showExportPreview(dataUrl, fileName) {
    latestExportUrl = dataUrl;
    latestExportFileName = fileName;
    if (!els.exportModal || !els.exportPreviewImage || !els.exportDownloadLink) return false;

    els.exportPreviewImage.src = dataUrl;
    els.exportDownloadLink.href = dataUrl;
    els.exportDownloadLink.download = fileName;
    els.exportModal.classList.add('show');
    els.exportModal.setAttribute('aria-hidden', 'false');
    trackEvent('export_preview_open', {
      compareMode: Boolean(store.getState().compareMode),
      compareLabels: store.getState().compareLabels !== false,
      layerCount: store.getState().layers.length,
    });
    return true;
  }

  function hideExportPreview() {
    if (!els.exportModal) return;
    els.exportModal.classList.remove('show');
    els.exportModal.setAttribute('aria-hidden', 'true');
  }

  function cloneCanvasAtMaxSide(sourceCanvas, maxSide = 1800, fill = '#ffffff') {
    if (!sourceCanvas?.width || !sourceCanvas?.height) return null;
    const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
    const width = Math.max(1, Math.round(sourceCanvas.width * scale));
    const height = Math.max(1, Math.round(sourceCanvas.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    return canvas;
  }

  function exportPng(state) {
    const timestamp = Date.now();
    const pngFileName = `jirai-editor-${timestamp}.png`;
    const jpgFileName = `jirai-editor-${timestamp}.jpg`;
    const triggerDownload = (href, downloadName = pngFileName) => {
      trackEvent('download_png', {
        source: isMobileLikeBrowser() ? 'mobile_fallback' : 'desktop_direct',
        compareMode: Boolean(state.compareMode),
        layerCount: state.layers.length,
      });
      const link = document.createElement('a');
      link.download = downloadName;
      link.href = href;
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    const markExportLimited = () => {
      if (!els.exportBtn) return;
      const original = els.exportBtn.textContent;
      els.exportBtn.textContent = '导出受限';
      window.setTimeout(() => {
        if (els.exportBtn) els.exportBtn.textContent = original;
      }, 1800);
    };

    const deliverExport = (href, downloadName = pngFileName) => {
      if (isMobileLikeBrowser()) {
        if (!showExportPreview(href, downloadName)) triggerDownload(href, downloadName);
      } else {
        triggerDownload(href, downloadName);
      }
    };

    const deliverBlob = (blob, downloadName = pngFileName) => {
      const url = URL.createObjectURL(blob);
      if (isMobileLikeBrowser()) {
        if (!showExportPreview(url, downloadName)) triggerDownload(url, downloadName);
      } else {
        triggerDownload(url, downloadName);
      }
      if (!isMobileLikeBrowser()) setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    // 优先同步 dataURL 导出，避免异步导致用户手势丢失而被浏览器拦截下载。
    try {
      const canvas = buildExportCanvas(state, false);
      const dataUrl = canvas.toDataURL('image/png');
      deliverExport(dataUrl);
      return;
    } catch {}

    try {
      const fallbackCanvas = buildExportCanvas(state, true);
      const dataUrl = fallbackCanvas.toDataURL('image/png');
      deliverExport(dataUrl);
      return;
    } catch {}

    try {
      const safeCanvas = buildExportCanvas(state, false, true);
      const dataUrl = safeCanvas.toDataURL('image/png');
      deliverExport(dataUrl);
      return;
    } catch {}

    try {
      const safeFallbackCanvas = buildExportCanvas(state, true, true);
      const dataUrl = safeFallbackCanvas.toDataURL('image/png');
      deliverExport(dataUrl);
      return;
    } catch {}

    try {
      const visibleCanvas = els.canvas;
      if (visibleCanvas?.width && visibleCanvas?.height) {
        const dataUrl = visibleCanvas.toDataURL('image/png');
        deliverExport(dataUrl);
        return;
      }
    } catch {}

    try {
      const compactVisibleCanvas = cloneCanvasAtMaxSide(els.canvas, isMobileLikeBrowser() ? 1400 : 1800);
      if (compactVisibleCanvas) {
        const dataUrl = compactVisibleCanvas.toDataURL('image/png');
        deliverExport(dataUrl);
        return;
      }
    } catch {}

    try {
      const compactVisibleCanvas = cloneCanvasAtMaxSide(els.canvas, isMobileLikeBrowser() ? 1400 : 1800);
      if (compactVisibleCanvas) {
        const dataUrl = compactVisibleCanvas.toDataURL('image/jpeg', 0.92);
        deliverExport(dataUrl, jpgFileName);
        return;
      }
    } catch {}

    // 异步 blob 作为兜底
    const tryAsyncBlob = async () => {
      try {
        const canvas = buildExportCanvas(state, true, true);
        const blob = await canvasToBlob(canvas);
        const file = new File([blob], pngFileName, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '导出图片' });
          return true;
        }
        deliverBlob(file);
        return true;
      } catch {
        try {
          const compactVisibleCanvas = cloneCanvasAtMaxSide(els.canvas, isMobileLikeBrowser() ? 1400 : 1800);
          if (!compactVisibleCanvas) return false;
          const compactBlob = await canvasToBlob(compactVisibleCanvas);
          const fallbackFile = new File([compactBlob], pngFileName, { type: 'image/png' });
          deliverBlob(fallbackFile);
          return true;
        } catch {
          try {
            const compactVisibleCanvas = cloneCanvasAtMaxSide(els.canvas, isMobileLikeBrowser() ? 1400 : 1800);
            if (!compactVisibleCanvas) return false;
            const jpgBlob = await canvasToBlob(compactVisibleCanvas, 'image/jpeg', 0.92);
            const jpgFile = new File([jpgBlob], jpgFileName, { type: 'image/jpeg' });
            deliverBlob(jpgFile, jpgFileName);
            return true;
          } catch {
            return false;
          }
        }
      }
    };

    tryAsyncBlob().then((ok) => {
      if (!ok) markExportLimited();
    });
  }

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

  const store = createStore();
  const previewRenderCache = {
    renderToken: -1,
    toneToken: -1,
    hiddenLayerId: null,
    interactivePreview: false,
    width: 0,
    height: 0,
    original: null,
    toneBase: null,
    edited: null,
  };

  const els = {
    canvas: document.getElementById('editorCanvas'),
    canvasFrame: document.getElementById('canvasFrame'),
    canvasEmpty: document.getElementById('canvasEmpty'),
    overlayLayer: document.getElementById('overlayLayer'),

    imageUpload: document.getElementById('imageUpload'),
    clearCanvasBtn: document.getElementById('clearCanvasBtn'),
    restoreOriginalBtn: document.getElementById('restoreOriginalBtn'),
    addFrostedMosaicBtn: document.getElementById('addFrostedMosaicBtn'),
    addGridMosaicBtn: document.getElementById('addGridMosaicBtn'),
    mosaicShapeCircleBtn: document.getElementById('mosaicShapeCircleBtn'),
    mosaicShapeHeartBtn: document.getElementById('mosaicShapeHeartBtn'),
    addTextLayerBtn: document.getElementById('addTextLayerBtn'),
    exportBtn: document.getElementById('exportBtn'),
    exportModal: document.getElementById('exportModal'),
    exportCloseBtn: document.getElementById('exportCloseBtn'),
    exportPreviewImage: document.getElementById('exportPreviewImage'),
    exportDownloadLink: document.getElementById('exportDownloadLink'),

    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    compareBtn: document.getElementById('compareBtn'),

    originalFilterBtn: document.getElementById('originalFilterBtn'),
    presetButtons: document.getElementById('presetButtons'),
    stickerPackList: document.getElementById('stickerPackList'),
    textTemplateList: document.getElementById('textTemplateList'),
    filterControls: document.getElementById('filterControls'),
    blushControls: document.getElementById('blushControls'),
    layerControls: document.getElementById('layerControls'),
    layerList: document.getElementById('layerList'),
    mobileLayerDock: document.getElementById('mobileLayerDock'),
    mobileLayerToggle: document.getElementById('mobileLayerToggle'),
    mobileLayerMenu: document.getElementById('mobileLayerMenu'),
    propFilterBlock: document.getElementById('propFilterBlock'),
    propLayerBlock: document.getElementById('propLayerBlock'),
    propListBlock: document.getElementById('propListBlock'),
    propertyPanel: document.querySelector('.PropertyPanel'),
    studioShell: document.querySelector('.studio-shell'),

    sidebarNav: document.getElementById('sidebarNav'),
  };

  const ctx = els.canvas.getContext('2d');
  const overlayController = createOverlayLayer(els.overlayLayer, store);
  let activeTool = 'project';
  const mosaicToolState = { ...MOSAIC_TOOL_DEFAULTS };
  let activeTextFontId = 'zhaizai-marker';
  let compareLongPressTimer = null;
  let compareLongPressActive = false;
  let comparePointerDownAt = 0;
  let compareToggleAt = 0;
  let compareSuppressClickUntil = 0;

  function getCompareCycleEventMode(state) {
    if (!state.compareMode) return 'labeled';
    if (state.compareLabels !== false) return 'unlabeled';
    return 'off';
  }
  const COMPARE_LONG_PRESS_MS = 220;
  let brandSubtitleTimer = null;
  let latestExportUrl = '';
  let latestExportFileName = 'jirai-editor.png';
  let visionSkillLoadPromise = null;
  let pendingRenderFrame = 0;
  let pendingRenderTimer = 0;
  let pendingRenderState = null;
  let lastInteractiveRenderAt = 0;
  let mobileLayerMenuOpen = false;
  let mobileLayerControlsExpanded = false;
  let activeFilterPanel = 'basic';
  let lastLayerControlsKey = '';
  let lastCanvasFrameWidth = 0;
  let lastCanvasFrameHeight = 0;
  let stickerPanelRendered = false;
  let textTemplatesRendered = false;

  function isTouchTabletViewport() {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const longSide = Math.max(window.innerWidth || 0, window.innerHeight || 0);
    const tabletSize = shortSide >= 761 && shortSide <= 1180 && longSide <= 1400;
    const ipadDesktopUa = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const ipadUa = /ipad/i.test(navigator.userAgent);
    return coarsePointer && tabletSize && (ipadDesktopUa || ipadUa || navigator.maxTouchPoints > 1);
  }

  function isMobileLayoutViewport() {
    return window.matchMedia('(max-width: 760px)').matches || (isTouchTabletViewport() && window.matchMedia('(orientation: portrait)').matches);
  }

  function isBlockedTabletLandscape() {
    return isTouchTabletViewport() && window.matchMedia('(orientation: landscape)').matches;
  }

  function syncViewportMode() {
    document.documentElement.classList.toggle('force-mobile-layout', isMobileLayoutViewport());
    document.documentElement.classList.toggle('tablet-landscape-locked', isBlockedTabletLandscape());
  }

  function isMobileViewport() {
    return isMobileLayoutViewport();
  }

  function syncCanvasFrameSize() {
    const stage = els.canvasFrame?.parentElement;
    if (!stage) return;
    const state = store.getState();
    const styles = window.getComputedStyle(stage);
    const padX = Number.parseFloat(styles.paddingLeft || '0') + Number.parseFloat(styles.paddingRight || '0');
    const padY = Number.parseFloat(styles.paddingTop || '0') + Number.parseFloat(styles.paddingBottom || '0');
    const maxWidth = Math.min(stage.clientWidth - padX, 980);
    const maxHeight = stage.clientHeight - padY;
    if (maxWidth <= 0 || maxHeight <= 0) return;
    const ratio = (state.canvas?.height && state.canvas?.width) ? state.canvas.height / state.canvas.width : 5 / 4;
    let width = maxWidth;
    let height = width * ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / ratio;
    }
    const nextWidth = Math.max(120, width);
    const nextHeight = Math.max(120, height);
    if (Math.abs(nextWidth - lastCanvasFrameWidth) > 0.5 || Math.abs(nextHeight - lastCanvasFrameHeight) > 0.5) {
      lastCanvasFrameWidth = nextWidth;
      lastCanvasFrameHeight = nextHeight;
      els.canvasFrame.style.width = `${nextWidth}px`;
      els.canvasFrame.style.height = `${nextHeight}px`;
    }
  }

  async function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function resolveAssetUrl(path, version = '') {
    const url = new URL(path, window.location.href);
    if (version) url.searchParams.set('v', version);
    return url.href;
  }

  function buildPixelStickerPack() {
    const stickers = USER_STICKER_FILES.map((fileName, index) => ({
      id: `user-${index + 1}`,
      name: `贴纸 ${index + 1}`,
      src: resolveAssetUrl(`./assets/user_stickers/${fileName}`, USER_STICKER_VERSION),
      fallbackSrc: resolveAssetUrl(`./assets/user_stickers/${fileName}`),
    }));
    stickerPacks = stickers.length
      ? [{ id: 'user-pack', name: '地雷系像素风贴纸', stickers }]
      : [];
  }

  function preloadStickerImages() {
    stickerPacks.forEach((pack) => {
      pack.stickers.forEach((sticker) => {
        if (STICKER_IMAGE_CACHE.has(sticker.src)) return;
        const img = new Image();
        img.onload = () => {
          STICKER_IMAGE_CACHE.set(sticker.src, img);
          if (sticker.fallbackSrc) STICKER_IMAGE_CACHE.set(sticker.fallbackSrc, img);
        };
        img.onerror = () => {
          if (!sticker.fallbackSrc || img.src === sticker.fallbackSrc) return;
          img.src = sticker.fallbackSrc;
        };
        img.src = sticker.src;
      });
    });
  }

  function runWhenIdle(callback, timeout = 900) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
      return;
    }
    window.setTimeout(callback, 80);
  }

  function addMosaic(variant, overrides = {}) {
    mobileLayerControlsExpanded = true;
    const state = store.getState();
    const canvasWidth = Math.max(1, state.canvas?.width || FIXED_CANVAS.width);
    const canvasHeight = Math.max(1, state.canvas?.height || FIXED_CANVAS.height);
    const widthNorm = 0.2;
    const heightNorm = clamp((widthNorm * canvasWidth) / canvasHeight, 0.04, 0.95);
    store.addLayer({
      type: 'mosaic',
      name: variant === 'frosted' ? '雾化模糊马赛克' : '网格玻璃马赛克',
      variant,
      shape: 'circle',
      width: widthNorm,
      height: heightNorm,
      feather: mosaicToolState.feather,
      featherRange: mosaicToolState.featherRange,
      intensity: mosaicToolState.strength,
      whiteOpacity: mosaicToolState.whiteOpacity,
      cellSize: 8,
      gridAlpha: 0.3,
      ...overrides,
    });
  }

  function addSticker(sticker) {
    setActiveTool('stickers');
    mobileLayerControlsExpanded = true;
    const state = store.getState();
    const canvasWidth = Math.max(1, state.canvas?.width || FIXED_CANVAS.width);
    const canvasHeight = Math.max(1, state.canvas?.height || FIXED_CANVAS.height);
    const img = STICKER_IMAGE_CACHE.get(sticker.src);
    const ratio = img && img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalHeight / img.naturalWidth : 1;
    let widthNorm = 0.18;
    let heightNorm = (widthNorm * canvasWidth * ratio) / canvasHeight;
    if (heightNorm > 0.42) {
      heightNorm = 0.42;
      widthNorm = (heightNorm * canvasHeight) / (canvasWidth * ratio);
    }
    store.addLayer({
      type: 'sticker',
      name: `贴纸：${sticker.name}`,
      src: sticker.src,
      width: clamp(widthNorm, 0.04, 0.95),
      height: clamp(heightNorm, 0.04, 0.95),
      aspectRatio: ratio,
    });
    trackEvent('sticker_add', {
      stickerId: sticker.id || 'unknown',
      packId: sticker.packId || 'user-pack',
      hasImage: Boolean(state.image.loaded),
    });
    render(store.getState());
  }

  function addText(preset = null) {
    mobileLayerControlsExpanded = true;
    const selectedPreset = preset || { content: DEFAULT_TEXT_STYLE.content, style: {} };
    const preferredFontId = selectedPreset.fontId || activeTextFontId;
    const selectedFont = TEXT_FONTS.find((font) => font.id === preferredFontId) || TEXT_FONTS[0];
    ensureTextFontLoaded(selectedFont);
    store.addLayer({
      type: 'text',
      name: getTextLayerName(selectedPreset.content),
      width: 0.44,
      height: 0.12,
      x: 0.72,
      y: 0.82,
      ...DEFAULT_TEXT_STYLE,
      ...selectedPreset.style,
      fontFamily: getRuntimeFontFamily(selectedFont),
      fontId: selectedFont.id,
      content: selectedPreset.content,
    });
    trackEvent('text_add', {
      source: preset ? 'template' : 'default',
      fontId: selectedFont.id,
      presetId: selectedPreset.id || 'default',
      hasImage: Boolean(store.getState().image.loaded),
    });
  }

  function applyOriginal() {
    store.setFilters(preserveManualBlushRegion(store.getState().filters, DEFAULT_FILTERS), 'original');
    trackEvent('filter_preset_apply', { presetId: 'original' });
  }

  function resetFiltersToOriginal() {
    store.setFilters(preserveManualBlushRegion(store.getState().filters, DEFAULT_FILTERS), 'original');
  }

  function formatRatio(width, height) {
    if (!width || !height) return '4:5';
    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }
    const base = gcd(width, height);
    return `${Math.round(width / base)}:${Math.round(height / base)}`;
  }

  function isOriginalFilters(filters) {
    const hslIsNeutral = HSL_CHANNELS.every((channel) =>
      HSL_AXES.every(({ axis }) => Math.abs(Number(filters[hslKey(channel.id, axis)] ?? 0)) < 0.001)
    );
    return (
      Math.abs(filters.brightness - 1) < 0.001 &&
      Math.abs(filters.contrast - 1) < 0.001 &&
      Math.abs(filters.saturation - 1) < 0.001 &&
      hslIsNeutral &&
      Math.abs(filters.temperature) < 0.001 &&
      Math.abs(filters.tint) < 0.001 &&
      Math.abs(filters.skinWhiten ?? 0) < 0.001 &&
      Math.abs(filters.blushStrength ?? 0) < 0.001 &&
      Math.abs(filters.blackProtect ?? 0) < 0.001 &&
      Math.abs(filters.fade) < 0.001 &&
      Math.abs(filters.overlayStrength) < 0.001
    );
  }

  function renderPresetButtons(state) {
    els.presetButtons.innerHTML = '';
    const currentPresetId = state.activePresetId || (isOriginalFilters(state.filters) ? 'original' : null);

    FILTER_PRESETS.forEach((preset) => {
      if (preset.id === 'original') return;
      const button = document.createElement('button');
      button.className = 'preset-chip';
      if (currentPresetId === preset.id) {
        button.classList.add('is-active');
      }
      const name = document.createElement('span');
      name.className = 'preset-name';
      name.textContent = preset.name;
      const desc = document.createElement('span');
      desc.className = 'preset-desc';
      desc.textContent = preset.description;
      button.append(name, desc);
      button.onclick = () => {
        store.setFilters(preserveManualBlushRegion(store.getState().filters, preset.filters), preset.id);
        trackEvent('filter_preset_apply', { presetId: preset.id });
      };
      els.presetButtons.appendChild(button);
    });
  }

  function renderStickerPanel() {
    els.stickerPackList.innerHTML = '';

    stickerPacks.forEach((pack) => {
      const packEl = document.createElement('div');
      packEl.className = 'sticker-pack';

      const grid = document.createElement('div');
      grid.className = 'sticker-grid';

      pack.stickers.forEach((sticker) => {
        const btn = document.createElement('button');
        btn.className = 'sticker-btn';
        btn.title = sticker.name;

        const img = document.createElement('img');
        img.alt = sticker.name;
        img.loading = 'eager';
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'high');
        img.onload = () => {
          if (!STICKER_IMAGE_CACHE.has(sticker.src)) STICKER_IMAGE_CACHE.set(sticker.src, img);
          if (sticker.fallbackSrc && !STICKER_IMAGE_CACHE.has(sticker.fallbackSrc)) STICKER_IMAGE_CACHE.set(sticker.fallbackSrc, img);
        };
        img.onerror = () => {
          if (!sticker.fallbackSrc || img.src === sticker.fallbackSrc) return;
          img.src = sticker.fallbackSrc;
        };
        img.src = sticker.src;

        btn.appendChild(img);
        btn.onclick = () => addSticker(sticker);
        grid.appendChild(btn);
      });

      packEl.append(grid);
      els.stickerPackList.appendChild(packEl);
    });
  }

  function ensureStickerPanelRendered() {
    if (stickerPanelRendered) return;
    renderStickerPanel();
    stickerPanelRendered = true;
  }

  function renderTextTemplates() {
    els.textTemplateList.innerHTML = '';

    TEXT_PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.className = 'preset-chip text-preset-chip';
      const content = document.createElement('span');
      const font = TEXT_FONTS.find((item) => item.id === (preset.fontId || activeTextFontId));
      const useFontPreview = shouldApplyFontPreviewClass(font);
      content.className = `text-preset-content ${useFontPreview ? font.className : ''}`.trim();
      content.textContent = preset.content;
      const presetFontFamily = useFontPreview ? getRuntimeFontFamily(font) || DEFAULT_TEXT_STYLE.fontFamily : TEXT_FONTS[0].family;
      btn.style.setProperty('--text-preset-family', presetFontFamily);
      content.style.setProperty('--text-preset-family', presetFontFamily);
      btn.append(content);
      btn.onclick = () => addText(preset);
      els.textTemplateList.appendChild(btn);
    });
    scheduleFontPreviewWarmup('mushin');
  }

  function ensureTextTemplatesRendered() {
    if (textTemplatesRendered) return;
    renderTextTemplates();
    textTemplatesRendered = true;
  }

  function preloadTextFonts() {
    const byId = new Map(TEXT_FONTS.map((font) => [font.id, font]));
    const orderedFonts = [
      ...TEXT_FONT_WARMUP_ORDER.map((id) => byId.get(id)).filter(Boolean),
      ...TEXT_FONTS.filter((font) => font.id !== 'system' && !TEXT_FONT_WARMUP_ORDER.includes(font.id)),
    ];
    return orderedFonts.reduce((chain, font) => chain.then(() => ensureTextFontLoaded(font)), Promise.resolve());
  }

  function renderBlushControls(state) {
    if (!els.blushControls) return;
    els.blushControls.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'inline-actions two-col';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = blushEditMode ? '完成腮红选区编辑' : '编辑腮红选区';
    editBtn.classList.toggle('is-active', blushEditMode);
    editBtn.onclick = () => {
      if (!state.image.loaded) {
        alert('请先上传图片。');
        return;
      }
      if (!blushEditMode) {
        blushPreviewEnabled = true;
        overlayController.ensureManualBlushSetup();
      }
      blushEditMode = !blushEditMode;
      render(store.getState());
    };

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = '恢复自动腮红';
    resetBtn.onclick = () => {
      blushEditMode = false;
      store.setFilters(
        {
          blushManual: 0,
          blushLeftEnabled: 1,
          blushRightEnabled: 1,
          blushExtraEnabled: 0,
          blushExtraLeftEnabled: 1,
          blushExtraRightEnabled: 1,
        },
        state.activePresetId ?? 'original',
        true
      );
      render(store.getState());
    };

    row.append(editBtn, resetBtn);
    els.blushControls.appendChild(row);

    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.textContent = blushPreviewEnabled ? '隐藏腮红区域预览' : '显示腮红区域预览';
    previewBtn.classList.toggle('is-active', blushPreviewEnabled);
    previewBtn.onclick = () => {
      blushPreviewEnabled = !blushPreviewEnabled;
      render(store.getState());
    };
    els.blushControls.appendChild(previewBtn);

    const extraEnabled = Number(state.filters.blushExtraEnabled ?? 0) > 0.5;
    const extraBtn = document.createElement('button');
    extraBtn.type = 'button';
    extraBtn.textContent = extraEnabled ? '已添加第二组腮红' : '新增一组腮红';
    extraBtn.classList.toggle('is-active', extraEnabled);
    extraBtn.disabled = extraEnabled;
    extraBtn.onclick = () => overlayController.addExtraBlushGroup();
    els.blushControls.appendChild(extraBtn);
  }

  function renderFilterControls(state) {
    els.filterControls.innerHTML = '';
    const selectedPreset = FILTER_PRESETS.find((preset) => preset.id === state.activePresetId);
    const isOriginalMode = (state.activePresetId ?? 'original') === 'original';

    const filterPanels = [
      { id: 'basic', label: '基础', keys: ['overlayStrength', 'brightness', 'contrast', 'saturation', 'temperature', 'tint', 'fade'] },
      { id: 'portrait', label: '人像', keys: ['skinWhiten', 'blushStrength', 'blackProtect'] },
      { id: 'hsl', label: 'HSL', keys: [] },
    ];

    const panelTabs = document.createElement('div');
    panelTabs.className = 'filter-panel-tabs';
    filterPanels.forEach((panel) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = panel.label;
      btn.className = 'filter-panel-tab';
      if (activeFilterPanel === panel.id) btn.classList.add('is-active');
      btn.onclick = () => {
        activeFilterPanel = panel.id;
        renderFilterControls(store.getState());
      };
      panelTabs.appendChild(btn);
    });
    els.filterControls.appendChild(panelTabs);

    const activePanel = filterPanels.find((panel) => panel.id === activeFilterPanel) || filterPanels[0];

    if (activePanel.id !== 'hsl') {
      FILTER_CONTROL_DEFS.filter((control) => activePanel.keys.includes(control.key)).forEach((control) => {
      if (isOriginalMode && control.key === 'overlayStrength') return;
      const controlMax =
        control.key === 'overlayStrength' && selectedPreset?.overlayStrengthMax
          ? selectedPreset.overlayStrengthMax
          : control.max;
      const controlStep = control.key === 'overlayStrength' && controlMax <= 0.1 ? Math.max(0.0005, controlMax / 80) : control.step;
      els.filterControls.appendChild(
        makeSlider({
          label: control.label,
          min: control.min,
          max: controlMax,
          step: controlStep,
          value: clamp(Number(state.filters[control.key] ?? control.min), control.min, controlMax),
          commitOnEnd: true,
          onBegin: () => store.beginStep(),
          onPreview: (value) => {
            const currentFilters = store.getState().filters;
            sliderPreviewFilters =
              control.key === 'overlayStrength' && selectedPreset && selectedPreset.id !== 'original'
                ? { ...currentFilters, ...blendPresetFiltersByStrength(selectedPreset.filters, value) }
                : { ...currentFilters, [control.key]: value };
            applyCanvasCssInteractionPreview(store.getState());
          },
          onInput: (value) => {
            if (control.key === 'overlayStrength' && selectedPreset && selectedPreset.id !== 'original') {
              store.setFilters(blendPresetFiltersByStrength(selectedPreset, value), state.activePresetId ?? 'original', false);
              return;
            }
            store.setFilters({ [control.key]: value }, state.activePresetId ?? 'original', false);
          },
          onEnd: () => {
            trackEvent('filter_adjust', {
              key: control.key,
              presetId: state.activePresetId ?? 'original',
              panel: activePanel.id,
            });
          },
        })
      );
      });

      if (activePanel.id === 'basic' && !isOriginalMode) {
        els.filterControls.appendChild(
          makeColorInput({
            label: '预设叠加主色',
            value: state.filters.overlayColor || '#e7d3ea',
            onBegin: () => store.beginStep(),
            onInput: (value) => store.setFilters({ overlayColor: value }, state.activePresetId ?? 'original', false),
            onEnd: () => {
              trackEvent('filter_adjust', {
                key: 'overlayColor',
                presetId: state.activePresetId ?? 'original',
                panel: activePanel.id,
              });
            },
          })
        );
      }
      return;
    }

    const channelRow = document.createElement('div');
    channelRow.className = 'inline-actions hsl-channel-row';
    const activeChannel = state.filters.hslActiveChannel || 'master';
    HSL_CHANNELS.forEach((channel) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hsl-channel-btn';
      if (activeChannel === channel.id) btn.classList.add('is-active');
      btn.title = channel.name;
      btn.setAttribute('aria-label', channel.name);
      btn.innerHTML = `<svg class="hsl-heart" style="--hsl-swatch:${channel.swatch}" viewBox="0 0 32 29" aria-hidden="true"><path d="M16 28C10 22.7 4.9 18.4 2.4 14.4C-1.4 8.3 2.1 1 8.7 1C12.2 1 14.5 2.9 16 5.1C17.5 2.9 19.8 1 23.3 1C29.9 1 33.4 8.3 29.6 14.4C27.1 18.4 22 22.7 16 28Z"></path></svg>`;
      btn.onclick = () => store.setFilters({ hslActiveChannel: channel.id }, state.activePresetId ?? 'original', true);
      channelRow.appendChild(btn);
    });
    els.filterControls.appendChild(channelRow);

    HSL_AXES.forEach((item) => {
      const key = hslKey(activeChannel, item.axis);
      const sliderValue = clamp(Number(state.filters[key] ?? 0), item.min, item.max);
      const activeSwatch = HSL_CHANNELS.find((c) => c.id === activeChannel)?.swatch || '#8adf75';
      const swatchRgb = activeSwatch.replace('#', '');
      const sr = Number.parseInt(swatchRgb.slice(0, 2), 16);
      const sg = Number.parseInt(swatchRgb.slice(2, 4), 16);
      const sb = Number.parseInt(swatchRgb.slice(4, 6), 16);
      const [h, , l] = rgbToHsl(sr, sg, sb);
      const [dr, dg, db] = hslToRgb(0, 0, l);
      const desatSwatch = rgbToHex(dr, dg, db);
      const [hlr, hlg, hlb] = hslToRgb((h - 70 + 360) % 360, 0.85, 0.62);
      const [hcr, hcg, hcb] = hslToRgb(h, 0.9, 0.62);
      const [hrr, hrg, hrb] = hslToRgb((h + 70) % 360, 0.85, 0.62);
      const hueLeft = rgbToHex(hlr, hlg, hlb);
      const hueCenter = rgbToHex(hcr, hcg, hcb);
      const hueRight = rgbToHex(hrr, hrg, hrb);
      const axisTrack =
        item.axis === 'h'
          ? activeChannel === 'master'
            ? 'linear-gradient(90deg,#ff49d8,#ff5f62,#ffac45,#f2e95d,#72df6a,#58cde1,#6e7df2,#b56cf1,#ff49d8)'
            : `linear-gradient(90deg,${hueLeft},${hueCenter},${hueRight})`
          : item.axis === 's'
            ? `linear-gradient(90deg,${desatSwatch},${activeSwatch})`
            : `linear-gradient(90deg,#1f1a20,${activeSwatch},#ffffff)`;
      els.filterControls.appendChild(
        makeSlider({
          label: item.label,
          min: item.min,
          max: item.max,
          step: item.step,
          value: sliderValue,
          rangeClass: 'hsl-range',
          trackGradient: axisTrack,
          commitOnEnd: true,
          onBegin: () => store.beginStep(),
          onPreview: (value) => {
            sliderPreviewFilters = { ...store.getState().filters, [key]: value };
            applyCanvasCssInteractionPreview(store.getState());
          },
          onInput: (value) => store.setFilters({ [key]: value }, state.activePresetId ?? 'original', false),
          onEnd: () => {
            trackEvent('filter_adjust', {
              key,
              channel: activeChannel,
              axis: item.axis,
              presetId: state.activePresetId ?? 'original',
              panel: 'hsl',
            });
          },
        })
      );
    });

  }

  function renderMosaicToolButtons() {
    els.addFrostedMosaicBtn?.classList.toggle('is-active', mosaicToolState.variant === 'frosted');
    els.addGridMosaicBtn?.classList.toggle('is-active', mosaicToolState.variant === 'grid-glass');
  }

  function pushSharedLayerControls(layer, node) {
    node.appendChild(
      makeSlider({
        label: '不透明度',
        min: 0,
        max: 1,
        step: 0.01,
        value: layer.opacity ?? 1,
        onBegin: () => store.beginStep(),
        onInput: (v) => store.updateLayer(layer.id, { opacity: v }),
      })
    );
  }

  function renderLayerControls(state) {
    const selected = state.layers.find((layer) => layer.id === state.selectedLayerId);
    els.layerControls.innerHTML = '';

    if (!selected) {
      els.layerControls.classList.add('muted');
      if (activeTool === 'mosaic') {
        els.layerControls.textContent = '请选择一个马赛克图层。';
      } else if (activeTool === 'stickers') {
        els.layerControls.textContent = '请选择一个贴纸图层。';
      } else if (activeTool === 'text') {
        els.layerControls.textContent = '请选择一个文字图层。';
      } else {
        els.layerControls.textContent = '请选择一个图层。';
      }
      return;
    }

    els.layerControls.classList.remove('muted');

    const title = document.createElement('div');
    title.className = 'layer-control-title';
    title.textContent = selected.name;
    els.layerControls.appendChild(title);

    if (selected.type !== 'mosaic') {
      pushSharedLayerControls(selected, els.layerControls);
    }

    if (selected.type === 'sticker') {
      els.layerControls.appendChild(
        makeSlider({
          label: '缩放',
          min: 0.05,
          max: 0.8,
          step: 0.01,
          value: selected.width ?? 0.2,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { width: v }),
        })
      );
    }

    if (selected.type === 'mosaic') {
      els.layerControls.appendChild(
        makeSlider({
          label: '羽化',
          min: 0,
          max: 0.8,
          step: 0.01,
          value: selected.feather ?? 0.1,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { feather: v }),
        })
      );
      els.layerControls.appendChild(
        makeSlider({
          label: '羽化范围',
          min: 0,
          max: 2.5,
          step: 0.01,
          value: selected.featherRange ?? 1,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { featherRange: v }),
        })
      );
      els.layerControls.appendChild(
        makeSlider({
          label: '白色覆盖(透明→不透明)',
          min: 0,
          max: 1,
          step: 0.01,
          value: selected.whiteOpacity ?? 0.34,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { whiteOpacity: v }),
        })
      );

      if (selected.variant === 'frosted') {
        // 雾化模糊强度固定，避免与风格预设冲突
      } else {
        els.layerControls.appendChild(
          makeSlider({
            label: '网格大小',
            min: 4,
            max: 24,
            step: 1,
            value: selected.cellSize ?? 8,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { cellSize: v }),
          })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '网格透明度',
            min: 0.05,
            max: 0.7,
            step: 0.01,
            value: selected.gridAlpha ?? 0.3,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { gridAlpha: v }),
          })
        );
      }
    }

    if (selected.type === 'text') {
      const strokeOn = (selected.strokeWidth ?? 4) > 0;
      const bgOn = (selected.bgOpacity ?? 0) > 0;
      const shadowOn = (selected.shadowBlur ?? 0) > 0;
      const noneActions = document.createElement('div');
      noneActions.className = 'inline-actions three-col';
      const strokeBtn = document.createElement('button');
      strokeBtn.type = 'button';
      strokeBtn.textContent = strokeOn ? '关闭描边' : '开启描边';
      strokeBtn.classList.toggle('is-active', strokeOn);
      strokeBtn.onclick = () => store.updateLayer(selected.id, { strokeWidth: strokeOn ? 0 : 3 }, true);
      const bgBtn = document.createElement('button');
      bgBtn.type = 'button';
      bgBtn.textContent = bgOn ? '关闭背景' : '开启背景';
      bgBtn.classList.toggle('is-active', bgOn);
      bgBtn.onclick = () => store.updateLayer(selected.id, { bgOpacity: bgOn ? 0 : 0.72 }, true);
      const shadowBtn = document.createElement('button');
      shadowBtn.type = 'button';
      shadowBtn.textContent = shadowOn ? '关闭阴影' : '开启阴影';
      shadowBtn.classList.toggle('is-active', shadowOn);
      shadowBtn.onclick = () => store.updateLayer(selected.id, { shadowBlur: shadowOn ? 0 : 8 }, true);
      noneActions.append(strokeBtn, bgBtn, shadowBtn);
      els.layerControls.appendChild(noneActions);

      els.layerControls.appendChild(
        makeTextInput({
          label: '内容',
          value: selected.content ?? '',
          multiline: true,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { content: v }),
        })
      );
      const alignActions = document.createElement('div');
      alignActions.className = 'inline-actions three-col';
      [
        ['left', '左对齐'],
        ['center', '居中'],
        ['right', '右对齐'],
      ].forEach(([value, label]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.classList.toggle('is-active', (selected.textAlign ?? 'center') === value);
        btn.onclick = () => store.updateLayer(selected.id, { textAlign: value }, true);
        alignActions.appendChild(btn);
      });
      els.layerControls.appendChild(alignActions);
      els.layerControls.appendChild(
        makeFontPicker({
          label: '字体',
          value: selected.fontId || TEXT_FONTS.find((font) => font.family === selected.fontFamily || font.mobileFamily === selected.fontFamily)?.id || activeTextFontId,
          onInput: (fontId) => {
            activeTextFontId = fontId;
            const font = TEXT_FONTS.find((item) => item.id === fontId) || TEXT_FONTS[0];
            store.updateLayer(selected.id, { fontFamily: getRuntimeFontFamily(font), fontId: font.id }, true);
          },
        })
      );
      els.layerControls.appendChild(
        makeSlider({
          label: '字号',
          min: 16,
          max: 180,
          step: 1,
          value: selected.fontSize ?? 56,
          onBegin: () => store.beginStep(),
          onInput: (v) => store.updateLayer(selected.id, { fontSize: v }),
        })
      );
      els.layerControls.appendChild(
        makeColorInput({ label: '文字颜色', value: selected.color ?? '#ffeef5', onInput: (v) => store.updateLayer(selected.id, { color: v }, true) })
      );
      if (bgOn) {
        els.layerControls.appendChild(
          makeColorInput({ label: '背景颜色', value: selected.bgColor ?? '#2a1d2a', onInput: (v) => store.updateLayer(selected.id, { bgColor: v }, true) })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '背景透明度',
            min: 0,
            max: 1,
            step: 0.01,
            value: selected.bgOpacity ?? 0,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { bgOpacity: v }),
          })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '背景留白',
            min: 0,
            max: 40,
            step: 1,
            value: selected.bgPadding ?? 18,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { bgPadding: v }),
          })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '背景圆角',
            min: 0,
            max: 40,
            step: 1,
            value: selected.bgRadius ?? 16,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { bgRadius: v }),
          })
        );
      }
      if (strokeOn) {
        els.layerControls.appendChild(
          makeColorInput({ label: '描边颜色', value: selected.strokeColor ?? '#2f2532', onInput: (v) => store.updateLayer(selected.id, { strokeColor: v }, true) })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '描边宽度',
            min: 0,
            max: 16,
            step: 1,
            value: selected.strokeWidth ?? 4,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { strokeWidth: v }),
          })
        );
      }
      if (shadowOn) {
        els.layerControls.appendChild(
          makeColorInput({ label: '阴影颜色', value: selected.shadowColor ?? '#2f2532', onInput: (v) => store.updateLayer(selected.id, { shadowColor: v }, true) })
        );
        els.layerControls.appendChild(
          makeSlider({
            label: '阴影强度',
            min: 0,
            max: 40,
            step: 1,
            value: selected.shadowBlur ?? 8,
            onBegin: () => store.beginStep(),
            onInput: (v) => store.updateLayer(selected.id, { shadowBlur: v }),
          })
        );
      }
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
      titleBtn.onclick = () => {
        setActiveTool(toolForLayer(layer));
        store.selectLayer(layer.id);
        render(store.getState());
      };

      const actions = document.createElement('div');
      actions.className = 'layer-actions';

      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = layer.visible ? '隐' : '显';
      toggleBtn.onclick = () => store.updateLayer(layer.id, { visible: !layer.visible }, true);

      const upBtn = document.createElement('button');
      upBtn.textContent = '↑';
      upBtn.onclick = () => store.moveLayer(layer.id, 1);

      const downBtn = document.createElement('button');
      downBtn.textContent = '↓';
      downBtn.onclick = () => store.moveLayer(layer.id, -1);

      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.onclick = () => store.removeLayer(layer.id);

      actions.append(toggleBtn, upBtn, downBtn, delBtn);
      row.append(titleBtn, actions);
      els.layerList.appendChild(row);
    });
  }

  function revealLayerControlsFor(layer) {
    if (!layer) return;
    setActiveTool(toolForLayer(layer));
    if (activeTool !== 'project') {
      blushEditMode = false;
      blushPreviewEnabled = false;
    }
    mobileLayerControlsExpanded = true;
    renderLayerControls(store.getState());
    if (els.propLayerBlock) els.propLayerBlock.style.display = '';
    if (els.propertyPanel) els.propertyPanel.classList.remove('is-empty');
    if (els.studioShell) {
      els.studioShell.dataset.activeTool = activeTool;
      els.studioShell.dataset.mobileLayerPanel = isMobileViewport() ? 'open' : 'collapsed';
    }
  }

  function toolForLayer(layer) {
    if (!layer) return activeTool;
    if (layer.type === 'mosaic') return 'mosaic';
    if (layer.type === 'sticker') return 'stickers';
    if (layer.type === 'text') return 'text';
    return activeTool;
  }

  function setActiveTool(tool) {
    activeTool = tool;
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    document.querySelectorAll('.tool-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.dataset.pane === tool);
    });
    if (tool === 'stickers') {
      ensureStickerPanelRendered();
      preloadStickerImages();
    }
    if (tool === 'text') ensureTextTemplatesRendered();
  }

  function enterManualBlushFallback() {
    setActiveTool('project');
    blushPreviewEnabled = true;
    blushEditMode = true;
    overlayController.ensureManualBlushSetup();
    if (!blushFallbackNoticeShown) {
      blushFallbackNoticeShown = true;
      window.alert('无法自动识别腮红位置，请拖动画面上的腮红选区手动调整。');
    }
    render(store.getState());
  }

  function renderMobileLayerDock(state) {
    if (!els.mobileLayerDock || !els.mobileLayerToggle || !els.mobileLayerMenu) return;
    const hasLayers = state.layers.length > 0;
    els.mobileLayerDock.classList.toggle('has-layers', hasLayers);
    els.mobileLayerDock.classList.toggle('is-open', hasLayers && mobileLayerMenuOpen);
    els.mobileLayerToggle.disabled = !hasLayers;
    els.mobileLayerToggle.setAttribute('aria-expanded', String(hasLayers && mobileLayerMenuOpen));
    els.mobileLayerToggle.textContent = hasLayers ? `图层 ${state.layers.length}` : '图层';
    els.mobileLayerMenu.setAttribute('aria-hidden', String(!(hasLayers && mobileLayerMenuOpen)));
    els.mobileLayerMenu.innerHTML = '';

    if (!hasLayers) return;

    [...state.layers].reverse().forEach((layer) => {
      const row = document.createElement('div');
      row.className = 'mobile-layer-row';
      if (state.selectedLayerId === layer.id) row.classList.add('selected');

      const selectBtn = document.createElement('button');
      selectBtn.type = 'button';
      selectBtn.className = 'mobile-layer-select';
      selectBtn.textContent = `${layer.visible ? '●' : '○'} ${layer.name}`;
      selectBtn.onclick = () => {
        store.selectLayer(layer.id);
        setActiveTool(toolForLayer(layer));
        mobileLayerControlsExpanded = true;
        mobileLayerMenuOpen = false;
        render(store.getState());
      };

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'mobile-layer-action';
      toggleBtn.textContent = layer.visible ? '隐' : '显';
      toggleBtn.onclick = () => store.updateLayer(layer.id, { visible: !layer.visible }, true);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'mobile-layer-action';
      deleteBtn.textContent = '×';
      deleteBtn.onclick = () => store.removeLayer(layer.id);

      row.append(selectBtn, toggleBtn, deleteBtn);
      els.mobileLayerMenu.appendChild(row);
    });
  }

  function render(state) {
    syncCanvasFrameSize();
    try {
      renderCanvas(ctx, state);
    } catch (error) {
      console.error('Canvas render failed:', error);
      if (state.image.loaded && state.image.element) {
        const previewState = createPreviewRenderState(state);
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = previewState.canvas.width;
        fallbackCanvas.height = previewState.canvas.height;
        const fallbackCtx = fallbackCanvas.getContext('2d');
        if (!fallbackCtx) return;
        try {
          fallbackCtx.drawImage(previewState.image.element, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
          if (ctx.canvas.width !== fallbackCanvas.width) ctx.canvas.width = fallbackCanvas.width;
          if (ctx.canvas.height !== fallbackCanvas.height) ctx.canvas.height = fallbackCanvas.height;
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.drawImage(fallbackCanvas, 0, 0);
        } catch {}
      }
    }
    if (!isSliderDragging && !isTextEditing) {
      overlayController.render();
    }

    els.canvasEmpty.style.display = state.image.loaded ? 'none' : 'grid';
    els.canvasFrame.classList.toggle('interactive', state.image.loaded);
    els.canvasFrame.classList.toggle('compare-on', state.compareMode);
    els.overlayLayer.style.display = state.compareMode || state.comparePeekOriginal ? 'none' : 'block';
    els.compareBtn.classList.toggle('is-active', state.compareMode);
    if (els.originalFilterBtn) {
      els.originalFilterBtn.classList.toggle('is-active', (state.activePresetId ?? 'original') === 'original');
    }

    els.undoBtn.disabled = !store.canUndo();
    els.redoBtn.disabled = !store.canRedo();
    if (isMobileViewport()) {
      if (els.clearCanvasBtn) els.clearCanvasBtn.textContent = '清空';
      if (els.restoreOriginalBtn) els.restoreOriginalBtn.textContent = '原图';
    } else {
      if (els.clearCanvasBtn) els.clearCanvasBtn.textContent = '清空画布';
      if (els.restoreOriginalBtn) els.restoreOriginalBtn.textContent = '恢复原图';
    }

    if (!isSliderDragging && !isTextEditing) {
      renderPresetButtons(state);
      renderBlushControls(state);
    }
    const selectedForControls = state.layers.find((layer) => layer.id === state.selectedLayerId);
    const layerControlsKey = `${activeTool}|${state.selectedLayerId || ''}|${selectedForControls?.type || ''}|${state.layers.length}`;
    const mustRefreshLayerControls = layerControlsKey !== lastLayerControlsKey;
    if (!isSliderDragging && !isTextEditing) {
      if (!isDirectManipulating) {
        renderFilterControls(state);
      }
      if (!isDirectManipulating || mustRefreshLayerControls) {
        renderLayerControls(state);
        lastLayerControlsKey = layerControlsKey;
      }
      if (!isDirectManipulating) {
        renderLayerList(state);
      }
    }
    if (!isSliderDragging && !isTextEditing) {
      renderMobileLayerDock(state);
      renderMosaicToolButtons();
    }

    const showFilter = activeTool === 'filters';
    const layerTools = ['mosaic', 'stickers', 'text'];
    const selected = selectedForControls;
    const selectedMatchesTool = Boolean(selected && toolForLayer(selected) === activeTool);
    const onLayerTool = layerTools.includes(activeTool);
    const mobile = isMobileViewport();
    const showLayer = onLayerTool && (!mobile || (selectedMatchesTool && mobileLayerControlsExpanded));
    const showList = onLayerTool && !mobile;

    if (els.propFilterBlock) els.propFilterBlock.style.display = showFilter ? '' : 'none';
    if (els.propLayerBlock) els.propLayerBlock.style.display = showLayer ? '' : 'none';
    if (els.propListBlock) els.propListBlock.style.display = showList ? '' : 'none';
    if (els.propertyPanel) els.propertyPanel.classList.toggle('is-empty', !(showFilter || showLayer || showList));
    if (els.studioShell) {
      els.studioShell.dataset.activeTool = activeTool;
      const mobileLayerPanelOpen = onLayerTool && showLayer;
      els.studioShell.dataset.mobileLayerPanel = mobileLayerPanelOpen ? 'open' : 'collapsed';
    }
  }

  function scheduleRender(state) {
    pendingRenderState = state;
    applyCanvasCssInteractionPreview(state);
    if (isDirectManipulating) return;
    const lightweight = isSliderDragging || isTextEditing;
    const now = performance.now();
    const minGap = lightweight ? (isMobileViewport() ? MOBILE_LIGHTWEIGHT_RENDER_MS : DESKTOP_LIGHTWEIGHT_RENDER_MS) : 0;
    if (minGap && now - lastInteractiveRenderAt < minGap) {
      if (!pendingRenderTimer) {
        pendingRenderTimer = window.setTimeout(() => {
          pendingRenderTimer = 0;
          scheduleRender(pendingRenderState || store.getState());
        }, Math.max(16, minGap - (now - lastInteractiveRenderAt)));
      }
      return;
    }
    if (pendingRenderFrame) return;
    if (pendingRenderTimer) {
      window.clearTimeout(pendingRenderTimer);
      pendingRenderTimer = 0;
    }
    pendingRenderFrame = window.requestAnimationFrame(() => {
      pendingRenderFrame = 0;
      if (isDirectManipulating) return;
      lastInteractiveRenderAt = performance.now();
      const renderingLightweight = isSliderDragging || isTextEditing;
      const renderStartedAt = performance.now();
      const renderedState = pendingRenderState || store.getState();
      render(renderedState);
      if (isSliderDragging) {
        const renderCost = performance.now() - renderStartedAt;
        if (renderCost <= INTERACTIVE_RENDER_BUDGET_MS * 0.75) {
          sliderDragStartFilters = { ...renderedState.filters };
          if (els?.canvas) els.canvas.style.filter = '';
        } else {
          applyCanvasCssInteractionPreview(renderedState);
        }
      }
      if (renderingLightweight) {
        const renderCost = performance.now() - renderStartedAt;
        if (renderCost > INTERACTIVE_RENDER_BUDGET_MS) {
          interactiveRenderPressure = clamp(interactiveRenderPressure + 1, 0, 3);
        } else {
          interactiveRenderPressure = clamp(interactiveRenderPressure - 0.35, 0, 3);
        }
      } else if (interactiveRenderPressure > 0) {
        interactiveRenderPressure = clamp(interactiveRenderPressure - 0.2, 0, 3);
      }
      pendingRenderState = null;
    });
  }

  function bindEvents() {
    const finishDirectInteraction = (event) => {
      overlayController.finishInteraction?.(event);
    };
    window.addEventListener('pointerup', finishDirectInteraction);
    window.addEventListener('pointercancel', finishDirectInteraction);

    const openImagePicker = () => {
      if (!els.imageUpload) return;
      if (!els.imageUpload.getClientRects().length) {
        els.imageUpload.classList.add('native-file-picker-proxy');
        document.body.appendChild(els.imageUpload);
      }
      els.imageUpload.value = '';
      els.imageUpload.click();
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const image = await loadLocalImage(file);
        store.setImage(image);
        blushFallbackNoticeShown = false;
        resetFiltersToOriginal();
        trackEvent('image_upload_success', {
          imageWidth: image.naturalWidth,
          imageHeight: image.naturalHeight,
          imageMegapixels: Math.round((image.naturalWidth * image.naturalHeight) / 10000) / 100,
          fileSizeKb: Math.round((file.size || 0) / 1024),
          fileType: file.type || 'unknown',
        });
        detectPortraitData(image).then((portrait) => {
          if (store.getState().image.element !== image) return;
          store.setVisionData(portrait);
          if (!portrait.autoBlushDetected) enterManualBlushFallback();
        });
      } catch (error) {
        console.error('Image import failed:', error);
      }
    };

    els.imageUpload.addEventListener('change', handleImageUpload);

    els.clearCanvasBtn.onclick = () => {
      store.clearCanvas();
      mobileLayerControlsExpanded = false;
      els.imageUpload.value = '';
    };

    els.restoreOriginalBtn.onclick = () => {
      store.resetEdits();
      mobileLayerControlsExpanded = false;
    };

    els.undoBtn.onclick = () => store.undo();
    els.redoBtn.onclick = () => store.redo();

    els.compareBtn.onpointerdown = () => {
      comparePointerDownAt = Date.now();
      compareLongPressActive = false;
      if (compareLongPressTimer) {
        window.clearTimeout(compareLongPressTimer);
      }
      compareLongPressTimer = window.setTimeout(() => {
        compareLongPressActive = true;
        store.setComparePeekOriginal(true);
      }, COMPARE_LONG_PRESS_MS);
    };
    els.compareBtn.onpointerup = (event) => {
      if (compareLongPressTimer) {
        window.clearTimeout(compareLongPressTimer);
        compareLongPressTimer = null;
      }
      if (compareLongPressActive) {
        event.preventDefault();
        store.setComparePeekOriginal(false);
        compareSuppressClickUntil = Date.now() + 900;
      } else {
        const state = store.getState();
        const mode = getCompareCycleEventMode(state);
        store.cycleCompareMode();
        trackEvent('compare_toggle', { mode, source: 'pointer' });
        compareToggleAt = Date.now();
        compareSuppressClickUntil = Date.now() + 900;
      }
      compareLongPressActive = false;
      comparePointerDownAt = 0;
    };
    els.compareBtn.onpointerleave = () => {
      if (compareLongPressTimer) {
        window.clearTimeout(compareLongPressTimer);
        compareLongPressTimer = null;
      }
      if (compareLongPressActive) store.setComparePeekOriginal(false);
      compareLongPressActive = false;
    };
    els.compareBtn.onpointercancel = () => {
      if (compareLongPressTimer) {
        window.clearTimeout(compareLongPressTimer);
        compareLongPressTimer = null;
      }
      if (compareLongPressActive) store.setComparePeekOriginal(false);
      compareLongPressActive = false;
      comparePointerDownAt = 0;
    };
    // 某些内嵌浏览器不会稳定触发 pointerup，使用 click 作为兜底。
    els.compareBtn.onclick = () => {
      if (Date.now() < compareSuppressClickUntil) return;
      if (Date.now() - compareToggleAt < 900) return;
      if (compareLongPressActive) return;
      if (comparePointerDownAt && Date.now() - comparePointerDownAt >= COMPARE_LONG_PRESS_MS) return;
      const state = store.getState();
      const mode = getCompareCycleEventMode(state);
      store.cycleCompareMode();
      trackEvent('compare_toggle', { mode, source: 'click' });
      compareToggleAt = Date.now();
      comparePointerDownAt = 0;
    };

    els.addFrostedMosaicBtn.onclick = () => {
      mosaicToolState.variant = 'frosted';
      render(store.getState());
    };
    els.addGridMosaicBtn.onclick = () => {
      mosaicToolState.variant = 'grid-glass';
      render(store.getState());
    };
    els.mosaicShapeCircleBtn.onclick = () => {
      const state = store.getState();
      const canvasWidth = Math.max(1, state.canvas?.width || FIXED_CANVAS.width);
      const canvasHeight = Math.max(1, state.canvas?.height || FIXED_CANVAS.height);
      addMosaic(mosaicToolState.variant, {
        shape: 'circle',
        width: 0.22,
        height: 0.22 * (canvasWidth / canvasHeight),
        feather: mosaicToolState.feather,
        featherRange: mosaicToolState.featherRange,
        intensity: mosaicToolState.strength,
        whiteOpacity: mosaicToolState.whiteOpacity,
      });
      render(store.getState());
    };
    els.mosaicShapeHeartBtn.onclick = () => {
      const state = store.getState();
      const canvasWidth = Math.max(1, state.canvas?.width || FIXED_CANVAS.width);
      const canvasHeight = Math.max(1, state.canvas?.height || FIXED_CANVAS.height);
      const heartPixelAspect = (0.24 * FIXED_CANVAS.width) / (0.22 * FIXED_CANVAS.height);
      const heartWidth = 0.24;
      const heartHeight = clamp((heartWidth * canvasWidth) / (canvasHeight * heartPixelAspect), 0.04, 0.95);
      addMosaic(mosaicToolState.variant, {
        shape: 'heart',
        width: heartWidth,
        height: heartHeight,
        feather: mosaicToolState.feather,
        featherRange: mosaicToolState.featherRange,
        intensity: mosaicToolState.strength,
        whiteOpacity: mosaicToolState.whiteOpacity,
      });
      render(store.getState());
    };
    els.addTextLayerBtn.onclick = () => addText();
    if (els.originalFilterBtn) els.originalFilterBtn.onclick = () => applyOriginal();

    if (els.mobileLayerToggle) {
      els.mobileLayerToggle.onclick = (event) => {
        event.stopPropagation();
        mobileLayerMenuOpen = !mobileLayerMenuOpen;
        renderMobileLayerDock(store.getState());
      };
    }

    els.exportBtn.onclick = () => {
      const state = store.getState();
      if (!state.image.loaded) {
        alert('请先上传图片。');
        return;
      }
      exportPng(state);
    };

    if (els.exportCloseBtn) {
      els.exportCloseBtn.onclick = () => hideExportPreview();
    }

    if (els.exportDownloadLink) {
      els.exportDownloadLink.onclick = () => {
        const state = store.getState();
        trackEvent('download_png', {
          source: 'export_preview',
          compareMode: Boolean(state.compareMode),
          layerCount: state.layers.length,
        });
      };
    }

    if (els.exportModal) {
      els.exportModal.onclick = (event) => {
        if (event.target === els.exportModal) hideExportPreview();
      };
    }

    els.canvasFrame.onclick = (event) => {
      const state = store.getState();
      const clickedOverlay = event.target.closest('.overlay-item');
      if (!state.image.loaded && !clickedOverlay) {
        openImagePicker();
      }
    };

    if (els.canvasEmpty) {
      els.canvasEmpty.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        openImagePicker();
      };
    }

    els.canvasFrame.onwheel = (event) => {
      event.preventDefault();
    };

    if (els.sidebarNav) {
      els.sidebarNav.onclick = (event) => {
        const target = event.target.closest('.nav-item');
        if (!target) return;
        const tool = target.dataset.tool;
        if (!tool) return;

        document.querySelectorAll('.nav-item').forEach((btn) => {
          btn.classList.toggle('active', btn === target);
        });

        document.querySelectorAll('.tool-pane').forEach((pane) => {
          pane.classList.toggle('active', pane.dataset.pane === tool);
        });
        activeTool = tool;
        if (tool === 'stickers') {
          ensureStickerPanelRendered();
          preloadStickerImages();
        }
        if (tool === 'text') ensureTextTemplatesRendered();
        trackEvent('tool_select', { tool });
        mobileLayerMenuOpen = false;
        mobileLayerControlsExpanded = false;
        if (activeTool !== 'project') {
          blushEditMode = false;
          blushPreviewEnabled = false;
        }
        render(store.getState());
      };
    }

    window.addEventListener('resize', () => {
      syncViewportMode();
      syncCanvasFrameSize();
      render(store.getState());
    });

    window.addEventListener('orientationchange', () => {
      window.setTimeout(() => {
        syncViewportMode();
        syncCanvasFrameSize();
        render(store.getState());
      }, 120);
    });
  }

  function setupBrandSubtitleTyping() {
    const el = document.querySelector('.brand-subtitle');
    if (!el) return;
    if (brandSubtitleTimer) {
      window.clearTimeout(brandSubtitleTimer);
      brandSubtitleTimer = null;
    }
    const baseText = '少女量产中';
    const frames = [];
    for (let i = 1; i <= baseText.length; i += 1) {
      frames.push({ text: baseText.slice(0, i), delay: 170 });
    }
    frames.push({ text: `${baseText}.`, delay: 200 });
    frames.push({ text: `${baseText}..`, delay: 200 });
    frames.push({ text: `${baseText}...`, delay: 820 });
    frames.push({ text: '', delay: 260 });
    let frameIndex = 0;
    el.textContent = '';

    const tick = () => {
      const frame = frames[frameIndex];
      el.textContent = frame.text;
      frameIndex = (frameIndex + 1) % frames.length;
      brandSubtitleTimer = window.setTimeout(tick, frame.delay);
    };

    tick();
  }

  async function init() {
    trackEvent('app_open', { referrerType: document.referrer ? 'external_or_internal' : 'direct' });
    syncViewportMode();
    setupBrandSubtitleTyping();
    bindEvents();
    store.subscribe(scheduleRender);
    buildPixelStickerPack();
    if (isMobileViewport()) {
      if (activeTool === 'stickers') ensureStickerPanelRendered();
      if (activeTool === 'text') ensureTextTemplatesRendered();
    } else {
      ensureStickerPanelRendered();
      ensureTextTemplatesRendered();
    }
    render(store.getState());

    runWhenIdle(() => {
      if (!isMobileViewport()) ensureTextFontLoaded(TEXT_FONTS.find((font) => font.id === activeTextFontId)).then(() => render(store.getState()));
    });
    runWhenIdle(() => {
      if (!isMobileViewport() || activeTool === 'stickers') preloadStickerImages();
    }, 1200);
    runWhenIdle(() => {
      if (!isMobileViewport()) preloadTextFonts().then(() => render(store.getState()));
    }, 1800);
  }

  init();
})();
