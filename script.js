/* ===========================================
   🔐 OWNER CONFIG
   =========================================== */
const OWNER_CODE  = 'ALIGHT-VIP-4065';   // kode unlock trial (bukan token premium)
const TRIAL_LIMIT = 3;
const STORAGE_KEY = 'am_trial_state_v1';

/* ===========================================
   📱 WHATSAPP OWNER
   =========================================== */
const WA_NUMBER  = '6289679137206';
const WA_MESSAGE = 'Halo kak,, saya ingin beli kode Unlimited Access untuk Alight Motion Premium. Mohon info harga & cara pembayarannya 🙏';

/* ===========================================
   ⚙️ API KYZOROHAN (send + verif)
   =========================================== */
const API_BASE = 'https://kyzorohan.web.id/api';
const API_KEY  = '';

const EP = {
  send  : (email)       => `${API_BASE}/am-send2?key=${API_KEY}&email=${encodeURIComponent(email)}`,
  verify: (email, link) => `${API_BASE}/am-verif2?key=${API_KEY}&email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}`,
};

/* ===========================================
   🔑 PREMIUM PROXY (Netlify Functions)
   =========================================== */
// ⬇️⬇️⬇️ GANTI BARIS DI BAWAH KE URL NETLIFY LO ⬇️⬇️⬇️
// Contoh: 'https://alight-premium.netlify.app/.netlify/functions'
const PREMIUM_API = 'https://febztzy-amprem.netlify.app/.netlify/functions';

const TOKEN_STORE = 'am_premium_token_v1';

function getPremiumToken()   { try { return localStorage.getItem(TOKEN_STORE) || ''; } catch { return ''; } }
function setPremiumToken(t)  { try { t ? localStorage.setItem(TOKEN_STORE, t) : localStorage.removeItem(TOKEN_STORE); } catch {} }

async function validatePremium() {
  const token = getPremiumToken();
  if (!token) return { valid: false, error: 'No token' };
  try {
    const r = await fetch(`${PREMIUM_API}/am-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return await r.json();
  } catch (e) { return { valid: false, error: e.message }; }
}

async function bulkGenerate(count) {
  const token = getPremiumToken();
  if (!token) throw new Error('Token premium belum ada');
  const r = await fetch(`${PREMIUM_API}/am-bulk-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, count })
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || 'Bulk gagal');
  return data;
}

async function apiGet(url) {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

/* ===========================================
   🗄️ TRIAL STATE
   =========================================== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, unlocked: false };
    const s = JSON.parse(raw);
    return { count: Math.max(0, parseInt(s.count) || 0), unlocked: !!s.unlocked };
  } catch { return { count: 0, unlocked: false }; }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
let trialState = loadState();

/* ===========================================
   🎨 TRIAL UI
   =========================================== */
const trialBadge      = document.getElementById('trialBadge');
const trialBar        = document.getElementById('trialBar');
const trialCount      = document.getElementById('trialCount');
const trialFill       = document.getElementById('trialFill');
const unlockPanel     = document.getElementById('unlockPanel');
const unlockTrialText = document.getElementById('unlockTrialText');

function renderTrial() {
  if (trialState.unlocked) {
    trialBadge.className = 'badge-vip';
    trialBadge.innerHTML = '<i class="fas fa-crown"></i> UNLIMITED';
    trialBar.style.display = 'none';
    unlockPanel.classList.remove('show');
    document.getElementById('step1').style.display = 'block';
    return;
  }
  const used = trialState.count;
  const left = Math.max(0, TRIAL_LIMIT - used);
  const pct  = (left / TRIAL_LIMIT) * 100;

  trialCount.textContent = left + ' / ' + TRIAL_LIMIT;
  trialFill.style.width  = pct + '%';
  trialFill.classList.remove('warn', 'empty');
  trialBadge.classList.remove('warn', 'empty');

  if (left <= 0) {
    trialBadge.innerHTML = '<i class="fas fa-ban"></i> Trial Habis';
    trialBadge.classList.add('empty');
    trialFill.classList.add('empty');
    unlockPanel.classList.add('show');
    if (unlockTrialText) unlockTrialText.textContent = TRIAL_LIMIT + 'x akses trial';
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
  } else if (left <= Math.ceil(TRIAL_LIMIT / 2)) {
    trialBadge.innerHTML = '<i class="fas fa-bolt"></i> Trial ' + left + '/' + TRIAL_LIMIT;
    trialBadge.classList.add('warn');
    trialFill.classList.add('warn');
  } else {
    trialBadge.innerHTML = '<i class="fas fa-bolt"></i> Trial ' + left + '/' + TRIAL_LIMIT;
  }
}
function canUseTrial() { return trialState.unlocked || trialState.count < TRIAL_LIMIT; }
function consumeTrial() {
  if (trialState.unlocked) return;
  trialState.count++;
  saveState(trialState);
  renderTrial();
}

/* ===========================================
   🎉 PARTICLES
   =========================================== */
(function spawnParticles() {
  const wrap = document.getElementById('particles');
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (-Math.random() * 15) + 's';
    p.style.opacity = 0.15 + Math.random() * 0.4;
    if (Math.random() > 0.6) {
      p.style.background = '#22d3ee';
      p.style.boxShadow = '0 0 10px #22d3ee';
    }
    wrap.appendChild(p);
  }
})();

/* ===========================================
   TOAST
   =========================================== */
const toastEl = document.getElementById('toast');
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ===========================================
   STEP 1: Kirim Magic Link (am-send2)
   =========================================== */
document.getElementById('amSendMagicBtn').onclick = async function() {
  if (!canUseTrial()) {
    showToast('Trial habis! Beli kode unlimited dulu.');
    renderTrial();
    return;
  }
  const email = document.getElementById('amEmail').value.trim();
  if (!email) { showToast('Masukkan email!'); return; }

  this.disabled = true;
  const original = this.innerHTML;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Mengirim...';

  const box = document.getElementById('amSendResult');
  box.style.display = 'block';
  box.innerHTML = '<div><i class="fas fa-spinner spin"></i> Mengirim magic link via API...</div>';

  try {
    const data = await apiGet(EP.send(email));
    const ok = data && (
      data.status === true || data.success === true || data.ok === true ||
      (typeof data.message === 'string' && /success|sent|ok/i.test(data.message)) ||
      (typeof data.raw === 'string' && /success|sent/i.test(data.raw))
    );

    if (ok) {
      box.innerHTML = '<div style="color:#22c55e;">✅ Magic link terkirim ke <b>' + email + '</b>. Cek inbox/spam.</div>';
      document.getElementById('step2').style.display = 'block';
      document.getElementById('amVerifyResult').style.display = 'none';
      box.dataset.email = email;
      if (!trialState.unlocked) consumeTrial();
    } else {
      const msg = (data && (data.message || data.error || data.raw)) || 'Gagal mengirim';
      box.innerHTML = '<div style="color:#ef4444;">' + String(msg) + '</div>';
    }
  } catch (e) {
    box.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>';
  }

  this.disabled = false;
  this.innerHTML = original;
};

/* ===========================================
   STEP 2: Verifikasi & Aktivasi (am-verif2)
   =========================================== */
document.getElementById('amVerifyBtn').onclick = async function() {
  const rawLink = document.getElementById('amRawLink').value.trim();
  const email = document.getElementById('amSendResult').dataset.email
              || document.getElementById('amEmail').value.trim();

  if (!rawLink) { showToast('Tempelkan magic link!'); return; }
  if (!email)   { showToast('Email tidak ditemukan, kirim ulang.'); return; }

  this.disabled = true;
  const original = this.innerHTML;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Memverifikasi...';

  const box = document.getElementById('amVerifyResult');
  box.style.display = 'block';
  box.innerHTML = '<div><i class="fas fa-spinner spin"></i> Verifikasi via API...</div>';

  try {
    const data = await apiGet(EP.verify(email, rawLink));
    const ok = data && (
      data.status === true || data.success === true || data.ok === true ||
      (typeof data.message === 'string' && /success|premium|activated|ok/i.test(data.message)) ||
      (typeof data.raw === 'string' && /success|premium/i.test(data.raw))
    );

    if (ok) {
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('successScreen').classList.add('show');
      document.getElementById('successEmail').textContent = email;
      showToast('Premium berhasil diaktifkan!');
    } else {
      const msg = (data && (data.message || data.error || data.raw)) || 'Verifikasi gagal';
      box.innerHTML = '<div style="color:#ef4444;">❌ ' + String(msg) + '</div>';
    }
  } catch (e) {
    box.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>';
  }

  this.disabled = false;
  this.innerHTML = original;
};

/* ===========================================
   🛒 BELI VIA WHATSAPP
   =========================================== */
document.getElementById('buyWaBtn').onclick = function() {
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  const encoded  = encodeURIComponent(WA_MESSAGE);
  const url = isMobile
    ? `https://wa.me/${WA_NUMBER}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${WA_NUMBER}&text=${encoded}`;
  showToast('Membuka WhatsApp owner...');
  window.open(url, '_blank');
};

/* ===========================================
   🔓 UNLOCK OWNER CODE
   =========================================== */
document.getElementById('unlockBtn').onclick = function() {
  const code = document.getElementById('unlockCode').value.trim();
  const res  = document.getElementById('unlockResult');
  res.style.display = 'block';

  if (!code) {
    res.innerHTML = '<div style="color:#fbbf24;">Masukkan kode akses terlebih dahulu.</div>';
    return;
  }
  if (code === OWNER_CODE) {
    trialState.unlocked = true;
    saveState(trialState);
    res.innerHTML = '<div style="color:#22c55e;">🎉 Kode valid! Unlimited access terbuka.</div>';
    showToast('Unlimited access aktif!');
    setTimeout(() => {
      renderTrial();
      document.getElementById('step1').style.display = 'block';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('amSendResult').style.display = 'none';
      document.getElementById('amVerifyResult').style.display = 'none';
      document.getElementById('unlockCode').value = '';
      res.style.display = 'none';
    }, 900);
  } else {
    res.innerHTML = '<div style="color:#ef4444;">❌ Kode salah. Hubungi owner.</div>';
    showToast('Kode tidak valid');
  }
};
document.getElementById('unlockCode').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('unlockBtn').click();
});

/* ===========================================
   📦 BULK GENERATOR (via premium token + proxy)
   =========================================== */
const bulkInput  = document.getElementById('bulkCount');
const bulkBtn    = document.getElementById('bulkBtn');
const bulkResult = document.getElementById('bulkResult');

function renderBulkResult(data) {
  if (!data) return '<div style="color:#ef4444;">Kosong</div>';

  const list =
    Array.isArray(data)                     ? data :
    Array.isArray(data.emails)              ? data.emails :
    Array.isArray(data.results)             ? data.results :
    Array.isArray(data.data)                ? data.data :
    Array.isArray(data.items)               ? data.items :
    null;

  if (list) {
    const rows = list.map((it, i) => {
      if (typeof it === 'string') return `${i + 1}. ${it}`;
      const em = it.email || it.mail || it.address || it.user || JSON.stringify(it);
      const st = it.status || it.state || '';
      return `${i + 1}. ${em}${st ? ' — ' + st : ''}`;
    }).join('\n');
    return `<div style="text-align:left; white-space:pre-wrap; font-family:monospace; font-size:11px;">${rows}</div>`;
  }

  const raw = data.raw || JSON.stringify(data, null, 2);
  return `<div style="text-align:left; white-space:pre-wrap; font-family:monospace; font-size:11px;">${String(raw).slice(0, 4000)}</div>`;
}

function fmtRemain(ms) {
  if (!ms || ms <= 0) return '';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}h ${h}j left`;
  if (h > 0) return `${h}j ${m}m left`;
  return `${m}m left`;
}

bulkBtn.onclick = async function() {
  const n = parseInt(bulkInput.value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    showToast('Jumlah 1–50');
    return;
  }

  const tok = getPremiumToken();
  if (!tok) {
    bulkResult.style.display = 'block';
    bulkResult.innerHTML = '<div style="color:#fbbf24;">🔒 Bulk hanya untuk premium. Masukkan token di bawah.</div>';
    document.getElementById('bulkTokenBox').style.display = 'block';
    return;
  }

  this.disabled = true;
  const original = this.innerHTML;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Generate...';
  bulkResult.style.display = 'block';
  bulkResult.innerHTML = '<div><i class="fas fa-spinner spin"></i> Meminta ' + n + ' akun...</div>';

  try {
    const out = await bulkGenerate(n);
    const remain = fmtRemain(out.remainingMs);
    bulkResult.innerHTML =
      '<div style="color:#22c55e; margin-bottom:8px;">✅ Bulk selesai (count=' + n + ') ' + remain + '</div>'
      + renderBulkResult(out.payload);
  } catch (e) {
    bulkResult.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>';
    if (/expired|revoked|invalid|token/i.test(e.message)) {
      setPremiumToken('');
      document.getElementById('bulkTokenBox').style.display = 'block';
    }
  }

  this.disabled = false;
  this.innerHTML = original;
};

/* Token apply */
document.getElementById('bulkTokenApply').onclick = async function() {
  const inp = document.getElementById('bulkTokenInput');
  const tok = inp.value.trim();
  if (!tok) { showToast('Token kosong'); return; }

  setPremiumToken(tok);
  const v = await validatePremium();
  if (v.valid) {
    const remain = fmtRemain(v.remainingMs);
    showToast('Token valid — ' + (v.plan || 'premium') + ' ' + remain);
    document.getElementById('bulkTokenBox').style.display = 'none';
    inp.value = '';
  } else {
    setPremiumToken('');
    showToast(v.error || 'Token tidak valid');
  }
};

/* ===========================================
   INIT
   =========================================== */
renderTrial();
