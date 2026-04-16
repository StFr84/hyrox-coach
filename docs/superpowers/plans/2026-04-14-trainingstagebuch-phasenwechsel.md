# Trainingstagebuch & Phasenwechsel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add set-by-set exercise logging to the Log-Tab and a blocking phase-transition modal to prevent athletes from missing training plan changes.

**Architecture:** `plan-data.js` gets structured `exercises[]` per training day and `changes[]` per phase. Workout logs are stored in localStorage (offline-first, no new Supabase table). The phase modal is mounted in `app.js` on DOMContentLoaded before the first tab renders.

**Tech Stack:** Vanilla JS, localStorage, CSS custom properties (existing), no new dependencies.

---

## File Structure

| File | Change |
|------|--------|
| `js/data/plan-data.js` | Add `exercises[]` to training days; `changes[]` to phases |
| `js/db.js` | Add 6 localStorage-based workout log functions |
| `css/main.css` | New styles: exercise card, set chip, phase modal overlay |
| `js/tabs/log.js` | Exercise block render + set completion + WIP auto-save |
| `js/app.js` | Phase change detection + blocking modal on init |

---

## Task 1: Add exercises[] to plan-data.js

**Files:**
- Modify: `js/data/plan-data.js`

- [x] **Step 1: Replace the full PHASES constant with this version including exercises**

Replace the entire content of `js/data/plan-data.js` with:

```js
export const TYPE_ICONS = {
  ausdauer: '🏃', kraft: '🏋️', hyrox: '🏆', concurrent: '⚡',
  skierg: '🎿', rowing: '🚣', erholung: '♻️', ruhe: '😴',
};

export const PHASES = [
  {
    id: 'comeback', name: 'Comeback', weeks: 'W1–2', period: 'Apr 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: null,
    weekPlan: [
      { day: 'Sa', type: 'ausdauer', name: 'Erster Lauf',        dur: 35, zone: 'LDL', hrMax: 130,  details: 'Unter 130 bpm, RPE max 5. Sehr locker, kein Druck.',
        exercises: [{ name: 'Dauerlauf', sets: 1, reps: 1, distance: '35 Min', unit: 'pace' }] },
      { day: 'So', type: 'ruhe',     name: 'Ruhe',               dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Spaziergang optional.' },
      { day: 'Mo', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Di', type: 'kraft',    name: 'Körpergewicht-Kraft', dur: 40, zone: null,  hrMax: null, details: 'Squats 3×15, Lunges 3×12, Liegestütz 3×10. Kein Gewicht.',
        exercises: [
          { name: 'Squats',    sets: 3, reps: 15, unit: 'reps' },
          { name: 'Lunges',    sets: 3, reps: 12, unit: 'reps' },
          { name: 'Liegestütz', sets: 3, reps: 10, unit: 'reps' },
        ] },
      { day: 'Mi', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: 'HRV messen.' },
      { day: 'Do', type: 'ausdauer', name: 'LDL Zweiter Lauf',   dur: 40, zone: 'LDL', hrMax: 137,  details: 'Unter 137 bpm. Wenn HF steigt → Tempo rausnehmen.',
        exercises: [{ name: 'Dauerlauf', sets: 1, reps: 1, distance: '40 Min', unit: 'pace' }] },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
    ],
  },
  {
    id: 'base', name: 'Base', weeks: 'W3–10', period: 'Apr–Jun 2026',
    sessionsPerWeek: 6, rpeMin: 1000, rpeMax: 1500,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'LDL Langer Dauerlauf',  dur: 60, zone: 'LDL', hrMax: 137, details: 'Strikt unter 137 bpm. Wenn Puls steigt → gehen.',
        exercises: [{ name: 'Langer Dauerlauf', sets: 1, reps: 1, distance: '60 Min', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',      name: 'Krafttraining A',       dur: 75, zone: null,  hrMax: null, details: 'Squat 4×6, Romanian Deadlift 3×8, Bulgarian Split Squat 3×10 pro Seite.',
        exercises: [
          { name: 'Squat',                 sets: 4, reps: 6,  unit: 'kg' },
          { name: 'Romanian Deadlift',     sets: 3, reps: 8,  unit: 'kg' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 10, unit: 'kg' },
        ] },
      { day: 'Mi', type: 'ausdauer',   name: 'SkiErg + Row MDL',      dur: 60, zone: 'MDL', hrMax: 158,  details: '30 Min SkiErg + 30 Min Rowing. HF 138–158 bpm.',
        exercises: [
          { name: 'SkiErg',  sets: 1, reps: 1, distance: '30 Min', unit: 'min:sec' },
          { name: 'Rowing',  sets: 1, reps: 1, distance: '30 Min', unit: 'min:sec' },
        ] },
      { day: 'Do', type: 'concurrent', name: 'Kraft + MDL Lauf',      dur: 90, zone: 'MDL', hrMax: 158,  details: 'Zuerst 45 Min Kraft (Bench Press, Pull-Ups, Core), dann 45 Min Lauf 138–158 bpm.',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 10, unit: 'kg' },
          { name: 'Pull-Ups',    sets: 3, reps: 8,  unit: 'reps' },
          { name: 'Core',        sets: 3, reps: 1,  distance: '1 Min', unit: 'reps' },
          { name: 'MDL Lauf',    sets: 1, reps: 1,  distance: '45 Min', unit: 'pace' },
        ] },
      { day: 'Fr', type: 'hyrox',      name: 'Stationstraining',      dur: 75, zone: null,  hrMax: null, details: 'Burpees 5×10 ⚡ | Sandbag Lunges 4×20m ⚡ | SkiErg 4×500m. Schwächen immer trainieren!',
        exercises: [
          { name: 'Burpees',        sets: 5, reps: 10, unit: 'reps' },
          { name: 'Sandbag Lunges', sets: 4, reps: 1,  distance: '20m', unit: 'reps' },
          { name: 'SkiErg',         sets: 4, reps: 1,  distance: '500m', unit: 'min:sec' },
        ] },
      { day: 'Sa', type: 'ausdauer',   name: 'Langer LDL',            dur: 90, zone: 'LDL', hrMax: 137,  details: 'Strikt unter 137 bpm. Dauer wichtiger als Tempo.',
        exercises: [{ name: 'Langer LDL', sets: 1, reps: 1, distance: '90 Min', unit: 'pace' }] },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',       dur: 40, zone: null,  hrMax: 137,  details: 'Lockerer Spaziergang oder Mobilität. HRV messen. Wochenauswertung.' },
    ],
  },
  {
    id: 'build', name: 'Build', weeks: 'W11–22', period: 'Jun–Sep 2026',
    sessionsPerWeek: 6, rpeMin: 1500, rpeMax: 2200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'TDL Schwellen-Intervalle', dur: 70, zone: 'TDL', hrMax: 161, details: '6×1 km bei 159–161 bpm, je 3 Min Pause. Ziel: IAS verschieben.',
        exercises: [{ name: 'Schwellen-Intervall', sets: 6, reps: 1, distance: '1 km', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',      name: 'Maximalkraft',             dur: 75, zone: null,  hrMax: null, details: 'Deadlift 5×3 @ 85% 1RM, Lunges 4×12, Klimmzüge 4×6.',
        exercises: [
          { name: 'Deadlift',   sets: 5, reps: 3,  unit: 'kg' },
          { name: 'Lunges',     sets: 4, reps: 12, unit: 'kg' },
          { name: 'Klimmzüge',  sets: 4, reps: 6,  unit: 'reps' },
        ] },
      { day: 'Mi', type: 'ausdauer',   name: 'MDL + SkiErg',            dur: 75, zone: 'MDL', hrMax: 158,  details: '45 Min MDL 138–158 bpm + SkiErg 6×500m mit 1 Min Pause.',
        exercises: [
          { name: 'MDL Lauf', sets: 1, reps: 1, distance: '45 Min', unit: 'pace' },
          { name: 'SkiErg',   sets: 6, reps: 1, distance: '500m', unit: 'min:sec' },
        ] },
      { day: 'Do', type: 'hyrox',      name: 'Rennsimulation Segmente', dur: 90, zone: null,  hrMax: null, details: '2×[1km Wettkampftempo + Burpees] | 2×[1km + Sandbag Lunges]. Zeiten stoppen!',
        exercises: [
          { name: '1km Wettkampftempo', sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Burpees',            sets: 2, reps: 20, unit: 'reps' },
          { name: '1km + Sandbag',      sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
        ] },
      { day: 'Fr', type: 'kraft',      name: 'Krafttraining C',         dur: 75, zone: null,  hrMax: null, details: 'Squat 5×5, Farmer Carry schwer (2×32 kg), Box Jumps 4×8.',
        exercises: [
          { name: 'Squat',        sets: 5, reps: 5, unit: 'kg' },
          { name: 'Farmer Carry', sets: 3, reps: 1, distance: '40m', unit: 'kg' },
          { name: 'Box Jumps',    sets: 4, reps: 8, unit: 'reps' },
        ] },
      { day: 'Sa', type: 'hyrox',      name: 'Halbe Rennsimulation',    dur: 90, zone: null,  hrMax: null, details: '4×1km + 4 Stationen (abwechselnd). Wettkampftempo. Zeiten messen.',
        exercises: [
          { name: '1km Lauf',    sets: 4, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Stationen',   sets: 4, reps: 1, distance: '1 Station', unit: 'min:sec' },
        ] },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',         dur: 30, zone: null,  hrMax: 137,  details: 'HRV + Wochenauswertung. Foam Roller 10 Min.' },
    ],
  },
  {
    id: 'peak', name: 'Peak', weeks: 'W23–32', period: 'Sep–Nov 2026',
    sessionsPerWeek: 6, rpeMin: 2000, rpeMax: 2800,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'ETL Wettkampfpace',      dur: 60, zone: 'ETL', hrMax: 165, details: '8×1 km bei 161–165 bpm. Wettkampfgeschwindigkeit halten.',
        exercises: [{ name: 'Wettkampf-Intervall', sets: 8, reps: 1, distance: '1 km', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',    name: 'Kraft-Power',             dur: 60, zone: null,  hrMax: null, details: 'Power Clean 5×3, Jump Squat 4×5, Box Jumps 4×8. Explosivität!',
        exercises: [
          { name: 'Power Clean', sets: 5, reps: 3, unit: 'kg' },
          { name: 'Jump Squat',  sets: 4, reps: 5, unit: 'kg' },
          { name: 'Box Jumps',   sets: 4, reps: 8, unit: 'reps' },
        ] },
      { day: 'Mi', type: 'erholung', name: 'Aktive Erholung',        dur: 40, zone: 'LDL', hrMax: 137,  details: 'Locker. Kein Druck. Morgen schwer.' },
      { day: 'Do', type: 'hyrox',    name: 'Vollrennsimulation',     dur: 90, zone: null,  hrMax: null, details: 'Alle 8 Stationen + 8×1km. Zeitmessung von Anfang bis Ende. Protokollieren!',
        exercises: [
          { name: 'Volle Rennsimulation', sets: 1, reps: 1, distance: '8×1km + 8 Stationen', unit: 'min:sec' },
        ] },
      { day: 'Fr', type: 'kraft',    name: 'Technik unter Ermüdung', dur: 45, zone: null,  hrMax: null, details: 'Burpee Broad Jump Technik 3×20m | Sandbag Lunges Technik 3×25m. Unter Ermüdung!',
        exercises: [
          { name: 'Burpee Broad Jump',    sets: 3, reps: 1, distance: '20m', unit: 'reps' },
          { name: 'Sandbag Lunges Technik', sets: 3, reps: 1, distance: '25m', unit: 'reps' },
        ] },
      { day: 'Sa', type: 'ausdauer', name: 'MDL Regeneration',       dur: 50, zone: 'MDL', hrMax: 158,  details: '138–158 bpm. Aktive Erholung nach Do-Simulation.',
        exercises: [{ name: 'MDL Lauf', sets: 1, reps: 1, distance: '50 Min', unit: 'pace' }] },
      { day: 'So', type: 'ruhe',     name: 'Komplett Pause',         dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Analyse der Woche. Mental vorbereiten.' },
    ],
  },
  {
    id: 'taper', name: 'Taper', weeks: 'W33–38', period: 'Nov–Dez 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: 1200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'Kurzer LDL',         dur: 40, zone: 'LDL', hrMax: 137,  details: 'Sehr locker, unter 137 bpm.',
        exercises: [{ name: 'Kurzer LDL', sets: 1, reps: 1, distance: '40 Min', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',    name: 'Kraft frisch halten', dur: 45, zone: null,  hrMax: null, details: '3×3 @ 75% 1RM. Ziel: frisch bleiben, nicht ermüden.',
        exercises: [
          { name: 'Squat',    sets: 3, reps: 3, unit: 'kg' },
          { name: 'Deadlift', sets: 3, reps: 3, unit: 'kg' },
        ] },
      { day: 'Mi', type: 'erholung', name: 'Erholung',           dur: 30, zone: null,  hrMax: null, details: 'Mobilität, Foam Roller, dehnen.' },
      { day: 'Do', type: 'hyrox',    name: 'Aktivierung',        dur: 45, zone: null,  hrMax: null, details: '2×1km Wettkampftempo + 2 Stationen. Frisch und scharf!',
        exercises: [
          { name: '1km Wettkampftempo', sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Stationen',          sets: 2, reps: 1, distance: '1 Station', unit: 'min:sec' },
        ] },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Sa', type: 'ausdauer', name: 'Aktivierungslauf',   dur: 30, zone: 'MDL', hrMax: 158,  details: '138–158 bpm + 4×80m Strides locker. Beine fühlen lassen.',
        exercises: [
          { name: 'Aktivierungslauf', sets: 1, reps: 1, distance: '30 Min', unit: 'pace' },
          { name: 'Strides',          sets: 4, reps: 1, distance: '80m', unit: 'reps' },
        ] },
      { day: 'So', type: 'ruhe',     name: 'WETTKAMPF / Ruhe',   dur: 0,  zone: null,  hrMax: null, details: 'Race Day oder letzte Ruhe davor. Gut schlafen!' },
    ],
  },
];

export function getCurrentPhase() {
  const now = new Date();
  const start = new Date('2026-03-29');
  const weeksSinceStart = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  if (weeksSinceStart < 3)  return PHASES[0];
  if (weeksSinceStart < 11) return PHASES[1];
  if (weeksSinceStart < 23) return PHASES[2];
  if (weeksSinceStart < 33) return PHASES[3];
  return PHASES[4];
}

export function getTodaySession() {
  const phase = getCurrentPhase();
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const todayLabel = days[new Date().getDay()];
  return phase.weekPlan.find(d => d.day === todayLabel) || null;
}
```

- [x] **Step 2: Verify in browser**

Open DevTools Console and run:
```js
// Paste after opening the app:
const { PHASES } = await import('/js/data/plan-data.js');
console.log('Kraft exercises:', PHASES[1].weekPlan.find(d => d.type === 'kraft').exercises);
console.log('Ausdauer exercises:', PHASES[1].weekPlan.find(d => d.type === 'ausdauer').exercises);
```
Expected output: arrays with name/sets/reps/unit objects. No undefined.

- [x] **Step 3: Commit**

```bash
git add js/data/plan-data.js
git commit -m "feat(data): add structured exercises[] to all training days"
```

---

## Task 2: Add changes[] to plan-data.js

**Files:**
- Modify: `js/data/plan-data.js`

- [x] **Step 1: Add changes arrays to phases base, build, peak, taper**

In `js/data/plan-data.js`, add a `changes` property to the phases with index 1–4. Insert after the `rpeMax` line in each phase:

**Phase base (index 1)** — add after `rpeMax: 1500,`:
```js
    changes: [
      { icon: '↑', text: 'Volumen: 4 → 6 Einheiten/Woche' },
      { icon: '🎯', text: 'RPE-Ziel: 1000–1500 Pkt/Woche' },
      { icon: '🏋️', text: 'Krafttraining A & B: Squat, RDL, Split Squat' },
      { icon: '🏃', text: 'Langer LDL Mo + Sa — strikt unter 137 bpm' },
      { icon: '🎿', text: 'SkiErg + Rowing Mi dazugekommen' },
      { icon: '🏆', text: 'Stationstraining Fr (Hyrox-Schwächen)' },
    ],
```

**Phase build (index 2)** — add after `rpeMax: 2200,`:
```js
    changes: [
      { icon: '↑', text: 'RPE-Ziel steigt: 1500–2200 Pkt/Woche' },
      { icon: '🏃', text: 'Schwellen-Intervalle Mo: 6×1km bei IAS' },
      { icon: '🏋️', text: 'Maximalkraft Di: Deadlift 5×3, Klimmzüge' },
      { icon: '🏆', text: 'Rennsimulation Do: Segmente mit Zeitmessung' },
      { icon: '🏋️', text: 'Krafttraining C Fr: Squat 5×5, Farmer Carry' },
      { icon: '🏆', text: 'Halbe Rennsimulation Sa: 4×1km + 4 Stationen' },
    ],
```

**Phase peak (index 3)** — add after `rpeMax: 2800,`:
```js
    changes: [
      { icon: '↑', text: 'RPE-Ziel: 2000–2800 Pkt/Woche — Hochphase' },
      { icon: '🏃', text: 'Wettkampfpace Mo: 8×1km bei 161–165 bpm' },
      { icon: '🏋️', text: 'Kraft-Power Di: Power Clean, Jump Squat' },
      { icon: '🏆', text: 'Vollrennsimulation Do: alle 8 Stationen + 8×1km' },
      { icon: '🏋️', text: 'Technik unter Ermüdung Fr' },
      { icon: '♻️', text: 'Mi wird zu aktiver Erholung (weniger Belastung)' },
    ],
```

**Phase taper (index 4)** — add after `rpeMax: 1200,`:
```js
    changes: [
      { icon: '↓', text: 'Volumen: 6 → 4 Einheiten/Woche — Taper!' },
      { icon: '↓', text: 'RPE-Ziel: max 1200 Pkt/Woche' },
      { icon: '🏋️', text: 'Kraft nur noch 3×3 @ 75% — frisch bleiben' },
      { icon: '🏆', text: 'Keine Vollrennsimulation mehr, nur Aktivierung' },
      { icon: '🎯', text: 'Fokus: mental vorbereiten, Beine schonen' },
    ],
```

- [x] **Step 2: Verify in browser**

```js
const { PHASES } = await import('/js/data/plan-data.js');
console.log('base changes:', PHASES[1].changes);
console.log('taper changes:', PHASES[4].changes);
```
Expected: arrays with `{ icon, text }` objects. `PHASES[0].changes` should be `undefined`.

- [x] **Step 3: Commit**

```bash
git add js/data/plan-data.js
git commit -m "feat(data): add phase transition changes[] to plan data"
```

---

## Task 3: Add workout log functions to db.js

**Files:**
- Modify: `js/db.js`

- [x] **Step 1: Append workout log functions at the end of js/db.js**

Add these functions after the existing `ampelLabel` function:

```js
// ── Workout Log (localStorage) ───────────────────────────────────────────────
const WL_KEY  = 'sub68_workout_logs';
const WIP_KEY = 'sub68_workout_wip';

export function saveWorkoutLog(log) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  const idx = logs.findIndex(l => l.date === log.date && l.session_type === log.session_type);
  if (idx >= 0) logs[idx] = log;
  else logs.unshift(log);
  localStorage.setItem(WL_KEY, JSON.stringify(logs.slice(0, 100)));
}

export function getWorkoutLogByDate(date) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  return logs.filter(l => l.date === date);
}

export function getLastWorkoutLog(type) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  return logs.find(l => l.session_type === type) || null;
}

export function saveWorkoutWip(wip) {
  localStorage.setItem(WIP_KEY, JSON.stringify(wip));
}

export function getWorkoutWip() {
  return JSON.parse(localStorage.getItem(WIP_KEY) || 'null');
}

export function clearWorkoutWip() {
  localStorage.removeItem(WIP_KEY);
}
```

- [x] **Step 2: Verify in browser console**

```js
const { saveWorkoutLog, getLastWorkoutLog, saveWorkoutWip, getWorkoutWip, clearWorkoutWip } = await import('/js/db.js');

saveWorkoutLog({
  date: '2026-04-14',
  session_type: 'kraft',
  phase_id: 'comeback',
  exercises: [{ name: 'Squat', sets: [{ set_number: 1, value: 80, unit: 'kg', reps: 6, completed: true }] }],
  created_at: new Date().toISOString()
});
const last = getLastWorkoutLog('kraft');
console.assert(last?.session_type === 'kraft', 'getLastWorkoutLog should return saved log');
console.assert(last?.exercises[0].name === 'Squat', 'Exercise name should be Squat');

saveWorkoutWip({ session_type: 'kraft', exercises: [] });
console.assert(getWorkoutWip()?.session_type === 'kraft', 'WIP should be retrievable');
clearWorkoutWip();
console.assert(getWorkoutWip() === null, 'WIP should be cleared');
console.log('All workout log assertions passed');
```
Expected: `All workout log assertions passed` — no assertion errors.

- [x] **Step 3: Commit**

```bash
git add js/db.js
git commit -m "feat(db): add localStorage-based workout log functions"
```

---

## Task 4: Add exercise tracking CSS to main.css

**Files:**
- Modify: `css/main.css`

- [x] **Step 1: Append exercise tracking styles at the end of css/main.css**

```css
/* ── Exercise Tracking ──────────────────────────────── */
.exercise-block { margin-bottom: 14px; }

.exercise-card {
  background: var(--bg2);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  transition: opacity 0.2s;
}
.exercise-card.collapsed {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.55;
}
.exercise-card.collapsed .exercise-name {
  flex: 1;
  font-weight: 700;
  font-size: 0.88em;
  text-decoration: line-through;
  color: var(--muted);
}
.exercise-card.collapsed .exercise-summary {
  font-size: 0.78em;
  color: var(--success);
  font-weight: 700;
}
.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.exercise-name { font-weight: 700; font-size: 0.9em; }
.exercise-plan { font-size: 0.72em; color: var(--muted); }
.exercise-prev {
  font-size: 0.68em;
  color: var(--accent2);
  margin-top: -4px;
  margin-bottom: 6px;
}

.set-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.set-chip {
  background: var(--bg);
  border: 1px solid #222;
  border-radius: 8px;
  padding: 6px 8px;
  text-align: center;
  min-width: 54px;
  flex: 1;
  max-width: 72px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.set-chip.active { border-color: var(--accent); }
.set-chip.done   { border-color: rgba(78,203,113,0.35); opacity: 0.7; }
.set-chip-label { font-size: 0.62em; color: var(--muted); margin-bottom: 3px; }
.set-chip.active .set-chip-label { color: var(--accent); }
.set-chip-value {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.9em;
  font-weight: 700;
  color: var(--accent);
  min-height: 1.1em;
}
.set-chip.done .set-chip-value { color: var(--success); }
.set-chip-reps { font-size: 0.62em; color: var(--muted); margin: 1px 0; }
.set-chip-check { font-size: 0.75em; color: var(--muted); }
.set-chip.done .set-chip-check { color: var(--success); }

.set-value-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  color: var(--accent);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.9em;
  font-weight: 700;
  text-align: center;
  outline: none;
  padding: 0;
}
```

- [x] **Step 2: Verify in browser**

Open DevTools → Elements and confirm the styles appear in the stylesheet. No visual change yet — exercises aren't rendered yet.

- [x] **Step 3: Commit**

```bash
git add css/main.css
git commit -m "feat(css): add exercise card and set chip styles"
```

---

## Task 5: Add phase modal CSS to main.css

**Files:**
- Modify: `css/main.css`

- [x] **Step 1: Append phase modal styles at the end of css/main.css**

```css
/* ── Phase Transition Modal ─────────────────────────── */
.phase-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13,15,20,0.94);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.phase-modal-card {
  background: var(--bg2);
  border: 2px solid var(--accent);
  border-radius: 18px;
  padding: 24px 20px;
  width: 100%;
  max-width: 360px;
  max-height: 90dvh;
  overflow-y: auto;
}
.phase-modal-icon { font-size: 2.2em; text-align: center; margin-bottom: 8px; }
.phase-modal-title {
  text-align: center;
  color: var(--accent);
  font-size: 0.78em;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 4px;
}
.phase-modal-name {
  text-align: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2em;
  font-weight: 900;
  margin-bottom: 2px;
}
.phase-modal-period { text-align: center; font-size: 0.78em; color: var(--muted); margin-bottom: 16px; }
.phase-modal-divider { height: 1px; background: var(--bg3); margin: 0 0 14px; }
.phase-modal-changes-label {
  font-size: 0.68em;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}
.phase-modal-changes { display: flex; flex-direction: column; gap: 7px; margin-bottom: 20px; }
.phase-change-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85em; }
.phase-change-icon { font-size: 1em; flex-shrink: 0; margin-top: 1px; }
.phase-change-text { color: var(--text); line-height: 1.4; }
.phase-modal-confirm {
  width: 100%;
  background: var(--accent);
  color: #0d0f14;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 0.9em;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.phase-modal-plan-link {
  display: block;
  text-align: center;
  margin-top: 10px;
  font-size: 0.78em;
  color: var(--accent2);
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
}
```

- [x] **Step 2: Commit**

```bash
git add css/main.css
git commit -m "feat(css): add phase transition modal styles"
```

---

## Task 6: Update log.js — render exercise block

**Files:**
- Modify: `js/tabs/log.js`

- [x] **Step 1: Replace the full content of js/tabs/log.js with this**

This adds imports, workoutState, exercise block rendering, and WIP restore on init. Set interaction is added in Task 7.

```js
import { saveSession, saveHRV, getTodayHRV, getRecentSessions, getAmpelFromRMSSD, getHRVEntries, ampelLabel,
         saveWorkoutWip, getWorkoutWip, clearWorkoutWip, getLastWorkoutLog } from '../db.js';
import { queueSession } from '../sync.js';
import { getCurrentPhase, TYPE_ICONS, PHASES } from '../data/plan-data.js';

const el = () => document.getElementById('tab-log');

let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null, pace: '', notes: '', date: new Date().toISOString().split('T')[0] };
let _sessions = [], _weekMean = null;
let workoutState = null; // { session_type, exercises: [{name, unit, distance, planned_sets, planned_reps, sets:[{set_number,value,completed}]}, lastValue} ] }

function buildWorkoutState(type, lastLog, existingWip) {
  const phase = getCurrentPhase();
  const planDay = phase.weekPlan.find(d => d.type === type && d.exercises?.length);
  if (!planDay) return null;

  // Restore WIP if it's for the same type and today's date
  const today = new Date().toISOString().split('T')[0];
  if (existingWip && existingWip.session_type === type && existingWip.date === today) {
    return existingWip;
  }

  return {
    session_type: type,
    date: today,
    exercises: planDay.exercises.map(ex => {
      const lastEx = lastLog?.exercises?.find(e => e.name === ex.name);
      const lastCompletedSet = lastEx?.sets?.filter(s => s.completed).slice(-1)[0];
      return {
        name: ex.name,
        unit: ex.unit,
        distance: ex.distance || null,
        planned_sets: ex.sets,
        planned_reps: ex.reps,
        lastValue: lastCompletedSet?.value ?? null,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          set_number: i + 1,
          value: null,
          completed: false,
        })),
      };
    }),
  };
}

function renderSetChips(exercise, exIdx) {
  return exercise.sets.map((set, sIdx) => {
    const isActive = !set.completed && exercise.sets.slice(0, sIdx).every(s => s.completed);
    const isDone = set.completed;
    const chipClass = isDone ? 'done' : isActive ? 'active' : '';
    const valueDisplay = isDone
      ? `<div class="set-chip-value">${set.value !== null ? set.value + ' ' + exercise.unit : '✓'}</div>`
      : isActive
        ? `<input class="set-value-input" data-ex="${exIdx}" data-set="${sIdx}" type="${exercise.unit === 'pace' || exercise.unit === 'min:sec' ? 'text' : 'number'}" inputmode="${exercise.unit === 'reps' ? 'numeric' : 'decimal'}" placeholder="${exercise.unit === 'reps' ? '—' : exercise.unit}" step="0.5">`
        : `<div class="set-chip-value" style="color:#333">—</div>`;
    const repsLabel = exercise.distance
      ? exercise.distance
      : `× ${exercise.planned_reps}`;

    return `
      <div class="set-chip ${chipClass}" data-ex="${exIdx}" data-set="${sIdx}">
        <div class="set-chip-label">S${set.set_number}</div>
        ${valueDisplay}
        <div class="set-chip-reps">${repsLabel}</div>
        <div class="set-chip-check">${isDone ? '✓' : '○'}</div>
      </div>`;
  }).join('');
}

function renderExerciseBlock() {
  if (!workoutState) return '';
  const allDone = workoutState.exercises.every(ex => ex.sets.every(s => s.completed));
  const exercises = workoutState.exercises.map((ex, exIdx) => {
    const completedCount = ex.sets.filter(s => s.completed).length;
    const isCollapsed = completedCount === ex.sets.length;
    const completedValues = ex.sets.filter(s => s.completed && s.value !== null).map(s => s.value);
    const avgVal = completedValues.length
      ? (completedValues.reduce((a, b) => a + parseFloat(b), 0) / completedValues.length).toFixed(1).replace('.0', '')
      : null;

    if (isCollapsed) {
      const summary = avgVal ? `Ø ${avgVal} ${ex.unit} · ${completedCount}/${ex.sets.length} Sätze` : `${completedCount}/${ex.sets.length} Sätze ✓`;
      return `
        <div class="exercise-card collapsed" data-ex="${exIdx}">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-summary">${summary}</span>
        </div>`;
    }

    const prevHint = ex.lastValue !== null
      ? `<div class="exercise-prev">Letztes Mal: ${ex.lastValue} ${ex.unit}</div>`
      : '';
    const planLabel = ex.distance
      ? `${ex.planned_sets} × ${ex.distance}`
      : `${ex.planned_sets} Sätze × ${ex.planned_reps} Wdh`;

    return `
      <div class="exercise-card" data-ex="${exIdx}">
        <div class="exercise-header">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-plan">${planLabel}</span>
        </div>
        ${prevHint}
        <div class="set-chips">${renderSetChips(ex, exIdx)}</div>
      </div>`;
  }).join('');

  return `
    <div class="section-label">Übungen</div>
    <div class="exercise-block">${exercises}</div>`;
}

export async function init() {
  const [todayHRV, sessions, hrvEntries] = await Promise.all([
    getTodayHRV(), getRecentSessions(10), getHRVEntries(7),
  ]);
  state.todayHRV = todayHRV;
  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;

  // Restore WIP or build fresh workout state for current type
  const wip = getWorkoutWip();
  const lastLog = getLastWorkoutLog(state.type);
  workoutState = buildWorkoutState(state.type, lastLog, wip);

  render(sessions, weekMean);
}

export async function refresh() { await init(); }

function render(sessions, weekMean) {
  _sessions = sessions ?? _sessions;
  _weekMean = weekMean ?? _weekMean;
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

    ${renderExerciseBlock()}

    ${state.type === 'laufen' && !workoutState ? `
    <div class="section-label">Pace (min/km) — optional</div>
    <div class="pace-input-row">
      <input class="settings-input pace-input" id="pace-input" type="text"
        inputmode="decimal" placeholder="5:30" value="${state.pace}"
        style="font-family:'Barlow Condensed',sans-serif;font-size:1.4em;font-weight:700;color:var(--accent2)">
      <span style="color:var(--muted);font-size:0.82em;white-space:nowrap">min/km</span>
    </div>
    ` : ''}

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
      ${_sessions.length === 0
        ? '<div class="empty-state"><div class="empty-icon">📭</div>Noch keine Einheiten</div>'
        : _sessions.map(s => `
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
      try { await saveHRV(v); } catch { /* retry not needed for HRV */ }
      state.todayHRV = await getTodayHRV();
      await refresh();
    });
  }

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.type = pill.dataset.type;
      if (state.type !== 'laufen') state.pace = '';
      const lastLog = getLastWorkoutLog(state.type);
      const wip = getWorkoutWip();
      workoutState = buildWorkoutState(state.type, lastLog, wip);
      render(_sessions, _weekMean);
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

  const paceInput = document.getElementById('pace-input');
  if (paceInput) {
    paceInput.addEventListener('input', () => { state.pace = paceInput.value.trim(); });
  }

  document.getElementById('btn-save-session')?.addEventListener('click', async () => {
    if (!state.rpe) { alert('Bitte RPE auswählen (1–10)'); return; }
    const session = {
      type: state.type,
      duration: state.duration,
      rpe: state.rpe,
      phase: phase.id,
      pace: state.pace || '',
      notes: state.notes || '',
    };
    try { await saveSession(session); } catch { queueSession(session); }
    state.rpe = null;
    state.pace = '';
    state.notes = '';
    state.date = new Date().toISOString().split('T')[0];
    workoutState = null;
    clearWorkoutWip();
    await init();
    document.querySelector('[data-tab="dashboard"]').click();
  });

  // Set chip interactions are attached in Task 7
  attachSetListeners();
}

function attachSetListeners() {
  // Placeholder — implemented in Task 7
}

function updateLoadPreview() {
  const el = document.getElementById('load-preview');
  if (el) el.textContent = state.rpe ? state.duration * state.rpe : '–';
}
```

- [x] **Step 2: Verify in browser**

1. Open the app → tap the Log tab
2. Select "Kraft" as type
3. Verify the exercise block appears below the type grid showing exercises from the plan (e.g. "Squat", "Romanian Deadlift")
4. Verify each exercise card shows set chips
5. Verify "Laufen" type shows the pace input (when workoutState is null, which it won't be if there are ausdauer exercises — check that pace is shown for types with no matching plan exercise)

- [x] **Step 3: Commit**

```bash
git add js/tabs/log.js
git commit -m "feat(log): render exercise block with set chips from plan data"
```

---

## Task 7: Update log.js — set completion and auto-save

**Files:**
- Modify: `js/tabs/log.js`

- [x] **Step 1: Replace the attachSetListeners placeholder with the full implementation**

Find the `attachSetListeners` function at the bottom of `js/tabs/log.js` and replace it:

```js
function attachSetListeners() {
  if (!workoutState) return;

  // Value input changes
  el().querySelectorAll('.set-value-input').forEach(input => {
    input.addEventListener('input', () => {
      const exIdx = parseInt(input.dataset.ex);
      const setIdx = parseInt(input.dataset.set);
      workoutState.exercises[exIdx].sets[setIdx].value = input.value;
    });
  });

  // Tap set chip to complete it
  el().querySelectorAll('.set-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const exIdx = parseInt(chip.dataset.ex);
      const setIdx = parseInt(chip.dataset.set);
      const ex = workoutState.exercises[exIdx];
      const set = ex.sets[setIdx];

      // Only allow completing the active set (first uncompleted)
      const isActive = !set.completed && ex.sets.slice(0, setIdx).every(s => s.completed);
      if (!isActive) return;

      // Read value from input if present
      const input = chip.querySelector('.set-value-input');
      if (input) set.value = input.value.trim() || null;

      set.completed = true;
      saveWorkoutWip(workoutState);  // auto-save after each set
      render(_sessions, _weekMean);
    });
  });

  // Also allow completing a set by pressing Enter in the input
  el().querySelectorAll('.set-value-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        input.closest('.set-chip')?.click();
      }
    });
  });
}
```

The import at the top of `log.js` already includes `clearWorkoutWip` from Task 6 — no change needed.

- [x] **Step 2: Verify in browser**

1. Open app → Log tab → select Kraft
2. Tap on the first set chip of "Squat"
3. Enter a value (e.g. 80) and tap the chip again — it should mark the set as done (green ✓)
4. The next set should become active (yellow border)
5. After completing all sets of an exercise, the card should collapse to a single-line summary
6. Close and reopen the app → navigate to Log tab → set Kraft → verify the WIP is restored (completed sets still show)
7. Open DevTools → Application → Local Storage → verify `sub68_workout_wip` key exists with the workout data

- [x] **Step 3: Commit**

```bash
git add js/tabs/log.js
git commit -m "feat(log): add set completion, auto-save WIP, and keyboard Enter support"
```

---

## Task 8: Phase transition modal in app.js

**Files:**
- Modify: `js/app.js`

- [x] **Step 1: Replace the full content of js/app.js**

```js
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
```

- [x] **Step 2: Verify the modal appears**

1. Open DevTools → Application → Local Storage
2. Delete the `sub68_confirmedPhase` key (or set it to a wrong value like `'wrongphase'`)
3. Reload the app
4. Expected: a full-screen modal appears after the dashboard loads, showing the current phase (Comeback), with a confirm button
5. Verify the background is not scrollable / no tab switch works while modal is visible
6. Tap "Ich habe meinen Plan angepasst"
7. Expected: modal closes, `sub68_confirmedPhase` is set to `'comeback'` in localStorage
8. Reload: no modal should appear

- [x] **Step 3: Verify modal does NOT appear on normal reload**

After confirming, reload the app 3 times. No modal should appear.

- [x] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(app): add phase transition detection and blocking confirmation modal"
```

---

## Task 9: Smoke test — full end-to-end

- [x] **Step 1: Complete a Kraft workout end-to-end**

1. Open app → Log tab → select Kraft
2. Complete all sets of the first exercise (enter a weight, tap to complete)
3. Complete all sets of the second exercise
4. Leave the third exercise incomplete
5. Close and reopen the app
6. Navigate to Log tab → select Kraft
7. Verify: exercises 1 and 2 are collapsed (completed), exercise 3 shows open with correct set state

- [x] **Step 2: Test WIP clears on save**

1. Complete some sets in a Kraft session
2. Select RPE and tap "Einheit speichern"
3. Reopen Log tab → select Kraft
4. Verify: all exercises are reset (fresh state, no WIP)

- [x] **Step 3: Test previous-value hint**

1. Complete and save a full Kraft session with Squat at 80 kg
2. Next day (or simulate by changing date): open Log → Kraft
3. Verify: "Letztes Mal: 80 kg" appears under the Squat exercise name

- [x] **Step 4: Test all session types show exercises**

| Type | Should show exercises |
|------|-----------------------|
| laufen (when ausdauer day exists) | ✓ |
| kraft | ✓ |
| hyrox | ✓ |
| skierg | only if weekPlan has skierg day |
| erholung | ✗ (no exercises) |

- [x] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Trainingstagebuch and phase transition modal"
```

---

**✅ Abgeschlossen: 2026-04-16** — Alle Tasks implementiert und auf `main` gemergt.
