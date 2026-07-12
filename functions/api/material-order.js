const DEFAULT_FEISHU_BASE_TOKEN = 'A3cwb8VDaaaAECsA8wOc3gGKnFh';
const DEFAULT_FEISHU_TABLE_ID = 'tblhl8dRA0HRY9cD';
const DEFAULT_FEISHU_VIEW_ID = 'vewKsAVbcS';
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function text(value) {
  return String(value ?? '').trim();
}

function envText(env, keys, fallback = '') {
  for (const key of keys) {
    const value = text(env?.[key]);
    if (value) return value;
  }
  return fallback;
}

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(text(value).toLowerCase());
}

function toFieldText(value) {
  if (Array.isArray(value)) return toFieldText(value[0]);
  if (value && typeof value === 'object') return text(value.text || value.name || value.value);
  return text(value);
}

function toSortOrder(value) {
  const next = Number(value);
  return Number.isInteger(next) && next > 0 ? next : 0;
}

export function normalizeOrderItems(items, options = {}) {
  if (!Array.isArray(items)) throw new Error('items_must_be_array');
  const seen = new Set();
  return items.map((item, index) => {
    const id = text(item?.id || item?.materialId);
    const sortOrder = options.preserveSortOrder ? toSortOrder(item?.sortOrder) : index + 1;
    return { id, sortOrder };
  })
    .filter((item) => item.id && item.sortOrder)
    .filter((item) => {
      const { id } = item;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

export function getMaterialOrderConfig(env = {}) {
  return {
    appId: envText(env, ['FEISHU_APP_ID', 'LARK_APP_ID']),
    appSecret: envText(env, ['FEISHU_APP_SECRET', 'LARK_APP_SECRET']),
    adminToken: envText(env, ['MATERIAL_ADMIN_TOKEN', 'FEISHU_MATERIAL_ADMIN_TOKEN']),
    baseToken: envText(env, ['FEISHU_BASE_TOKEN', 'LARK_BASE_TOKEN'], DEFAULT_FEISHU_BASE_TOKEN),
    tableId: envText(env, ['FEISHU_MATERIAL_TABLE_ID', 'LARK_MATERIAL_TABLE_ID'], DEFAULT_FEISHU_TABLE_ID),
    viewId: envText(env, ['FEISHU_MATERIAL_VIEW_ID', 'LARK_MATERIAL_VIEW_ID'], DEFAULT_FEISHU_VIEW_ID),
    dryRun: isEnabled(env.MATERIAL_ORDER_DRY_RUN),
  };
}

function getRequestAdminToken(request) {
  const headerToken = text(request.headers.get('x-admin-token'));
  if (headerToken) return headerToken;
  const auth = text(request.headers.get('authorization'));
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
}

function validateAdminToken(request, config) {
  if (config.dryRun) return null;
  if (!config.adminToken) {
    return { status: 500, body: { ok: false, error: 'admin_token_missing', message: '未配置素材管理密码。' } };
  }
  if (getRequestAdminToken(request) !== config.adminToken) {
    return { status: 401, body: { ok: false, error: 'unauthorized', message: '素材管理密码不正确。' } };
  }
  return null;
}

function assertFeishuConfigured(config) {
  if (!config.appId || !config.appSecret || !config.baseToken || !config.tableId) {
    return {
      ok: false,
      error: 'not_configured',
      message: 'Cloudflare 尚未配置飞书写入密钥，当前只能在页面内预览排序。',
    };
  }
  return null;
}

async function feishuFetch(path, options = {}) {
  const response = await fetch(`${FEISHU_API_BASE}${path}`, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok || (json.code !== undefined && json.code !== 0)) {
    const error = new Error(json.msg || json.message || `Feishu request failed: ${response.status}`);
    error.details = json;
    error.status = response.status;
    throw error;
  }
  return json;
}

async function getTenantAccessToken(config) {
  const json = await feishuFetch('/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });
  const token = text(json.tenant_access_token);
  if (!token) throw new Error('missing_tenant_access_token');
  return token;
}

async function listMaterialRecords(config, tenantAccessToken) {
  const records = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      page_size: '500',
      ...(config.viewId ? { view_id: config.viewId } : {}),
      ...(pageToken ? { page_token: pageToken } : {}),
    });
    const json = await feishuFetch(
      `/bitable/v1/apps/${encodeURIComponent(config.baseToken)}/tables/${encodeURIComponent(config.tableId)}/records?${params}`,
      {
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
        },
      }
    );
    records.push(...(json.data?.items || []));
    pageToken = text(json.data?.page_token);
    if (!json.data?.has_more) pageToken = '';
  } while (pageToken);
  return records;
}

export function buildFeishuOrderPlan(records, orderItems) {
  const recordByMaterialId = new Map();
  for (const record of records || []) {
    const materialId = toFieldText(record.fields?.素材ID);
    if (materialId) recordByMaterialId.set(materialId, record.record_id);
  }

  const updates = [];
  const missingIds = [];
  for (const item of orderItems) {
    const recordId = recordByMaterialId.get(item.id);
    if (!recordId) {
      missingIds.push(item.id);
      continue;
    }
    updates.push({
      recordId,
      materialId: item.id,
      sortOrder: item.sortOrder,
    });
  }
  return { updates, missingIds };
}

async function updateMaterialOrder(config, tenantAccessToken, update) {
  await feishuFetch(
    `/bitable/v1/apps/${encodeURIComponent(config.baseToken)}/tables/${encodeURIComponent(config.tableId)}/records/${encodeURIComponent(update.recordId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        fields: {
          网页展示顺序: update.sortOrder,
        },
      }),
    }
  );
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json', message: '请求内容不是有效 JSON。' }, 400);
  }

  let orderItems;
  try {
    orderItems = normalizeOrderItems(payload?.items, {
      preserveSortOrder: Boolean(payload?.preserveSortOrder),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message, message: '排序数据格式不正确。' }, 400);
  }

  if (!orderItems.length) {
    return jsonResponse({ ok: false, error: 'empty_items', message: '没有可保存的素材。' }, 400);
  }

  const config = getMaterialOrderConfig(env);
  const authError = validateAdminToken(request, config);
  if (authError) return jsonResponse(authError.body, authError.status);

  if (config.dryRun) {
    return jsonResponse({ ok: true, dryRun: true, updated: orderItems.length, missingIds: [] });
  }

  const configError = assertFeishuConfigured(config);
  if (configError) return jsonResponse(configError, 501);

  try {
    const tenantAccessToken = await getTenantAccessToken(config);
    const records = await listMaterialRecords(config, tenantAccessToken);
    const plan = buildFeishuOrderPlan(records, orderItems);
    for (const update of plan.updates) {
      await updateMaterialOrder(config, tenantAccessToken, update);
    }
    return jsonResponse({
      ok: true,
      dryRun: false,
      updated: plan.updates.length,
      missingIds: plan.missingIds,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: 'feishu_write_failed',
      message: error.message || '飞书写入失败。',
      details: error.details,
    }, 502);
  }
}

export function onRequestGet({ env }) {
  const config = getMaterialOrderConfig(env);
  const configError = assertFeishuConfigured(config);
  return jsonResponse({
    ok: true,
    endpoint: 'material-order',
    dryRun: config.dryRun,
    canSave: config.dryRun || (!configError && Boolean(config.adminToken)),
    missingConfig: configError ? configError.error : '',
  });
}
