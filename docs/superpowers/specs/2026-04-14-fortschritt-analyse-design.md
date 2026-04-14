# Design: Fortschrittsanzeige & Strava-HR-Import
**Datum:** 2026-04-14  
**Branch:** feature/phase-c-quality-pass

---

## Übersicht

Zwei zusammenhängende Features:

1. **Strava-HR-Import** — `average_heartrate` beim Strava-Sync importieren und in der `notes`-Spalte speichern, damit Laufen-Sessions automatisch eine HF-Angabe haben.
2. **Fortschrittsanzeige** — Neuer Abschnitt am Ende des Analyse-Tabs mit Mini-Charts: Laufen (Pace + HF Dual-Chart) und Kraft (ein Mini-Chart pro geloggter Übung).

---

## Feature 1: Strava-HR-Import

### Änderung in strava.js

`syncActivities()` speichert `average_heartrate` aus der Strava-API in das `notes`-Feld der Session — identisches Format wie bei manueller Eingabe: `"Ø HF: 132 bpm"`.

```js
const avgHR = act.average_heartrate ? Math.round(act.average_heartrate) : null;
const notes = avgHR ? `Ø HF: ${avgHR} bpm` : (act.name || '');
```

**Warum notes statt neuer Spalte:** Kein Supabase-Migration nötig. Das notes-Feld ist bereits vorhanden und wird für diesen Zweck konsistent genutzt (manuell + Strava).

**Konflikt mit Aktivitätsname:** Wenn avg_hr vorhanden ist, wird der Aktivitätsname (z.B. "Morning Run") nicht gespeichert. Akzeptabler Trade-off — der Name hat keinen Mehrwert in dieser App.

---

## Feature 2: Fortschrittsanzeige im Analyse-Tab

### Platzierung

Am Ende von `js/tabs/analyse.js`, nach den bestehenden Charts (HRV, Wochenbelastung, Verteilung, Pace). Kein neuer Tab.

### Laufen-Dual-Chart

**Datenquelle:** Supabase `sessions` — bereits via `getSessionsForCharts()` geladen. Filter: `type === 'laufen'`, letzte 10 Einheiten mit Pace-Wert.

**HR-Daten:** Aus `notes`-Feld parsen: `parseInt(s.notes?.match(/Ø HF: (\d+)/)?.[1])`.

**Chart:** Chart.js mit zwei Datensätzen auf einer gemeinsamen X-Achse (Datum):
- Links Y-Achse: Pace in Dezimalminuten (z.B. 5:30 → 5.5), Farbe `#e8ff47`
- Rechts Y-Achse: Ø HF in bpm, Farbe `#47c8ff`

**Neue Render-Funktion in charts.js:**
```js
export function renderRunProgressChart(canvasId, sessions) { ... }
```

### Kraft-Mini-Charts

**Datenquelle:** `sub68_workout_logs` (localStorage) via neue Funktion in `db.js`:
```js
export function getAllWorkoutLogs() {
  return JSON.parse(localStorage.getItem('sub68_workout_logs') || '[]');
}
```

**Verarbeitung in analyse.js:** Gruppiere Logs nach Übungsname. Für jeden Log berechne Ø abgeschlossener kg-Werte pro Übung. Nur Übungen mit `unit === 'kg'` und mindestens 2 Datenpunkten werden angezeigt.

```js
// Ergebnis-Struktur:
{
  'Squat':    [{ date: '2026-04-10', avgKg: 80 }, { date: '2026-04-14', avgKg: 82.5 }],
  'Deadlift': [{ date: '2026-04-11', avgKg: 100 }, ...],
}
```

**Chart pro Übung:** Kleines Chart.js Liniendiagramm, Höhe 60px, keine Achsenbeschriftung außer Werten. Übungsname + Trend (`erster → letzter Wert`) als Header-Zeile.

**Neue Render-Funktion in charts.js:**
```js
export function renderStrengthMiniChart(canvasId, dataPoints) { ... }
```

### HTML-Struktur in analyse.js

```html
<!-- Laufen Fortschritt -->
<div class="chart-container">
  <div class="chart-title">🏃 Laufen — Pace & HF</div>
  <div style="height:160px"><canvas id="chart-run-progress"></canvas></div>
</div>

<!-- Kraft Fortschritt -->
<div class="chart-container">
  <div class="chart-title">🏋️ Kraft — Übungsfortschritt</div>
  <div id="strength-charts">
    <!-- Ein canvas pro Übung, dynamisch gerendert -->
  </div>
</div>
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `js/strava.js` | `average_heartrate` in notes-Feld beim Sync speichern |
| `js/db.js` | Neue Funktion `getAllWorkoutLogs()` |
| `js/charts.js` | Neue Funktionen `renderRunProgressChart()` und `renderStrengthMiniChart()` |
| `js/tabs/analyse.js` | Zwei neue Chart-Abschnitte am Ende des Tabs |

---

## Nicht im Scope

- Reps-basierte Übungen (Liegestütz, Klimmzüge) in den Kraft-Charts — nur `unit === 'kg'`
- Pace/HF für SkiErg, Rowing — nur Laufen
- Export oder Teilen der Charts
- Filterung nach Trainingsphase
