import { SYSTEM_PROMPT } from '../data/athlete.js';

const PROXY = 'https://dxikdpatrtsnbkeijtiy.supabase.co/functions/v1/bright-processor';
import { getTodayHRV, getWeekSessions, getHRVEntries, ampelLabel } from '../db.js';
import { getCurrentPhase, getTodaySession } from '../data/plan-data.js';

const el = () => document.getElementById('tab-coach');
const HISTORY_KEY = 'sub68_chat_history';
const MAX_HISTORY = 20;

let messages = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

export async function init() { render(); }
export async function refresh() { render(); }

function saveHistory() {
  if (messages.length > MAX_HISTORY) messages = messages.slice(-MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
}

async function buildSystemPrompt() {
  const [todayHRV, weekSessions, hrvEntries] = await Promise.all([
    getTodayHRV(), getWeekSessions(), getHRVEntries(7),
  ]);
  const weekLoad = weekSessions.reduce((s, x) => s + (x.load_points || 0), 0);
  const weekMean = hrvEntries.length
    ? Math.round(hrvEntries.reduce((s, e) => s + e.rmssd, 0) / hrvEntries.length)
    : null;
  const phase = getCurrentPhase();
  const today = getTodaySession();
  return SYSTEM_PROMPT + `\n\nAKTUELLE WOCHENDATEN (${new Date().toLocaleDateString('de-DE')}):
- Phase: ${phase.name} (${phase.weeks})
- Wochenbelastung: ${weekLoad} RPE-Punkte (Ziel: ${phase.rpeMin || 0}–${phase.rpeMax || 1500})
- HRV heute: ${todayHRV ? todayHRV.rmssd + ' ms (' + ampelLabel(todayHRV.ampel) + ')' : 'nicht gemessen'}
- HRV 7-Tage-Mittel: ${weekMean ? weekMean + ' ms' : 'keine Daten'}
- Heutige geplante Einheit: ${today ? today.name + ' (' + today.dur + ' Min)' : 'Ruhetag'}
- Einheiten diese Woche: ${weekSessions.length}`;
}

function render() {
  const apiKey = localStorage.getItem('claude_api_key');
  el().innerHTML = `
    <div class="coach-header">
      <h2>🤖 KI-Coach</h2>
      <div style="font-size:0.78em;color:var(--muted);margin-top:2px">Dein persönlicher Hyrox-Trainer</div>
    </div>

    ${!apiKey ? `
    <div class="card" style="border:1px solid var(--warn);background:rgba(255,179,71,0.08)">
      <div style="color:var(--warn);font-weight:700;margin-bottom:8px">⚠️ API-Key fehlt</div>
      <div style="font-size:0.85em;color:var(--muted);margin-bottom:12px">Geh zu Einstellungen und trag deinen Claude API-Key ein.</div>
      <button class="btn-secondary" onclick="document.querySelector('[data-tab=settings]').click()">→ Einstellungen öffnen</button>
    </div>
    ` : ''}

    <button class="checkin-btn" id="btn-checkin">
      📋 Wöchentlicher Check-in starten (Analyse + Plan für nächste Woche)
    </button>

    <div class="chat-messages" id="chat-messages">
      ${messages.length === 0 ? `
        <div class="chat-msg assistant">
          Hallo Steven! Ich bin dein Hyrox-Coach. Ich kenne dein vollständiges Athletenprofil und deine aktuellen Trainingsdaten.<br><br>
          Stell mir eine Frage zum Training, zur Erholung, oder starte den wöchentlichen Check-in. 💪
        </div>
      ` : messages.map(m => `
        <div class="chat-msg ${m.role === 'user' ? 'user' : 'assistant'}">${m.content.replace(/\n/g, '<br>')}</div>
      `).join('')}
    </div>

    <div class="chat-input-bar">
      <textarea class="chat-input" id="chat-input" placeholder="Frage stellen…" rows="1"></textarea>
      <button class="chat-send" id="btn-send">➤</button>
    </div>
  `;

  const input = document.getElementById('chat-input');
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById('btn-send')?.addEventListener('click', sendMessage);
  document.getElementById('btn-checkin')?.addEventListener('click', () => {
    document.getElementById('chat-input').value =
      'Hier mein wöchentlicher Check-in. Bitte analysiere meine aktuelle Woche, bewerte den Trainingsfortschritt und erstelle den Plan für die nächste Woche.';
    sendMessage();
  });
  scrollToBottom();
}

function scrollToBottom() {
  const msgs = document.getElementById('chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;
  const apiKey = localStorage.getItem('claude_api_key');
  if (!apiKey) { alert('Bitte zuerst Claude API-Key in den Einstellungen eintragen.'); return; }

  input.value = '';
  input.style.height = 'auto';
  messages.push({ role: 'user', content: text });
  saveHistory();
  render();

  const msgsEl = document.getElementById('chat-messages');
  const thinking = document.createElement('div');
  thinking.className = 'chat-msg thinking';
  thinking.textContent = '…';
  msgsEl?.appendChild(thinking);
  scrollToBottom();

  try {
    const systemPrompt = await buildSystemPrompt();
    const res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: messages.slice(-10),
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'API-Fehler'); }
    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content[0].text });
    saveHistory();
    render();
  } catch (err) {
    thinking?.remove();
    messages.push({ role: 'assistant', content: `❌ Fehler: ${err.message}` });
    saveHistory();
    render();
  }
}
