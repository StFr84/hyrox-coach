import { syncQueue } from './sync.js';
import { exchangeCode } from './strava.js';

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
      await exchangeCode(stravaCode);
      await switchTab('settings');
      return;
    } catch (e) {
      console.error('Strava auth failed:', e);
    }
  }

  await switchTab('dashboard');
});
