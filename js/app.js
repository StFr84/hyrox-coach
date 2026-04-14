import { syncQueue } from './sync.js';
import { getCurrentPhase } from './data/plan-data.js';

const TAB_MODULES = {
  dashboard: () => import('./tabs/dashboard.js'),
  log:       () => import('./tabs/log.js'),
  plan:      () => import('./tabs/plan.js'),
  analyse:   () => import('./tabs/analyse.js'),
  coach:     () => import('./tabs/coach.js'),
  settings:  () => import('./tabs/settings.js'),
};

const initialized = new Set();

async function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

  if (!initialized.has(tabId) && TAB_MODULES[tabId]) {
    const mod = await TAB_MODULES[tabId]();
    await mod.init();
    initialized.add(tabId);
  } else if (TAB_MODULES[tabId]) {
    const mod = await TAB_MODULES[tabId]();
    if (mod.refresh) await mod.refresh();
  }
}

function showPhaseModal(phase) {
  const overlay = document.createElement('div');
  overlay.className = 'phase-modal-overlay';
  overlay.id = 'phase-modal';

  const changesHtml = (phase.changes || []).map(c => `
    <div class="phase-change-item">
      <span class="phase-change-icon">${c.icon}</span>
      <span class="phase-change-text">${c.text}</span>
    </div>`).join('');

  overlay.innerHTML = `
    <div class="phase-modal-card">
      <div class="phase-modal-icon">🚀</div>
      <div class="phase-modal-title">Neue Phase gestartet!</div>
      <div class="phase-modal-name">${phase.name}</div>
      <div class="phase-modal-period">${phase.period} · ${phase.weeks}</div>
      <div class="phase-modal-divider"></div>
      <div class="phase-modal-changes-label">Was sich ändert</div>
      <div class="phase-modal-changes">${changesHtml || '<div style="color:var(--muted);font-size:0.85em">Erste Phase — los geht\'s!</div>'}</div>
      <button class="phase-modal-confirm" id="btn-confirm-phase">✓ Ich habe meinen Plan angepasst</button>
      <button class="phase-modal-plan-link" id="btn-view-plan">Plan in der App ansehen →</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btn-confirm-phase').addEventListener('click', () => {
    localStorage.setItem('sub68_confirmedPhase', phase.id);
    overlay.remove();
  });
  overlay.querySelector('#btn-view-plan').addEventListener('click', () => {
    localStorage.setItem('sub68_confirmedPhase', phase.id);
    overlay.remove();
    switchTab('plan');
  });
}

function checkPhaseTransition() {
  const phase = getCurrentPhase();
  const confirmed = localStorage.getItem('sub68_confirmedPhase');
  if (phase.id !== confirmed) showPhaseModal(phase);
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  syncQueue();
  window.addEventListener('online', syncQueue);

  // Handle Strava OAuth callback
  const params = new URLSearchParams(window.location.search);
  const stravaCode = params.get('code');
  if (stravaCode && params.get('scope')?.includes('activity')) {
    history.replaceState({}, '', window.location.pathname);
    try {
      const { exchangeCode } = await import('./strava.js');
      await exchangeCode(stravaCode);
      await switchTab('settings');
      return;
    } catch (e) {
      console.error('Strava auth failed:', e);
    }
  }

  await switchTab('dashboard');
  checkPhaseTransition(); // Show after dashboard loads, blocks interaction until confirmed
});
