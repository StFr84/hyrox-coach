import { saveSession, saveHRV, getTodayHRV, getRecentSessions, getAmpelFromRMSSD, getHRVEntries, ampelLabel } from '../db.js';
import { queueSession } from '../sync.js';
import { getCurrentPhase, TYPE_ICONS } from '../data/plan-data.js';

const el = () => document.getElementById('tab-log');

let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null };

export async function init() {
  const [todayHRV, sessions, hrvEntries] = await Promise.all([
    getTodayHRV(), getRecentSessions(10), getHRVEntries(7),
  ]);
  state.todayHRV = todayHRV;
  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;
  render(sessions, weekMean);
}

export async function refresh() { await init(); }

function render(sessions, weekMean) {
  const phase = getCurrentPhase();
  const types = [
    { id: 'laufen',   label: 'Laufen',  icon: '🏃' },
    { id: 'kraft',    label: 'Kraft',   icon: '🏋️' },
    { id: 'hyrox',    label: 'Hyrox',   icon: '🏆' },
    { id: 'skierg',   label: 'SkiErg',  icon: '🎿' },
    { id: 'rowing',   label: 'Rowing',  icon: '🚣' },
    { id: 'erholung', label: 'Erhol.',  icon: '♻️' },
  ];

  el().innerHTML = `
    <div class="screen-title">⚡ Training erfassen</div>

    ${!state.todayHRV ? `
    <div class="section-label">HRV heute morgen (RMSSD in ms)</div>
    <div class="hrv-input-row">
      <span style="font-size:1.4em">💚</span>
      <input class="hrv-number" id="hrv-input" type="number" min="10" max="200" placeholder="z.B. 72">
      <span style="color:var(--muted);font-size:0.8em">ms</span>
      <span id="hrv-ampel-badge" class="hrv-ampel-badge" style="display:none"></span>
    </div>
    <button class="btn-secondary mt-8" id="btn-save-hrv" style="width:100%">HRV speichern</button>
    ` : `
    <div class="ampel-banner ${state.todayHRV.ampel}" style="margin-bottom:10px">
      <div class="ampel-dot"></div>
      HRV heute: ${state.todayHRV.rmssd} ms · ${ampelLabel(state.todayHRV.ampel)}
    </div>
    `}

    <div class="section-label">Trainingstyp</div>
    <div class="type-grid">
      ${types.map(t => `
        <div class="type-pill ${state.type === t.id ? 'active' : ''}" data-type="${t.id}">
          <span class="type-icon">${t.icon}</span>${t.label}
        </div>
      `).join('')}
    </div>

    <div class="section-label">Dauer</div>
    <div class="duration-row">
      <button class="dur-btn" id="dur-minus">−</button>
      <div class="dur-value" id="dur-display">${state.duration} <span class="dur-unit">Min</span></div>
      <button class="dur-btn" id="dur-plus">+</button>
    </div>

    <div class="section-label">Anstrengung (RPE 1–10)</div>
    <div class="rpe-grid">
      ${[1,2,3,4,5,6,7,8,9,10].map(r => `
        <button class="rpe-btn ${state.rpe === r ? 'active' : ''}" data-rpe="${r}">${r}</button>
      `).join('')}
    </div>

    <div class="section-label">Belastung</div>
    <div class="result-box">
      <div>
        <div style="font-size:0.78em;color:var(--muted)">Session-RPE (${state.duration} Min × RPE ${state.rpe || '?'})</div>
        <div style="font-size:0.78em;color:var(--accent2);margin-top:2px">Phase-Ziel: ${phase.rpeMin || 0}–${phase.rpeMax || 1500} Pkt/Woche</div>
      </div>
      <div class="result-points" id="load-preview">${state.rpe ? state.duration * state.rpe : '–'}</div>
    </div>

    <button class="btn-primary" id="btn-save-session">💾 Einheit speichern</button>

    <div class="section-label" style="margin-top:24px">Letzte Einheiten</div>
    <div class="card" style="padding:0 14px">
      ${sessions.length === 0
        ? '<div class="empty-state"><div class="empty-icon">📭</div>Noch keine Einheiten</div>'
        : sessions.map(s => `
          <div class="session-item">
            <div>
              <div class="session-type">${TYPE_ICONS[s.type] || ''} ${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</div>
              <div class="session-meta">${new Date(s.created_at).toLocaleDateString('de-DE', {day:'numeric',month:'short'})} · ${s.duration_min} Min · RPE ${s.rpe}</div>
            </div>
            <div class="session-points">${s.load_points}</div>
          </div>
        `).join('')}
    </div>
  `;

  attachListeners(phase, weekMean);
}

function attachListeners(phase, weekMean) {
  const hrvInput = document.getElementById('hrv-input');
  if (hrvInput) {
    hrvInput.addEventListener('input', () => {
      const v = parseInt(hrvInput.value);
      const badge = document.getElementById('hrv-ampel-badge');
      if (v > 10) {
        const a = getAmpelFromRMSSD(v, weekMean);
        badge.className = `hrv-ampel-badge ampel-banner ${a}`;
        badge.style.display = '';
        badge.textContent = a === 'gruen' ? '● GRÜN' : a === 'gelb' ? '● GELB' : '● ROT';
      }
    });
    document.getElementById('btn-save-hrv')?.addEventListener('click', async () => {
      const v = parseInt(hrvInput.value);
      if (!v || v < 10 || v > 200) { alert('Bitte einen gültigen HRV-Wert eingeben (10–200 ms)'); return; }
      try {
        await saveHRV(v);
      } catch {
        // queue not applicable for HRV — just try again
      }
      state.todayHRV = await getTodayHRV();
      await refresh();
    });
  }

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.type = pill.dataset.type;
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateLoadPreview();
    });
  });

  document.getElementById('dur-minus')?.addEventListener('click', () => {
    state.duration = Math.max(5, state.duration - 5);
    document.getElementById('dur-display').innerHTML = `${state.duration} <span class="dur-unit">Min</span>`;
    updateLoadPreview();
  });
  document.getElementById('dur-plus')?.addEventListener('click', () => {
    state.duration = Math.min(180, state.duration + 5);
    document.getElementById('dur-display').innerHTML = `${state.duration} <span class="dur-unit">Min</span>`;
    updateLoadPreview();
  });

  document.querySelectorAll('.rpe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.rpe = parseInt(btn.dataset.rpe);
      document.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLoadPreview();
    });
  });

  document.getElementById('btn-save-session')?.addEventListener('click', async () => {
    if (!state.rpe) { alert('Bitte RPE auswählen (1–10)'); return; }
    const session = { type: state.type, duration: state.duration, rpe: state.rpe, phase: phase.id };
    try {
      await saveSession(session);
    } catch {
      queueSession(session);
    }
    state.rpe = null;
    await init();
    document.querySelector('[data-tab="dashboard"]').click();
  });
}

function updateLoadPreview() {
  const el = document.getElementById('load-preview');
  if (el) el.textContent = state.rpe ? state.duration * state.rpe : '–';
}
