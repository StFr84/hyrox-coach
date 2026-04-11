import { SUPABASE_URL } from './config.js';
import { saveSession } from './db.js';

const STRAVA_PROXY = `${SUPABASE_URL}/functions/v1/Strava`;
const CLIENT_ID = 223478;
const REDIRECT_URI = 'https://stfr84.github.io/hyrox-coach';

const TYPE_MAP = {
  Run: 'laufen', 'Trail Run': 'laufen',
  WeightTraining: 'kraft', Workout: 'kraft', CrossFit: 'kraft',
  Rowing: 'rowing',
  NordicSki: 'skierg',
  Hike: 'erholung', Walk: 'erholung', Yoga: 'erholung', Swim: 'erholung',
};

function toType(stravaType) {
  return TYPE_MAP[stravaType] || 'erholung';
}

function toPace(avgSpeedMs) {
  if (!avgSpeedMs || avgSpeedMs <= 0) return '';
  const minPerKm = 1000 / avgSpeedMs / 60;
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function getStravaTokens() {
  const raw = localStorage.getItem('strava_tokens');
  return raw ? JSON.parse(raw) : null;
}

export function saveStravaTokens(tokens) {
  localStorage.setItem('strava_tokens', JSON.stringify(tokens));
}

export function clearStravaTokens() {
  localStorage.removeItem('strava_tokens');
}

export function stravaAuthUrl() {
  return `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&approval_prompt=auto&scope=activity:read_all`;
}

export async function exchangeCode(code) {
  const res = await fetch(STRAVA_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'exchange', code }),
  });
  const data = await res.json();
  if (data.access_token) {
    saveStravaTokens({ access_token: data.access_token, refresh_token: data.refresh_token, athlete: data.athlete });
    return data;
  }
  throw new Error(data.message || 'Token-Austausch fehlgeschlagen');
}

export async function syncActivities() {
  const tokens = getStravaTokens();
  if (!tokens) throw new Error('Nicht mit Strava verbunden');

  const res = await fetch(STRAVA_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sync', refresh_token: tokens.refresh_token }),
  });
  const data = await res.json();
  if (!data.activities) throw new Error('Sync fehlgeschlagen');

  // Update tokens
  saveStravaTokens({ ...tokens, access_token: data.access_token, refresh_token: data.refresh_token });

  // Get already imported strava IDs
  const imported = JSON.parse(localStorage.getItem('strava_imported') || '[]');
  let newCount = 0;

  for (const act of data.activities) {
    if (imported.includes(act.id)) continue;
    const type = toType(act.sport_type || act.type);
    const duration = Math.max(1, Math.round((act.moving_time || act.elapsed_time || 60) / 60));
    const rpe = act.perceived_exertion || 6;
    const pace = type === 'laufen' ? toPace(act.average_speed) : '';

    await saveSession({
      type,
      duration,
      rpe,
      notes: act.name || '',
      pace: pace,
      phase: 'base',
    });

    imported.push(act.id);
    newCount++;
  }

  localStorage.setItem('strava_imported', JSON.stringify(imported));
  return newCount;
}
