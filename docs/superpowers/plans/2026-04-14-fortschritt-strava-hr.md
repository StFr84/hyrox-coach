# Fortschrittsanzeige & Strava-HR-Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HR import to Strava sync and show strength/running progress mini-charts at the bottom of the Analyse-Tab.

**Architecture:** Strava sync writes `average_heartrate` to the existing `notes` field in the same format as manual entry (`"Ø HF: 132 bpm"`). The Analyse-Tab reads sessions (Supabase) for the running dual-chart and localStorage workout logs for the per-exercise strength charts. Two new Chart.js render functions are added to `charts.js` following the existing pattern.

**Tech Stack:** Vanilla JS ES modules, Chart.js (already loaded globally), Supabase (existing), localStorage.

---

## File Map

| File | Change |
|------|--------|
| `js/strava.js` | Save `average_heartrate` as `"Ø HF: X bpm"` in notes during sync |
| `js/db.js` | Add `getAllWorkoutLogs()` + add `notes` to `getSessionsForCharts` select |
| `js/charts.js` | Add `renderRunProgressChart()` and `renderStrengthMiniChart()` |
| `js/tabs/analyse.js` | Add two new chart sections + import new functions |

---

## Task 1: Update db.js — getAllWorkoutLogs() + notes in getSessionsForCharts

**Files:**
- Modify: `js/db.js`

**Context:** `getSessionsForCharts` currently selects `'created_at,load_points,type,pace_per_km'` — it must also include `notes` so the run progress chart can parse avg HR. `getAllWorkoutLogs()` is a new simple getter for the localStorage workout logs array.

- [ ] **Step 1: Add `notes` to the select in `getSessionsForCharts`**

In `js/db.js`, find this line (around line 72):
```js
    .from('sessions').select('created_at,load_points,type,pace_per_km')
```
Replace with:
```js
    .from('sessions').select('created_at,load_points,type,pace_per_km,notes')
```

- [ ] **Step 2: Add `getAllWorkoutLogs()` at the end of db.js**

Append after the existing `clearWorkoutWip()` function:
```js
export function getAllWorkoutLogs() {
  return JSON.parse(localStorage.getItem(WL_KEY) || '[]');
}
```

- [ ] **Step 3: Verify manually**

Open `http://localhost:3000` → Analyse-Tab → no errors in console. The existing charts still render correctly.

- [ ] **Step 4: Commit**

```bash
git add js/db.js
git commit -m "feat(db): add getAllWorkoutLogs and include notes in getSessionsForCharts"
```

---

## Task 2: Update strava.js — import average_heartrate

**Files:**
- Modify: `js/strava.js`

**Context:** `syncActivities()` currently sets `notes: act.name || ''`. Strava activities include `average_heartrate` (numeric bpm, may be `null` if no HR monitor). When HR is available, store it as `"Ø HF: 132 bpm"` (same format as manual entry). When not available, fall back to the activity name.

- [ ] **Step 1: Update notes construction in `syncActivities()`**

In `js/strava.js`, find these lines (around line 83–93):
```js
    const rpe = act.perceived_exertion || 6;
    const pace = type === 'laufen' ? toPace(act.average_speed) : '';

    await saveSession({
      type,
      duration,
      rpe,
      notes: act.name || '',
      pace: pace,
      phase: 'base',
    });
```
Replace with:
```js
    const rpe = act.perceived_exertion || 6;
    const pace = type === 'laufen' ? toPace(act.average_speed) : '';
    const avgHR = act.average_heartrate ? Math.round(act.average_heartrate) : null;
    const notes = avgHR ? `Ø HF: ${avgHR} bpm` : (act.name || '');

    await saveSession({
      type,
      duration,
      rpe,
      notes,
      pace,
      phase: 'base',
    });
```

- [ ] **Step 2: Verify manually**

Open Settings-Tab → Strava sync → if connected, sync → check Supabase or recent sessions list: laufen sessions should show `"Ø HF: X bpm"` in the meta row.

*(If not connected to Strava, skip sync test — the code change is straightforward.)*

- [ ] **Step 3: Commit**

```bash
git add js/strava.js
git commit -m "feat(strava): import average_heartrate as notes on sync"
```

---

## Task 3: Add renderRunProgressChart() to charts.js

**Files:**
- Modify: `js/charts.js`

**Context:** Dual-axis Chart.js line chart. Left Y-axis: pace in decimal minutes (reversed — lower = faster). Right Y-axis: avg HR in bpm. HR data is parsed from the `notes` field (`"Ø HF: 132 bpm"`). Only shows if at least 2 laufen sessions with pace exist. HR axis only shown if at least one HR value is present.

- [ ] **Step 1: Append `renderRunProgressChart()` to `js/charts.js`**

```js
export function renderRunProgressChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const toDecimal = pace => {
    const [m, s] = pace.split(':').map(Number);
    return m + (s || 0) / 60;
  };
  const parseHR = notes => {
    const m = notes?.match(/Ø HF: (\d+)/);
    return m ? parseInt(m[1]) : null;
  };

  const running = sessions
    .filter(s => s.type === 'laufen' && s.pace_per_km)
    .slice(-10);
  if (running.length < 2) return;

  const labels = running.map(s =>
    new Date(s.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  );
  const paceData = running.map(s => toDecimal(s.pace_per_km));
  const hrData = running.map(s => parseHR(s.notes));
  const hasHR = hrData.some(v => v !== null);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pace (min/km)',
          data: paceData,
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232,255,71,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          fill: true,
          yAxisID: 'yPace',
        },
        ...(hasHR ? [{
          label: 'Ø HF (bpm)',
          data: hrData,
          borderColor: '#47c8ff',
          backgroundColor: 'rgba(71,200,255,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'yHR',
        }] : []),
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          display: hasHR,
          position: 'top',
          labels: { padding: 8, font: { size: 10 }, color: '#7a8099' },
        },
      },
      scales: {
        x: { grid: { color: '#1e2230' } },
        yPace: {
          type: 'linear', position: 'left',
          reverse: true,
          grid: { color: '#1e2230' },
          ticks: {
            color: '#e8ff47',
            callback: v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`,
          },
        },
        yHR: {
          type: 'linear', position: 'right',
          display: hasHR,
          grid: { display: false },
          ticks: { color: '#47c8ff' },
        },
      },
    },
  });
}
```

- [ ] **Step 2: Verify no syntax errors**

Open `http://localhost:3000` → Analyse-Tab → no console errors.

- [ ] **Step 3: Commit**

```bash
git add js/charts.js
git commit -m "feat(charts): add renderRunProgressChart with dual pace/HR axes"
```

---

## Task 4: Add renderStrengthMiniChart() to charts.js

**Files:**
- Modify: `js/charts.js`

**Context:** Small line chart for a single exercise. Input is an array of `{ date: 'YYYY-MM-DD', avgKg: number }` sorted oldest-first. Height is 60px, no legend, minimal tick font size.

- [ ] **Step 1: Append `renderStrengthMiniChart()` to `js/charts.js`**

```js
export function renderStrengthMiniChart(canvasId, dataPoints) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: dataPoints.map(d =>
        new Date(d.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      ),
      datasets: [{
        data: dataPoints.map(d => d.avgKg),
        borderColor: '#e8ff47',
        backgroundColor: 'rgba(232,255,71,0.06)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#1e2230' }, ticks: { font: { size: 9 }, maxTicksLimit: 5 } },
        y: { grid: { color: '#1e2230' }, beginAtZero: false, ticks: { font: { size: 9 }, maxTicksLimit: 3 } },
      },
    },
  });
}
```

- [ ] **Step 2: Verify no syntax errors**

Open `http://localhost:3000` → Analyse-Tab → no console errors.

- [ ] **Step 3: Commit**

```bash
git add js/charts.js
git commit -m "feat(charts): add renderStrengthMiniChart for per-exercise progress"
```

---

## Task 5: Update analyse.js — add Fortschritt sections

**Files:**
- Modify: `js/tabs/analyse.js`

**Context:** The analyse tab currently imports from `db.js` and `charts.js`. We need to add `getAllWorkoutLogs` to the db import and `renderRunProgressChart`, `renderStrengthMiniChart` to the charts import. Then add two new chart-containers at the end of the HTML template and call the new render functions after `renderPaceChart`.

The strength data processing: iterate all workout logs, collect completed kg-sets per exercise name, compute average per session, sort oldest-first. Only show exercises with `unit === 'kg'` and ≥ 2 data points.

- [ ] **Step 1: Update imports**

In `js/tabs/analyse.js`, replace:
```js
import { getHRVEntries, getSessionsForCharts } from '../db.js';
import { renderHRVChart, renderWeeklyLoadChart, renderDistributionChart, renderPaceChart } from '../charts.js';
```
With:
```js
import { getHRVEntries, getSessionsForCharts, getAllWorkoutLogs } from '../db.js';
import { renderHRVChart, renderWeeklyLoadChart, renderDistributionChart, renderPaceChart, renderRunProgressChart, renderStrengthMiniChart } from '../charts.js';
```

- [ ] **Step 2: Build strength data in `render()`**

In `js/tabs/analyse.js`, inside the `async function render()`, after the `const [hrvEntries, sessions] = await Promise.all([...])` line, add:

```js
  const workoutLogs = getAllWorkoutLogs();
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
```

- [ ] **Step 3: Add HTML for the two new sections**

In `js/tabs/analyse.js`, inside `el().innerHTML = \`...\``, append these two chart-containers after the existing pace chart container:

```js
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
        : `<div>${strengthExercises.map(([name, pts]) => {
            const safeId = 'chart-strength-' + name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const first = pts[0].avgKg;
            const last = pts[pts.length - 1].avgKg;
            return `<div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:0.78em;color:var(--muted)">${name}</span>
                <span style="font-size:0.78em;color:var(--accent)">${first} → ${last} kg</span>
              </div>
              <div style="height:60px"><canvas id="${safeId}"></canvas></div>
            </div>`;
          }).join('')}</div>`
      }
    </div>
```

- [ ] **Step 4: Call the new render functions**

In `js/tabs/analyse.js`, after the existing render calls (`renderHRVChart`, `renderWeeklyLoadChart`, `renderDistributionChart`, `renderPaceChart`), append:

```js
  renderRunProgressChart('chart-run-progress', sessions);
  strengthExercises.forEach(([name, pts]) => {
    const safeId = 'chart-strength-' + name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    renderStrengthMiniChart(safeId, pts);
  });
```

- [ ] **Step 5: Verify manually**

Open `http://localhost:3000` → Analyse-Tab → scroll to bottom:
- "🏃 Laufen — Pace & HF": either shows chart (if ≥2 laufen sessions with pace) or empty-state message
- "🏋️ Kraft — Übungsfortschritt": either shows mini-charts per exercise (if ≥2 kraft sessions logged) or empty-state message
- No console errors

- [ ] **Step 6: Commit**

```bash
git add js/tabs/analyse.js
git commit -m "feat(analyse): add running and strength progress charts"
```
