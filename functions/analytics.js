const ALLOWED_EVENTS = new Set([
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

const STRING_PAYLOAD_KEYS = new Set([
  'tool',
  'fileType',
  'presetId',
  'key',
  'panel',
  'channel',
  'axis',
  'stickerId',
  'packId',
  'source',
  'fontId',
  'mode',
  'referrerType',
]);

const NUMBER_PAYLOAD_KEYS = new Set(['imageWidth', 'imageHeight', 'imageMegapixels', 'fileSizeKb', 'layerCount']);
const BOOLEAN_PAYLOAD_KEYS = new Set(['hasImage', 'compareMode']);

function text(value, fallback = '') {
  return String(value ?? fallback).slice(0, 80);
}

function number(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function getPayload(data) {
  const input = data && typeof data.payload === 'object' ? data.payload : {};
  const strings = {};
  const numbers = {};
  const booleans = {};

  STRING_PAYLOAD_KEYS.forEach((key) => {
    if (input[key] !== undefined) strings[key] = text(input[key]);
  });
  NUMBER_PAYLOAD_KEYS.forEach((key) => {
    if (input[key] !== undefined) numbers[key] = number(input[key]);
  });
  BOOLEAN_PAYLOAD_KEYS.forEach((key) => {
    if (input[key] !== undefined) booleans[key] = Boolean(input[key]);
  });

  return { strings, numbers, booleans };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const eventName = text(data?.name);
  if (!ALLOWED_EVENTS.has(eventName)) {
    return jsonResponse({ ok: false, error: 'unknown_event' }, 400);
  }

  const payload = getPayload(data);
  const country = request.cf?.country || '';

  if (env?.ANALYTICS?.writeDataPoint) {
    env.ANALYTICS.writeDataPoint({
      indexes: [eventName],
      blobs: [
        eventName,
        text(data.path, '/'),
        text(data.language),
        text(country),
        text(payload.strings.tool),
        text(payload.strings.fileType),
        text(payload.strings.presetId),
        text(payload.strings.key),
        text(payload.strings.panel),
        text(payload.strings.channel),
        text(payload.strings.axis),
        text(payload.strings.stickerId),
        text(payload.strings.packId),
        text(payload.strings.source),
        text(payload.strings.fontId),
        text(payload.strings.mode),
        text(payload.strings.referrerType),
      ],
      doubles: [
        number(data.viewportWidth),
        number(data.viewportHeight),
        data.isMobile ? 1 : 0,
        payload.numbers.imageWidth || 0,
        payload.numbers.imageHeight || 0,
        payload.numbers.imageMegapixels || 0,
        payload.numbers.fileSizeKb || 0,
        payload.numbers.layerCount || 0,
        payload.booleans.hasImage ? 1 : 0,
        payload.booleans.compareMode ? 1 : 0,
      ],
    });
  }

  return jsonResponse({ ok: true });
}

export function onRequestGet() {
  return jsonResponse({ ok: true, endpoint: 'analytics' });
}
