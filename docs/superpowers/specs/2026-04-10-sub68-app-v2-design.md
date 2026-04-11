# Sub 68 App v2 — Design Spec
**Datum:** 10. April 2026
**Athlet:** Steven Fredrickson
**Ziel:** Hyrox unter 68 Minuten, Wettkampf Dezember 2026

---

## Kontext

Die bestehende App (PWA auf GitHub Pages, `StFr84.github.io/hyrox-coach`) wird komplett neu gebaut. Die alte App nutzt localStorage und hat keinen echten Chat-Coach, keine Charts und eine langsame Dateneingabe. Die neue Version ersetzt sie vollständig.

---

## Plattform & Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript (ES Modules) |
| Charts | Chart.js (CDN) |
| Daten | Supabase (bestehender Account, neue Tabellen) |
| KI-Coach | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | GitHub Pages (`StFr84.github.io/hyrox-coach`) |
| PWA | Service Worker + Web App Manifest |
| Offline | Service Worker cacht App-Shell; Supabase-Daten bei Verbindung sync |

**Keine nativen App-Store-Apps.** Installierbar als PWA auf iPhone via Safari → "Zum Home-Bildschirm".

---

## Visual Design

**Stil:** Hero & Bold
**Theme:** Dark-first, schwarz-anthrazit Hintergrund, gelb-grüner Hauptakzent

```css
--bg: #0d0f14
--bg2: #161920
--bg3: #1e2230
--accent: #e8ff47      /* Hauptakzent, CTAs */
--accent2: #47c8ff     /* Sekundär, Wochenbelastung */
--text: #f0f2f8
--muted: #7a8099
--success: #4ecb71     /* HRV Grün, Stärken */
--warn: #ffb347        /* HRV Gelb, Achtung */
--danger: #ff6b6b      /* HRV Rot, Schwächen */
```

**Typografie:** Barlow Condensed (Zahlen, Headlines) + Barlow (Fließtext)
**Navigation:** Fixe Bottom-Tab-Bar mit 5 Icons (Dashboard, Log, Plan, Analyse, Coach) + Einstellungen via Icon oben rechts

---

## Architektur

```
index.html              ← App-Shell, Tab-Navigation
├── css/
│   └── main.css        ← Alle Styles, CSS-Variablen
├── js/
│   ├── app.js          ← Tab-Router, Init
│   ├── db.js           ← Supabase Client (sessions, hrv_entries)
│   ├── tabs/
│   │   ├── dashboard.js
│   │   ├── log.js
│   │   ├── plan.js
│   │   ├── analyse.js
│   │   ├── coach.js
│   │   └── settings.js
│   ├── data/
│   │   ├── athlete.js  ← Athletenprofil, Trainingszonen
│   │   ├── plan.js     ← Alle 5 Phasen + Wochenpläne
│   │   └── studies.js  ← Wissenschaftliche Referenzen
│   └── charts.js       ← Chart.js Wrapper-Funktionen
├── manifest.json
├── sw.js               ← Service Worker
├── icon-192.png
└── icon-512.png
```

---

## Tab 1 — Dashboard

**Zweck:** Tagesüberblick auf einen Blick.

**Inhalte (von oben nach unten):**
1. **HRV-Ampel-Banner** — Farbe (Grün/Gelb/Rot), RMSSD-Wert, Trainingsempfehlung ("Volles Training" / "Intensität –20%" / "Nur Erholung")
2. **Hero-Karte: Zielzeit-Prognose** — Große Zahl (~74:30), Trend vs. Vorwoche (↓ 0:30), Ziel-Badge "Sub 68"
3. **Heute-Karte** — Heutige Einheit aus dem Trainingsplan (Name, Dauer, HF-Zone), LOG-Button direkt darauf
4. **Stats-Row (2er Grid):** Wochenbelastung (Zahl + Fortschrittsbalken vs. Phasen-Ziel) | Phase + Countdown (Tage bis Dezember 2026)

**Logik:**
- Heutige Einheit wird aus dem aktiven Wochenplan ermittelt (Tag der Woche → Einheit)
- Zielzeit-Prognose: Formel basierend auf VO2max-Schätzung + aktuellem Trainingsvolumen (vereinfacht linear)
- HRV-Ampel: Vergleich heutiger RMSSD vs. 7-Tage-Mittel aus hrv_entries-Tabelle

---

## Tab 2 — Log

**Zweck:** Training nach der Einheit in unter 15 Sekunden erfassen.

**Oberer Bereich — HRV morgens:**
- Nur sichtbar wenn heute noch kein HRV-Wert eingetragen
- Nummernfeld (RMSSD in ms) + sofortige Ampel-Anzeige

**Training erfassen:**
1. **Trainingstyp** — 6 Pills: Laufen / Kraft / Hyrox / SkiErg / Rowing / Erholung
2. **Dauer** — +/– Buttons (5-Min-Schritte), Startpunkt 60 Min
3. **RPE** — 10 farbige Buttons (1–3 grün, 4–6 orange, 7–8 dunkelorange, 9–10 rot)
4. **Belastungspunkte-Vorschau** — automatisch berechnet (RPE × Minuten), Wochenstand aktualisiert sich live
5. **Speichern-Button** — schreibt in Supabase `sessions`-Tabelle

**Letzte Sessions** — scrollbare Liste der letzten 10 Einheiten (Datum, Typ, Dauer, RPE, Punkte)

---

## Tab 3 — Plan

**Zweck:** Trainingsplan für alle Phasen April–Dezember 2026 abrufen.

**Phasen-Selector:** Horizontale Pills (Comeback / Base / Build / Peak / Taper) — aktive Phase ist vorausgewählt

**Wochenplan-Ansicht:**
- 7 Tage als Karten, klickbar
- Jede Karte: Tag, Typ-Icon, Einheitenname, Dauer, HF-Zone
- Tap auf Karte → Modal mit vollständigen Details (Warm-Up, Workout, Core, Hinweise)

**Hyrox-Stationen-Sektion** (am Ende des Tabs):
- Alle 8 Stationen mit Zielzeit, Gewicht, Priorität
- Schwächen (Burpee, Lunges, Laufen) hervorgehoben mit rotem Badge

---

## Tab 4 — Analyse

**Zweck:** Fortschritt visuell verstehen.

**Charts (Chart.js):**

| Chart | Typ | Daten | Zeitraum |
|-------|-----|-------|----------|
| HRV-Verlauf | Linie | hrv_entries.rmssd | 7 / 30 Tage (Toggle) |
| Wochenbelastung | Balken | sessions aggregiert | Letzte 8 Wochen |
| Trainingsverteilung | Donut | sessions nach Typ | Letzte 4 Wochen |
| Pace-Entwicklung | Linie | sessions.pace_per_km (optionales Feld) | Lauf-Sessions |

**Ampel-Statistik:** Anteil Grün/Gelb/Rot-Tage der letzten 30 Tage als horizontaler Balken

**Wochenbelastungs-Phasen-Vergleich:** Aktuelle Woche vs. Phasen-Zielbereich (grüne Zone)

---

## Tab 5 — KI-Coach

**Zweck:** Echter Chat-Coach direkt in der App.

**Chat-Interface:**
- Nachrichten-Verlauf (scrollbar)
- Text-Eingabe unten + Senden-Button
- Lade-Indikator während API-Antwort

**System-Prompt (automatisch mitgegeben):**
```
Du bist ein erfahrener Hyrox-Trainer. Du coachst Steven Fredrickson.
[Vollständiges Athletenprofil aus athlete.js]
[Aktuelle Wochenbelastung aus Supabase]
[Letzter HRV-Wert + Trend]
[Aktuelle Phase + heutige Einheit]
Antworte auf Deutsch, direkt, max. 280 Wörter.
```

**Kontext-Injection:** Vor jeder Anfrage werden aktuelle Supabase-Daten (letzte 7 Sessions, HRV-Wochenmittel) dynamisch in den System-Prompt eingebaut.

**Check-in Template-Button:** Schickt vorgefertigte Wochencheck-in-Nachricht automatisch ab.

**API:** `POST https://api.anthropic.com/v1/messages` — Modell: `claude-sonnet-4-6` — direkt vom Browser (API-Key in localStorage nach Einrichtung in Settings)

---

## Tab 6 — Einstellungen

**Inhalte:**
- **Claude API-Key** — Eingabe + Test-Button (schickt Test-Nachricht)
- **Supabase** — Verbindungsstatus, Projekt-URL anzeigen
- **Athletenprofil** — Anzeige der gespeicherten Diagnostik-Werte (read-only)
- **Wissenschaftliche Studien** — Liste aller 19 Referenzen mit Links
- **Daten exportieren** — Sessions als CSV-Download
- **App-Version** — Build-Info

---

## Datenbank (Supabase)

### Tabelle: `sessions`
```sql
id            BIGSERIAL PRIMARY KEY
athlete       TEXT DEFAULT 'steven_fredrickson'
type          TEXT NOT NULL          -- 'laufen','kraft','hyrox','skierg','rowing','erholung'
duration_min  INTEGER NOT NULL
rpe           INTEGER NOT NULL CHECK (rpe BETWEEN 1 AND 10)
load_points   INTEGER GENERATED ALWAYS AS (duration_min * rpe) STORED
phase         TEXT DEFAULT 'base'
notes         TEXT DEFAULT ''
pace_per_km   TEXT DEFAULT ''        -- optional, nur für Lauf-Sessions (z.B. '5:30')
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### Tabelle: `hrv_entries`
```sql
id            BIGSERIAL PRIMARY KEY
athlete       TEXT DEFAULT 'steven_fredrickson'
rmssd         INTEGER NOT NULL       -- in ms
ampel         TEXT                   -- 'gruen','gelb','rot'
notes         TEXT DEFAULT ''
measured_at   DATE DEFAULT CURRENT_DATE
created_at    TIMESTAMPTZ DEFAULT NOW()
```

**Sicherheit:** Supabase Row Level Security deaktiviert (Single-User-App, kein Auth nötig). API-Key liegt in localStorage — ausreichend für persönliche App.

---

## PWA & Offline

- Service Worker cacht: `index.html`, alle CSS/JS-Dateien, Chart.js CDN
- Bei Offline: App funktioniert, Log-Eingabe wird in eine localStorage-Queue gespeichert (JSON-Array) und beim nächsten Online-Start automatisch zu Supabase synced
- Manifest: Theme `#0d0f14`, Accent `#e8ff47`, Display `standalone`

---

## Nicht in Scope (v1)

- Face ID / Biometrie (PWA-Limitation)
- Direkte Apple Health / HealthKit Integration (nur native möglich)
- Push Notifications (Safari PWA-Limitation auf iOS)
- Mehrere Athleten
- Strava-API-Integration
- Ernährungsplanung

---

## Erfolgskriterien

- [ ] App lädt unter 2 Sekunden (gecacht)
- [ ] Training loggen in unter 15 Sekunden möglich
- [ ] KI-Coach antwortet mit korrektem Athletenkontext
- [ ] Alle 5 Phasen des Trainingsplans vollständig abrufbar
- [ ] HRV-Ampel korrekt nach 7-Tage-Mittel berechnet
- [ ] Charts zeigen echte Supabase-Daten
- [ ] Installierbar als PWA auf iPhone (Safari → Home-Bildschirm)
