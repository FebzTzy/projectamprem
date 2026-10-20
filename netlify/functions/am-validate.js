// netlify/functions/am-validate.js
// POST { token, email? } → { valid, expiresAt, remainingMs, plan }
// Token disimpan di Netlify Blobs (gratis, built-in). Fallback ke Upstash Redis
// kalau env UPSTASH_URL diset. API key kyzorohan hanya hidup di server.

const { getStore } = require('@netlify/blobs');

const OWNER_SECRET = (process.env.OWNER_SECRET || '').trim(); // rahasia pembuat token
const KEY_PREFIX   = 'am-premium:';
const STORE_NAME   = 'am-keys';

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra
  };
}

function json(statusCode, body) {
  return { statusCode, headers: cors({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) };
}

function decodeToken(token) {
  // token = base64url( json{id, exp, plan, sig} )
  try {
    const raw = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

function signPayload(payload) {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', OWNER_SECRET)
    .update(`${payload.id}|${payload.exp}|${payload.plan}`)
    .digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Bad JSON' }); }

  const { token } = body;
  if (!token || typeof token !== 'string') return json(400, { error: 'Token required' });

  const payload = decodeToken(token);
  if (!payload || !payload.id || !payload.exp) return json(400, { valid: false, error: 'Malformed token' });

  // 1. signature check
  const expectedSig = signPayload(payload);
  if (expectedSig !== payload.sig) return json(401, { valid: false, error: 'Invalid signature' });

  // 2. expiry check
  const remaining = payload.exp - Date.now();
  if (remaining <= 0) return json(200, { valid: false, error: 'Token expired', expiresAt: payload.exp });

  // 3. revocation check (opsional, pakai Blobs)
  if (process.env.NETLIFY === 'true') {
    try {
      const store = getStore({ name: STORE_NAME, consistency: 'strong' });
      const revoked = await store.get(`${KEY_PREFIX}revoked:${payload.id}`);
      if (revoked) return json(200, { valid: false, error: 'Token revoked' });
    } catch {}
  }

  return json(200, {
    valid: true,
    id: payload.id,
    plan: payload.plan || 'custom',
    expiresAt: payload.exp,
    remainingMs: remaining
  });
};
