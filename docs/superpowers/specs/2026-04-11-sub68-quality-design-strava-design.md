# Sub 68 App — Quality Pass + Design Upgrade + Strava Intelligence

**Date:** 2026-04-11
**Author:** Steven Fredrickson + Claude
**Status:** Approved for implementation

---

## Overview

Three sequential improvement phases for the Sub 68 Hyrox coaching PWA, each building on the last:

1. **Phase C — Quality Pass**: Fix all known bugs and UX gaps (stable foundation)
2. **Phase A — Design Upgrade**: Navigation overhaul (Concept C) + premium visual polish
3. **Phase B — Strava Intelligence**: Bidirectional sync + data-driven prognosis

---

## Phase C — Quality Pass

### C1: Log Tab — Add Pace Field

**Problem:** `db.js` stores `pace_per_km` and `analyse.js` shows a pace chart, but `log.js` has no pace input. All running sessions are saved with empty pace.

**Fix:** Add a conditional pace input field to the Log form that appears only when `state.type === 'laufen'`.

**UI:** Text input, placeholder `"5:30"`, label "Pace (min/km)", positioned between Duration and RPE. Validate format: `/^\d{1,2}:\d{2}$/`. Show small hint: "z.B. 5:30 für 5 Minuten 30 Sekunden".

**DB:** Pass `pace: state.pace` in the `saveSession()` call (maps to `pace_per_km` column in `db.js` already).

**State change in log.js:**
```javascript
state = {
  type: 'laufen',
  duration: 60,
  rpe: null,
  todayHRV: null,
  pace: ''    // ADD THIS
}
```

### C2: Log Tab — Add Notes Field

**Problem:** `db.js` saves `session.notes` but no textarea exists in Log form. Field always empty.

**Fix:** Add an optional textarea for notes at the bottom of the form (above Save button).

**UI:** `<textarea>`, placeholder "Wie war die Einheit? (optional)", max 3 rows, same styling as `.settings-input`. No character limit.

**State:** Add `notes: ''` to state object. Clear on save.

### C3: Plan Tab — Inline Exercise Details

**Problem:** The Plan tab shows only a day card (type icon + name + duration). Clicking opens a modal. User wants to see exercises/details more directly, without always needing the modal.

**Fix:** Add an expandable inline section within each day card. On first tap: expand card to show `details` text + zone/hrMax inline. Modal still exists for the "Log this session" CTA.

**Card expanded state (CSS):**
- Card gets class `.expanded`
- Details text appears below name, font-size 0.78em, color `--muted`
- Zone badge: colored pill using zone color from `ZONES` array
- hrMax: shows "< {hrMax} bpm" if present
- Second tap collapses

**No modal change:** Modal remains for "⚡ Diese Einheit loggen" CTA.

### C4: Plan Tab — Show Hyrox Stations Prominently

**Problem:** Hyrox stations section exists but is below the fold and not highlighted enough. User wants exercises to be visible.

**Fix:** Add a "Stations" mini-card row below the week plan that shows all 8 stations as horizontal scrollable pills. Tapping a station shows its target time + prio badge in a small tooltip/bottom sheet.

**Station pill:** Icon (💪 for all, 🔴 for schwaeche=true) + station name (truncated to 12 chars) + target time.

**Bottom sheet on tap:** Full station name, target time range, weight, priority level (hoch/mittel/niedrig), and a training tip from `details` if available.

### C5: Analyse Tab — Better Empty States

**Problem:** Charts render empty canvases when no data exists. The pace chart only shows a message if zero running sessions with pace exist — not if sessions exist but all have empty pace.

**Fix:** For each chart function:
- **HRV chart:** If `entries.length === 0`, skip canvas, render: `<div class="empty-state">📊 Noch keine HRV-Daten. Trage täglich deinen RMSSD-Wert ein.</div>`
- **Weekly load chart:** If all weeks have 0 sessions, render: `<div class="empty-state">📅 Noch keine Trainingseinheiten. Log dein erstes Workout.</div>`
- **Distribution chart:** Same as weekly load
- **Pace chart:** If `sessions.filter(s => s.type === 'laufen').length > 0` but all have empty `pace_per_km`, render: `<div class="empty-state">🏃 Du hast Läufe geloggt, aber noch keine Pace eingetragen.<br><button onclick="switchTab('log')">→ Pace jetzt nachtragen</button></div>`

### C6: Coach Tab — Better No-Key UX

**Problem:** When no API key is set, coach shows a warning card. But the chat input is just hidden — there's no guided path for first-time users.

**Fix:**
- Keep warning card but add 3 "suggested questions" as tappable chips below it:
  - "Wie sollte ich diese Woche trainieren?"
  - "Bin ich auf Kurs für Sub 68?"
  - "Was ist meine größte Schwäche?"
- These chips are grayed-out but visible, with tooltip: "Erst API-Key eintragen → Einstellungen"
- Once key is set, chips become tappable and pre-fill the textarea

### C7: Log Tab — Past-Session Timestamp

**Problem:** Sessions always use `now()` as timestamp. If user forgot to log a workout, they can't backdate it.

**Fix:** Add an optional date picker below the form title. Default: today. When changed to a past date, show a small badge "⏮ Vergangene Einheit" on the save button.

**UI:** `<input type="date">` styled as `.settings-input`, default value = today (`new Date().toISOString().split('T')[0]`). Pass `timestamp: new Date(state.date + 'T12:00').toISOString()` to saveSession (db.js needs to support this).

**db.js change:** In the insert object, add: `created_at: session.timestamp || undefined` (if undefined, Supabase uses DB default).

---

## Phase A — Design Upgrade

### A1: Navigation — Concept C (Card Stack + Tab-Indicator)

**Current state:** 6-item bottom nav bar with emoji icons + labels, fixed 64px height.

**New design:** Bottom nav becomes a minimal tab bar with:
- 5 primary tabs: Home (🏠), Log (⚡), Plan (📅), Analyse (📈), Coach (🤖)
- Settings accessible via header gear icon on Dashboard (no longer a tab)
- Each nav item: icon only (no labels), active state = accent-colored icon + 20px wide accent pill below it (height 2px, border-radius 1px)
- Inactive items: muted icon, no pill
- Nav background: semi-transparent `rgba(13,15,20,0.92)` with backdrop-filter blur(12px) — glass effect
- Nav height: 56px (slightly slimmer)

**Active indicator:** Instead of background fill, use a slim pill below the icon:
```css
.nav-item.active::after {
  content: '';
  display: block;
  width: 20px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
  margin: 3px auto 0;
}
```

**HTML changes in index.html:**
- Remove ⚙️ Settings nav item
- Add gear icon to dashboard header (top-right)
- Update `data-tab` and `onclick` attributes

### A2: Dashboard — Full-Screen Hero Card

**Current state:** Dashboard has an `ampel-banner` at top, then hero card, then 2×2 stats grid.

**New design:**
- Hero card becomes full-width, taller (min 200px), with gradient background
- Large prognosis time: Barlow Condensed 900, 4.5em, accent color
- Subtitle: "Ziel: Sub 68:00" + days countdown on same line, smaller
- Phase badge: top-right corner of hero card, pill-style
- Remove separate ampel banner — integrate HRV status as a colored dot + label inside hero card bottom row
- Stats grid below hero card: same 2×2 layout but cards get subtle `border: 1px solid var(--bg3)` with no background color (transparent cards on dark bg)

### A3: Typography Hierarchy

**Changes across all tabs:**

| Element | Current | New |
|---------|---------|-----|
| Screen title | 0.65em uppercase | 0.7em uppercase, letter-spacing 0.15em |
| Hero value | 3.2em | 4.5em on dashboard, 2.8em elsewhere |
| Card title (small) | 0.72em | 0.75em bold |
| Metric value | 1.6em | 1.8em |
| Muted text | #7a8099 | unchanged |
| Section separator | none | 1px solid var(--bg3) with 8px margin-block |

### A4: Card Visual Polish

**Changes:**

- `.card` border-radius: 14px → 18px
- `.hero-card` border: none → `border: 1px solid rgba(232,255,71,0.12)` (subtle accent glow)
- Phase pills: active pill gets `box-shadow: 0 0 0 2px rgba(232,255,71,0.3)` in addition to accent bg
- Day cards in Plan tab: add left border stripe (3px) in the type color (zone color for ausdauer, `--warn` for kraft, `--accent` for hyrox)
- Log type pills (6 session types): increase size, add colored emoji indicator per type

### A5: Log Tab Visual Refresh

**Session type selector:**
- Current: 6 small pills in a 3-column grid
- New: 6 larger pills with colored left stripe, icon + label, full-width stacked pairs (3 rows of 2)
- Active state: `border: 2px solid var(--accent)` + subtle accent bg

**RPE selector:**
- Current: 10 small number buttons in a row
- New: Same 10 buttons but color-coded (1–3 green, 4–6 yellow, 7–10 orange/red gradient)
- Active RPE number displayed large (2em) above the row with label: e.g., "7 — Anstrengend"

---

## Phase B — Strava Intelligence

### B1: Upload Workouts to Strava (Bidirectional Sync)

**Problem:** App can pull activities from Strava but cannot push. User wants workouts logged in app to appear on Strava.

**Approach:** After saving a session in log.js, offer a "Auf Strava hochladen" button in the success state. This calls a new Supabase Edge Function `strava-upload` that creates a Strava activity via the API.

**New Edge Function `strava-upload`:**
- Action: `createActivity`
- Input: `{ refresh_token, name, sport_type, start_date_local, elapsed_time, description, distance? }`
- Calls Strava API: `POST https://www.strava.com/api/v3/activities`
- Returns: `{ id, url }` or error

**Strava activity mapping from session:**

| App Field | Strava Field | Notes |
|-----------|-------------|-------|
| type='laufen' | sport_type='Run' | |
| type='kraft' | sport_type='WeightTraining' | |
| type='hyrox' | sport_type='Workout' | name set to "HYROX Training" |
| type='skierg' | sport_type='NordicSki' | |
| type='rowing' | sport_type='Rowing' | |
| type='erholung' | sport_type='Yoga' | |
| duration (min) | elapsed_time (sec) | × 60 |
| notes | description | |
| pace (min/km) | → distance | calc: `(duration / pace_minutes) * 1000` meters if both present |
| phase + zone | description suffix | "Phase: Base · Zone: LDL" |

**UI after save:**
```
✅ Einheit gespeichert!
[Auf Strava hochladen ↗]  [Schließen]
```
Upload button only shown if `getStravaTokens()` is not null.
After upload: button becomes "✓ Auf Strava" (disabled, green).

**strava.js new export:**
```javascript
export async function uploadActivity(session) { ... }
```

**Supabase function:** New function `strava-upload` (separate from existing `Strava` function). JWT OFF. Uses `STRAVA_CLIENT_SECRET` from secrets (same as `Strava` function). Token refresh before upload.

### B2: Pace Prognosis from Strava Data

**Problem:** Current prognosis (`78 - weeksTraining * 0.3`) is purely formula-based and ignores actual training data.

**New calculation:** Use real running data from last 8 weeks to compute trends.

**Algorithm:**
```
1. Fetch sessions of type='laufen' with pace_per_km for last 8 weeks
2. Group by ISO week number
3. For each week: calculate avg_pace (mean of all run paces that week)
4. Fit linear regression: pace vs. week number
5. Trend: slope of regression line (negative = improving)
6. Project to race date (week 38): extrapolated pace
7. Convert pace to 10km race time: pace × 10
8. Add estimated Hyrox station overhead (from athlete's station targets)
9. Cap at 62:00 min (physiological ceiling for Steven's profile)
```

**New function in strava.js:**
```javascript
export function computePacePrognosis(sessions) {
  // returns { prognosisMin, prognosisSec, trend, confidence }
  // confidence: 'low' if < 4 weeks data, 'medium' < 6, 'high' >= 6
}
```

**Dashboard integration:**
- If confidence='high': Show prognosis from real data, replace formula
- If confidence='medium': Show formula prognosis with note "Basiert auf {n} Wochen Daten"
- If confidence='low': Keep formula prognosis unchanged
- Show trend arrow: ↑ improving / → stable / ↓ declining (last 4 weeks vs. prior 4)

### B3: Strava Volume Analysis in Coach Context

**Problem:** Coach's system prompt has no training volume data. Claude can't assess if training load is appropriate.

**Fix:** When building the system prompt in `coach.js`, include Strava-derived volume:
```
- Laufkilometer letzte Woche: X km (alle Strava-Läufe)
- Laufkilometer letzte 4 Wochen: Y km
- Progressionsrate: +Z% vs. Vormonat
```

**New helper `getStravaVolumeContext()` in strava.js:**
```javascript
export function getStravaVolumeContext() {
  const sessions = getSessionsForCharts(8); // already in db.js
  // Returns formatted string for prompt injection
}
```

**Note:** Uses local DB sessions (already synced from Strava), no extra API call.

### B4: Pace Chart Enhancement in Analyse Tab

**New features for pace chart:**
- Show regression trend line (dotted, muted color) on top of pace data points
- Add horizontal reference lines for athlete's zone boundaries:
  - LDL zone: pace < 7:08 (1000/8.4 km/h converted)
  - MDL zone: 5:02–7:08 min/km
  - TDL zone: 4:45–5:02
- Zone labels on right axis (abbreviated: LDL, MDL, TDL)
- If last 3 pace values are improving: show "↓ Trend: +{X}s/km diese Woche" badge

---

## Architecture Notes

### Files Modified (by phase)

**Phase C:**
- `js/tabs/log.js` — Add pace field, notes field, date picker (C1, C2, C7)
- `js/tabs/plan.js` — Expandable day cards, stations mini-cards (C3, C4)
- `js/tabs/analyse.js` — Empty states per chart (C5)
- `js/tabs/coach.js` — Suggested question chips (C6)
- `js/db.js` — Support optional `created_at` in saveSession (C7)

**Phase A:**
- `index.html` — Remove settings nav item, add gear icon to dashboard header (A1)
- `css/main.css` — Nav redesign, typography scale, card polish (A1–A5)
- `js/tabs/dashboard.js` — Hero card layout changes (A2)
- `js/tabs/log.js` — Type pills + RPE color coding (A5)
- `js/tabs/settings.js` — Ensure settings tab still navigable via header gear

**Phase B:**
- `js/strava.js` — `uploadActivity()`, `computePacePrognosis()`, `getStravaVolumeContext()` (B1, B2, B3)
- `js/tabs/log.js` — "Upload to Strava" post-save button (B1)
- `js/tabs/dashboard.js` — Smart prognosis display (B2)
- `js/tabs/coach.js` — Inject volume context into system prompt (B3)
- `js/tabs/analyse.js` — Trend line + zone refs on pace chart (B4)
- `js/charts.js` — Support for reference lines + trend line rendering
- Supabase Edge Function: `strava-upload` (new, via Supabase dashboard)
- `sw.js` — Bump cache version to `sub68-v13` after Phase C, `sub68-v14` after A, `sub68-v15` after B

### No New Dependencies

All changes use vanilla JS, existing Chart.js API, and existing Supabase SDK. No new npm packages.

### Service Worker Cache Bumps

Each phase requires a cache version bump in `sw.js`:
- After Phase C complete: `sub68-v13`
- After Phase A complete: `sub68-v14`
- After Phase B complete: `sub68-v15`

---

## Success Criteria

### Phase C Done When:
- [ ] Running sessions can be logged with pace (min:sec format, validated)
- [ ] Sessions can be logged with notes text
- [ ] Plan day cards expand inline to show details without opening modal
- [ ] All 8 Hyrox stations visible in Plan tab as scrollable pills
- [ ] Analyse charts show meaningful empty states instead of empty canvases
- [ ] Coach tab shows suggested question chips (grayed if no key, active if key present)
- [ ] Past session timestamp can be set via date picker

### Phase A Done When:
- [ ] Bottom nav shows 5 items (no Settings), active state = slim pill below icon
- [ ] Settings accessible via gear icon in dashboard header
- [ ] Nav has glass/blur background effect
- [ ] Dashboard hero card shows prognosis at 4.5em with integrated HRV status
- [ ] Day cards in Plan tab have colored left border stripe by type
- [ ] RPE selector in Log tab is color-coded 1–10
- [ ] Session type selector uses larger visual pills with type colors

### Phase B Done When:
- [ ] After saving a session, "Auf Strava hochladen" button appears if Strava connected
- [ ] Clicking upload creates activity on Strava via new Edge Function
- [ ] Dashboard prognosis uses real pace data if >= 4 weeks of running data available
- [ ] Prognosis shows confidence indicator and trend arrow
- [ ] Coach system prompt includes weekly/monthly running volume
- [ ] Pace chart shows trend line + zone reference lines

---

## Out of Scope

- Multi-user support
- Push notifications
- Apple Watch / wearable integration
- Custom training plan editor
- Strava webhook (real-time sync) — keep polling/manual sync
- Session editing/deletion (complex, deferred to future)
