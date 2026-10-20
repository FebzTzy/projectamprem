// netlify/functions/am-bulk-proxy.js
// POST { token, count } → { ok, count, payload, remainingMs }
// Verifikasi token dulu, baru panggil am-bulk. Client tidak pernah lihat API key.

const { getStore } = require('@netlify/blobs');
const OWNER_SECRET = (process.env.OWNER_SECRET || '').trim();
const KY_KEY       = process.env.KYZ_KEY; // simpan di Netlify env, JANGAN di client
const KY_BASE      = 'https://kyzorohan.web.id/api';
const KEY_PREFIX   = 'am-premium:';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(s, b) { return { statusCode: s, headers: cors(), body: JSON.stringify(b) }; }
function decode(t) { try { return JSON.parse(Buffer.from(t.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString()); } catch { return null; } }
function sign(p) { return require('crypto').createHmac('sha256', OWNER_SECRET).update(`${p.id}|${p.exp}|${p.plan}`).digest('hex'); }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad JSON' }); }

  const { token, count } = body;
  const n = parseInt(count, 10);
  if (!token) return json(400, { ok: false, error: 'Token required' });
  if (!Number.isFinite(n) || n < 1 || n > 50) return json(400, { ok: false, error: 'Count 1–50' });

  const payload = decode(token);
  if (!payload || !payload.id || !payload.exp) return json(400, { ok: false, error: 'Malformed token' });
  if (sign(payload) !== payload.sig) return json(401, { ok: false, error: 'Invalid signature' });

  const remaining = payload.exp - Date.now();
  if (remaining <= 0) return json(200, { ok: false, error: 'Token expired' });

  try {
    const store = getStore({ name: 'am-keys', consistency: 'strong' });
    const revoked = await store.get(`${KEY_PREFIX}revoked:${payload.id}`);
    if (revoked) return json(200, { ok: false, error: 'Token revoked' });
  } catch {}

  const url = `${KY_BASE}/am-bulk?key=${encodeURIComponent(KY_KEY)}&count=${n}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return json(200, { ok: r.ok, count: n, payload: data, remainingMs: remaining });
  } catch (e) {
    return json(500, { ok: false, error: e.message });
  }
};
