// netlify/functions/am-admin.js
// POST { ownerPass, action, ... }
//   action=create  { plan, unit, amount }   → { token, id, expiresAt }
//   action=list                              → { keys: [...] }
//   action=revoke  { id }                    → { ok }
// Owner password: OWNER_PASS env. OWNER_SECRET dipakai HMAC signing.

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const OWNER_PASS = (process.env.OWNER_PASS || '').trim();
const OWNER_SECRET = (process.env.OWNER_SECRET || '').trim();
const STORE_NAME   = 'am-keys';
const PREFIX       = 'am-premium:';

const UNIT_MS = {
  second:  1000,
  minute:  60 * 1000,
  hour:    60 * 60 * 1000,
  day:     24 * 60 * 60 * 1000,
  week:    7  * 24 * 60 * 60 * 1000,
  month:   30 * 24 * 60 * 60 * 1000,
  year:    365 * 24 * 60 * 60 * 1000,
  permanent: 100 * 365 * 24 * 60 * 60 * 1000, // 100 tahun = praktis permanen
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(s, b) { return { statusCode: s, headers: cors(), body: JSON.stringify(b) }; }
function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function sign(p) { return crypto.createHmac('sha256', OWNER_SECRET).update(`${p.id}|${p.exp}|${p.plan}`).digest('hex'); }
function decode(t) { try { return JSON.parse(Buffer.from(t.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString()); } catch { return null; } }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad JSON' }); }

  if (!OWNER_PASS || body.ownerPass !== OWNER_PASS) return json(401, { error: 'Unauthorized' });
  if (!OWNER_SECRET) return json(500, { error: 'Server misconfigured' });

  const action = String(body.action || '').toLowerCase();

  if (action === 'create') {
    const unit   = String(body.unit || 'hour').toLowerCase();
    const amount = Number(body.amount);
    const plan   = String(body.plan || 'premium');
    const ms     = UNIT_MS[unit];
    if (!ms)                     return json(400, { error: 'Invalid unit' });
    if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: 'Invalid amount' });

    const id  = b64url(crypto.randomBytes(9));
    const now = Date.now();
    const exp = now + Math.round(ms * amount);
    const payload = { id, exp, plan };
    payload.sig = sign(payload);

    const token = b64url(Buffer.from(JSON.stringify(payload)));

    try {
      const store = getStore({ name: STORE_NAME, consistency: 'strong' });
      await store.setJSON(`${PREFIX}${id}`, {
        id, plan, unit, amount, createdAt: now, expiresAt: exp, token
      });
    } catch (e) {
      // kalau Blobs gagal, tetap return token (stateless), tapi gak bisa di-revoke
      console.warn('Blob save failed:', e.message);
    }

    return json(200, { ok: true, token, id, plan, unit, amount, expiresAt: exp, remainingMs: exp - now });
  }

  if (action === 'list') {
    try {
      const store = getStore({ name: STORE_NAME, consistency: 'strong' });
      const { blobs } = await store.list({ prefix: PREFIX });
      const keys = [];
      for (const b of blobs) {
        if (b.key.includes('revoked:')) continue;
        try {
          const data = await store.get(b.key, { type: 'json' });
          if (data) keys.push(data);
        } catch {}
      }
      keys.sort((a, b) => b.createdAt - a.createdAt);
      return json(200, { ok: true, keys });
    } catch (e) {
      return json(500, { error: e.message });
    }
  }

  if (action === 'revoke') {
    const id = String(body.id || '');
    if (!id) return json(400, { error: 'id required' });
    try {
      const store = getStore({ name: STORE_NAME, consistency: 'strong' });
      await store.setJSON(`${PREFIX}revoked:${id}`, { revokedAt: Date.now() });
      return json(200, { ok: true, id });
    } catch (e) {
      return json(500, { error: e.message });
    }
  }

  return json(400, { error: 'Unknown action' });
};
