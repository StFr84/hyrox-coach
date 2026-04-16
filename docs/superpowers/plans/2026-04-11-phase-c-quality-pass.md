# Sub 68 Phase C — Quality Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix all known bugs and UX gaps — pace/notes/date fields in Log, expandable plan cards, horizontal station pills, chart empty states, coach suggested chips.

**Architecture:** Vanilla JS ES modules, no build step. Each task modifies 1–2 existing files. Verification is done by serving the project with `python3 -m http.server 8080` from the project root and inspecting in browser. No automated test framework — verification steps are explicit browser checks.

**Tech Stack:** Vanilla JS ES Modules, Supabase JS v2, Chart.js 4.4.0, CSS custom properties, PWA service worker

---

## File Map

| File | Changes |
|------|---------|
| `js/tabs/log.js` | Add pace field (C1), notes textarea (C2), date picker (C7) |
| `js/tabs/plan.js` | Expandable day cards (C3), stations horizontal scroll (C4) |
| `js/tabs/analyse.js` | Better empty states per chart (C5) |
| `js/tabs/coach.js` | Suggested question chips (C6) |
| `js/db.js` | Support optional `created_at` in saveSession (C7) |
| `css/main.css` | New styles for pace input, stations scroll, coach chips |
| `sw.js` | Bump cache to `sub68-v13` |

---

### Task C1: Log Tab — Pace Field for Running Sessions

**Files:**
- Modify: `js/tabs/log.js`
- Modify: `css/main.css`

**Context:** `db.js` already stores `session.pace` as `pace_per_km`. The analyse tab shows a pace chart but can never display data because the log form never collects pace. This adds a conditional pace input that appears only for type='laufen'.

- [x] **Step 1: Add `pace` to state and type-change logic**

In `js/tabs/log.js`, replace line 7:
```javascript
let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null };
```
with:
```javascript
let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null, pace: '', notes: '', date: new Date().toISOString().split('T')[0] };
```

- [x] **Step 2: Add pace input HTML after the duration section**

In `js/tabs/log.js`, in the `render()` function, find the line that starts with `<div class="section-label">Anstrengung` and insert the following block *before* it:

```javascript
    ${state.type === 'laufen' ? `
    <div class="section-label">Pace (min/km) — optional</div>
    <div class="pace-input-row">
      <input class="settings-input pace-input" id="pace-input" type="text"
        inputmode="decimal" placeholder="5:30" value="${state.pace}"
        style="font-family:'Barlow Condensed',sans-serif;font-size:1.4em;font-weight:700;color:var(--accent2)">
      <span style="color:var(--muted);font-size:0.82em;white-space:nowrap">min/km</span>
    </div>
    ` : ''}
```

- [x] **Step 3: Attach pace input listener in `attachListeners()`**

In `js/tabs/log.js`, at the end of `attachListeners()` (before the closing `}`), add:

```javascript
  const paceInput = document.getElementById('pace-input');
  if (paceInput) {
    paceInput.addEventListener('input', () => { state.pace = paceInput.value.trim(); });
  }
```

- [x] **Step 4: Pass pace in the save call**

In `js/tabs/log.js`, replace line 162:
```javascript
    const session = { type: state.type, duration: state.duration, rpe: state.rpe, phase: phase.id };
```
with:
```javascript
    const session = {
      type: state.type,
      duration: state.duration,
      rpe: state.rpe,
      phase: phase.id,
      pace: state.pace || '',
      notes: state.notes || '',
    };
```

- [x] **Step 5: Reset pace and notes on save**

In `js/tabs/log.js`, replace line 168:
```javascript
    state.rpe = null;
```
with:
```javascript
    state.rpe = null;
    state.pace = '';
    state.notes = '';
```

- [x] **Step 6: Also reset pace when type changes away from laufen**

In `attachListeners()`, find the type-pill click handler. Replace:
```javascript
      state.type = pill.dataset.type;
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateLoadPreview();
```
with:
```javascript
      state.type = pill.dataset.type;
      if (state.type !== 'laufen') state.pace = '';
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateLoadPreview();
      render(null, null); // re-render to show/hide pace field
```

Wait — `render()` needs sessions and weekMean. The type pill listener is in `attachListeners(phase, weekMean)` which has access to those. But `sessions` isn't in scope there. Instead, just re-call `refresh()` which fetches fresh data:

Replace the prior block with:
```javascript
      state.type = pill.dataset.type;
      if (state.type !== 'laufen') state.pace = '';
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateLoadPreview();
      // Re-render to show/hide pace field without re-fetching data
      // Store sessions/weekMean on module scope
```

Actually the cleanest fix: store `_weekMean` and `_sessions` as module-level variables. Replace line 7 with:

```javascript
let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null, pace: '', notes: '' };
let _sessions = [], _weekMean = null;
```

Then in `render(sessions, weekMean)`, add at the top:
```javascript
function render(sessions, weekMean) {
  _sessions = sessions ?? _sessions;
  _weekMean = weekMean ?? _weekMean;
```

Then the type-pill click can call `render(_sessions, _weekMean)` directly.

Full updated type-pill click handler in `attachListeners()`:
```javascript
  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.type = pill.dataset.type;
      if (state.type !== 'laufen') state.pace = '';
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateLoadPreview();
      render(_sessions, _weekMean);
    });
  });
```

- [x] **Step 7: Add CSS for pace input row**

In `css/main.css`, after the `.hrv-ampel-badge` block (around line 502), add:
```css
/* ── Pace Input Row ─────────────────────────────────── */
.pace-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg2);
  border-radius: 12px;
  padding: 8px 14px;
}
.pace-input {
  font-family: 'Barlow Condensed', sans-serif !important;
  font-size: 1.4em !important;
  font-weight: 700 !important;
  color: var(--accent2) !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 4px 0 !important;
  width: 80px;
}
```

- [x] **Step 8: Verify in browser**

Run: `python3 -m http.server 8080` from project root, open `http://localhost:8080`

Expected:
- Navigate to Log tab (⚡)
- Default type is "Laufen" → pace input "min/km" field is visible below Duration
- Switch type to "Kraft" → pace field disappears
- Switch back to "Laufen" → pace field reappears
- Enter "5:45" in pace field, set RPE, save → session saves without error
- Navigate to Analyse tab → pace chart shows the value (after a few runs are logged)

- [x] **Step 9: Commit**

```bash
git add js/tabs/log.js css/main.css
git commit -m "feat(log): add pace input field for running sessions"
```

---

### Task C2: Log Tab — Notes Textarea

**Files:**
- Modify: `js/tabs/log.js` (already has updated state from C1)

**Context:** `db.js` already stores `session.notes` in the `notes` column. This adds an optional textarea above the save button.

- [x] **Step 1: Add notes textarea HTML**

In `js/tabs/log.js` `render()`, find:
```javascript
    <button class="btn-primary" id="btn-save-session">💾 Einheit speichern</button>
```
Insert before it:
```javascript
    <div class="section-label">Notizen — optional</div>
    <textarea class="settings-input" id="notes-input" rows="3"
      placeholder="Wie war die Einheit? Besonderheiten, Befinden…"
      style="resize:none;line-height:1.5">${state.notes}</textarea>

```

- [x] **Step 2: Attach notes listener in `attachListeners()`**

At the end of `attachListeners()` (after the pace listener added in C1), add:
```javascript
  const notesInput = document.getElementById('notes-input');
  if (notesInput) {
    notesInput.addEventListener('input', () => { state.notes = notesInput.value; });
  }
```

- [x] **Step 3: Verify in browser**

Open `http://localhost:8080`, navigate to Log tab.

Expected:
- Textarea appears below RPE section, above the Save button
- Typing in textarea keeps value when switching RPE values (state persists between re-renders? No — `render()` re-renders the whole tab on RPE clicks, which resets the textarea to `state.notes`)
- Actually: RPE buttons call `updateLoadPreview()` only, they don't re-render. So textarea value is preserved as long as the user doesn't change type (which calls `render()`). This is correct behavior.
- Save session → notes textarea cleared, session saved to DB

- [x] **Step 4: Commit**

```bash
git add js/tabs/log.js
git commit -m "feat(log): add notes textarea field"
```

---

### Task C3: Plan Tab — Expandable Day Cards

**Files:**
- Modify: `js/tabs/plan.js`
- Modify: `css/main.css`

**Context:** Currently clicking a day card opens a full modal sheet. The new behavior: first tap expands the card inline to show details; a "Log" button inside the expanded card leads to the modal (for "Log this session" CTA). Second tap collapses. This makes training details immediately accessible without a modal overlay.

- [x] **Step 1: Add `expandedDay` state variable**

At the top of `js/tabs/plan.js`, after the `let activePhaseId` line, add:
```javascript
let expandedDay = null; // stores day.day+day.name key of expanded card
```

- [x] **Step 2: Update week-day card HTML to include inline details**

In the `render()` function, replace the entire `.week-grid` template:

```javascript
    <div class="week-grid">
      ${phase.weekPlan.map(day => {
        const key = day.day + day.name;
        const isExpanded = expandedDay === key;
        const typeColors = { ausdauer: '#4ecb71', kraft: '#47c8ff', hyrox: '#e8ff47', concurrent: '#ffb347', skierg: '#7a8099', rowing: '#7a8099', erholung: '#7a8099', ruhe: '#2a2f42' };
        const borderColor = typeColors[day.type] || '#2a2f42';
        return `
        <div class="week-day ${day.type === 'ruhe' ? 'rest' : ''} ${isExpanded ? 'expanded' : ''}"
             data-day='${JSON.stringify(day).replace(/'/g, "&#39;")}'
             style="border-left: 3px solid ${borderColor}">
          <div class="day-label">${day.day}</div>
          <div class="day-icon">${TYPE_ICONS[day.type] || '–'}</div>
          <div class="day-info">
            <div class="day-name">${day.name}</div>
            <div class="day-detail">${day.dur > 0 ? day.dur + ' Min' : ''}${day.zone ? ' · ' + day.zone : ''}${day.hrMax ? ' · &lt;' + day.hrMax + ' bpm' : ''}</div>
            ${isExpanded && day.details ? `
            <div class="day-details-text">${day.details}</div>
            <button class="btn-log day-log-btn" data-logday='${JSON.stringify(day).replace(/'/g, "&#39;")}'>⚡ Loggen</button>
            ` : ''}
          </div>
          ${day.type !== 'ruhe' ? `<div class="day-chevron">${isExpanded ? '∨' : '›'}</div>` : ''}
        </div>
      `}).join('')}
    </div>
```

- [x] **Step 3: Update event listeners to toggle expand instead of opening modal directly**

In `js/tabs/plan.js`, replace the event listener block at the end of `render()`:
```javascript
  document.querySelectorAll('.week-day:not(.rest)').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      const day = JSON.parse(dayEl.dataset.day);
      showDayModal(day);
    });
  });
```
with:
```javascript
  document.querySelectorAll('.week-day:not(.rest)').forEach(dayEl => {
    dayEl.addEventListener('click', e => {
      // Don't toggle if clicking the log button
      if (e.target.closest('.day-log-btn')) return;
      const day = JSON.parse(dayEl.dataset.day);
      const key = day.day + day.name;
      expandedDay = expandedDay === key ? null : key;
      render();
    });
  });

  document.querySelectorAll('.day-log-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const day = JSON.parse(btn.dataset.logday);
      showDayModal(day);
    });
  });
```

- [x] **Step 4: Add CSS for expanded cards**

In `css/main.css`, after `.day-chevron` (around line 350), add:
```css
.week-day.expanded { background: var(--bg3); }
.day-details-text {
  font-size: 0.78em;
  color: var(--muted);
  line-height: 1.6;
  margin-top: 8px;
  border-top: 1px solid var(--bg3);
  padding-top: 8px;
}
.day-log-btn {
  margin-top: 8px;
  padding: 6px 14px !important;
  font-size: 0.75em !important;
  border-radius: 20px !important;
  width: auto !important;
  display: inline-block;
}
```

- [x] **Step 5: Verify in browser**

Open `http://localhost:8080`, navigate to Plan tab.

Expected:
- Each training day has a colored left border (green for runs, cyan for strength, yellow for hyrox)
- Tapping a day card expands it inline — chevron changes from `›` to `∨`
- Expanded card shows `details` text in small muted font
- "⚡ Loggen" button appears in expanded card
- Tapping again collapses
- Tapping "⚡ Loggen" opens the modal with "Log this session" button
- Rest days (Ruhe/So) have no interaction

- [x] **Step 6: Commit**

```bash
git add js/tabs/plan.js css/main.css
git commit -m "feat(plan): expandable inline day cards with colored type borders"
```

---

### Task C4: Plan Tab — Horizontal Station Scroll Strip

**Files:**
- Modify: `js/tabs/plan.js`
- Modify: `css/main.css`

**Context:** Currently stations are shown as a vertical list of cards below the week grid. This adds a horizontally scrollable strip of station pills above the existing station list, giving quick visual overview of all 8 stations with priority highlighting.

- [x] **Step 1: Add station strip HTML above the existing `section-label`**

In `js/tabs/plan.js` `render()`, find the line:
```javascript
    <div class="section-label" style="margin-top:20px">Hyrox Stationen & Zielzeiten</div>
```
Replace this and the following `${STATIONS.map...}` block with:

```javascript
    <div class="section-label" style="margin-top:20px">Hyrox Stationen & Zielzeiten</div>

    <div class="stations-scroll">
      ${STATIONS.map(s => `
        <div class="station-pill ${s.schwaeche ? 'schwaeche' : ''}">
          <div class="station-pill-name">${s.name.split(' ').slice(0,2).join(' ')}</div>
          <div class="station-pill-time">${s.ziel}</div>
          ${s.schwaeche ? '<div class="station-pill-badge">PRIO</div>' : ''}
        </div>
      `).join('')}
    </div>

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
```

- [x] **Step 2: Add CSS for station scroll strip**

In `css/main.css`, after `.badge-schwaeche` (around line 475), add:
```css
/* ── Stations Scroll Strip ──────────────────────────── */
.stations-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 14px;
}
.stations-scroll::-webkit-scrollbar { display: none; }
.station-pill {
  flex-shrink: 0;
  background: var(--bg2);
  border: 1px solid var(--bg3);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 90px;
  text-align: center;
  cursor: default;
}
.station-pill.schwaeche {
  border-color: rgba(255,107,107,0.4);
  background: rgba(255,107,107,0.06);
}
.station-pill-name {
  font-size: 0.7em;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.station-pill-time {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1em;
  font-weight: 800;
  color: var(--accent2);
}
.station-pill-badge {
  font-size: 0.58em;
  color: var(--danger);
  font-weight: 700;
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- [x] **Step 3: Verify in browser**

Open `http://localhost:8080`, navigate to Plan tab.

Expected:
- Below the week grid, a horizontal row of 8 station pills is visible
- Pills are horizontally scrollable (try swiping)
- Burpee Broad Jump and Sandbag Lunges pills have a red border and "PRIO" badge
- All stations show a 2-word shortened name and target time
- Below the scroll strip, the original vertical station list still shows full details

- [x] **Step 4: Commit**

```bash
git add js/tabs/plan.js css/main.css
git commit -m "feat(plan): add horizontal station scroll strip above station list"
```

---

### Task C5: Analyse Tab — Better Empty States Per Chart

**Files:**
- Modify: `js/tabs/analyse.js`

**Context:** Currently charts render empty canvases when no data exists. The pace chart only shows a message when zero running sessions with pace exist — it silently shows nothing if sessions exist but all have empty pace. This task adds meaningful empty states for each chart.

- [x] **Step 1: Replace the entire `render()` function in analyse.js**

Replace the full `async function render()` body with:

```javascript
async function render() {
  const [hrvEntries, sessions] = await Promise.all([
    getHRVEntries(30),
    getSessionsForCharts(8),
  ]);
  const shown = hrvDays === 7 ? hrvEntries.slice(-7) : hrvEntries;

  const hasHRV = shown.length > 0;
  const hasLoad = sessions.length > 0;
  const hasDist = sessions.length > 0;
  const runSessions = sessions.filter(s => s.type === 'laufen');
  const runWithPace = runSessions.filter(s => s.pace_per_km);
  const hasPace = runWithPace.length > 0;
  const hasRunsButNoPace = runSessions.length > 0 && runWithPace.length === 0;

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
      ${hasHRV
        ? `<div style="height:180px"><canvas id="chart-hrv"></canvas></div>`
        : `<div class="empty-state"><div class="empty-icon">💚</div>Noch keine HRV-Daten.<br>Trage täglich deinen RMSSD-Wert im Log ein.</div>`}
    </div>

    <div class="chart-container">
      <div class="chart-title">Wochenbelastung (Session-RPE Pkt)</div>
      ${hasLoad
        ? `<div style="height:160px"><canvas id="chart-load"></canvas></div>`
        : `<div class="empty-state"><div class="empty-icon">📅</div>Noch keine Trainingseinheiten.<br>Log dein erstes Workout im ⚡ Tab.</div>`}
    </div>

    <div class="chart-container">
      <div class="chart-title">Trainingsverteilung</div>
      ${hasDist
        ? `<div style="height:180px"><canvas id="chart-dist"></canvas></div>`
        : `<div class="empty-state"><div class="empty-icon">🥧</div>Noch keine Einheiten zum Anzeigen.</div>`}
    </div>

    <div class="chart-container">
      <div class="chart-title">Pace-Entwicklung (Laufen)</div>
      ${hasPace
        ? `<div style="height:160px"><canvas id="chart-pace"></canvas></div>`
        : hasRunsButNoPace
          ? `<div class="empty-state"><div class="empty-icon">🏃</div>Du hast Läufe geloggt, aber noch keine Pace eingetragen.<br><button class="btn-secondary mt-8" style="display:inline-block" onclick="document.querySelector('[data-tab=log]').click()">→ Pace jetzt eintragen</button></div>`
          : `<div class="empty-state"><div class="empty-icon">🏃</div>Noch keine Laufdaten. Leg los!</div>`}
    </div>
  `;

  if (hasHRV) renderHRVChart('chart-hrv', shown);
  if (hasLoad) renderWeeklyLoadChart('chart-load', sessions);
  if (hasDist) renderDistributionChart('chart-dist', sessions);
  if (hasPace) renderPaceChart('chart-pace', sessions);

  document.getElementById('hrv-7')?.addEventListener('click', () => { hrvDays = 7; render(); });
  document.getElementById('hrv-30')?.addEventListener('click', () => { hrvDays = 30; render(); });
}
```

- [x] **Step 2: Verify in browser (no data state)**

Open `http://localhost:8080` with a fresh browser session (Cmd+Shift+R to force-reload), navigate to Analyse tab.

Expected (with no or few sessions in DB):
- HRV chart section shows "Noch keine HRV-Daten" if no HRV entries, or shows chart if entries exist
- Weekly load section shows "Noch keine Trainingseinheiten" if no sessions
- Pace section shows "Du hast Läufe geloggt, aber noch keine Pace eingetragen" if runs exist without pace, with a "→ Pace jetzt eintragen" button
- Clicking that button navigates to Log tab
- No blank canvas elements when data is missing

- [x] **Step 3: Commit**

```bash
git add js/tabs/analyse.js
git commit -m "fix(analyse): add meaningful empty states for all four charts"
```

---

### Task C6: Coach Tab — Suggested Question Chips

**Files:**
- Modify: `js/tabs/coach.js`
- Modify: `css/main.css`

**Context:** When no API key is configured, the chat is inaccessible but there are no hints about what to ask once configured. This adds 3 tappable question chips: grayed out without key, active with key.

- [x] **Step 1: Define suggested questions and add chips HTML**

In `js/tabs/coach.js` `render()`, after the `${!apiKey ? ... : ''}` block (after line 54), add:

```javascript
    <div class="coach-chips">
      ${[
        'Wie soll ich diese Woche trainieren?',
        'Bin ich auf Kurs für Sub 68?',
        'Was ist meine größte Schwäche?',
      ].map(q => `
        <button class="coach-chip ${!apiKey ? 'disabled' : ''}"
          ${apiKey ? `data-question="${q}"` : ''}
          ${!apiKey ? 'title="Erst API-Key in Einstellungen eintragen"' : ''}>
          ${q}
        </button>
      `).join('')}
    </div>
```

- [x] **Step 2: Attach chip click listeners at the end of `render()`**

In `js/tabs/coach.js`, add at the end of `render()` (after `scrollToBottom();`):

```javascript
  document.querySelectorAll('.coach-chip:not(.disabled)').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = chip.dataset.question;
        input.dispatchEvent(new Event('input')); // trigger auto-height
        input.focus();
      }
    });
  });
```

- [x] **Step 3: Add CSS for chips**

In `css/main.css`, after `.checkin-btn` (around line 441), add:

```css
/* ── Coach Question Chips ───────────────────────────── */
.coach-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.coach-chip {
  background: var(--bg2);
  border: 1px solid var(--bg3);
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 0.78em;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: left;
  font-family: inherit;
}
.coach-chip:not(.disabled):hover {
  border-color: var(--accent);
  background: rgba(232,255,71,0.06);
}
.coach-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [x] **Step 4: Verify in browser**

Open `http://localhost:8080`, navigate to Coach tab.

Expected (without API key):
- 3 chips visible below the "⚙️ Einstellungen" card, all grayed out (opacity 0.4)
- Hovering does nothing (cursor: not-allowed)
- Tooltips shows "Erst API-Key in Einstellungen eintragen" on hover

Expected (with API key set in Settings):
- Chips are full brightness
- Clicking a chip pre-fills the textarea with that question
- User can still edit or send as-is

- [x] **Step 5: Commit**

```bash
git add js/tabs/coach.js css/main.css
git commit -m "feat(coach): add suggested question chips with disabled state when no API key"
```

---

### Task C7: Log Tab — Past Session Date Picker

**Files:**
- Modify: `js/tabs/log.js`
- Modify: `js/db.js`

**Context:** Sessions always get `now()` as their timestamp. This adds an optional date picker so users can backdate forgotten sessions.

- [x] **Step 1: Add `date` to state (already added in C1 — verify it's there)**

State should already be:
```javascript
let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null, pace: '', notes: '', date: new Date().toISOString().split('T')[0] };
```
If not, add `date: new Date().toISOString().split('T')[0]` to the state object.

- [x] **Step 2: Add date picker HTML near top of Log form**

In `js/tabs/log.js` `render()`, after `<div class="screen-title">⚡ Training erfassen</div>`, add:

```javascript
    ${state.date !== new Date().toISOString().split('T')[0] ? `
    <div class="past-session-banner">⏮ Vergangene Einheit: ${new Date(state.date + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
    ` : ''}
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px">
      <input type="date" id="session-date" class="settings-input"
        value="${state.date}"
        max="${new Date().toISOString().split('T')[0]}"
        style="width:auto;padding:6px 10px;font-size:0.82em;color:var(--muted)">
    </div>
```

- [x] **Step 3: Attach date listener**

In `attachListeners()`, add:
```javascript
  const dateInput = document.getElementById('session-date');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value;
      render(_sessions, _weekMean); // re-render to show/hide past-session banner
    });
  }
```

- [x] **Step 4: Pass timestamp to saveSession**

In the save handler, replace:
```javascript
    const session = {
      type: state.type,
      duration: state.duration,
      rpe: state.rpe,
      phase: phase.id,
      pace: state.pace || '',
      notes: state.notes || '',
    };
```
with:
```javascript
    const today = new Date().toISOString().split('T')[0];
    const session = {
      type: state.type,
      duration: state.duration,
      rpe: state.rpe,
      phase: phase.id,
      pace: state.pace || '',
      notes: state.notes || '',
      timestamp: state.date !== today ? new Date(state.date + 'T12:00').toISOString() : undefined,
    };
```

Also reset `state.date` after save:
```javascript
    state.rpe = null;
    state.pace = '';
    state.notes = '';
    state.date = new Date().toISOString().split('T')[0];
```

- [x] **Step 5: Update `db.js` to support optional `created_at`**

In `js/db.js`, replace the `saveSession` function:
```javascript
export async function saveSession(session) {
  const record = {
    athlete: 'steven_fredrickson',
    type: session.type,
    duration_min: session.duration,
    rpe: session.rpe,
    phase: session.phase,
    notes: session.notes || '',
    pace_per_km: session.pace || '',
  };
  if (session.timestamp) record.created_at = session.timestamp;
  const { error } = await db.from('sessions').insert([record]);
  if (error) throw error;
}
```

- [x] **Step 6: Add CSS for past session banner**

In `css/main.css`, after `.pace-input-row` block, add:
```css
/* ── Past Session Banner ────────────────────────────── */
.past-session-banner {
  background: rgba(255,179,71,0.1);
  border: 1px solid rgba(255,179,71,0.3);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.82em;
  color: var(--warn);
  margin-bottom: 8px;
}
```

- [x] **Step 7: Verify in browser**

Open `http://localhost:8080`, navigate to Log tab.

Expected:
- A small date input in the top-right corner shows today's date
- Changing date to yesterday shows the orange "⏮ Vergangene Einheit: [date]" banner
- Saving with past date → session is saved with that date (visible in session list with correct date)
- Resetting back to today hides the banner
- After save, date resets to today

- [x] **Step 8: Commit**

```bash
git add js/tabs/log.js js/db.js css/main.css
git commit -m "feat(log): add past-session date picker with created_at support in db"
```

---

### Task C8: Service Worker Cache Bump

**Files:**
- Modify: `sw.js`

- [x] **Step 1: Bump cache version**

In `sw.js`, replace line 1:
```javascript
const CACHE_NAME = 'sub68-v12';
```
with:
```javascript
const CACHE_NAME = 'sub68-v13';
```

- [x] **Step 2: Verify in browser**

Open DevTools → Application → Service Workers. After Cmd+Shift+R, verify the new service worker is active and the old `sub68-v12` cache is deleted (check Cache Storage).

- [x] **Step 3: Commit**

```bash
git add sw.js
git commit -m "chore: bump service worker cache to v13 (Phase C)"
```

---

## Phase C Complete

All 8 tasks done. Verify success criteria from the spec:
- [x] Running sessions can be logged with pace (min:sec format, conditional on type=laufen)
- [x] Sessions can be logged with optional notes text
- [x] Plan day cards expand inline to show details without full modal
- [x] All 8 Hyrox stations visible as scrollable pill strip
- [x] Analyse charts show meaningful empty states instead of empty canvases
- [x] Coach tab shows 3 suggested question chips (grayed without key, active with key)
- [x] Past session timestamp can be set via date picker

Push to GitHub Pages (`git push`) to deploy.

---

**✅ Abgeschlossen: 2026-04-16** — Alle 8 Tasks implementiert und auf `main` gemergt. Deployed via GitHub Pages. Zusätzlich implementiert: AvgHR-Feld im Log, XSS-Escape für Exercise-Namen, index-basierte Canvas-IDs.
