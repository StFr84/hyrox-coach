import { getTodayHRV, getWeekSessions, getHRVEntries, ampelLabel } from '../db.js';
import { getCurrentPhase, getTodaySession, TYPE_ICONS } from '../data/plan-data.js';
import { RACE_DATE } from '../config.js';

const el = () => document.getElementById('tab-dashboard');

export async function init() {
  el().innerHTML = '<div class="loading">Lade Dashboard…</div>';
  await render();
}

export async function refresh() {
  await render();
}

async function render() {
  const [todayHRV, weekSessions, hrvEntries] = await Promise.all([
    getTodayHRV(),
    getWeekSessions(),
    getHRVEntries(7),
  ]);

  const phase = getCurrentPhase();
  const todaySession = getTodaySession();
  const weekLoad = weekSessions.reduce((s, x) => s + (x.load_points || 0), 0);
  const phaseMax = phase.rpeMax || 1500;
  const loadPct = Math.min(100, Math.round((weekLoad / phaseMax) * 100));
  const daysLeft = Math.ceil((RACE_DATE - new Date()) / (1000 * 60 * 60 * 24));

  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;
  const ampel = todayHRV ? todayHRV.ampel : 'gruen';
  const ampelText = ampelLabel(ampel);

  const start = new Date('2026-03-29');
  const weeksTraining = Math.max(0, Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000)));
  const prognosisMin = Math.max(66, 78 - weeksTraining * 0.3);
  const progM = Math.floor(prognosisMin);
  const progS = Math.round((prognosisMin - progM) * 60);
  const prognosisStr = `${progM}:${String(progS).padStart(2, '0')}`;

  // Ring: 0% at 78 min baseline, 100% at 68 min target (sub 68)
  const circumference = 276; // 2 * π * 44 ≈ 276.46
  const ringFill = Math.max(0, Math.min(circumference, ((78 - prognosisMin) / 10) * circumference));

  el().innerHTML = `
    <div class="screen-title">Dashboard · ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>

    <div class="ampel-banner ${ampel}">
      <div class="ampel-dot"></div>
      <div>
        <span style="font-size:1.1em">${todayHRV ? todayHRV.rmssd + ' ms RMSSD' : 'HRV heute noch nicht gemessen'}</span>
        <div style="font-size:0.82em;opacity:0.85;margin-top:1px">${ampelText}</div>
      </div>
    </div>

    <div class="hero-card" style="text-align:center;border:1px solid var(--bg3);">
      <div class="hero-label" style="margin-bottom:8px;">Zielzeit-Prognose</div>
      <div class="ring-chart-wrap">
        <svg viewBox="0 0 120 120" class="ring-chart">
          <circle cx="60" cy="60" r="44" fill="none" stroke="var(--bg3)" stroke-width="8"/>
          <circle cx="60" cy="60" r="44" fill="none" stroke="var(--accent)" stroke-width="8"
            stroke-dasharray="${ringFill} ${circumference}" stroke-dashoffset="69"
            stroke-linecap="round" transform="rotate(-90 60 60)" class="ring-progress"/>
          <text x="60" y="57" text-anchor="middle" class="ring-text-main">${prognosisStr}</text>
          <text x="60" y="69" text-anchor="middle" class="ring-text-label">PROGNOSE</text>
          <text x="60" y="80" text-anchor="middle" class="ring-text-goal">Ziel: Sub 68:00</text>
        </svg>
      </div>
      <div class="hero-sub">${daysLeft} Tage bis Race Day</div>
    </div>

    ${todaySession && todaySession.type !== 'ruhe' ? `
    <div class="today-card">
      <div class="today-info">
        <div class="today-name">${TYPE_ICONS[todaySession.type] || ''} ${todaySession.name}</div>
        <div class="today-detail">${todaySession.dur > 0 ? todaySession.dur + ' Min' : ''}${todaySession.zone ? ' · ' + todaySession.zone : ''}${todaySession.hrMax ? ' · &lt;' + todaySession.hrMax + ' bpm' : ''}</div>
      </div>
      <button class="btn-log" onclick="document.querySelector('[data-tab=log]').click()">LOG ›</button>
    </div>
    ` : `
    <div class="card" style="text-align:center;color:var(--muted);padding:16px">
      <div style="font-size:1.4em;margin-bottom:4px">😴</div>
      <div style="font-size:0.88em">Heute: ${todaySession?.name || 'Ruhetag'}</div>
    </div>
    `}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Wochenbelastung</div>
        <div class="stat-value color-accent2">${weekLoad} <span style="font-size:0.45em;color:var(--muted)">/ ${phaseMax}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${loadPct}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Phase</div>
        <div class="stat-value color-accent">${phase.name}</div>
        <div style="font-size:0.72em;color:var(--muted);margin-top:2px">${phase.weeks} · ${phase.period}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">7-Tage HRV-Mittel</div>
        <div class="stat-value color-success">${weekMean ? weekMean + ' ms' : '–'}</div>
        <div style="font-size:0.72em;color:var(--muted);margin-top:2px">${hrvEntries.length} Messungen</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Countdown</div>
        <div class="stat-value color-warn">${daysLeft}</div>
        <div style="font-size:0.72em;color:var(--muted);margin-top:2px">Tage bis Dezember</div>
      </div>
    </div>
  `;
}
