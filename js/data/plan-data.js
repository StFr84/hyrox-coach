export const TYPE_ICONS = {
  ausdauer: '🏃', kraft: '🏋️', hyrox: '🏆', concurrent: '⚡',
  skierg: '🎿', rowing: '🚣', erholung: '♻️', ruhe: '😴',
};

export const PHASES = [
  {
    id: 'comeback', name: 'Comeback', weeks: 'W1–2', period: 'Apr 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: null,
    weekPlan: [
      { day: 'Sa', type: 'ausdauer', name: 'Erster Lauf',         dur: 35, zone: 'LDL', hrMax: 130,  details: 'Unter 130 bpm, RPE max 5. Sehr locker, kein Druck.' },
      { day: 'So', type: 'ruhe',     name: 'Ruhe',                dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Spaziergang optional.' },
      { day: 'Mo', type: 'ruhe',     name: 'Pause',               dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Di', type: 'kraft',    name: 'Körpergewicht-Kraft',  dur: 40, zone: null,  hrMax: null, details: 'Squats 3×15, Lunges 3×12, Liegestütz 3×10. Kein Gewicht.' },
      { day: 'Mi', type: 'ruhe',     name: 'Pause',               dur: 0,  zone: null,  hrMax: null, details: 'HRV messen.' },
      { day: 'Do', type: 'ausdauer', name: 'LDL Zweiter Lauf',    dur: 40, zone: 'LDL', hrMax: 137,  details: 'Unter 137 bpm. Wenn HF steigt → Tempo rausnehmen.' },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',               dur: 0,  zone: null,  hrMax: null, details: '' },
    ],
  },
  {
    id: 'base', name: 'Base', weeks: 'W3–10', period: 'Apr–Jun 2026',
    sessionsPerWeek: 6, rpeMin: 1000, rpeMax: 1500,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'LDL Langer Dauerlauf',  dur: 60, zone: 'LDL', hrMax: 137, details: 'Strikt unter 137 bpm. Wenn Puls steigt → gehen.' },
      { day: 'Di', type: 'kraft',      name: 'Krafttraining A',       dur: 75, zone: null,  hrMax: null, details: 'Squat 4×6, Romanian Deadlift 3×8, Bulgarian Split Squat 3×10 pro Seite.' },
      { day: 'Mi', type: 'ausdauer',   name: 'SkiErg + Row MDL',      dur: 60, zone: 'MDL', hrMax: 158,  details: '30 Min SkiErg + 30 Min Rowing. HF 138–158 bpm.' },
      { day: 'Do', type: 'concurrent', name: 'Kraft + MDL Lauf',      dur: 90, zone: 'MDL', hrMax: 158,  details: 'Zuerst 45 Min Kraft (Bench Press, Pull-Ups, Core), dann 45 Min Lauf 138–158 bpm.' },
      { day: 'Fr', type: 'hyrox',      name: 'Stationstraining',      dur: 75, zone: null,  hrMax: null, details: 'Burpees 5×10 ⚡ | Sandbag Lunges 4×20m ⚡ | SkiErg 4×500m. Schwächen immer trainieren!' },
      { day: 'Sa', type: 'ausdauer',   name: 'Langer LDL',            dur: 90, zone: 'LDL', hrMax: 137,  details: 'Strikt unter 137 bpm. Dauer wichtiger als Tempo.' },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',       dur: 40, zone: null,  hrMax: 137,  details: 'Lockerer Spaziergang oder Mobilität. HRV messen. Wochenauswertung.' },
    ],
  },
  {
    id: 'build', name: 'Build', weeks: 'W11–22', period: 'Jun–Sep 2026',
    sessionsPerWeek: 6, rpeMin: 1500, rpeMax: 2200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'TDL Schwellen-Intervalle', dur: 70, zone: 'TDL', hrMax: 161, details: '6×1 km bei 159–161 bpm, je 3 Min Pause. Ziel: IAS verschieben.' },
      { day: 'Di', type: 'kraft',      name: 'Maximalkraft',             dur: 75, zone: null,  hrMax: null, details: 'Deadlift 5×3 @ 85% 1RM, Lunges 4×12, Klimmzüge 4×6.' },
      { day: 'Mi', type: 'ausdauer',   name: 'MDL + SkiErg',            dur: 75, zone: 'MDL', hrMax: 158,  details: '45 Min MDL 138–158 bpm + SkiErg 6×500m mit 1 Min Pause.' },
      { day: 'Do', type: 'hyrox',      name: 'Rennsimulation Segmente', dur: 90, zone: null,  hrMax: null, details: '2×[1km Wettkampftempo + Burpees] | 2×[1km + Sandbag Lunges]. Zeiten stoppen!' },
      { day: 'Fr', type: 'kraft',      name: 'Krafttraining C',         dur: 75, zone: null,  hrMax: null, details: 'Squat 5×5, Farmer Carry schwer (2×32 kg), Box Jumps 4×8.' },
      { day: 'Sa', type: 'hyrox',      name: 'Halbe Rennsimulation',    dur: 90, zone: null,  hrMax: null, details: '4×1km + 4 Stationen (abwechselnd). Wettkampftempo. Zeiten messen.' },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',         dur: 30, zone: null,  hrMax: 137,  details: 'HRV + Wochenauswertung. Foam Roller 10 Min.' },
    ],
  },
  {
    id: 'peak', name: 'Peak', weeks: 'W23–32', period: 'Sep–Nov 2026',
    sessionsPerWeek: 6, rpeMin: 2000, rpeMax: 2800,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'ETL Wettkampfpace',      dur: 60, zone: 'ETL', hrMax: 165, details: '8×1 km bei 161–165 bpm. Wettkampfgeschwindigkeit halten.' },
      { day: 'Di', type: 'kraft',    name: 'Kraft-Power',             dur: 60, zone: null,  hrMax: null, details: 'Power Clean 5×3, Jump Squat 4×5, Box Jumps 4×8. Explosivität!' },
      { day: 'Mi', type: 'erholung', name: 'Aktive Erholung',        dur: 40, zone: 'LDL', hrMax: 137,  details: 'Locker. Kein Druck. Morgen schwer.' },
      { day: 'Do', type: 'hyrox',    name: 'Vollrennsimulation',     dur: 90, zone: null,  hrMax: null, details: 'Alle 8 Stationen + 8×1km. Zeitmessung von Anfang bis Ende. Protokollieren!' },
      { day: 'Fr', type: 'kraft',    name: 'Technik unter Ermüdung', dur: 45, zone: null,  hrMax: null, details: 'Burpee Broad Jump Technik 3×20m | Sandbag Lunges Technik 3×25m. Unter Ermüdung!' },
      { day: 'Sa', type: 'ausdauer', name: 'MDL Regeneration',       dur: 50, zone: 'MDL', hrMax: 158,  details: '138–158 bpm. Aktive Erholung nach Do-Simulation.' },
      { day: 'So', type: 'ruhe',     name: 'Komplett Pause',         dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Analyse der Woche. Mental vorbereiten.' },
    ],
  },
  {
    id: 'taper', name: 'Taper', weeks: 'W33–38', period: 'Nov–Dez 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: 1200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'Kurzer LDL',         dur: 40, zone: 'LDL', hrMax: 137,  details: 'Sehr locker, unter 137 bpm.' },
      { day: 'Di', type: 'kraft',    name: 'Kraft frisch halten', dur: 45, zone: null,  hrMax: null, details: '3×3 @ 75% 1RM. Ziel: frisch bleiben, nicht ermüden.' },
      { day: 'Mi', type: 'erholung', name: 'Erholung',           dur: 30, zone: null,  hrMax: null, details: 'Mobilität, Foam Roller, dehnen.' },
      { day: 'Do', type: 'hyrox',    name: 'Aktivierung',        dur: 45, zone: null,  hrMax: null, details: '2×1km Wettkampftempo + 2 Stationen. Frisch und scharf!' },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Sa', type: 'ausdauer', name: 'Aktivierungslauf',   dur: 30, zone: 'MDL', hrMax: 158,  details: '138–158 bpm + 4×80m Strides locker. Beine fühlen lassen.' },
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
