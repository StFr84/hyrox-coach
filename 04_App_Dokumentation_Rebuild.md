# APP DOKUMENTATION & REBUILD GUIDE
## Projekt: Sub 68 · Steven Fredrickson

---

## WAS DIE APP KANN

### Tabs / Funktionen
1. **Dashboard** – Überblick, Diagnostik-Werte, Periodisierungsplan, Schwachstellen, Schlaf
2. **Trainingsplan** – 6 Phasen wählbar, klickbare Wochenpläne mit Einheiten-Details
3. **Stationen** – Alle 8 Hyrox-Stationen, Zielzeiten, Trainingstipps
4. **Monitoring** – RPE-Tracker, HRV-Ampel, Session-Belastungsberechnung
5. **KI-Coach** – Chat-Interface (verlinkt zu Claude.ai)
6. **Wissenschaft** – Alle 12 Studien mit Links

### Erinnerungssystem (Pop-ups)
- **Morgens (5–11 Uhr):** HRV-Messen-Erinnerung mit 3-Schritte-Anleitung
- **Sonntags:** Wöchentlicher Check-in Erinnerung mit Strava-Screenshot-Anleitung
- Merkt sich über localStorage ob heute/diese Woche bereits gesehen

### Datenspeicherung
- Sessions werden in **localStorage** gespeichert (offline, im Browser)
- Letzte 50 Sessions bleiben erhalten
- Wochenbelastung wird aus letzten 7 Tagen berechnet

---

## TECHNISCHER STACK

| Komponente | Technologie |
|------------|-------------|
| Frontend | HTML, CSS, Vanilla JS |
| Fonts | Google Fonts: Barlow Condensed + Barlow |
| Hosting | GitHub Pages (kostenlos) |
| PWA | Service Worker + Manifest |
| Datenspeicherung | localStorage (offline) |
| KI-Coach | Link zu Claude.ai (kein API-Key nötig) |

---

## GITHUB REPOSITORY

**URL:** https://github.com/StFr84/hyrox-coach
**GitHub Pages URL:** https://StFr84.github.io/hyrox-coach

### Dateien im Repository
```
hyrox-coach/
├── index.html       ← Hauptapp (alles in einer Datei)
├── manifest.json    ← PWA-Konfiguration
├── sw.js            ← Service Worker (Offline-Funktion)
├── icon-192.png     ← App-Icon klein
└── icon-512.png     ← App-Icon groß
```

---

## PWA INSTALLATION

### iPhone (Safari)
1. https://StFr84.github.io/hyrox-coach in Safari öffnen
2. Teilen-Button (Quadrat mit Pfeil)
3. "Zum Home-Bildschirm"
4. Fertig – App-Icon auf Homescreen

### Android (Chrome)
1. URL in Chrome öffnen
2. Menü (3 Punkte) → "App installieren"
3. Fertig

---

## FARBSCHEMA (CSS Variables)

```css
--bg: #0d0f14          /* Haupthintergrund */
--bg2: #161920         /* Karten-Hintergrund */
--bg3: #1e2230         /* Eingebettete Elemente */
--accent: #e8ff47      /* Gelb-Grün (Hauptakzent) */
--accent2: #47c8ff     /* Hellblau (Sekundär) */
--text: #f0f2f8        /* Haupttext */
--muted: #7a8099       /* Gedämpfter Text */
--danger: #ff6b6b      /* Rot (Schwächen, Warnung) */
--success: #4ecb71     /* Grün (Stärken, OK) */
--warn: #ffb347        /* Orange (Mittel, Achtung) */
```

---

## MANIFEST.JSON

```json
{
  "name": "HYROX Coach – Steven Fredrickson",
  "short_name": "HYROX Coach",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0d0f14",
  "theme_color": "#e8ff47",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

---

## SUPABASE (optional, für persistente Sessions)

**Projekt:** zeiterfassung-mvp (bestehendes Projekt)
**Projekt-ID:** dxikdpatrtsnbkeijtiy
**URL:** https://dxikdpatrtsnbkeijtiy.supabase.co

### Sessions-Tabelle (bereits angelegt)
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id          BIGSERIAL PRIMARY KEY,
  athlete     TEXT NOT NULL DEFAULT 'steven_fredrickson',
  type        TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  rpe         INTEGER NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  load_points INTEGER GENERATED ALWAYS AS (duration_min * rpe) STORED,
  phase       TEXT DEFAULT 'base',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Status:** Tabelle ist angelegt. Für Nutzung braucht es Vercel-Functions als Proxy (CORS).

---

## WÖCHENTLICHER WORKFLOW

### Täglich morgens (2 Min)
1. Apple Watch: HRV messen (Atemübung-App, 1 Min)
2. RMSSD-Wert in App eingeben → Ampel zeigt Trainingsintensität

### Nach jedem Training (1 Min)
1. App öffnen → Monitoring
2. Trainingsart wählen, Dauer einstellen, RPE anklicken
3. "Einheit speichern" → Wochenbelastung aktualisiert sich

### Sonntags (10 Min) – Check-in mit Claude.ai
1. Strava: Wochenzusammenfassung Screenshot
2. Apple Health: HRV-Wochenverlauf Screenshot
3. Beides in Claude.ai schicken mit: *"Hier mein Wochen-Check-in"*
4. Antwort: Analyse + Plan für nächste Woche

---

## REBUILD ANLEITUNG (Kurzfassung)

Um die App neu zu bauen brauchst du:

1. **Datei 01** (dieses Repo): Athletenprofil + Master Prompt
2. **Datei 02**: Alle 12 wissenschaftlichen Studien
3. **Datei 03**: Trainingspläne + Zonen
4. **Diese Datei 04**: Technische Dokumentation

Der KI-Coach (Claude) bekommt den Master Prompt aus Datei 01 als System-Prompt.
Alle Trainingsdaten aus Datei 03 fließen in die Planungs-Logik.
Alle Studien aus Datei 02 bilden die Wissensbasis.

---

## NÄCHSTE SCHRITTE (offen)

- [ ] Supabase Key rotieren (nach versehentlichem Chat-Leak)
- [ ] Vercel-Setup wenn persistente Sessions gewünscht
- [ ] App auf iPhone als PWA installieren
- [ ] Ersten Check-in nach Trainingsstart (Sa. 29.03.2026)
- [ ] Neue Leistungsdiagnostik nach Base-Phase (ca. Juli 2026)
