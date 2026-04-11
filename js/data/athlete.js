export const ATHLETE = {
  name: 'Steven Fredrickson',
  dob: '1984-11-15',
  height: 190,
  weight: 84.4,
  hrMax: 170,
  hrRest: 84,
  vo2max: 50.8,
  lt1: { bpm: 148, pace: 9.0, laktat: 1.30 },
  ias: { bpm: 162, pace: 12.5, laktat: 3.14 },
};

export const ZONES = [
  { id: 'ldl', name: 'LDL/Regeneration', paceMax: 8.4, hrMax: 137, color: '#4ecb71', desc: 'Vollständig aerob, Fettverbrennung' },
  { id: 'mdl', name: 'MDL Dauerlauf',    paceMin: 8.4, paceMax: 11.9, hrMin: 138, hrMax: 158, color: '#47c8ff', desc: 'Aerober Entwicklungsbereich' },
  { id: 'tdl', name: 'TDL Schwelle',     paceMin: 11.9, paceMax: 12.6, hrMin: 159, hrMax: 161, color: '#ffb347', desc: 'Schwellentraining, IAS-Verschiebung' },
  { id: 'etl', name: 'ETL Tempo',        paceMin: 12.4, paceMax: 13.4, hrMin: 161, hrMax: 165, color: '#ff8c47', desc: 'Über IAS, wettkampfspezifisch' },
  { id: 'max', name: 'MAX',              paceMin: 13.4, hrMin: 165, color: '#ff6b6b', desc: 'Wettkampfpace Hyrox' },
];

export const STATIONS = [
  { name: 'SkiErg',            dist: '1×1000m',  weight: '–',       ziel: '3:30–4:00', prio: 'mittel', schwaeche: false },
  { name: 'Sled Push',         dist: '2×25m',    weight: '102 kg',  ziel: '1:30–2:00', prio: 'mittel', schwaeche: false },
  { name: 'Sled Pull',         dist: '2×25m',    weight: '78 kg',   ziel: '2:00–2:30', prio: 'mittel', schwaeche: false },
  { name: 'Burpee Broad Jump', dist: '80m',      weight: '–',       ziel: '4:00–5:30', prio: 'hoch',   schwaeche: true  },
  { name: 'Rowing Ergometer',  dist: '1×1000m',  weight: '–',       ziel: '3:30–4:00', prio: 'niedrig',schwaeche: false },
  { name: 'Farmers Carry',     dist: '2×25m',    weight: '2×24 kg', ziel: '1:00–1:30', prio: 'niedrig',schwaeche: false },
  { name: 'Sandbag Lunges',    dist: '2×25m',    weight: '20 kg',   ziel: '3:30–4:30', prio: 'hoch',   schwaeche: true  },
  { name: 'Wall Balls',        dist: '100 Wdh',  weight: '6kg/3m',  ziel: '3:00–4:00', prio: 'mittel', schwaeche: false },
];

export const SYSTEM_PROMPT = `Du bist ein erfahrener Hyrox-Trainer und Sportwissenschaftler. Du coachst Steven Fredrickson mit folgendem Profil:

PERSÖNLICHE DATEN:
- Name: Steven Fredrickson, geb. 15.11.1984 (41 Jahre), 190 cm / 84,4 kg
- HRmax: 170 bpm | Ruhe-HF: 84 bpm | VO2max: 50,8 ml/min/kg
- LT1: 148 bpm @ 9,0 km/h | IAS: 162 bpm @ 12,5 km/h (4:47 min/km)

TRAININGSZONEN:
- LDL: unter 137 bpm | MDL: 138–158 bpm | TDL: 159–161 bpm | ETL: 161–165 bpm

HYROX-ZIEL: Sub 68 Minuten | Wettkampf: Dezember 2026
SCHWÄCHEN (Priorität 1): Burpee Broad Jump, Sandbag Lunges, Laufen (VO2max)
SCHLAF: 6–7h → konservative Progression max +5–10%/Woche
JOB: Agile Coach (Büroarbeit, moderater Stress)

WISSENSCHAFTLICHE BASIS:
- VO2max ist stärkster Hyrox-Prädiktor (Brandt et al. 2025)
- Kraft VOR Ausdauer in Concurrent Sessions (Interferenz-Modell 2025)
- HRV >10% unter Wochenmittel → nur aktive Erholung
- Session-RPE = RPE × Minuten

AKTUELLE WOCHENDATEN werden dynamisch ergänzt.

Antworte auf Deutsch, direkt, mit echten bpm-Werten, max. 280 Wörter.`;
