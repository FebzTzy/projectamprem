// Alarm deteksi error
window.onerror = function(msg, url, line) {
    alert("❌ ERROR JS (Baris " + line + "):\n" + msg + "\n\nCoba hapus semua isi script.js dan paste ulang kode ini dari awal.");
    return false;
};

/* ===========================================
   ⚙️ API KYZOROHAN
   =========================================== */
const API_BASE = 'https://kyzorohan.web.id/api';
const API_KEY  = '';

const EP = {
  send  : (email)       => `${API_BASE}/am-send2?key=${API_KEY}&email=${encodeURIComponent(email)}`,
  verify: (email, link) => `${API_BASE}/am-verif2?key=${API_KEY}&email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}`,
};

/* ===========================================
   🔑 PREMIUM PROXY (NETLIFY)
   =========================================== */
// ⚠️ GANTI URL INI KE DOMAIN NETLIFY BARU LO ⚠️
const PREMIUM_API = 'https://projectamprem-febztzy.netlify.app/.netlify/functions'; 
const TOKEN_STORE = 'am_premium_token_v1';
const TRIAL_LIMIT = 3;
const STORAGE_KEY = 'am_trial_state_v1';
const WA_NUMBER   = '6289679137206';
const WA_MESSAGE  = 'Halo kak, saya ingin beli Kode Unlimited / Bulk Key.';

// Variabel Global
let isBulkUnlocked = false;
let trialState = { count: 0, unlocked: false };

// Helper Token
function getPremiumToken()   { try { return localStorage.getItem(TOKEN_STORE) || ''; } catch { return ''; } }
function setPremiumToken(t)  { try { t ? localStorage.setItem(TOKEN_STORE, t) : localStorage.removeItem(TOKEN_STORE); } catch {} }

async function validatePremium(token, requiredPlan) {
  if (!token) return { valid: false, error: 'No token' };
  try {
    const r = await fetch(`${PREMIUM_API}/am-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await r.json();
    if (data.valid && requiredPlan && data.plan !== requiredPlan) {
      return { valid: false, error: 'Key ini bukan untuk fitur ini.' };
    }
    return data;
  } catch (e) { return { valid: false, error: e.message }; }
}

async function bulkGenerate(count) {
  const token = getPremiumToken();
  if (!token) throw new Error('Bulk Key belum ada');
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
   🗄️ TRIAL STATE & UI (FITUR ATAS)
   =========================================== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, unlocked: false };
    const s = JSON.parse(raw);
    return { count: Math.max(0, parseInt(s.count) || 0), unlocked: !!s.unlocked };
  } catch { return { count: 0, unlocked: false }; }
}
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }

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
   🎉 PARTICLES & TOAST
   =========================================== */
(function spawnParticles() {
  const wrap = document.getElementById('particles');
  if(!wrap) return;
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
    if (Math.random() > 0.6) { p.style.background = '#22d3ee'; p.style.boxShadow = '0 0 10px #22d3ee'; }
    wrap.appendChild(p);
  }
})();

const toastEl = document.getElementById('toast');
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ===========================================
   STEP 1 & 2: MAGIC LINK (FITUR ATAS)
   =========================================== */
document.getElementById('amSendMagicBtn').onclick = async function() {
  if (!canUseTrial()) { showToast('Trial habis! Masukkan Kode Owner di bawah.'); renderTrial(); return; }
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
    const ok = data && (data.status === true || data.success === true || data.ok === true || (typeof data.message === 'string' && /success|sent|ok/i.test(data.message)) || (typeof data.raw === 'string' && /success|sent/i.test(data.raw)));

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
  } catch (e) { box.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>'; }

  this.disabled = false;
  this.innerHTML = original;
};

document.getElementById('amVerifyBtn').onclick = async function() {
  const rawLink = document.getElementById('amRawLink').value.trim();
  const email = document.getElementById('amSendResult').dataset.email || document.getElementById('amEmail').value.trim();

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
    const ok = data && (data.status === true || data.success === true || data.ok === true || (typeof data.message === 'string' && /success|premium|activated|ok/i.test(data.message)) || (typeof data.raw === 'string' && /success|premium/i.test(data.raw)));

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
  } catch (e) { box.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>'; }

  this.disabled = false;
  this.innerHTML = original;
};

/* ===========================================
   🔓 UNLOCK KODE (FITUR ATAS)
   =========================================== */
document.getElementById('unlockBtn').onclick = async function() {
  const code = document.getElementById('unlockCode').value.trim();
  const res  = document.getElementById('unlockResult');
  res.style.display = 'block';

  if (!code) { res.innerHTML = '<div style="color:#fbbf24;">Masukkan kode akses terlebih dahulu.</div>'; return; }

  this.disabled = true;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Cek Kode...';
  res.innerHTML = '<div style="color:#fbbf24;"><i class="fas fa-spinner spin"></i> Memvalidasi kode...</div>';

  const v = await validatePremium(code, 'premium_magic');

  if (v.valid) {
    trialState.unlocked = true;
    saveState(trialState);
    res.innerHTML = '<div style="color:#22c55e;">🎉 Kode valid! Unlimited access fitur atas terbuka.</div>';
    showToast('Unlimited access aktif!');
    setTimeout(() => {
      renderTrial();
      document.getElementById('step1').style.display = 'block';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('unlockCode').value = '';
      res.style.display = 'none';
    }, 900);
  } else {
    res.innerHTML = '<div style="color:#ef4444;">❌ ' + (v.error || 'Kode salah/expired.') + '</div>';
    showToast('Kode tidak valid');
  }

  this.disabled = false;
  this.innerHTML = '<i class="fas fa-unlock"></i> Aktivasi Kode';
};
document.getElementById('unlockCode').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('unlockBtn').click();
});

/* ===========================================
   📦 BULK GENERATOR (FITUR BAWAH - LOCKED)
   =========================================== */
const bulkInput  = document.getElementById('bulkCount');
const bulkBtn    = document.getElementById('bulkBtn');
const bulkResult = document.getElementById('bulkResult');

function renderBulkResult(data) {
  if (!data) return '<div style="color:#ef4444;">Kosong</div>';
  const list = Array.isArray(data) ? data : (data.results || data.emails || data.data || data.items || null);
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
  return `<div style="text-align:left; white-space:pre-wrap; font-family:monospace; font-size:11px; max-height:300px; overflow-y:auto;">${String(raw).slice(0, 4000)}</div>`;
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

function updateBulkUI(unlocked) {
  isBulkUnlocked = unlocked;
  if (unlocked) {
    bulkBtn.disabled = false;
    bulkBtn.style.opacity = 1;
    bulkBtn.style.cursor = 'pointer';
    bulkBtn.style.background = 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
    bulkBtn.innerHTML = '<i class="fas fa-boxes-stacked"></i> Generate Bulk';
    bulkInput.disabled = false;
    document.getElementById('bulkTokenBox').style.display = 'none';
  } else {
    bulkBtn.disabled = true;
    bulkBtn.style.opacity = 0.5;
    bulkBtn.style.cursor = 'not-allowed';
    bulkBtn.style.background = '#333';
    bulkBtn.innerHTML = '<i class="fas fa-lock"></i> Fitur Terkunci (Butuh Key)';
    bulkInput.disabled = true;
    document.getElementById('bulkTokenBox').style.display = 'block';
  }
}

(async function initBulkCheck() {
  const tok = getPremiumToken();
  if (tok) {
    const v = await validatePremium(tok, 'premium_bulk');
    if (v.valid) {
      updateBulkUI(true);
      document.getElementById('bulkTokenInput').value = tok;
      showToast('Bulk Key aktif ' + fmtRemain(v.remainingMs));
    } else {
      setPremiumToken(''); 
      updateBulkUI(false);
    }
  } else {
    updateBulkUI(false);
  }
})();

document.getElementById('bulkTokenApply').onclick = async function() {
  const inp = document.getElementById('bulkTokenInput');
  const tok = inp.value.trim();
  if (!tok) { showToast('Key kosong'); return; }

  this.disabled = true;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Cek Key...';

  try {
    setPremiumToken(tok);
    const v = await validatePremium(tok, 'premium_bulk');
    if (v.valid) {
      updateBulkUI(true);
      showToast('Bulk Key valid — ' + fmtRemain(v.remainingMs));
      inp.value = ''; 
    } else {
      setPremiumToken('');
      updateBulkUI(false);
      showToast(v.error || 'Key tidak valid');
    }
  } catch (err) {
    showToast('Error sistem: ' + err.message);
  }

  this.disabled = false;
  this.innerHTML = '<i class="fas fa-unlock"></i> Terapkan Key Bulk';
};

bulkBtn.onclick = async function() {
  if (!isBulkUnlocked) { showToast('Masukkan Key Bulk dulu!'); return; }
  
  const n = parseInt(bulkInput.value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) { showToast('Jumlah 1–50'); return; }

  this.disabled = true;
  const original = this.innerHTML;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Generate...';
  bulkResult.style.display = 'block';
  bulkResult.innerHTML = '<div><i class="fas fa-spinner spin"></i> Meminta ' + n + ' akun...</div>';

  try {
    const out = await bulkGenerate(n);
    const remain = fmtRemain(out.remainingMs);
    bulkResult.innerHTML = '<div style="color:#22c55e; margin-bottom:8px;">✅ Bulk selesai (count=' + n + ') ' + remain + '</div>' + renderBulkResult(out.payload);
  } catch (e) {
    bulkResult.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>';
    if (/expired|revoked|invalid|token/i.test(e.message)) {
      setPremiumToken('');
      updateBulkUI(false);
    }
  }

  this.disabled = false;
  this.innerHTML = original;
};

/* ===========================================
   INIT
   =========================================== */
trialState = loadState();
renderTrial();.value.trim();
  if (!tok) { showToast('Key kosong'); return; }

  this.disabled = true;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Cek Key...';

  try {
    setPremiumToken(tok);
    const v = await validatePremium(tok, 'premium_bulk');
    if (v.valid) {
      updateBulkUI(true);
      showToast('Bulk Key valid — ' + fmtRemain(v.remainingMs));
      inp.value = ''; // bersihkan input
    } else {
      setPremiumToken('');
      updateBulkUI(false);
      showToast(v.error || 'Key tidak valid');
    }
  } catch (err) {
    showToast('Error sistem: ' + err.message);
  }

  this.disabled = false;
  this.innerHTML = '<i class="fas fa-unlock"></i> Terapkan Key Bulk';
};

bulkBtn.onclick = async function() {
  if (!isBulkUnlocked) { showToast('Masukkan Key Bulk dulu!'); return; }
  
  const n = parseInt(bulkInput.value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 50) { showToast('Jumlah 1–50'); return; }

  this.disabled = true;
  const original = this.innerHTML;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Generate...';
  bulkResult.style.display = 'block';
  bulkResult.innerHTML = '<div><i class="fas fa-spinner spin"></i> Meminta ' + n + ' akun...</div>';

  try {
    const out = await bulkGenerate(n);
    const remain = fmtRemain(out.remainingMs);
    bulkResult.innerHTML = '<div style="color:#22c55e; margin-bottom:8px;">✅ Bulk selesai (count=' + n + ') ' + remain + '</div>' + renderBulkResult(out.payload);
  } catch (e) {
    bulkResult.innerHTML = '<div style="color:#ef4444;">Error: ' + e.message + '</div>';
    if (/expired|revoked|invalid|token/i.test(e.message)) {
      setPremiumToken('');
      updateBulkUI(false);
    }
  }

  thidisabled = false;
  this.innerHTML = original;
};

/* ===========================================
   INIT
   =========================================== */
trialState = loadState();
renderTrial();id ${border}; border-radius:8px; padding:10px; font-size:11px; font-family:monospace;">
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
// State & Fungsi untuk Buka/Kunci UI Bulk
let isBulkUnlocked = false;
const bulkInput = document.getElementById('bulkCount');
const bulkBtn = document.getElementById('bulkBtn');

function updateBulkUI(unlocked) {
  isBulkUnlocked = unlocked;
  if (unlocked) {
    bulkBtn.disabled = false;
    bulkBtn.style.opacity = 1;
    bulkBtn.style.cursor = 'pointer';
    bulkBtn.style.background = 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
    bulkBtn.innerHTML = '<i class="fas fa-boxes-stacked"></i> Generate Bulk';
    bulkInput.disabled = false;
    document.getElementById('bulkTokenBox').style.display = 'none';
  } else {
    bulkBtn.disabled = true;
    bulkBtn.style.opacity = 0.5;
    bulkBtn.style.cursor = 'not-allowed';
    bulkBtn.style.background = '#333';
    bulkBtn.innerHTML = '<i class="fas fa-lock"></i> Fitur Terkunci (Butuh Key)';
    bulkInput.disabled = true;
    document.getElementById('bulkTokenBox').style.display = 'block';
  }
}
/* Token apply */
document.getElementById('bulkTokenApply').onclick = async function() {
  const inp = document.getElementById('bulkTokenInput');
  const tok = inp.value.trim();
  if (!tok) { alert('Key kosong!'); return; }

  this.disabled = true;
  this.innerHTML = '<i class="fas fa-spinner spin"></i> Cek Key...';

  try {
    setPremiumToken(tok);
    // Wajib cek 'premium_bulk' biar key fitur atas gabisa dipake disini
    const v = await validatePremium(tok, 'premium_bulk');
    
    if (v.valid) {
      const remain = fmtRemain(v.remainingMs);
      updateBulkUI(true); // <-- INI YANG BIKIN TOMBOLNYA NYALA
      alert('SUKSES! Bulk Key Valid: ' + remain);
    } else {
      setPremiumToken('');
      updateBulkUI(false);
      alert('GAGAL: ' + (v.error || 'Key tidak valid / salah tipe'));
    }
  } catch (err) {
    alert('ERROR SISTEM: ' + err.message);
  }

  this.disabled = false;
  this.innerHTML = '<i class="fas fa-unlock"></i> Terapkan Key Bulk';
};

/* ===========================================
   INIT
   =========================================== */
renderTrial();
