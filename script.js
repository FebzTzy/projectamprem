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
  // Validasi data kosong
  if (!data) return '<div style="color:#ef4444;">Data kosong / tidak valid.</div>';

  // Ambil array results dari response (kalau ada)
  const list = data.results || data.data || data.items || (Array.isArray(data) ? data : null);

  // Kalau ternyata nggak ada array-nya, tampilkan raw JSON
  if (!list || !Array.isArray(list)) {
    const raw = data.raw || JSON.stringify(data, null, 2);
    return `<div style="text-align:left; white-space:pre-wrap; font-family:monospace; font-size:11px; padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;">${String(raw).slice(0, 4000)}</div>`;
  }

  // Header info (sukses/gagal)
  let html = `<div style="text-align:left; margin-bottom:10px; font-size:12px; color:#8b98b5;">
    <span style="color:#22c55e; font-weight:bold;">Sukses: ${data.sukses || 0}</span> | 
    <span style="color:#ef4444; font-weight:bold;">Gagal: ${data.gagal || 0}</span> 
    <span style="float:right;">Total: ${data.total || list.length}</span>
  </div>`;

  // Loop bikin kartu per akun
  html += '<div style="display:flex; flex-direction:column; gap:8px;">';
  
  list.forEach((item, index) => {
    // Default value kalau field-nya ga ada
    const email = item.email || item.mail || '-';
    const inbox = item.inbox || '#';
    const uid = item.uid || '-';
    const status = item.status || (item.success ? 'Active' : 'Failed');
    
    // Cek status sukses/gagal
    const isSuccess = item.success === true || /active|success|sukses/i.test(status);
    const color = isSuccess ? '#22c55e' : '#ef4444';
    const bg = isSuccess ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
    const border = isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

    html += `
      <div style="text-align:left; background:${bg}; border:1px solid ${border}; border-radius:8px; padding:10px; font-size:11px; font-family:monospace;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <b style="color:#eef4ff;">#${item.no || index + 1}</b>
          <span style="color:${color}; font-weight:bold;">${status.toUpperCase()}</span>
        </div>
        <div style="color:#8b98b5; margin-bottom:4px;">Email: <span style="color:#eef4ff;">${email}</span></div>
        <div style="color:#8b98b5; margin-bottom:8px;">UID: <span style="color:#eef4ff;">${uid}</span></div>
        
        ${inbox !== '#' ? `<a href="${inbox}" target="_blank" style="display:inline-block; background:${color}; color:#0a0f1c; text-decoration:none; padding:5px 10px; border-radius:4px; font-weight:bold; font-family:sans-serif;">Buka Inbox</a>` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

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
