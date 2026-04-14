export const TYPE_ICONS = {
  ausdauer: '🏃', kraft: '🏋️', hyrox: '🏆', concurrent: '⚡',
  skierg: '🎿', rowing: '🚣', erholung: '♻️', ruhe: '😴',
};

export const PHASES = [
  {
    id: 'comeback', name: 'Comeback', weeks: 'W1–2', period: 'Apr 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: null,
    weekPlan: [
      { day: 'Sa', type: 'ausdauer', name: 'Erster Lauf',        dur: 35, zone: 'LDL', hrMax: 130,  details: 'Unter 130 bpm, RPE max 5. Sehr locker, kein Druck.',
        exercises: [{ name: 'Dauerlauf', sets: 1, reps: 1, distance: '35 Min', unit: 'pace' }] },
      { day: 'So', type: 'ruhe',     name: 'Ruhe',               dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Spaziergang optional.' },
      { day: 'Mo', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Di', type: 'kraft',    name: 'Körpergewicht-Kraft', dur: 40, zone: null,  hrMax: null, details: 'Squats 3×15, Lunges 3×12, Liegestütz 3×10. Kein Gewicht.',
        exercises: [
          { name: 'Squats',    sets: 3, reps: 15, unit: 'reps' },
          { name: 'Lunges',    sets: 3, reps: 12, unit: 'reps' },
          { name: 'Liegestütz', sets: 3, reps: 10, unit: 'reps' },
        ] },
      { day: 'Mi', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: 'HRV messen.' },
      { day: 'Do', type: 'ausdauer', name: 'LDL Zweiter Lauf',   dur: 40, zone: 'LDL', hrMax: 137,  details: 'Unter 137 bpm. Wenn HF steigt → Tempo rausnehmen.',
        exercises: [{ name: 'Dauerlauf', sets: 1, reps: 1, distance: '40 Min', unit: 'pace' }] },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
    ],
  },
  {
    id: 'base', name: 'Base', weeks: 'W3–10', period: 'Apr–Jun 2026',
    sessionsPerWeek: 6, rpeMin: 1000, rpeMax: 1500,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'LDL Langer Dauerlauf',  dur: 60, zone: 'LDL', hrMax: 137, details: 'Strikt unter 137 bpm. Wenn Puls steigt → gehen.',
        exercises: [{ name: 'Langer Dauerlauf', sets: 1, reps: 1, distance: '60 Min', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',      name: 'Krafttraining A',       dur: 75, zone: null,  hrMax: null, details: 'Squat 4×6, Romanian Deadlift 3×8, Bulgarian Split Squat 3×10 pro Seite.',
        exercises: [
          { name: 'Squat',                 sets: 4, reps: 6,  unit: 'kg' },
          { name: 'Romanian Deadlift',     sets: 3, reps: 8,  unit: 'kg' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 10, unit: 'kg' },
        ] },
      { day: 'Mi', type: 'ausdauer',   name: 'SkiErg + Row MDL',      dur: 60, zone: 'MDL', hrMax: 158,  details: '30 Min SkiErg + 30 Min Rowing. HF 138–158 bpm.',
        exercises: [
          { name: 'SkiErg',  sets: 1, reps: 1, distance: '30 Min', unit: 'min:sec' },
          { name: 'Rowing',  sets: 1, reps: 1, distance: '30 Min', unit: 'min:sec' },
        ] },
      { day: 'Do', type: 'concurrent', name: 'Kraft + MDL Lauf',      dur: 90, zone: 'MDL', hrMax: 158,  details: 'Zuerst 45 Min Kraft (Bench Press, Pull-Ups, Core), dann 45 Min Lauf 138–158 bpm.',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 10, unit: 'kg' },
          { name: 'Pull-Ups',    sets: 3, reps: 8,  unit: 'reps' },
          { name: 'Core',        sets: 3, reps: 1,  distance: '1 Min', unit: 'reps' },
          { name: 'MDL Lauf',    sets: 1, reps: 1,  distance: '45 Min', unit: 'pace' },
        ] },
      { day: 'Fr', type: 'hyrox',      name: 'Stationstraining',      dur: 75, zone: null,  hrMax: null, details: 'Burpees 5×10 ⚡ | Sandbag Lunges 4×20m ⚡ | SkiErg 4×500m. Schwächen immer trainieren!',
        exercises: [
          { name: 'Burpees',        sets: 5, reps: 10, unit: 'reps' },
          { name: 'Sandbag Lunges', sets: 4, reps: 1,  distance: '20m', unit: 'reps' },
          { name: 'SkiErg',         sets: 4, reps: 1,  distance: '500m', unit: 'min:sec' },
        ] },
      { day: 'Sa', type: 'ausdauer',   name: 'Langer LDL',            dur: 90, zone: 'LDL', hrMax: 137,  details: 'Strikt unter 137 bpm. Dauer wichtiger als Tempo.',
        exercises: [{ name: 'Langer LDL', sets: 1, reps: 1, distance: '90 Min', unit: 'pace' }] },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',       dur: 40, zone: null,  hrMax: 137,  details: 'Lockerer Spaziergang oder Mobilität. HRV messen. Wochenauswertung.' },
    ],
  },
  {
    id: 'build', name: 'Build', weeks: 'W11–22', period: 'Jun–Sep 2026',
    sessionsPerWeek: 6, rpeMin: 1500, rpeMax: 2200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer',   name: 'TDL Schwellen-Intervalle', dur: 70, zone: 'TDL', hrMax: 161, details: '6×1 km bei 159–161 bpm, je 3 Min Pause. Ziel: IAS verschieben.',
        exercises: [{ name: 'Schwellen-Intervall', sets: 6, reps: 1, distance: '1 km', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',      name: 'Maximalkraft',             dur: 75, zone: null,  hrMax: null, details: 'Deadlift 5×3 @ 85% 1RM, Lunges 4×12, Klimmzüge 4×6.',
        exercises: [
          { name: 'Deadlift',   sets: 5, reps: 3,  unit: 'kg' },
          { name: 'Lunges',     sets: 4, reps: 12, unit: 'kg' },
          { name: 'Klimmzüge',  sets: 4, reps: 6,  unit: 'reps' },
        ] },
      { day: 'Mi', type: 'ausdauer',   name: 'MDL + SkiErg',            dur: 75, zone: 'MDL', hrMax: 158,  details: '45 Min MDL 138–158 bpm + SkiErg 6×500m mit 1 Min Pause.',
        exercises: [
          { name: 'MDL Lauf', sets: 1, reps: 1, distance: '45 Min', unit: 'pace' },
          { name: 'SkiErg',   sets: 6, reps: 1, distance: '500m', unit: 'min:sec' },
        ] },
      { day: 'Do', type: 'hyrox',      name: 'Rennsimulation Segmente', dur: 90, zone: null,  hrMax: null, details: '2×[1km Wettkampftempo + Burpees] | 2×[1km + Sandbag Lunges]. Zeiten stoppen!',
        exercises: [
          { name: '1km Wettkampftempo', sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Burpees',            sets: 2, reps: 20, unit: 'reps' },
          { name: '1km + Sandbag',      sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
        ] },
      { day: 'Fr', type: 'kraft',      name: 'Krafttraining C',         dur: 75, zone: null,  hrMax: null, details: 'Squat 5×5, Farmer Carry schwer (2×32 kg), Box Jumps 4×8.',
        exercises: [
          { name: 'Squat',        sets: 5, reps: 5, unit: 'kg' },
          { name: 'Farmer Carry', sets: 3, reps: 1, distance: '40m', unit: 'kg' },
          { name: 'Box Jumps',    sets: 4, reps: 8, unit: 'reps' },
        ] },
      { day: 'Sa', type: 'hyrox',      name: 'Halbe Rennsimulation',    dur: 90, zone: null,  hrMax: null, details: '4×1km + 4 Stationen (abwechselnd). Wettkampftempo. Zeiten messen.',
        exercises: [
          { name: '1km Lauf',    sets: 4, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Stationen',   sets: 4, reps: 1, distance: '1 Station', unit: 'min:sec' },
        ] },
      { day: 'So', type: 'erholung',   name: 'Aktive Erholung',         dur: 30, zone: null,  hrMax: 137,  details: 'HRV + Wochenauswertung. Foam Roller 10 Min.' },
    ],
  },
  {
    id: 'peak', name: 'Peak', weeks: 'W23–32', period: 'Sep–Nov 2026',
    sessionsPerWeek: 6, rpeMin: 2000, rpeMax: 2800,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'ETL Wettkampfpace',      dur: 60, zone: 'ETL', hrMax: 165, details: '8×1 km bei 161–165 bpm. Wettkampfgeschwindigkeit halten.',
        exercises: [{ name: 'Wettkampf-Intervall', sets: 8, reps: 1, distance: '1 km', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',    name: 'Kraft-Power',             dur: 60, zone: null,  hrMax: null, details: 'Power Clean 5×3, Jump Squat 4×5, Box Jumps 4×8. Explosivität!',
        exercises: [
          { name: 'Power Clean', sets: 5, reps: 3, unit: 'kg' },
          { name: 'Jump Squat',  sets: 4, reps: 5, unit: 'kg' },
          { name: 'Box Jumps',   sets: 4, reps: 8, unit: 'reps' },
        ] },
      { day: 'Mi', type: 'erholung', name: 'Aktive Erholung',        dur: 40, zone: 'LDL', hrMax: 137,  details: 'Locker. Kein Druck. Morgen schwer.' },
      { day: 'Do', type: 'hyrox',    name: 'Vollrennsimulation',     dur: 90, zone: null,  hrMax: null, details: 'Alle 8 Stationen + 8×1km. Zeitmessung von Anfang bis Ende. Protokollieren!',
        exercises: [
          { name: 'Volle Rennsimulation', sets: 1, reps: 1, distance: '8×1km + 8 Stationen', unit: 'min:sec' },
        ] },
      { day: 'Fr', type: 'kraft',    name: 'Technik unter Ermüdung', dur: 45, zone: null,  hrMax: null, details: 'Burpee Broad Jump Technik 3×20m | Sandbag Lunges Technik 3×25m. Unter Ermüdung!',
        exercises: [
          { name: 'Burpee Broad Jump',      sets: 3, reps: 1, distance: '20m', unit: 'reps' },
          { name: 'Sandbag Lunges Technik', sets: 3, reps: 1, distance: '25m', unit: 'reps' },
        ] },
      { day: 'Sa', type: 'ausdauer', name: 'MDL Regeneration',       dur: 50, zone: 'MDL', hrMax: 158,  details: '138–158 bpm. Aktive Erholung nach Do-Simulation.',
        exercises: [{ name: 'MDL Lauf', sets: 1, reps: 1, distance: '50 Min', unit: 'pace' }] },
      { day: 'So', type: 'ruhe',     name: 'Komplett Pause',         dur: 0,  zone: null,  hrMax: null, details: 'HRV messen. Analyse der Woche. Mental vorbereiten.' },
    ],
  },
  {
    id: 'taper', name: 'Taper', weeks: 'W33–38', period: 'Nov–Dez 2026',
    sessionsPerWeek: 4, rpeMin: null, rpeMax: 1200,
    weekPlan: [
      { day: 'Mo', type: 'ausdauer', name: 'Kurzer LDL',         dur: 40, zone: 'LDL', hrMax: 137,  details: 'Sehr locker, unter 137 bpm.',
        exercises: [{ name: 'Kurzer LDL', sets: 1, reps: 1, distance: '40 Min', unit: 'pace' }] },
      { day: 'Di', type: 'kraft',    name: 'Kraft frisch halten', dur: 45, zone: null,  hrMax: null, details: '3×3 @ 75% 1RM. Ziel: frisch bleiben, nicht ermüden.',
        exercises: [
          { name: 'Squat',    sets: 3, reps: 3, unit: 'kg' },
          { name: 'Deadlift', sets: 3, reps: 3, unit: 'kg' },
        ] },
      { day: 'Mi', type: 'erholung', name: 'Erholung',           dur: 30, zone: null,  hrMax: null, details: 'Mobilität, Foam Roller, dehnen.' },
      { day: 'Do', type: 'hyrox',    name: 'Aktivierung',        dur: 45, zone: null,  hrMax: null, details: '2×1km Wettkampftempo + 2 Stationen. Frisch und scharf!',
        exercises: [
          { name: '1km Wettkampftempo', sets: 2, reps: 1, distance: '1 km', unit: 'pace' },
          { name: 'Stationen',          sets: 2, reps: 1, distance: '1 Station', unit: 'min:sec' },
        ] },
      { day: 'Fr', type: 'ruhe',     name: 'Pause',              dur: 0,  zone: null,  hrMax: null, details: '' },
      { day: 'Sa', type: 'ausdauer', name: 'Aktivierungslauf',   dur: 30, zone: 'MDL', hrMax: 158,  details: '138–158 bpm + 4×80m Strides locker. Beine fühlen lassen.',
        exercises: [
          { name: 'Aktivierungslauf', sets: 1, reps: 1, distance: '30 Min', unit: 'pace' },
          { name: 'Strides',          sets: 4, reps: 1, distance: '80m', unit: 'reps' },
        ] },
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
