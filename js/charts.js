Chart.defaults.color = '#7a8099';
Chart.defaults.borderColor = '#1e2230';
Chart.defaults.font.family = "'Barlow', system-ui, sans-serif";

export function renderHRVChart(canvasId, entries) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: entries.map(e => new Date(e.measured_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'HRV (RMSSD ms)',
        data: entries.map(e => e.rmssd),
        borderColor: '#4ecb71',
        backgroundColor: 'rgba(78,203,113,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#1e2230' } }, y: { grid: { color: '#1e2230' }, beginAtZero: false } },
    },
  });
}

export function renderWeeklyLoadChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  const weeks = {};
  sessions.forEach(s => {
    const d = new Date(s.created_at);
    const monday = new Date(d);
    monday.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    const key = monday.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    weeks[key] = (weeks[key] || 0) + (s.load_points || 0);
  });
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(weeks),
      datasets: [{
        label: 'Session-RPE Punkte',
        data: Object.values(weeks),
        backgroundColor: 'rgba(71,200,255,0.7)',
        borderColor: '#47c8ff',
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#1e2230' } }, y: { grid: { color: '#1e2230' }, beginAtZero: true } },
    },
  });
}

export function renderDistributionChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  const counts = {};
  sessions.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
  const COLORS = {
    laufen: '#4ecb71', kraft: '#47c8ff', hyrox: '#e8ff47',
    skierg: '#ffb347', rowing: '#ff8c47', erholung: '#7a8099', concurrent: '#ff6b6b',
  };
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: Object.keys(counts).map(k => COLORS[k] || '#7a8099'),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
      cutout: '65%',
    },
  });
}

export function renderPaceChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  const running = sessions.filter(s => s.type === 'laufen' && s.pace_per_km);
  if (running.length === 0) return;
  const toDecimal = pace => {
    const [m, s] = pace.split(':').map(Number);
    return m + (s || 0) / 60;
  };
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: running.map(s => new Date(s.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Pace (min/km)',
        data: running.map(s => toDecimal(s.pace_per_km)),
        borderColor: '#e8ff47',
        backgroundColor: 'rgba(232,255,71,0.06)',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#1e2230' } },
        y: { grid: { color: '#1e2230' }, reverse: true, ticks: { callback: v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}` } },
      },
    },
  });
}
