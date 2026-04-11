import { db } from './db.js';

const QUEUE_KEY = 'sub68_offline_queue';

export function queueSession(session) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ ...session, queued_at: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function syncQueue() {
  if (!navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  const remaining = [];
  for (const session of queue) {
    try {
      await db.from('sessions').insert([{
        athlete: 'steven_fredrickson',
        type: session.type,
        duration_min: session.duration,
        rpe: session.rpe,
        phase: session.phase,
        notes: session.notes || '',
        pace_per_km: session.pace || '',
      }]);
    } catch {
      remaining.push(session);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}
