import { getHRVEntries, getSessionsForCharts, getAllWorkoutLogs } from '../db.js';
import { renderHRVChart, renderWeeklyLoadChart, renderDistributionChart, renderPaceChart, renderRunProgressChart, renderStrengthMiniChart } from '../charts.js';

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

  let workoutLogs = [];
  try { workoutLogs = getAllWorkoutLogs(); } catch { /* corrupt localStorage — skip strength data */ }
  const exerciseMap = {};
  for (const log of workoutLogs) {
    for (const ex of (log.exercises || [])) {
      if (ex.unit !== 'kg') continue;
      const completedKg = ex.sets
        .filter(s => s.completed && s.value !== null)
        .map(s => parseFloat(s.value))
        .filter(v => !isNaN(v));
      if (completedKg.length === 0) continue;
      const avgKg = completedKg.reduce((a, b) => a + b, 0) / completedKg.length;
      if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
      exerciseMap[ex.name].unshift({ date: log.date, avgKg: parseFloat(avgKg.toFixed(1)) });
    }
  }
  const strengthExercises = Object.entries(exerciseMap).filter(([, pts]) => pts.length >= 2);

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

    <div class="chart-container">
      <div class="chart-title">🏃 Laufen — Pace & HF</div>
      <div style="height:160px"><canvas id="chart-run-progress"></canvas></div>
      ${sessions.filter(s => s.type === 'laufen' && s.pace_per_km).length < 2
        ? '<div style="text-align:center;color:var(--muted);font-size:0.82em;margin-top:8px">Mindestens 2 Laufen-Einheiten mit Pace nötig.</div>'
        : ''}
    </div>

    <div class="chart-container">
      <div class="chart-title">🏋️ Kraft — Übungsfortschritt</div>
      ${strengthExercises.length === 0
        ? '<div style="text-align:center;color:var(--muted);font-size:0.82em;padding:12px 0">Noch keine Kraftdaten. Mindestens 2 Einheiten mit Gewichten tracken.</div>'
        : `<div>${strengthExercises.map(([name, pts], idx) => {
            const safeId = `chart-strength-${idx}`;
            const escapedName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const first = pts[0].avgKg;
            const last = pts[pts.length - 1].avgKg;
            return `<div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:0.78em;color:var(--muted)">${escapedName}</span>
                <span style="font-size:0.78em;color:var(--accent)">${first} → ${last} kg</span>
              </div>
              <div style="height:60px"><canvas id="${safeId}"></canvas></div>
            </div>`;
          }).join('')}</div>`
      }
    </div>
  `;

  renderHRVChart('chart-hrv', shown);
  renderWeeklyLoadChart('chart-load', sessions);
  renderDistributionChart('chart-dist', sessions);
  renderPaceChart('chart-pace', sessions);
  renderRunProgressChart('chart-run-progress', sessions);
  strengthExercises.forEach(([, pts], idx) => {
    renderStrengthMiniChart(`chart-strength-${idx}`, pts);
  });

  document.getElementById('hrv-7')?.addEventListener('click', () => { hrvDays = 7; render(); });
  document.getElementById('hrv-30')?.addEventListener('click', () => { hrvDays = 30; render(); });
}
