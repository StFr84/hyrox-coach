import { PHASES, getCurrentPhase, TYPE_ICONS } from '../data/plan-data.js';
import { STATIONS } from '../data/athlete.js';

const el = () => document.getElementById('tab-plan');
let activePhaseId = getCurrentPhase().id;

export async function init() { render(); }
export async function refresh() { render(); }

function render() {
  const phase = PHASES.find(p => p.id === activePhaseId) || PHASES[1];

  el().innerHTML = `
    <div class="screen-title">📅 Trainingsplan</div>

    <div class="phase-pills">
      ${PHASES.map(p => `
        <div class="phase-pill ${p.id === activePhaseId ? 'active' : ''}" data-phase="${p.id}">
          ${p.name} <span style="opacity:0.6;font-size:0.85em">${p.weeks}</span>
        </div>
      `).join('')}
    </div>

    <div class="card" style="margin-bottom:10px;padding:12px 14px">
      <div style="font-size:0.78em;color:var(--muted)">${phase.period} · ${phase.sessionsPerWeek} Einheiten/Woche</div>
      ${phase.rpeMax ? `<div style="font-size:0.78em;color:var(--accent2);margin-top:2px">Ziel: ${phase.rpeMin || 0}–${phase.rpeMax} Session-RPE-Punkte/Woche</div>` : ''}
    </div>

    <div class="week-grid">
      ${phase.weekPlan.map(day => `
        <div class="week-day ${day.type === 'ruhe' ? 'rest' : ''}" data-day='${JSON.stringify(day).replace(/'/g, "&#39;")}'>
          <div class="day-label">${day.day}</div>
          <div class="day-icon">${TYPE_ICONS[day.type] || '–'}</div>
          <div class="day-info">
            <div class="day-name">${day.name}</div>
            <div class="day-detail">${day.dur > 0 ? day.dur + ' Min' : ''}${day.zone ? ' · ' + day.zone : ''}${day.hrMax ? ' · &lt;' + day.hrMax + ' bpm' : ''}</div>
          </div>
          ${day.type !== 'ruhe' ? '<div class="day-chevron">›</div>' : ''}
        </div>
      `).join('')}
    </div>

    <div class="section-label" style="margin-top:20px">Hyrox Stationen & Zielzeiten</div>
    ${STATIONS.map(s => `
      <div class="station-card">
        <div>
          <div class="station-name">${s.name}</div>
          <div class="station-detail">${s.dist}${s.weight !== '–' ? ' · ' + s.weight : ''}</div>
          ${s.schwaeche ? '<span class="badge-schwaeche">⚡ SCHWÄCHE Prio 1</span>' : ''}
        </div>
        <div class="station-time">${s.ziel}</div>
      </div>
    `).join('')}
  `;

  document.querySelectorAll('.phase-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activePhaseId = pill.dataset.phase;
      render();
    });
  });

  document.querySelectorAll('.week-day:not(.rest)').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      const day = JSON.parse(dayEl.dataset.day);
      showDayModal(day);
    });
  });
}

function showDayModal(day) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <button class="modal-close" id="modal-close">✕</button>
      <div class="modal-title">${TYPE_ICONS[day.type] || ''} ${day.name}</div>
      <div style="font-size:0.85em;color:var(--muted);margin-bottom:14px">
        ${day.day} · ${day.dur > 0 ? day.dur + ' Min' : ''}${day.zone ? ' · Zone: ' + day.zone : ''}${day.hrMax ? ' · HF &lt;' + day.hrMax + ' bpm' : ''}
      </div>
      <div style="line-height:1.7;font-size:0.95em">${day.details || 'Keine weiteren Details.'}</div>
      <button class="btn-primary" style="margin-top:20px" id="modal-log-btn">⚡ Diese Einheit jetzt loggen</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-log-btn').addEventListener('click', () => {
    overlay.remove();
    document.querySelector('[data-tab="log"]').click();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
