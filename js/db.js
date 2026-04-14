import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const { createClient } = window.supabase;
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function saveSession(session) {
  const { error } = await db.from('sessions').insert([{
    athlete: 'steven_fredrickson',
    type: session.type,
    duration_min: session.duration,
    rpe: session.rpe,
    phase: session.phase,
    notes: session.notes || '',
    pace_per_km: session.pace || '',
  }]);
  if (error) throw error;
}

export async function saveHRV(rmssd) {
  const ampel = getAmpelFromRMSSD(rmssd);
  const { error } = await db.from('hrv_entries').insert([{
    athlete: 'steven_fredrickson',
    rmssd,
    ampel,
    measured_at: new Date().toISOString().split('T')[0],
  }]);
  if (error) throw error;
  return ampel;
}

export async function getTodayHRV() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await db
    .from('hrv_entries').select('*')
    .eq('measured_at', today)
    .order('created_at', { ascending: false }).limit(1);
  return data?.[0] || null;
}

export async function getHRVEntries(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await db
    .from('hrv_entries').select('*')
    .gte('measured_at', since.toISOString().split('T')[0])
    .order('measured_at', { ascending: true });
  return data || [];
}

export async function getWeekSessions() {
  const monday = new Date();
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const { data } = await db
    .from('sessions').select('*')
    .gte('created_at', monday.toISOString());
  return data || [];
}

export async function getRecentSessions(limit = 10) {
  const { data } = await db
    .from('sessions').select('*')
    .order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

export async function getSessionsForCharts(weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);
  const { data } = await db
    .from('sessions').select('created_at,load_points,type,pace_per_km,notes')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  return data || [];
}

export function getAmpelFromRMSSD(rmssd, weekMean = null) {
  if (!weekMean) return rmssd >= 50 ? 'gruen' : rmssd >= 35 ? 'gelb' : 'rot';
  const pct = (rmssd - weekMean) / weekMean;
  if (pct > -0.10) return 'gruen';
  if (pct > -0.20) return 'gelb';
  return 'rot';
}

export function ampelLabel(ampel) {
  return { gruen: 'GRÜN — Volles Training', gelb: 'GELB — Intensität –20%', rot: 'ROT — Nur Erholung' }[ampel] || '–';
}

// ── Workout Log (localStorage) ───────────────────────────────────────────────
const WL_KEY  = 'sub68_workout_logs';
const WIP_KEY = 'sub68_workout_wip';

export function saveWorkoutLog(log) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  const idx = logs.findIndex(l => l.date === log.date && l.session_type === log.session_type);
  if (idx >= 0) logs[idx] = log;
  else logs.unshift(log);
  localStorage.setItem(WL_KEY, JSON.stringify(logs.slice(0, 100)));
}

export function getWorkoutLogByDate(date) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  return logs.filter(l => l.date === date);
}

export function getLastWorkoutLog(type) {
  const logs = JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  return logs.find(l => l.session_type === type) || null;
}

export function saveWorkoutWip(wip) {
  localStorage.setItem(WIP_KEY, JSON.stringify(wip));
}

export function getWorkoutWip() {
  return JSON.parse(localStorage.getItem(WIP_KEY) || 'null');
}

export function clearWorkoutWip() {
  localStorage.removeItem(WIP_KEY);
}

export function getAllWorkoutLogs() {
  return JSON.parse(localStorage.getItem(WL_KEY) || '[]');
}
