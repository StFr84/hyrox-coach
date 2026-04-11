import { db } from '../db.js';
import { ATHLETE, ZONES } from '../data/athlete.js';
import { SUPABASE_URL } from '../config.js';

const el = () => document.getElementById('tab-settings');

export async function init() { render(); }
export async function refresh() { render(); }

async function render() {
  const apiKey = localStorage.getItem('claude_api_key') || '';

  el().innerHTML = `
    <div class="screen-title">⚙️ Einstellungen</div>

    <div class="settings-section">
      <div class="settings-label">Claude API-Key</div>
      <input class="settings-input" id="api-key-input" type="password" placeholder="sk-ant-..." value="${apiKey}">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn-secondary" id="btn-save-key" style="flex:1">Speichern</button>
        <button class="btn-secondary" id="btn-test-key" style="flex:1">Testen</button>
      </div>
      <div id="key-status" style="font-size:0.78em;color:var(--muted);margin-top:6px">
        ${apiKey ? '● Key gespeichert' : '● Kein Key — Coach nicht verfügbar'}
      </div>
      <div style="font-size:0.75em;color:var(--muted);margin-top:4px">
        API-Key bekommst du auf console.anthropic.com → API Keys.
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Supabase Verbindung</div>
      <div class="card-sm" style="font-size:0.85em">
        <span class="status-dot" id="db-dot"></span>
        <span id="db-status">Prüfe…</span>
        <div style="color:var(--muted);font-size:0.8em;margin-top:4px">${SUPABASE_URL}</div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Athletenprofil</div>
      <div class="card-sm" style="font-size:0.85em;line-height:1.8">
        <b>${ATHLETE.name}</b> · ${ATHLETE.height} cm / ${ATHLETE.weight} kg<br>
        HRmax: ${ATHLETE.hrMax} bpm · VO2max: ${ATHLETE.vo2max} ml/kg/min<br>
        LT1: ${ATHLETE.lt1.bpm} bpm @ ${ATHLETE.lt1.pace} km/h<br>
        IAS: ${ATHLETE.ias.bpm} bpm @ ${ATHLETE.ias.pace} km/h
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Trainingszonen</div>
      ${ZONES.map(z => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bg3)">
          <div style="width:10px;height:10px;border-radius:50%;background:${z.color};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:0.85em;font-weight:700">${z.name}</div>
            <div style="font-size:0.75em;color:var(--muted)">${z.desc}</div>
          </div>
          <div style="font-size:0.78em;color:var(--muted);text-align:right">
            ${z.hrMax ? '&lt;' + z.hrMax : z.hrMin ? z.hrMin + '+' : ''} bpm
          </div>
        </div>
      `).join('')}
    </div>

    <div class="settings-section">
      <div class="settings-label">Daten exportieren</div>
      <button class="btn-secondary" id="btn-export" style="width:100%">📥 Sessions als CSV exportieren</button>
    </div>

    <div class="settings-section">
      <div class="settings-label">App Info</div>
      <div style="font-size:0.78em;color:var(--muted)">Sub 68 Coach v2.0 · Built for Steven Fredrickson · Dezember 2026</div>
    </div>
  `;

  db.from('sessions').select('id').limit(1)
    .then(() => {
      document.getElementById('db-dot')?.classList.add('online');
      if (document.getElementById('db-status')) document.getElementById('db-status').textContent = 'Verbunden ✓';
    })
    .catch(() => {
      document.getElementById('db-dot')?.classList.add('offline');
      if (document.getElementById('db-status')) document.getElementById('db-status').textContent = 'Nicht verbunden';
    });

  document.getElementById('btn-save-key')?.addEventListener('click', () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
      localStorage.setItem('claude_api_key', key);
      const s = document.getElementById('key-status');
      s.textContent = '✓ Key gespeichert';
      s.style.color = 'var(--success)';
    }
  });

  document.getElementById('btn-test-key')?.addEventListener('click', async () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { alert('Bitte erst einen Key eingeben'); return; }
    const s = document.getElementById('key-status');
    s.textContent = 'Teste…';
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (r.ok) {
        s.textContent = '✓ API-Key funktioniert!';
        s.style.color = 'var(--success)';
        localStorage.setItem('claude_api_key', key);
      } else {
        const err = await r.json();
        s.textContent = '✗ ' + (err.error?.message || 'Ungültiger Key');
        s.style.color = 'var(--danger)';
      }
    } catch {
      s.textContent = '✗ Verbindungsfehler';
      s.style.color = 'var(--danger)';
    }
  });

  document.getElementById('btn-export')?.addEventListener('click', async () => {
    const { data } = await db.from('sessions').select('*').order('created_at', { ascending: false });
    if (!data?.length) { alert('Keine Sessions vorhanden'); return; }
    const csv = ['Datum,Typ,Dauer(Min),RPE,Belastungspunkte,Pace,Phase,Notizen',
      ...data.map(s => `${new Date(s.created_at).toLocaleDateString('de-DE')},${s.type},${s.duration_min},${s.rpe},${s.load_points},${s.pace_per_km || ''},${s.phase},${s.notes || ''}`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `sub68_sessions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });
}
