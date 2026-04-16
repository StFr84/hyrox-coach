import { saveSession, saveHRV, getTodayHRV, getRecentSessions, getAmpelFromRMSSD, getHRVEntries, ampelLabel,
         saveWorkoutLog, saveWorkoutWip, getWorkoutWip, clearWorkoutWip, getLastWorkoutLog } from '../db.js';
import { queueSession } from '../sync.js';
import { getCurrentPhase, TYPE_ICONS } from '../data/plan-data.js';

const el = () => document.getElementById('tab-log');

let state = { type: 'laufen', duration: 60, rpe: null, todayHRV: null, pace: '', notes: '', avgHR: '', date: new Date().toISOString().split('T')[0] };
let _sessions = [], _weekMean = null;
let workoutState = null; // { session_type, date, exercises: [{name, unit, distance, planned_sets, planned_reps, lastValue, sets:[{set_number,value,completed}]}] }

function buildWorkoutState(type, lastLog, existingWip) {
  const phase = getCurrentPhase();
  const planType = { laufen: 'ausdauer', skierg: 'skierg', rowing: 'rowing' }[type] || type;
  const planDay = phase.weekPlan.find(d => d.type === planType && d.exercises?.length);
  if (!planDay) return null;

  const today = new Date().toISOString().split('T')[0];
  if (existingWip && existingWip.session_type === type && existingWip.date === today) {
    return existingWip;
  }

  return {
    session_type: type,
    date: today,
    exercises: planDay.exercises.map(ex => {
      const lastEx = lastLog?.exercises?.find(e => e.name === ex.name);
      const lastCompletedSet = lastEx?.sets?.filter(s => s.completed).slice(-1)[0];
      return {
        name: ex.name,
        unit: ex.unit,
        distance: ex.distance || null,
        planned_sets: ex.sets,
        planned_reps: ex.reps,
        lastValue: lastCompletedSet?.value ?? null,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          set_number: i + 1,
          value: null,
          completed: false,
        })),
      };
    }),
  };
}

function renderSetChips(exercise, exIdx) {
  return exercise.sets.map((set, sIdx) => {
    const isActive = !set.completed && exercise.sets.slice(0, sIdx).every(s => s.completed);
    const isDone = set.completed;
    const chipClass = isDone ? 'done' : isActive ? 'active' : '';
    const inputType = exercise.unit === 'pace' || exercise.unit === 'min:sec' ? 'text' : 'number';
    const inputMode = exercise.unit === 'reps' ? 'numeric' : 'decimal';
    const valueDisplay = isDone
      ? `<div class="set-chip-value">${set.value !== null ? set.value + (exercise.unit !== 'reps' ? ' ' + exercise.unit : '') : '✓'}</div>`
      : isActive
        ? `<input class="set-value-input" data-ex="${exIdx}" data-set="${sIdx}" type="${inputType}" inputmode="${inputMode}" placeholder="${exercise.unit === 'reps' ? '—' : exercise.unit}" step="0.5">`
        : `<div class="set-chip-value" style="color:var(--bg3)">—</div>`;
    const repsLabel = exercise.distance ? exercise.distance : `× ${exercise.planned_reps}`;

    return `
      <div class="set-chip ${chipClass}" data-ex="${exIdx}" data-set="${sIdx}">
        <div class="set-chip-label">S${set.set_number}</div>
        ${valueDisplay}
        <div class="set-chip-reps">${repsLabel}</div>
        <div class="set-chip-check">${isDone ? '✓' : '○'}</div>
      </div>`;
  }).join('');
}

function renderExerciseBlock() {
  if (!workoutState) return '';

  const exercises = workoutState.exercises.map((ex, exIdx) => {
    const completedCount = ex.sets.filter(s => s.completed).length;
    const isCollapsed = completedCount === ex.sets.length;
    const completedValues = ex.sets.filter(s => s.completed && s.value !== null).map(s => parseFloat(s.value)).filter(v => !isNaN(v));
    const avgVal = completedValues.length
      ? (completedValues.reduce((a, b) => a + b, 0) / completedValues.length).toFixed(1).replace('.0', '')
      : null;

    if (isCollapsed) {
      const summary = avgVal ? `Ø ${avgVal} ${ex.unit} · ${completedCount}/${ex.sets.length} Sätze` : `${completedCount}/${ex.sets.length} Sätze ✓`;
      return `
        <div class="exercise-card collapsed" data-ex="${exIdx}">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-summary">${summary}</span>
        </div>`;
    }

    const prevHint = ex.lastValue !== null
      ? `<div class="exercise-prev">Letztes Mal: ${ex.lastValue} ${ex.unit}</div>`
      : '';
    const planLabel = ex.distance ? `${ex.planned_sets} × ${ex.distance}` : `${ex.planned_sets} Sätze × ${ex.planned_reps} Wdh`;

    return `
      <div class="exercise-card" data-ex="${exIdx}">
        <div class="exercise-header">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-plan">${planLabel}</span>
        </div>
        ${prevHint}
        <div class="set-chips">${renderSetChips(ex, exIdx)}</div>
      </div>`;
  }).join('');

  return `
    <div class="section-label">Übungen</div>
    <div class="exercise-block">${exercises}</div>`;
}

export async function init() {
  const [todayHRV, sessions, hrvEntries] = await Promise.all([
    getTodayHRV(), getRecentSessions(10), getHRVEntries(7),
  ]);
  state.todayHRV = todayHRV;
  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;

  const wip = getWorkoutWip();
  const today = new Date().toISOString().split('T')[0];
  if (wip && wip.date === today && wip.session_type !== state.type) {
    state.type = wip.session_type;
  }
  const lastLog = getLastWorkoutLog(state.type);
  workoutState = buildWorkoutState(state.type, lastLog, wip);

  render(sessions, weekMean);
}

export async function refresh() { await init(); }

function render(sessions, weekMean) {
  _sessions = sessions ?? _sessions;
  _weekMean = weekMean ?? _weekMean;
  const phase = getCurrentPhase();
  const planTypeForHR = { laufen: 'ausdauer', skierg: 'skierg', rowing: 'rowing' }[state.type] || state.type;
  const hrMax = phase.weekPlan.find(d => d.type === planTypeForHR && d.hrMax)?.hrMax ?? null;
  const types = [
    { id: 'laufen',   label: 'Laufen',  icon: '🏃' },
    { id: 'kraft',    label: 'Kraft',   icon: '🏋️' },
    { id: 'hyrox',    label: 'Hyrox',   icon: '🏆' },
    { id: 'skierg',   label: 'SkiErg',  icon: '🎿' },
    { id: 'rowing',   label: 'Rowing',  icon: '🚣' },
    { id: 'erholung', label: 'Erhol.',  icon: '♻️' },
  ];

  el().innerHTML = `
    <div class="screen-title">⚡ Training erfassen</div>

    ${state.date !== new Date().toISOString().split('T')[0] ? `
    <div class="past-session-banner">⏮ Vergangene Einheit: ${new Date(state.date + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
    ` : ''}
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px">
      <input type="date" id="session-date" class="settings-input"
        value="${state.date}"
        max="${new Date().toISOString().split('T')[0]}"
        style="width:auto;padding:6px 10px;font-size:0.82em;color:var(--muted)">
    </div>

    ${!state.todayHRV ? `
    <div class="section-label">HRV heute morgen (RMSSD in ms)</div>
    <div class="hrv-input-row">
      <span style="font-size:1.4em">💚</span>
      <input class="hrv-number" id="hrv-input" type="number" min="10" max="200" placeholder="z.B. 72">
      <span style="color:var(--muted);font-size:0.8em">ms</span>
      <span id="hrv-ampel-badge" class="hrv-ampel-badge" style="display:none"></span>
    </div>
    <button class="btn-secondary mt-8" id="btn-save-hrv" style="width:100%">HRV speichern</button>
    ` : `
    <div class="ampel-banner ${state.todayHRV.ampel}" style="margin-bottom:10px">
      <div class="ampel-dot"></div>
      HRV heute: ${state.todayHRV.rmssd} ms · ${ampelLabel(state.todayHRV.ampel)}
    </div>
    `}

    <div class="section-label">Trainingstyp</div>
    <div class="type-grid">
      ${types.map(t => `
        <div class="type-pill ${state.type === t.id ? 'active' : ''}" data-type="${t.id}">
          <span class="type-icon">${t.icon}</span>${t.label}
        </div>
      `).join('')}
    </div>

    ${renderExerciseBlock()}

    ${state.type === 'laufen' && !workoutState ? `
    <div class="section-label">Pace (min/km) — optional</div>
    <div class="pace-input-row">
      <input class="settings-input pace-input" id="pace-input" type="text"
        inputmode="decimal" placeholder="5:30" value="${state.pace}"
        style="font-family:'Barlow Condensed',sans-serif;font-size:1.4em;font-weight:700;color:var(--accent2)">
      <span style="color:var(--muted);font-size:0.82em;white-space:nowrap">min/km</span>
    </div>
    ` : ''}

    ${state.type === 'laufen' ? `
    <div class="section-label">Ø Herzfrequenz — optional</div>
    <div class="pace-input-row">
      <input class="settings-input pace-input" id="avg-hr-input" type="number"
        inputmode="numeric" placeholder="z.B. 132" value="${state.avgHR}"
        style="font-family:'Barlow Condensed',sans-serif;font-size:1.4em;font-weight:700;color:var(--accent2)">
      <span style="color:var(--muted);font-size:0.82em;white-space:nowrap">bpm${hrMax ? ` · Ziel &lt;${hrMax}` : ''}</span>
    </div>
    ` : ''}

    <div class="section-label">Dauer</div>
    <div class="duration-row">
      <button class="dur-btn" id="dur-minus">−</button>
      <div class="dur-value" id="dur-display">${state.duration} <span class="dur-unit">Min</span></div>
      <button class="dur-btn" id="dur-plus">+</button>
    </div>

    <div class="section-label">Anstrengung (RPE 1–10)</div>
    <div class="rpe-grid">
      ${[1,2,3,4,5,6,7,8,9,10].map(r => `
        <button class="rpe-btn ${state.rpe === r ? 'active' : ''}" data-rpe="${r}">${r}</button>
      `).join('')}
    </div>

    <div class="section-label">Belastung</div>
    <div class="result-box">
      <div>
        <div style="font-size:0.78em;color:var(--muted)">Session-RPE (${state.duration} Min × RPE ${state.rpe || '?'})</div>
        <div style="font-size:0.78em;color:var(--accent2);margin-top:2px">Phase-Ziel: ${phase.rpeMin || 0}–${phase.rpeMax || 1500} Pkt/Woche</div>
      </div>
      <div class="result-points" id="load-preview">${state.rpe ? state.duration * state.rpe : '–'}</div>
    </div>

    <div class="section-label">Notizen — optional</div>
    <textarea class="settings-input" id="notes-input" rows="3"
      placeholder="Wie war die Einheit? Besonderheiten, Befinden…"
      style="resize:none;line-height:1.5">${state.notes}</textarea>

    <button class="btn-primary" id="btn-save-session">💾 Einheit speichern</button>

    <div class="section-label" style="margin-top:24px">Letzte Einheiten</div>
    <div class="card" style="padding:0 14px">
      ${_sessions.length === 0
        ? '<div class="empty-state"><div class="empty-icon">📭</div>Noch keine Einheiten</div>'
        : _sessions.map(s => `
          <div class="session-item">
            <div>
              <div class="session-type">${TYPE_ICONS[s.type] || ''} ${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</div>
              <div class="session-meta">${new Date(s.created_at).toLocaleDateString('de-DE', {day:'numeric',month:'short'})} · ${s.duration_min} Min · RPE ${s.rpe}${s.notes ? ' · ' + s.notes : ''}</div>
            </div>
            <div class="session-points">${s.load_points}</div>
          </div>
        `).join('')}
    </div>
  `;

  attachListeners(phase, weekMean);
}

function attachListeners(phase, weekMean) {
  const hrvInput = document.getElementById('hrv-input');
  if (hrvInput) {
    hrvInput.addEventListener('input', () => {
      const v = parseInt(hrvInput.value);
      const badge = document.getElementById('hrv-ampel-badge');
      if (v > 10) {
        const a = getAmpelFromRMSSD(v, weekMean);
        badge.className = `hrv-ampel-badge ampel-banner ${a}`;
        badge.style.display = '';
        badge.textContent = a === 'gruen' ? '● GRÜN' : a === 'gelb' ? '● GELB' : '● ROT';
      }
    });
    document.getElementById('btn-save-hrv')?.addEventListener('click', async () => {
      const v = parseInt(hrvInput.value);
      if (!v || v < 10 || v > 200) { alert('Bitte einen gültigen HRV-Wert eingeben (10–200 ms)'); return; }
      try { await saveHRV(v); } catch { /* retry not needed for HRV */ }
      state.todayHRV = await getTodayHRV();
      await refresh();
    });
  }

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.type = pill.dataset.type;
      if (state.type !== 'laufen') state.pace = '';
      const lastLog = getLastWorkoutLog(state.type);
      const wip = getWorkoutWip();
      workoutState = buildWorkoutState(state.type, lastLog, wip);
      render(_sessions, _weekMean);
    });
  });

  document.getElementById('dur-minus')?.addEventListener('click', () => {
    state.duration = Math.max(5, state.duration - 5);
    document.getElementById('dur-display').innerHTML = `${state.duration} <span class="dur-unit">Min</span>`;
    updateLoadPreview();
  });
  document.getElementById('dur-plus')?.addEventListener('click', () => {
    state.duration = Math.min(180, state.duration + 5);
    document.getElementById('dur-display').innerHTML = `${state.duration} <span class="dur-unit">Min</span>`;
    updateLoadPreview();
  });

  document.querySelectorAll('.rpe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.rpe = parseInt(btn.dataset.rpe);
      document.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLoadPreview();
    });
  });

  const paceInput = document.getElementById('pace-input');
  if (paceInput) {
    paceInput.addEventListener('input', () => { state.pace = paceInput.value.trim(); });
  }

  const avgHRInput = document.getElementById('avg-hr-input');
  if (avgHRInput) {
    avgHRInput.addEventListener('input', () => { state.avgHR = avgHRInput.value.trim(); });
  }

  const notesInput = document.getElementById('notes-input');
  if (notesInput) {
    notesInput.addEventListener('input', () => { state.notes = notesInput.value; });
  }

  const dateInput = document.getElementById('session-date');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value;
      render(_sessions, _weekMean);
    });
  }

  document.getElementById('btn-save-session')?.addEventListener('click', async () => {
    if (!state.rpe) { alert('Bitte RPE auswählen (1–10)'); return; }
    const today = new Date().toISOString().split('T')[0];
    const session = {
      type: state.type,
      duration: state.duration,
      rpe: state.rpe,
      phase: phase.id,
      pace: state.pace || '',
      notes: [state.avgHR ? `Ø HF: ${state.avgHR} bpm` : '', state.notes || ''].filter(Boolean).join(' · '),
      timestamp: state.date !== today ? new Date(state.date + 'T12:00').toISOString() : undefined,
    };
    try { await saveSession(session); } catch { queueSession(session); }
    state.rpe = null;
    state.pace = '';
    state.notes = '';
    state.avgHR = '';
    state.date = new Date().toISOString().split('T')[0];
    if (workoutState) {
      saveWorkoutLog({ ...workoutState, phase_id: phase.id, created_at: Date.now() });
    }
    workoutState = null;
    clearWorkoutWip();
    await init();
    document.querySelector('[data-tab="dashboard"]').click();
  });

  attachSetListeners();
}

function attachSetListeners() {
  if (!workoutState) return;

  // Value input changes — update in-memory state
  el().querySelectorAll('.set-value-input').forEach(input => {
    input.addEventListener('input', () => {
      const exIdx = parseInt(input.dataset.ex);
      const setIdx = parseInt(input.dataset.set);
      workoutState.exercises[exIdx].sets[setIdx].value = input.value;
    });
  });

  // Tap set chip to complete it
  el().querySelectorAll('.set-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const exIdx = parseInt(chip.dataset.ex);
      const setIdx = parseInt(chip.dataset.set);
      const ex = workoutState.exercises[exIdx];
      const set = ex.sets[setIdx];

      // Only allow completing the active set (first uncompleted set)
      const isActive = !set.completed && ex.sets.slice(0, setIdx).every(s => s.completed);
      if (!isActive) return;

      // Read value from input if present
      const input = chip.querySelector('.set-value-input');
      if (input) set.value = input.value.trim() || null;

      set.completed = true;
      saveWorkoutWip(workoutState);  // auto-save after each set completion
      render(_sessions, _weekMean);
    });
  });

  // Allow completing a set by pressing Enter in the input
  el().querySelectorAll('.set-value-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        input.closest('.set-chip')?.click();
      }
    });
  });
}

function updateLoadPreview() {
  const el = document.getElementById('load-preview');
  if (el) el.textContent = state.rpe ? state.duration * state.rpe : '–';
}
