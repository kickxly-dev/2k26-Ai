'use strict';

/* ──────────────── CONFIG ──────────────── */
const SERVICES = [
  {
    id: 'views',
    name: 'TikTok Views',
    icon: '👁️',
    faIcon: 'fa-eye',
    desc: 'Boost your video view count instantly',
    amount: '1,000',
    unit: 'Views',
    color: '#25f4ee',
    cooldown: 30,
    type: 'video',
    status: 'active',
  },
  {
    id: 'likes',
    name: 'TikTok Likes',
    icon: '❤️',
    faIcon: 'fa-heart',
    desc: 'Increase likes on your TikTok videos',
    amount: '500',
    unit: 'Likes',
    color: '#fe2c55',
    cooldown: 30,
    type: 'video',
    status: 'active',
  },
  {
    id: 'followers',
    name: 'TikTok Followers',
    icon: '👥',
    faIcon: 'fa-user-plus',
    desc: 'Grow your follower count organically',
    amount: '200',
    unit: 'Followers',
    color: '#9333ea',
    cooldown: 60,
    type: 'profile',
    status: 'active',
  },
  {
    id: 'comments',
    name: 'TikTok Comments',
    icon: '💬',
    faIcon: 'fa-comment',
    desc: 'Get more comments on your videos',
    amount: '50',
    unit: 'Comments',
    color: '#f59e0b',
    cooldown: 30,
    type: 'video',
    status: 'busy',
  },
  {
    id: 'shares',
    name: 'TikTok Shares',
    icon: '↗️',
    faIcon: 'fa-share',
    desc: 'Expand reach with more video shares',
    amount: '100',
    unit: 'Shares',
    color: '#10b981',
    cooldown: 30,
    type: 'video',
    status: 'active',
  },
  {
    id: 'favorites',
    name: 'TikTok Favorites',
    icon: '⭐',
    faIcon: 'fa-star',
    desc: 'Add favorites/saves to your videos',
    amount: '300',
    unit: 'Favorites',
    color: '#f97316',
    cooldown: 30,
    type: 'video',
    status: 'active',
  },
  {
    id: 'live-views',
    name: 'TikTok Live Views',
    icon: '🔴',
    faIcon: 'fa-video',
    desc: 'Boost your live stream viewer count',
    amount: '500',
    unit: 'Live Views',
    color: '#ef4444',
    cooldown: 15,
    type: 'live',
    status: 'active',
  },
  {
    id: 'live-likes',
    name: 'TikTok Live Likes',
    icon: '🔥',
    faIcon: 'fa-fire',
    desc: 'Send live likes during your stream',
    amount: '1,000',
    unit: 'Live Likes',
    color: '#fe2c55',
    cooldown: 15,
    type: 'live',
    status: 'busy',
  },
];

const VERIFY_SECONDS = 15;
const PROC_DURATION  = 4000; // ms

/* ──────────────── STATE ──────────────── */
let activeService = null;
let verifyTimer   = null;
let procTimer     = null;
let cooldownTimers = {};

/* ──────────────── COOLDOWN HELPERS ──────────────── */
function setCooldown(serviceId, minutes) {
  const expiry = Date.now() + minutes * 60 * 1000;
  localStorage.setItem(`cd_${serviceId}`, expiry.toString());
}

function getCooldownRemaining(serviceId) {
  const expiry = parseInt(localStorage.getItem(`cd_${serviceId}`) || '0', 10);
  if (!expiry) return 0;
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function formatCooldown(seconds) {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
  return `${seconds}s`;
}

/* ──────────────── RENDER GRID ──────────────── */
function renderServices() {
  const grid = document.getElementById('services-grid');
  grid.innerHTML = '';

  SERVICES.forEach(svc => {
    const cd = getCooldownRemaining(svc.id);
    const isOnCd = cd > 0;
    const isBusy = svc.status === 'busy';

    const card = document.createElement('div');
    card.className = `service-card${isOnCd ? ' on-cooldown' : ''}${isBusy ? ' disabled' : ''}`;
    card.style.setProperty('--service-color', svc.color);
    card.dataset.id = svc.id;

    let statusHtml;
    if (isOnCd) {
      statusHtml = `<span class="status-badge cooldown"><span class="status-dot"></span>Cooldown</span>`;
    } else if (isBusy) {
      statusHtml = `<span class="status-badge busy"><span class="status-dot pulse"></span>Busy</span>`;
    } else {
      statusHtml = `<span class="status-badge active"><span class="status-dot pulse"></span>Active</span>`;
    }

    let btnHtml;
    if (isOnCd) {
      btnHtml = `<button class="card-btn cooldown-btn" disabled>⏳ ${formatCooldown(cd)}</button>`;
    } else if (isBusy) {
      btnHtml = `<button class="card-btn cooldown-btn" disabled>Busy</button>`;
    } else {
      btnHtml = `<button class="card-btn">Start →</button>`;
    }

    const cdBarHtml = isOnCd
      ? `<div class="cooldown-bar"><div class="cooldown-bar-fill" style="width:${getCooldownPct(svc)}%"></div></div>`
      : '';

    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon" style="color:${svc.color}">${svc.icon}</div>
        ${statusHtml}
      </div>
      <div>
        <div class="card-name">${svc.name}</div>
        <div class="card-desc">${svc.desc}</div>
      </div>
      ${cdBarHtml}
      <div class="card-footer">
        <div class="card-amount">+<span>${svc.amount}</span> ${svc.unit}</div>
        ${btnHtml}
      </div>
    `;

    if (!isOnCd && !isBusy) {
      card.addEventListener('click', () => openPanel(svc.id));
    }

    grid.appendChild(card);
  });

  startCooldownCounters();
}

function getCooldownPct(svc) {
  const expiry = parseInt(localStorage.getItem(`cd_${svc.id}`) || '0', 10);
  if (!expiry) return 0;
  const total = svc.cooldown * 60 * 1000;
  const elapsed = total - (expiry - Date.now());
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function startCooldownCounters() {
  Object.values(cooldownTimers).forEach(clearInterval);
  cooldownTimers = {};

  SERVICES.forEach(svc => {
    if (getCooldownRemaining(svc.id) > 0) {
      cooldownTimers[svc.id] = setInterval(() => {
        const cd = getCooldownRemaining(svc.id);
        const card = document.querySelector(`.service-card[data-id="${svc.id}"]`);
        if (!card) return;

        if (cd <= 0) {
          clearInterval(cooldownTimers[svc.id]);
          renderServices();
          showToast(`${svc.name} is ready again!`, 'success');
          return;
        }

        const btn = card.querySelector('.card-btn');
        if (btn) btn.textContent = `⏳ ${formatCooldown(cd)}`;

        const fill = card.querySelector('.cooldown-bar-fill');
        if (fill) fill.style.width = `${getCooldownPct(svc)}%`;
      }, 1000);
    }
  });
}

/* ──────────────── PANEL ──────────────── */
function openPanel(serviceId) {
  activeService = SERVICES.find(s => s.id === serviceId);
  if (!activeService) return;

  // Reset all steps
  goToStep('url');

  // Fill panel header
  document.getElementById('panel-icon').textContent = activeService.icon;
  document.getElementById('panel-icon').style.background = hexToRgba(activeService.color, .12);
  document.getElementById('panel-icon').style.border = `1px solid ${hexToRgba(activeService.color, .25)}`;
  document.getElementById('panel-title').textContent = activeService.name;

  const typeLabel = activeService.type === 'video' ? 'video URL'
    : activeService.type === 'live' ? 'live stream URL'
    : 'profile URL';
  document.getElementById('panel-subtitle').textContent =
    `Enter your TikTok ${typeLabel} to get +${activeService.amount} ${activeService.unit}`;

  // Placeholder text
  const input = document.getElementById('url-input');
  input.value = '';
  input.className = 'url-input';
  input.placeholder = activeService.type === 'profile'
    ? 'https://www.tiktok.com/@username'
    : activeService.type === 'live'
    ? 'https://www.tiktok.com/@username/live'
    : 'https://www.tiktok.com/@username/video/...';

  document.getElementById('input-error').classList.remove('visible');
  document.getElementById('profile-preview').classList.remove('visible');
  document.getElementById('panel-overlay').classList.add('visible');
  document.getElementById('service-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => input.focus(), 350);
}

function closePanel() {
  clearTimeout(verifyTimer);
  clearTimeout(procTimer);
  document.getElementById('panel-overlay').classList.remove('visible');
  document.getElementById('service-panel').classList.remove('open');
  document.body.style.overflow = '';
  activeService = null;
}

document.getElementById('panel-overlay').addEventListener('click', closePanel);
document.getElementById('panel-close').addEventListener('click', closePanel);

/* ──────────────── STEPS ──────────────── */
function goToStep(step) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');
}

/* ──────────────── URL STEP ──────────────── */
const urlInput = document.getElementById('url-input');
const inputError = document.getElementById('input-error');
const profilePreview = document.getElementById('profile-preview');

urlInput.addEventListener('input', () => {
  inputError.classList.remove('visible');
  urlInput.classList.remove('error');

  const val = urlInput.value.trim();
  if (val && isTikTokUrl(val)) {
    showProfilePreview(val);
  } else {
    profilePreview.classList.remove('visible');
  }
});

function isTikTokUrl(url) {
  return /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/i.test(url);
}

function showProfilePreview(url) {
  const handle = extractHandle(url) || 'user';
  document.getElementById('preview-name').textContent = `@${handle}`;
  document.getElementById('preview-url').textContent = url.length > 48 ? url.slice(0, 48) + '...' : url;
  document.getElementById('preview-avatar-letter').textContent = handle[0].toUpperCase();
  profilePreview.classList.add('visible');
}

function extractHandle(url) {
  const m = url.match(/tiktok\.com\/@([^/?#]+)/i);
  return m ? m[1] : null;
}

document.getElementById('btn-send').addEventListener('click', () => {
  const val = urlInput.value.trim();
  if (!val) {
    showError('Please enter a TikTok URL');
    return;
  }
  if (!isTikTokUrl(val)) {
    showError('Please enter a valid TikTok URL (must start with tiktok.com)');
    return;
  }
  goToStep('verify');
  startVerification();
});

function showError(msg) {
  urlInput.classList.add('error');
  inputError.textContent = msg;
  inputError.classList.add('visible');
  urlInput.focus();
}

/* ──────────────── VERIFY STEP ──────────────── */
const VERIFY_TASKS = [
  'Connecting to TikTok servers',
  'Authenticating your request',
  'Verifying your URL',
];

let verifySecondsLeft = VERIFY_SECONDS;
let verifyInterval    = null;

function startVerification() {
  verifySecondsLeft = VERIFY_SECONDS;
  renderVerifyTasks(0);
  updateCountdown(verifySecondsLeft);

  verifyInterval = setInterval(() => {
    verifySecondsLeft--;
    updateCountdown(verifySecondsLeft);

    const taskIdx = Math.floor((1 - verifySecondsLeft / VERIFY_SECONDS) * VERIFY_TASKS.length);
    renderVerifyTasks(taskIdx);

    if (verifySecondsLeft <= 0) {
      clearInterval(verifyInterval);
      goToStep('processing');
      startProcessing();
    }
  }, 1000);
}

function updateCountdown(seconds) {
  document.getElementById('countdown-num').textContent = seconds;
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - seconds / VERIFY_SECONDS);
  document.getElementById('ring-fill').style.strokeDashoffset = circumference - offset;
}

function renderVerifyTasks(doneUpTo) {
  const container = document.getElementById('verify-tasks');
  container.innerHTML = '';
  VERIFY_TASKS.forEach((task, i) => {
    const div = document.createElement('div');
    div.className = 'verify-task';
    const isDone = i < doneUpTo;
    const isActive = i === doneUpTo;
    div.innerHTML = `
      <div class="task-icon ${isDone ? 'done' : isActive ? 'active' : ''}">
        ${isDone ? '✓' : isActive ? '<i class="fas fa-circle-notch fa-spin" style="font-size:.7rem"></i>' : '○'}
      </div>
      <span>${task}</span>
    `;
    container.appendChild(div);
  });
}

/* ──────────────── PROCESSING STEP ──────────────── */
const PROC_STEPS = ['Queuing', 'Processing', 'Sending', 'Finalizing'];

function startProcessing() {
  let pct = 0;
  const bar = document.getElementById('progress-bar');
  const statusEl = document.getElementById('proc-status');
  renderProcSteps(-1);

  const interval = setInterval(() => {
    pct = Math.min(100, pct + (Math.random() * 8 + 2));
    bar.style.width = pct + '%';

    const stepIdx = Math.floor((pct / 100) * PROC_STEPS.length);
    renderProcSteps(stepIdx);
    statusEl.textContent = PROC_STEPS[Math.min(stepIdx, PROC_STEPS.length - 1)] + '...';

    if (pct >= 100) {
      clearInterval(interval);
      bar.style.width = '100%';
      renderProcSteps(PROC_STEPS.length);
      setTimeout(() => {
        goToStep('success');
        showSuccess();
      }, 500);
    }
  }, PROC_DURATION / 30);
}

function renderProcSteps(activeIdx) {
  const container = document.getElementById('proc-steps');
  container.innerHTML = '';
  PROC_STEPS.forEach((label, i) => {
    const div = document.createElement('div');
    div.className = `proc-step ${i < activeIdx ? 'done' : i === activeIdx ? 'active' : ''}`;
    div.innerHTML = `<div class="proc-step-dot"></div><span>${label}</span>`;
    container.appendChild(div);
  });
}

/* ──────────────── SUCCESS STEP ──────────────── */
function showSuccess() {
  document.getElementById('success-amount').textContent = `+${activeService.amount}`;
  document.getElementById('success-service').textContent = `${activeService.unit} sent to your ${activeService.type}`;

  const cd = activeService.cooldown;
  document.getElementById('cooldown-time').textContent =
    cd >= 60 ? `${cd / 60} hour${cd / 60 > 1 ? 's' : ''}` : `${cd} minutes`;

  spawnConfetti();
  setCooldown(activeService.id, cd);
  renderServices();
  showToast(`+${activeService.amount} ${activeService.unit} sent!`, 'success');
}

function spawnConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  wrap.innerHTML = '';
  const colors = ['#fe2c55', '#25f4ee', '#9333ea', '#10b981', '#f59e0b'];
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.background = colors[i % colors.length];
    dot.style.left = Math.random() * 80 + 10 + '%';
    dot.style.top  = Math.random() * 80 + 10 + '%';
    const tx = (Math.random() - .5) * 80;
    const ty = -(Math.random() * 60 + 20);
    dot.style.setProperty('--tx', `translate(${tx}px,${ty}px)`);
    dot.style.animationDelay = Math.random() * .4 + 's';
    wrap.appendChild(dot);
  }
}

document.getElementById('btn-done').addEventListener('click', closePanel);

/* ──────────────── TOAST ──────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ──────────────── STATS COUNTER ──────────────── */
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = formatNum(Math.floor(current)) + suffix;
    if (current >= target) clearInterval(timer);
  }, 16);
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

/* ──────────────── INTERSECTION OBSERVER (stats) ──────────────── */
function initStats() {
  const stats = [
    { el: document.getElementById('stat-users'),    val: 2_430_000 },
    { el: document.getElementById('stat-sent'),     val: 18_750_000 },
    { el: document.getElementById('stat-services'), val: 8 },
    { el: document.getElementById('stat-uptime'),   val: 99, suffix: '%' },
  ];

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        stats.forEach(s => animateCounter(s.el, s.val, s.suffix || ''));
        obs.disconnect();
      }
    });
  }, { threshold: .3 });

  obs.observe(document.getElementById('stats-section'));
}

/* ──────────────── UTILITY ──────────────── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ──────────────── COUNTDOWN RING INIT ──────────────── */
function initRing() {
  const circ = 2 * Math.PI * 44;
  const fill = document.getElementById('ring-fill');
  fill.style.strokeDasharray = circ;
  fill.style.strokeDashoffset = 0;
}

/* ──────────────── INIT ──────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  initStats();
  initRing();
});
