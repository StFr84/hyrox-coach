# Design: Trainingstagebuch & Phasenwechsel-Safety
**Datum:** 2026-04-14  
**Branch:** feature/phase-c-quality-pass

---

## Übersicht

Zwei unabhängige Features:

1. **Trainingstagebuch** — Erweiterung des Log-Tabs um Satz-für-Satz-Übungserfassung mit Gewicht/Pace/Zeit je Session-Typ, für sichtbaren Fortschritt über Zeit.
2. **Phasenwechsel-Modal** — Blockierendes Vollbild-Modal beim ersten App-Start einer neuen Trainingsphase, damit Übergänge bewusst wahrgenommen und bestätigt werden.

---

## Feature 1: Trainingstagebuch

### Platzierung
Im bestehenden Log-Tab (`js/tabs/log.js`). Nach Typ-Auswahl erscheinen die Übungen des Tages automatisch aus dem Trainingsplan. Kein neuer Tab.

### Datenmodell — plan-data.js

Jeder Tag-Eintrag erhält ein optionales `exercises`-Array. Der bestehende `details`-String bleibt für die modale Beschreibung.

**Kraft:**
```js
exercises: [
  { name: 'Squat',                 sets: 4, reps: 6,  unit: 'kg' },
  { name: 'Romanian Deadlift',     sets: 3, reps: 8,  unit: 'kg' },
  { name: 'Bulgarian Split Squat', sets: 3, reps: 10, unit: 'kg' },
]
```

**Laufen (Intervalle):**
```js
exercises: [
  { name: 'Schwellen-Intervall', sets: 6, reps: 1, distance: '1 km', unit: 'pace' },
]
```

**Hyrox / SkiErg / Rowing:**
```js
exercises: [
  { name: 'SkiErg',         sets: 4, reps: 1, distance: '500m', unit: 'min:sec' },
  { name: 'Burpees',        sets: 5, reps: 10, unit: 'reps' },
  { name: 'Sandbag Lunges', sets: 4, reps: 1, distance: '20m', unit: 'reps' },
]
```

Tage ohne `exercises` (z.B. Ruhe, Erholung) zeigen keinen Übungsblock.

### Datenmodell — db.js (neu: workout_log)

Neuer IndexedDB-Store `workout_log`, getrennt von `sessions`:

```js
{
  id,            // auto-increment
  date,          // ISO string 'YYYY-MM-DD'
  session_type,  // 'kraft', 'laufen', etc.
  phase_id,      // aktuell aktive Phase
  exercises: [
    {
      name: 'Squat',
      sets: [
        { set_number: 1, value: 80, unit: 'kg', reps: 6, completed: true },
        { set_number: 2, value: 80, unit: 'kg', reps: 6, completed: true },
        { set_number: 3, value: 82.5, unit: 'kg', reps: 5, completed: true },
        { set_number: 4, value: null, unit: 'kg', reps: 6, completed: false },
      ]
    }
  ],
  created_at     // timestamp
}
```

Neue DB-Funktionen:
- `saveWorkoutLog(log)` — speichert/aktualisiert
- `getWorkoutLogByDate(date)` — für Heute-Ansicht
- `getLastWorkoutLog(type)` — für Vorwert-Anzeige ("Letztes Mal: 80 kg")

### UI — Log-Tab Übungsblock

Erscheint zwischen Typ-Auswahl und RPE-Block wenn für den gewählten Typ ein Tag mit `exercises` im aktuellen `weekPlan` existiert. Die Übungen werden nach Session-Typ gefiltert (`weekPlan.find(d => d.type === selectedType)`), nicht nach heutigem Wochentag — so funktioniert Kraft-Tracking auch wenn man es an einem anderen Tag nachholt.

**Übungscard (eine pro Übung):**
- Header: Name + "N Sätze × M Wdh"
- Satz-Chips nebeneinander (S1, S2, S3, ...):
  - **Abgeschlossen:** kompakt — Wert + ✓ (grün)
  - **Aktiv:** hervorgehoben (gelber Border) — Eingabefeld + ○. **Aktiver Satz = erster Satz mit `completed: false`.**
  - **Ausstehend:** gedimmt — "—" + ○
- Beim Abhaken eines Satzes: Wert + completed=true gespeichert, **sofort Auto-Save in IndexedDB (upsert nach date+type)**; nächster Satz wird aktiv
- Übung komplett → Card kollabiert zu einzeiliger Zusammenfassung ("Ø 80 kg · 3/3 Sätze")
- **"Einheit speichern"** speichert nur die RPE-Session wie bisher — Übungsdaten sind bereits per Auto-Save persistiert

**Vorwert-Anzeige:**
- Kleiner Hinweis unter dem Übungsnamen: "Letztes Mal: 80 kg" (aus `getLastWorkoutLog`)

**Einheit je Typ:**
- `kg` → Zahl + "kg"
- `pace` → "min:sec"-Format (z.B. "5:30")
- `min:sec` → Zeit-Input
- `reps` → Wiederholungs-Zähler (kein Wert, nur Checkbox)

### Fortschrittsanzeige (Analyse-Tab, Phase 2)
Gesonderte Ausbaustufe — nicht Teil dieses Specs.

---

## Feature 2: Phasenwechsel-Modal

### Erkennung

In `js/app.js` beim App-Init:

```js
const current = getCurrentPhase().id;
const confirmed = localStorage.getItem('confirmedPhase');
if (current !== confirmed) showPhaseModal(current);
```

### Modal-Verhalten
- Rendert über die gesamte App (z-index hoch)
- Hintergrund: gesperrt (kein Scroll, kein Tab-Wechsel möglich)
- Einziger Schließ-Mechanismus: Bestätigungs-Button
- Beim Bestätigen: `localStorage.setItem('confirmedPhase', phase.id)`

### Modal-Inhalt
- Phase-Name + Zeitraum (aus `PHASES`)
- "Was sich ändert"-Liste: kommt aus neuem `changes`-Array in plan-data.js
- Link "Plan in der App ansehen →" öffnet Plan-Tab nach Schließen

### Datenmodell — PHASES.changes

Jede Phase (außer der ersten) bekommt ein `changes`-Array:

```js
{
  id: 'base', name: 'Base', ...
  changes: [
    { icon: '↑', text: 'Volumen: 4 → 6 Einheiten/Woche' },
    { icon: '🎯', text: 'RPE-Ziel: 1000–1500 Pkt/Woche' },
    { icon: '🏋️', text: 'Krafttraining A & B einführen' },
    { icon: '🏃', text: 'Langer LDL Mo + Sa, strikt <137 bpm' },
    { icon: '⚡', text: 'SkiErg + Rowing Mi dazugekommen' },
  ]
}
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `js/data/plan-data.js` | `exercises[]` + `changes[]` zu allen PHASES-Einträgen |
| `js/db.js` | Neuer Store `workout_log` + 3 neue Funktionen |
| `js/tabs/log.js` | Übungsblock nach Typ-Auswahl, Satz-Tracking-UI |
| `js/app.js` | Phasenwechsel-Erkennung + Modal-Aufruf bei Init |
| `css/main.css` | Neue Styles: Satz-Chip, Übungscard, Phase-Modal |

---

## Nicht im Scope

- Fortschritts-Graphen / Analyse über Zeit (spätere Phase)
- Strava-Sync für Übungsdaten
- Eigene Übungen hinzufügen (nur Plan-Übungen)
- Push-Notifications für Phasenwechsel
