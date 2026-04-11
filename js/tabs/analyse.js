import { getHRVEntries, getSessionsForCharts } from '../db.js';
import { renderHRVChart, renderWeeklyLoadChart, renderDistributionChart, renderPaceChart } from '../charts.js';

const el = () => document.getElementById('tab-analyse');
let hrvDays = 7;

export async function init() {
  el().innerHTML = '<div class="loading">Lade Analyse…</div>';
  await render();
}

export async function refresh() { await render(); }

async function render() {
  const [hrvEntries, sessions] = await Promise.all([
    getHRVEntries(30),
    getSessionsForCharts(8),
  ]);
  const shown = hrvDays === 7 ? hrvEntries.slice(-7) : hrvEntries;

  el().innerHTML = `
    <div class="screen-title">📈 Analyse</div>

    <div class="chart-container">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="chart-title">HRV-Verlauf (RMSSD)</div>
        <div class="chart-toggle">
          <button class="${hrvDays === 7 ? 'active' : ''}" id="hrv-7">7T</button>
          <button class="${hrvDays === 30 ? 'active' : ''}" id="hrv-30">30T</button>
        </div>
      </div>
      <div style="height:180px"><canvas id="chart-hrv"></canvas></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Wochenbelastung (Session-RPE Pkt)</div>
      <div style="height:160px"><canvas id="chart-load"></canvas></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Trainingsverteilung</div>
      <div style="height:180px"><canvas id="chart-dist"></canvas></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Pace-Entwicklung (Laufen)</div>
      <div style="height:160px"><canvas id="chart-pace"></canvas></div>
      ${sessions.filter(s => s.type === 'laufen' && s.pace_per_km).length === 0
        ? '<div style="text-align:center;color:var(--muted);font-size:0.82em;margin-top:8px">Noch keine Pace-Daten. Beim Loggen Pace eintragen.</div>'
        : ''}
    </div>
  `;

  renderHRVChart('chart-hrv', shown);
  renderWeeklyLoadChart('chart-load', sessions);
  renderDistributionChart('chart-dist', sessions);
  renderPaceChart('chart-pace', sessions);

  document.getElementById('hrv-7')?.addEventListener('click', () => { hrvDays = 7; render(); });
  document.getElementById('hrv-30')?.addEventListener('click', () => { hrvDays = 30; render(); });
}
