# Sub 68 Phase A — Design Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Concept C navigation (5-item nav with slim pill indicator, glass background), move Settings to dashboard gear icon, upgrade hero card and typography, add colored day-card borders and color-coded RPE selector.

**Architecture:** CSS-only changes for nav redesign and visual polish. Minimal JS changes to dashboard (add gear icon) and settings nav routing. No new dependencies, no new files.

**Tech Stack:** CSS custom properties, Vanilla JS ES Modules, PWA

**Prerequisite:** Phase C must be complete (sw.js at sub68-v13, all C features merged).

---

## File Map

| File | Changes |
|------|---------|
| `index.html` | Remove ⚙️ Settings nav item, nav now has 5 items |
| `css/main.css` | Nav glass effect + pill indicator, hero card upgrade, RPE color display |
| `js/tabs/dashboard.js` | Add gear icon ⚙️ top-right, clicking it navigates to settings |
| `sw.js` | Bump cache to `sub68-v14` |

Note: Phase C already adds colored left borders to day cards in `plan.js`. Phase A adds CSS for RPE color label and updates nav styles.

---

### Task A1: Navigation — 5-Item Glass Nav with Pill Indicator

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`

**Context:** Currently 6 nav items including ⚙️ Settings. New design: 5 items (remove Settings), active item shows a 20px wide accent pill below the icon instead of colored icon text. Nav gets glass/blur background.

- [ ] **Step 1: Remove Settings nav item from `index.html`**

In `index.html`, remove these lines (the settings nav button):
```html
      <button class="nav-item" data-tab="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
```

The `<nav class="bottom-nav">` should now contain exactly 5 buttons: dashboard, log, plan, analyse, coach.

- [ ] **Step 2: Remove nav-label spans from all nav items**

Labels are no longer shown in the new design. In `index.html`, remove all `<span class="nav-label">...</span>` lines from within the `<nav class="bottom-nav">` element.

After the change, the nav HTML should look like:
```html
    <nav class="bottom-nav">
      <button class="nav-item active" data-tab="dashboard">
        <span class="nav-icon">🏠</span>
      </button>
      <button class="nav-item" data-tab="log">
        <span class="nav-icon">⚡</span>
      </button>
      <button class="nav-item" data-tab="plan">
        <span class="nav-icon">📅</span>
      </button>
      <button class="nav-item" data-tab="analyse">
        <span class="nav-icon">📈</span>
      </button>
      <button class="nav-item" data-tab="coach">
        <span class="nav-icon">🤖</span>
      </button>
    </nav>
```

- [ ] **Step 3: Update nav CSS in `css/main.css`**

Replace the entire bottom nav block (from `/* ── Bottom Nav */` through `.nav-label { ... }`) with:

```css
/* ── Bottom Nav ─────────────────────────────────────── */
:root {
  --nav-h: 56px;
}

.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: calc(var(--nav-h) + var(--safe-bottom));
  background: rgba(13, 15, 20, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  padding-bottom: var(--safe-bottom);
  z-index: 100;
}
.nav-item {
  flex: 1;
  background: none;
  border: none;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
  position: relative;
}
.nav-item.active { color: var(--accent); }
.nav-icon { font-size: 1.5em; line-height: 1; }
.nav-item.active::after {
  content: '';
  display: block;
  width: 20px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
  margin-top: 4px;
}
.nav-item:not(.active)::after {
  content: '';
  display: block;
  width: 20px;
  height: 2px;
  background: transparent;
  margin-top: 4px;
}
```

Note: The `--nav-h` variable is also defined in `:root` at the top of the file (as `64px`). Update that existing declaration from `--nav-h: 64px` to `--nav-h: 56px` in the `:root` block at line 13, and remove the redundant one above.

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server 8080`, open `http://localhost:8080`.

Expected:
- Nav bar is slightly slimmer (56px)
- Nav has a semi-transparent glass effect — content below partially visible through blur
- Only 5 nav items — no Settings icon
- Active tab (Home) shows the emoji icon in accent yellow + a 20px pill below it
- Other tabs show muted icon with no pill
- Switching tabs updates which item shows the pill
- Nav labels (Home, Log, etc.) no longer visible

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css
git commit -m "feat(nav): 5-item glass nav with slim pill active indicator, remove Settings from nav"
```

---

### Task A2: Dashboard — Gear Icon for Settings Access

**Files:**
- Modify: `js/tabs/dashboard.js`
- Modify: `css/main.css`

**Context:** Settings is no longer in the nav bar. Users access it via a gear icon ⚙️ in the top-right of the Dashboard screen title row.

- [ ] **Step 1: Update Dashboard screen title to include gear icon**

In `js/tabs/dashboard.js`, find in `render()`:
```javascript
  el().innerHTML = `
    <div class="screen-title">Dashboard · ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
```
Replace with:
```javascript
  el().innerHTML = `
    <div class="dashboard-header">
      <div class="screen-title" style="margin-bottom:0">Dashboard · ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
      <button class="settings-gear-btn" id="btn-settings" aria-label="Einstellungen">⚙️</button>
    </div>
```

- [ ] **Step 2: Attach gear button listener**

In `js/tabs/dashboard.js`, the `render()` function currently has no event listeners attached after the innerHTML. Add at the bottom of `render()`:

```javascript
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    document.querySelector('[data-tab="settings"]').click();
  });
```

- [ ] **Step 3: Add CSS for dashboard header and gear button**

In `css/main.css`, after `.screen-title` block (around line 75), add:
```css
/* ── Dashboard Header ───────────────────────────────── */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.settings-gear-btn {
  background: none;
  border: none;
  font-size: 1.3em;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.settings-gear-btn:hover { opacity: 1; }
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, verify Dashboard tab.

Expected:
- Top row shows "Dashboard · [day, date]" on left and ⚙️ gear icon on right
- Tapping gear icon navigates to Settings tab
- Settings tab is fully functional (the tab-content div still exists, just no nav button for it)

- [ ] **Step 5: Commit**

```bash
git add js/tabs/dashboard.js css/main.css
git commit -m "feat(dashboard): add gear icon for settings access (replaces nav entry)"
```

---

### Task A3: Hero Card Upgrade — Larger Prognosis + Integrated HRV Status

**Files:**
- Modify: `js/tabs/dashboard.js`
- Modify: `css/main.css`

**Context:** The hero card shows a 3.2em prognosis time. New design: 4.5em, integrate HRV status as a colored dot + label inside the hero card bottom row, remove the separate `ampel-banner` above it.

- [ ] **Step 1: Update hero card HTML in dashboard.js**

In `js/tabs/dashboard.js`, replace the ampel-banner + hero-card block:

Current (lines 46–58):
```javascript
    <div class="ampel-banner ${ampel}">
      <div class="ampel-dot"></div>
      <div>
        <span style="font-size:1.1em">${todayHRV ? todayHRV.rmssd + ' ms RMSSD' : 'HRV heute noch nicht gemessen'}</span>
        <div style="font-size:0.82em;opacity:0.85;margin-top:1px">${ampelText}</div>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-label">Zielzeit-Prognose</div>
      <div class="hero-value">${prognosisStr}</div>
      <div class="hero-sub">Ziel: Sub 68:00 · ${daysLeft} Tage bis Race Day</div>
    </div>
```

Replace with:
```javascript
    <div class="hero-card">
      <div class="hero-badge">${phase.name}</div>
      <div class="hero-label">Zielzeit-Prognose</div>
      <div class="hero-value">${prognosisStr}</div>
      <div class="hero-sub">Ziel: Sub 68:00 · ${daysLeft} Tage bis Race Day</div>
      <div class="hero-hrv ${ampel}">
        <div class="ampel-dot" style="width:8px;height:8px"></div>
        <span>${todayHRV ? todayHRV.rmssd + ' ms RMSSD' : 'HRV noch nicht gemessen'}</span>
        <span style="opacity:0.7">· ${ampelText}</span>
      </div>
    </div>
```

- [ ] **Step 2: Update hero card CSS**

In `css/main.css`, replace the entire `/* ── Hero Card */` block:

```css
/* ── Hero Card ──────────────────────────────────────── */
.hero-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0d1520 100%);
  border: 1px solid rgba(232, 255, 71, 0.12);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}
.hero-card::before {
  content: 'SUB 68';
  position: absolute;
  right: -8px; top: 50%;
  transform: translateY(-50%);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 3.8em;
  font-weight: 900;
  color: rgba(232, 255, 71, 0.05);
  letter-spacing: -0.02em;
  pointer-events: none;
}
.hero-badge {
  display: inline-block;
  background: rgba(71,200,255,0.12);
  border: 1px solid rgba(71,200,255,0.25);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.68em;
  font-weight: 700;
  color: var(--accent2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.hero-label {
  font-size: 0.68em;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}
.hero-value {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 4.5em;
  font-weight: 900;
  color: var(--accent);
  line-height: 0.95;
}
.hero-sub { color: var(--accent2); font-size: 0.82em; margin-top: 6px; }
.hero-hrv {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 0.8em;
  font-weight: 600;
}
.hero-hrv.gruen { color: var(--success); }
.hero-hrv.gelb  { color: var(--warn); }
.hero-hrv.rot   { color: var(--danger); }
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8080`, navigate to Dashboard.

Expected:
- Hero card is taller, prognosis time is much larger (4.5em)
- Phase badge (e.g., "BASE") shown in top-left as a cyan pill
- HRV status row at bottom of hero card with colored dot
- No separate ampel-banner above the hero card
- Hero card has subtle yellow-glow border (1px rgba(232,255,71,0.12))

- [ ] **Step 4: Commit**

```bash
git add js/tabs/dashboard.js css/main.css
git commit -m "feat(dashboard): upgrade hero card to 4.5em prognosis with integrated HRV status"
```

---

### Task A4: RPE Selector — Color-Coded with Selected Label

**Files:**
- Modify: `js/tabs/log.js`
- Modify: `css/main.css`

**Context:** The RPE grid already has color-coded button text (via CSS added in the existing `main.css`). This task adds a large RPE label above the grid showing the selected value and its meaning, e.g., "7 — Anstrengend".

- [ ] **Step 1: Define RPE labels**

In `js/tabs/log.js`, add a constant at the module level (after the `import` lines, before `let state`):

```javascript
const RPE_LABELS = {
  1: 'Sehr leicht', 2: 'Leicht', 3: 'Moderat',
  4: 'Etwas anstrengend', 5: 'Anstrengend',
  6: 'Mäßig hart', 7: 'Hart', 8: 'Sehr hart',
  9: 'Extrem hart', 10: 'Maximale Anstrengung',
};
```

- [ ] **Step 2: Add RPE selected display in render()**

In `js/tabs/log.js` `render()`, find:
```javascript
    <div class="section-label">Anstrengung (RPE 1–10)</div>
    <div class="rpe-grid">
```
Replace with:
```javascript
    <div class="section-label">Anstrengung (RPE 1–10)</div>
    ${state.rpe ? `
    <div class="rpe-selected-display">
      <span class="rpe-selected-num">${state.rpe}</span>
      <span class="rpe-selected-label">${RPE_LABELS[state.rpe]}</span>
    </div>
    ` : ''}
    <div class="rpe-grid">
```

- [ ] **Step 3: Add CSS for RPE display**

In `css/main.css`, after the `.rpe-btn.active` rule (around line 253), add:

```css
/* ── RPE Selected Display ───────────────────────────── */
.rpe-selected-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 0 2px;
}
.rpe-selected-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2.2em;
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}
.rpe-selected-label {
  font-size: 0.85em;
  color: var(--muted);
}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8080`, navigate to Log tab.

Expected:
- Before selecting RPE: no RPE display label (section-label only)
- After tapping RPE 7: shows "7 — Hart" with large "7" in accent yellow above the grid
- After tapping a different RPE: label updates immediately
- RPE buttons are still color-coded (green 1-3, orange 4-6, red-orange 7-8, red 9-10)

- [ ] **Step 5: Commit**

```bash
git add js/tabs/log.js css/main.css
git commit -m "feat(log): add RPE label display showing selected value and description"
```

---

### Task A5: Service Worker Cache Bump

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump cache version**

In `sw.js`, replace:
```javascript
const CACHE_NAME = 'sub68-v13';
```
with:
```javascript
const CACHE_NAME = 'sub68-v14';
```

- [ ] **Step 2: Verify in browser**

Hard reload (Cmd+Shift+R), check DevTools Application → Service Workers that new worker is active and `sub68-v13` is deleted from Cache Storage.

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "chore: bump service worker cache to v14 (Phase A)"
```

---

## Phase A Complete

Verify success criteria from spec:
- [ ] Bottom nav shows exactly 5 items (dashboard, log, plan, analyse, coach — no settings)
- [ ] Active nav item has a slim 2px accent pill below the icon, no text label
- [ ] Nav background has semi-transparent glass/blur effect
- [ ] Settings accessible via ⚙️ gear icon on Dashboard header
- [ ] Dashboard hero card shows prognosis at 4.5em with phase badge and integrated HRV status row
- [ ] No separate ampel-banner — HRV status integrated into hero card
- [ ] RPE selector shows selected value + label text above the number grid

Push to GitHub Pages (`git push`) to deploy.
