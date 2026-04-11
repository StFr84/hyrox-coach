# Sub 68 Phase B — Strava Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload app workouts to Strava, compute data-driven pace prognosis from real running history, inject training volume into coach system prompt, and add trend line + zone references to the pace chart.

**Architecture:** New `uploadActivity()` and `computePacePrognosis()` functions in `strava.js`. Dashboard imports prognosis logic. Coach imports volume context helper. Charts.js gets trend line support. One new Supabase Edge Function (`strava-upload`) must be deployed manually via Supabase dashboard before Task B1 can be tested end-to-end.

**Tech Stack:** Vanilla JS ES Modules, Supabase Edge Functions (Deno), Strava API v3, Chart.js 4.4.0

**Prerequisite:** Phase A complete (sw.js at sub68-v14). Strava integration already working (existing `Strava` function handles token exchange + sync).

---

## File Map

| File | Changes |
|------|---------|
| `js/strava.js` | Add `uploadActivity()`, `computePacePrognosis()`, `getStravaVolumeContext()` |
| `js/tabs/log.js` | Post-save Strava upload button (success state) |
| `js/tabs/dashboard.js` | Smart prognosis using `computePacePrognosis()` |
| `js/tabs/coach.js` | Inject volume context into system prompt |
| `js/tabs/analyse.js` | Pass full sessions to pace chart |
| `js/charts.js` | Add trend line + zone reference lines to pace chart |
| `js/db.js` | Export `getSessionsForCharts` already exists — no change needed |
| `sw.js` | Bump cache to `sub68-v15` |
| Supabase Edge Function | New `strava-upload` function (manual deploy step) |

---

### Task B0: Deploy Supabase Edge Function `strava-upload` (Manual Step)

**Files:**
- Supabase dashboard only — no local files

**Context:** The Strava upload requires a server-side function to handle token refresh + Strava API POST. This must be deployed before Task B1 can be tested.

- [ ] **Step 1: Create the Edge Function code**

Create a new file locally (not in the repo) at `/tmp/strava-upload/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { refresh_token, name, sport_type, start_date_local, elapsed_time, description } = await req.json();
    const clientId = Deno.env.get('STRAVA_CLIENT_ID') || '223478';
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')!;

    // Refresh token
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Token refresh failed', detail: tokenData }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    // Create Strava activity
    const actRes = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        name,
        sport_type,
        start_date_local,
        elapsed_time,
        description: description || '',
      }),
    });
    const activity = await actRes.json();
    if (!actRes.ok) {
      return new Response(JSON.stringify({ error: 'Strava API error', detail: activity }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    return new Response(JSON.stringify({
      id: activity.id,
      url: `https://www.strava.com/activities/${activity.id}`,
      new_access_token: tokenData.access_token,
      new_refresh_token: tokenData.refresh_token,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
```

- [ ] **Step 2: Deploy via Supabase dashboard**

1. Go to [Supabase Dashboard](https://app.supabase.com) → Project `dxikdpatrtsnbkeijtiy`
2. Navigate to Edge Functions → "New Function"
3. Name: `strava-upload`
4. Paste the code above
5. Deploy
6. Go to Settings → Secrets → Verify `STRAVA_CLIENT_SECRET` exists (already set for the `Strava` function)
7. Optionally add `STRAVA_CLIENT_ID=223478` as a secret (or it defaults to 223478 in code)
8. **CRITICAL:** Set JWT verification to OFF for this function (same as the other Strava function)

- [ ] **Step 3: Note the function URL**

Function URL will be: `https://dxikdpatrtsnbkeijtiy.supabase.co/functions/v1/strava-upload`

No browser test possible until B1 (client code) is implemented.

---

### Task B1: `uploadActivity()` in strava.js

**Files:**
- Modify: `js/strava.js`

**Context:** After saving a session in the log, the user can optionally upload it to Strava. This function handles the upload by calling the `strava-upload` Edge Function.

- [ ] **Step 1: Add the upload function to strava.js**

In `js/strava.js`, after the `syncActivities()` function (after line 99), add:

```javascript
const STRAVA_UPLOAD_PROXY = `${SUPABASE_URL}/functions/v1/strava-upload`;

const SPORT_TYPE_MAP = {
  laufen: 'Run',
  kraft: 'WeightTraining',
  hyrox: 'Workout',
  skierg: 'NordicSki',
  rowing: 'Rowing',
  erholung: 'Yoga',
  concurrent: 'Workout',
};

export async function uploadActivity(session) {
  const tokens = getStravaTokens();
  if (!tokens) throw new Error('Nicht mit Strava verbunden');

  const sportType = SPORT_TYPE_MAP[session.type] || 'Workout';
  const elapsedTimeSec = (session.duration || 60) * 60;

  // Build description
  const descParts = [];
  if (session.notes) descParts.push(session.notes);
  descParts.push(`Phase: ${session.phase || '–'}`);
  if (session.pace) descParts.push(`Pace: ${session.pace} min/km`);
  descParts.push(`RPE: ${session.rpe} · Sub 68 Training`);
  const description = descParts.join(' · ');

  // Activity name
  const typeNames = { laufen: 'Laufen', kraft: 'Krafttraining', hyrox: 'HYROX Training', skierg: 'SkiErg', rowing: 'Rowing', erholung: 'Erholung', concurrent: 'Concurrent Training' };
  const name = typeNames[session.type] || 'Training';

  // Use provided timestamp or now
  const startDate = session.timestamp
    ? new Date(session.timestamp).toISOString().replace('Z', '')
    : new Date().toISOString().replace('Z', '');

  const res = await fetch(STRAVA_UPLOAD_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: tokens.refresh_token,
      name,
      sport_type: sportType,
      start_date_local: startDate,
      elapsed_time: elapsedTimeSec,
      description,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || data.detail?.message || 'Upload fehlgeschlagen');

  // Update stored tokens if refreshed
  if (data.new_refresh_token) {
    saveStravaTokens({ ...tokens, access_token: data.new_access_token, refresh_token: data.new_refresh_token });
  }

  return { id: data.id, url: data.url };
}
```

- [ ] **Step 2: Verify the function compiles (no syntax errors)**

Open `http://localhost:8080`, open DevTools Console, navigate to Log tab.

Expected: No import errors for strava.js. The function is exported but not yet called — no visible change.

- [ ] **Step 3: Commit**

```bash
git add js/strava.js
git commit -m "feat(strava): add uploadActivity() for bidirectional Strava sync"
```

---

### Task B2: Log Tab — "Upload to Strava" Post-Save Button

**Files:**
- Modify: `js/tabs/log.js`

**Context:** After successfully saving a session, if the user is connected to Strava, show a brief success state with an "Auf Strava hochladen ↗" button before navigating to Dashboard.

- [ ] **Step 1: Import `uploadActivity` and `getStravaTokens` in log.js**

In `js/tabs/log.js`, the current imports are:
```javascript
import { saveSession, saveHRV, getTodayHRV, getRecentSessions, getAmpelFromRMSSD, getHRVEntries, ampelLabel } from '../db.js';
import { queueSession } from '../sync.js';
import { getCurrentPhase, TYPE_ICONS } from '../data/plan-data.js';
```

Add a lazy import function (same pattern as existing Strava handling in app.js):
```javascript
async function getStravaModule() {
  return import('../strava.js');
}
```

- [ ] **Step 2: Replace the save success flow with an intermediate success state**

In `js/tabs/log.js`, find the save handler in `attachListeners()`. Replace the current handler:

```javascript
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
    try {
      await saveSession(session);
    } catch {
      queueSession(session);
    }
    state.rpe = null;
    state.pace = '';
    state.notes = '';
    state.date = new Date().toISOString().split('T')[0];
    await init();
    document.querySelector('[data-tab="dashboard"]').click();
  });
```

Replace with:
```javascript
  document.getElementById('btn-save-session')?.addEventListener('click', async () => {
    if (!state.rpe) { alert('Bitte RPE auswählen (1–10)'); return; }
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
    try {
      await saveSession(session);
    } catch {
      queueSession(session);
    }

    // Check if Strava is connected
    const { getStravaTokens } = await getStravaModule();
    const hasStrava = !!getStravaTokens();

    if (hasStrava) {
      // Show success state with Strava upload option
      showSaveSuccess(session);
    } else {
      state.rpe = null;
      state.pace = '';
      state.notes = '';
      state.date = today;
      await init();
      document.querySelector('[data-tab="dashboard"]').click();
    }
  });
```

- [ ] **Step 3: Add `showSaveSuccess()` function**

In `js/tabs/log.js`, add this function before `updateLoadPreview()`:

```javascript
function showSaveSuccess(session) {
  const logEl = el();
  logEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:16px;padding:24px">
      <div style="font-size:2.5em">✅</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.6em;font-weight:800">Einheit gespeichert!</div>
      <div style="color:var(--muted);font-size:0.85em;text-align:center">
        ${session.type.charAt(0).toUpperCase() + session.type.slice(1)} · ${session.duration} Min · RPE ${session.rpe}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:300px">
        <button class="btn-secondary" id="btn-strava-upload" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <span style="font-size:1.1em">🚴</span> Auf Strava hochladen ↗
        </button>
        <button class="btn-primary" id="btn-goto-dashboard">→ Zum Dashboard</button>
      </div>
    </div>
  `;

  document.getElementById('btn-goto-dashboard')?.addEventListener('click', async () => {
    state.rpe = null;
    state.pace = '';
    state.notes = '';
    state.date = new Date().toISOString().split('T')[0];
    await init();
    document.querySelector('[data-tab="dashboard"]').click();
  });

  document.getElementById('btn-strava-upload')?.addEventListener('click', async () => {
    const uploadBtn = document.getElementById('btn-strava-upload');
    if (!uploadBtn) return;
    uploadBtn.disabled = true;
    uploadBtn.textContent = '⏳ Hochladen…';
    try {
      const { uploadActivity } = await getStravaModule();
      const result = await uploadActivity(session);
      uploadBtn.textContent = '✓ Auf Strava hochgeladen';
      uploadBtn.style.color = 'var(--success)';
      uploadBtn.style.borderColor = 'var(--success)';
    } catch (err) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = `❌ Fehler: ${err.message}`;
    }
  });
}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, navigate to Log tab.

Test A (Strava NOT connected):
- Log a session → immediately navigates to Dashboard (old behavior)

Test B (Strava connected — connect first via Settings → Strava verbinden):
- Log a session → shows "✅ Einheit gespeichert!" success screen
- Two buttons: "🚴 Auf Strava hochladen ↗" and "→ Zum Dashboard"
- Tap "→ Zum Dashboard" → navigates to Dashboard
- Tap "🚴 Auf Strava hochladen ↗" → shows "⏳ Hochladen…" then "✓ Auf Strava hochgeladen" or error
- After upload, activity should appear in Strava (verify in Strava app)

- [ ] **Step 5: Commit**

```bash
git add js/tabs/log.js
git commit -m "feat(log): add post-save Strava upload option when Strava is connected"
```

---

### Task B3: `computePacePrognosis()` in strava.js

**Files:**
- Modify: `js/strava.js`

**Context:** Current prognosis in dashboard.js uses `78 - weeksTraining * 0.3` (pure formula). This new function analyzes actual running session data to compute a data-driven prognosis. If <4 weeks of data, it returns `null` (caller falls back to formula). If ≥4 weeks, it returns a projected 10km time + confidence level + trend direction.

- [ ] **Step 1: Add `computePacePrognosis()` to strava.js**

In `js/strava.js`, after `uploadActivity()`, add:

```javascript
/**
 * Compute pace-based race prognosis from running session history.
 * @param {Array} sessions - sessions from getSessionsForCharts(8), each with {created_at, type, pace_per_km}
 * @returns {{ prognosisMin: number, prognosisStr: string, confidence: 'low'|'medium'|'high', trendArrow: string } | null}
 */
export function computePacePrognosis(sessions) {
  const runningSessions = sessions
    .filter(s => s.type === 'laufen' && s.pace_per_km)
    .map(s => {
      const [m, sec] = s.pace_per_km.split(':').map(Number);
      return { date: new Date(s.created_at), paceDecimal: m + (sec || 0) / 60 };
    })
    .sort((a, b) => a.date - b.date);

  if (runningSessions.length < 2) return null;

  // Group by ISO week (Monday start)
  const byWeek = {};
  runningSessions.forEach(s => {
    const d = new Date(s.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    monday.setHours(0,0,0,0);
    const key = monday.toISOString().split('T')[0];
    if (!byWeek[key]) byWeek[key] = [];
    byWeek[key].push(s.paceDecimal);
  });

  const weekKeys = Object.keys(byWeek).sort();
  const weekAvgPaces = weekKeys.map(k => {
    const paces = byWeek[k];
    return paces.reduce((a, b) => a + b, 0) / paces.length;
  });

  const n = weekAvgPaces.length;
  if (n < 2) return null;

  // Confidence levels
  const confidence = n >= 6 ? 'high' : n >= 4 ? 'medium' : 'low';
  if (confidence === 'low') return null;

  // Linear regression: x = week index (0..n-1), y = avg pace
  const xMean = (n - 1) / 2;
  const yMean = weekAvgPaces.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  weekAvgPaces.forEach((y, i) => { sxy += (i - xMean) * (y - yMean); sxx += (i - xMean) ** 2; });
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = yMean - slope * xMean;

  // Weeks until race from last training week
  const lastDate = new Date(weekKeys[weekKeys.length - 1]);
  const raceDate = new Date('2026-12-13'); // race date
  const weeksToRace = Math.max(1, Math.round((raceDate - lastDate) / (7 * 24 * 60 * 60 * 1000)));
  const projectedPace = intercept + slope * (n - 1 + weeksToRace);

  // Cap pace: 4:00 min/km minimum (15 km/h), 9:00 max (very slow)
  const cappedPace = Math.max(4.0, Math.min(9.0, projectedPace));

  // Hyrox: 10km run split + station overhead (stations total ~25 min for Steven's targets)
  const STATION_OVERHEAD_MIN = 25;
  const tenKmMin = cappedPace * 10;
  const totalMin = tenKmMin + STATION_OVERHEAD_MIN;
  const finalMin = Math.max(62, Math.min(80, totalMin)); // cap between 62 and 80

  const m = Math.floor(finalMin);
  const s = Math.round((finalMin - m) * 60);
  const prognosisStr = `${m}:${String(s).padStart(2, '0')}`;

  // Trend: compare last 4 weeks vs prior 4 weeks
  let trendArrow = '→';
  if (weekAvgPaces.length >= 6) {
    const recent = weekAvgPaces.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const earlier = weekAvgPaces.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    if (recent < earlier - 0.05) trendArrow = '↓ Besser';
    else if (recent > earlier + 0.05) trendArrow = '↑ Langsamer';
    else trendArrow = '→ Stabil';
  }

  return { prognosisMin: finalMin, prognosisStr, confidence, trendArrow };
}
```

- [ ] **Step 2: Verify the logic (no browser test needed yet — tested in B4)**

No browser-visible change yet. Ensure no syntax errors by opening DevTools Console after a page load.

- [ ] **Step 3: Commit**

```bash
git add js/strava.js
git commit -m "feat(strava): add computePacePrognosis() for data-driven race time projection"
```

---

### Task B4: Dashboard — Smart Prognosis Using Real Data

**Files:**
- Modify: `js/tabs/dashboard.js`

**Context:** Replace the hardcoded formula prognosis with `computePacePrognosis()` when confidence is 'medium' or 'high'. Fall back to the formula when insufficient data.

- [ ] **Step 1: Import `computePacePrognosis` and `getSessionsForCharts` in dashboard.js**

Add to existing imports in `js/tabs/dashboard.js`:
```javascript
import { getSessionsForCharts } from '../db.js';
```

And import strava module lazily:
```javascript
async function getStravaPrognosis(sessions) {
  const { computePacePrognosis } = await import('../strava.js');
  return computePacePrognosis(sessions);
}
```

- [ ] **Step 2: Fetch sessions in `render()` and compute smart prognosis**

In `js/tabs/dashboard.js` `render()`, update the data fetch:
```javascript
  const [todayHRV, weekSessions, hrvEntries, chartSessions] = await Promise.all([
    getTodayHRV(),
    getWeekSessions(),
    getHRVEntries(7),
    getSessionsForCharts(8),
  ]);
```

Then replace the existing prognosis calculation block:
```javascript
  const start = new Date('2026-03-29');
  const weeksTraining = Math.max(0, Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000)));
  const prognosisMin = Math.max(66, 78 - weeksTraining * 0.3);
  const progM = Math.floor(prognosisMin);
  const progS = Math.round((prognosisMin - progM) * 60);
  const prognosisStr = `${progM}:${String(progS).padStart(2, '0')}`;
```
with:
```javascript
  // Smart prognosis: use real pace data if available, else formula
  let prognosisStr, prognosisConfidence = null, prognosisTrend = null;
  const smartPrognosis = await getStravaPrognosis(chartSessions);
  if (smartPrognosis) {
    prognosisStr = smartPrognosis.prognosisStr;
    prognosisConfidence = smartPrognosis.confidence;
    prognosisTrend = smartPrognosis.trendArrow;
  } else {
    const start = new Date('2026-03-29');
    const weeksTraining = Math.max(0, Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000)));
    const prognosisMin = Math.max(66, 78 - weeksTraining * 0.3);
    const progM = Math.floor(prognosisMin);
    const progS = Math.round((prognosisMin - progM) * 60);
    prognosisStr = `${progM}:${String(progS).padStart(2, '0')}`;
  }
```

- [ ] **Step 3: Update hero card HTML to show confidence + trend**

In `js/tabs/dashboard.js`, in the hero card HTML, replace:
```javascript
      <div class="hero-sub">Ziel: Sub 68:00 · ${daysLeft} Tage bis Race Day</div>
```
with:
```javascript
      <div class="hero-sub">Ziel: Sub 68:00 · ${daysLeft} Tage bis Race Day</div>
      ${prognosisTrend ? `
      <div style="font-size:0.75em;color:var(--muted);margin-top:4px">
        ${prognosisTrend} · ${prognosisConfidence === 'high' ? 'Basiert auf echten Laufdaten' : 'Wenig Daten — Näherungswert'}
      </div>` : ''}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, navigate to Dashboard.

Expected (without pace data): Hero card shows formula prognosis, no trend line shown.

Expected (after logging several running sessions with pace over multiple weeks):
- Hero card shows data-driven prognosis
- Small indicator below "Race Day" shows trend arrow (↓ Besser / → Stabil / ↑ Langsamer) and confidence label

- [ ] **Step 5: Commit**

```bash
git add js/tabs/dashboard.js
git commit -m "feat(dashboard): use computePacePrognosis() for data-driven race prognosis with trend indicator"
```

---

### Task B5: Coach — Volume Context in System Prompt

**Files:**
- Modify: `js/strava.js`
- Modify: `js/tabs/coach.js`

**Context:** The coach's system prompt currently has no training volume data. This adds a `getStravaVolumeContext()` helper that summarizes weekly/monthly running kilometers, and injects it into the coach prompt.

- [ ] **Step 1: Add `getStravaVolumeContext()` to strava.js**

In `js/strava.js`, after `computePacePrognosis()`, add:

```javascript
/**
 * Returns a formatted string summarizing training volume for coach context.
 * @param {Array} sessions - from getSessionsForCharts(8)
 * @returns {string}
 */
export function getStravaVolumeContext(sessions) {
  const runSessions = sessions.filter(s => s.type === 'laufen');

  // Sessions with pace → can estimate km
  const withPace = runSessions.filter(s => s.pace_per_km && s.duration_min);

  function paceToKmh(pace) {
    const [m, sec] = pace.split(':').map(Number);
    const minPerKm = m + (sec || 0) / 60;
    return minPerKm > 0 ? 60 / minPerKm : 0;
  }

  function sessionKm(s) {
    if (!s.pace_per_km || !s.duration_min) return 0;
    const kmh = paceToKmh(s.pace_per_km);
    return kmh * (s.duration_min / 60);
  }

  // Last 7 days
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 28);

  const weekRuns = runSessions.filter(s => new Date(s.created_at) >= weekAgo);
  const monthRuns = runSessions.filter(s => new Date(s.created_at) >= monthAgo);

  const weekKm = withPace.filter(s => new Date(s.created_at) >= weekAgo).reduce((a, s) => a + sessionKm(s), 0);
  const monthKm = withPace.filter(s => new Date(s.created_at) >= monthAgo).reduce((a, s) => a + sessionKm(s), 0);

  const parts = [];
  parts.push(`- Laufeinheiten letzte Woche: ${weekRuns.length} (${weekKm > 0 ? '~' + weekKm.toFixed(1) + ' km' : 'Pace nicht erfasst'})`);
  parts.push(`- Laufeinheiten letzte 4 Wochen: ${monthRuns.length} (${monthKm > 0 ? '~' + monthKm.toFixed(1) + ' km' : 'Pace nicht erfasst'})`);

  // All training sessions this week
  const allWeekSessions = sessions.filter(s => new Date(s.created_at) >= weekAgo);
  const kraftCount = allWeekSessions.filter(s => s.type === 'kraft').length;
  const hyroxCount = allWeekSessions.filter(s => s.type === 'hyrox').length;
  if (kraftCount > 0) parts.push(`- Krafteinheiten letzte Woche: ${kraftCount}`);
  if (hyroxCount > 0) parts.push(`- HYROX-Einheiten letzte Woche: ${hyroxCount}`);

  return parts.join('\n');
}
```

Note: The function uses `s.duration_min` (the DB field name from `getSessionsForCharts`). Verify that `getSessionsForCharts` returns this field. Looking at `db.js` line 72: `getSessionsForCharts` selects `'created_at,load_points,type,pace_per_km'` — it does NOT include `duration_min`. Update the select query.

- [ ] **Step 2: Update `getSessionsForCharts` in db.js to include duration_min**

In `js/db.js`, find `getSessionsForCharts()`:
```javascript
    .from('sessions').select('created_at,load_points,type,pace_per_km')
```
Replace with:
```javascript
    .from('sessions').select('created_at,load_points,type,pace_per_km,duration_min')
```

- [ ] **Step 3: Inject volume context into coach system prompt**

In `js/tabs/coach.js`, update `buildSystemPrompt()`. First add a lazy import for `getStravaVolumeContext`:

After the existing imports at the top of `coach.js`:
```javascript
async function getVolumeContext(sessions) {
  try {
    const { getStravaVolumeContext } = await import('../strava.js');
    return getStravaVolumeContext(sessions);
  } catch {
    return null;
  }
}
```

Then in `buildSystemPrompt()`, add `getSessionsForCharts` to the data fetching:
```javascript
  const { getSessionsForCharts } = await import('../db.js');
```

Wait — `db.js` is already imported at the top of `coach.js` via `import { getTodayHRV, getWeekSessions, getHRVEntries, ampelLabel } from '../db.js'`. Add `getSessionsForCharts` to that import:

```javascript
import { getTodayHRV, getWeekSessions, getHRVEntries, ampelLabel, getSessionsForCharts } from '../db.js';
```

Then update `buildSystemPrompt()`:
```javascript
async function buildSystemPrompt() {
  const [todayHRV, weekSessions, hrvEntries, chartSessions] = await Promise.all([
    getTodayHRV(), getWeekSessions(), getHRVEntries(7), getSessionsForCharts(8),
  ]);
  const weekLoad = weekSessions.reduce((s, x) => s + (x.load_points || 0), 0);
  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;
  const phase = getCurrentPhase();
  const today = getTodaySession();
  const volumeCtx = await getVolumeContext(chartSessions);

  return SYSTEM_PROMPT + `\n\nAKTUELLE WOCHENDATEN (${new Date().toLocaleDateString('de-DE')}):
- Phase: ${phase.name} (${phase.weeks})
- Wochenbelastung: ${weekLoad} RPE-Punkte (Ziel: ${phase.rpeMin || 0}–${phase.rpeMax || 1500})
- HRV heute: ${todayHRV ? todayHRV.rmssd + ' ms (' + ampelLabel(todayHRV.ampel) + ')' : 'nicht gemessen'}
- HRV 7-Tage-Mittel: ${weekMean ? weekMean + ' ms' : 'keine Daten'}
- Heutige geplante Einheit: ${today ? today.name + ' (' + today.dur + ' Min)' : 'Ruhetag'}
- Einheiten diese Woche: ${weekSessions.length}
${volumeCtx ? '\nTRAININGSVOLUMEN:\n' + volumeCtx : ''}`;
}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, navigate to Coach tab.

Expected: No visible UI change. But when sending a message, the system prompt now includes volume data. To verify: add a `console.log(systemPrompt)` temporarily in `sendMessage()` before the fetch call, then check the console output. Volume context should appear after the weekly data section.

- [ ] **Step 5: Commit**

```bash
git add js/strava.js js/tabs/coach.js js/db.js
git commit -m "feat(coach): inject weekly training volume into Claude system prompt"
```

---

### Task B6: Pace Chart — Trend Line and Zone Reference Lines

**Files:**
- Modify: `js/charts.js`
- Modify: `js/tabs/analyse.js`

**Context:** The pace chart currently shows only raw pace data points. This adds: (1) a dotted trend line using linear regression, (2) two horizontal zone reference lines (LDL: 7:08 min/km, MDL: 5:02 min/km).

- [ ] **Step 1: Update `renderPaceChart()` in charts.js to accept options**

In `js/charts.js`, replace the entire `renderPaceChart` function:

```javascript
export function renderPaceChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const running = sessions.filter(s => s.type === 'laufen' && s.pace_per_km);
  if (running.length === 0) return;

  const toDecimal = pace => {
    const [m, s] = pace.split(':').map(Number);
    return m + (s || 0) / 60;
  };

  const paceValues = running.map(s => toDecimal(s.pace_per_km));
  const labels = running.map(s => new Date(s.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }));

  // Compute linear regression trend
  const n = paceValues.length;
  const xMean = (n - 1) / 2;
  const yMean = paceValues.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  paceValues.forEach((y, i) => { sxy += (i - xMean) * (y - yMean); sxx += (i - xMean) ** 2; });
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = yMean - slope * xMean;
  const trendData = paceValues.map((_, i) => intercept + slope * i);

  // Zone reference lines (as datasets with single-value fill spanning entire chart)
  // LDL max pace: 1000/8.4 km/h = 7.14 min/km
  // MDL max pace: 1000/11.9 km/h = 5.04 min/km
  const ldlPace = 1000 / 8.4 / 60; // = 7.14 min/km
  const mdlPace = 1000 / 11.9 / 60; // = 5.04 min/km

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pace (min/km)',
          data: paceValues,
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232,255,71,0.06)',
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.3,
          fill: true,
          order: 1,
        },
        {
          label: 'Trend',
          data: trendData,
          borderColor: 'rgba(232,255,71,0.35)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          order: 2,
        },
        {
          label: 'LDL-Grenze',
          data: Array(n).fill(ldlPace),
          borderColor: 'rgba(78,203,113,0.4)',
          borderWidth: 1,
          borderDash: [3, 4],
          pointRadius: 0,
          fill: false,
          order: 3,
        },
        {
          label: 'MDL-Grenze',
          data: Array(n).fill(mdlPace),
          borderColor: 'rgba(71,200,255,0.4)',
          borderWidth: 1,
          borderDash: [3, 4],
          pointRadius: 0,
          fill: false,
          order: 4,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 8,
            font: { size: 10 },
            filter: item => item.text !== 'Trend', // hide trend from legend
          },
        },
      },
      scales: {
        x: { grid: { color: '#1e2230' } },
        y: {
          grid: { color: '#1e2230' },
          reverse: true,
          ticks: {
            callback: v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`,
          },
        },
      },
    },
  });
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8080`, navigate to Analyse tab. Requires at least 2 running sessions with pace entered.

Expected:
- Pace chart shows raw data (yellow line, dots)
- Dotted trend line in muted yellow below the main line
- Two horizontal dashed lines: green (LDL, ~7:08) and cyan (MDL, ~5:04)
- Legend shows "Pace (min/km)", "LDL-Grenze", "MDL-Grenze" (no "Trend" in legend)
- Y axis still shows min:sec format

- [ ] **Step 3: Commit**

```bash
git add js/charts.js
git commit -m "feat(charts): add trend line and zone reference lines to pace chart"
```

---

### Task B7: Service Worker Cache Bump

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump cache version**

In `sw.js`, replace:
```javascript
const CACHE_NAME = 'sub68-v14';
```
with:
```javascript
const CACHE_NAME = 'sub68-v15';
```

- [ ] **Step 2: Verify in browser**

Hard reload, check DevTools Application → Service Workers. `sub68-v14` should be deleted.

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "chore: bump service worker cache to v15 (Phase B)"
```

---

## Phase B Complete

Verify success criteria from spec:
- [ ] After saving a session, "Auf Strava hochladen" button appears if Strava connected
- [ ] Clicking upload creates activity on Strava (visible in Strava app)
- [ ] Dashboard prognosis uses real pace data when ≥4 weeks of running data available
- [ ] Prognosis shows trend indicator (↓ Besser / → Stabil / ↑ Langsamer)
- [ ] Coach system prompt includes weekly and monthly running volume breakdown
- [ ] Pace chart shows dotted trend line and two zone reference lines (LDL, MDL)

Push to GitHub Pages (`git push`) to deploy.
