Chart.defaults.color = '#4a5270';
Chart.defaults.borderColor = '#1e2438';
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
        borderColor: '#39D98A',
        backgroundColor: 'rgba(57,217,138,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#1e2438' } }, y: { grid: { color: '#1e2438' }, beginAtZero: false } },
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
        backgroundColor: 'rgba(96,165,250,0.7)',
        borderColor: '#60A5FA',
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#1e2438' } }, y: { grid: { color: '#1e2438' }, beginAtZero: true } },
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
    laufen: '#39D98A', kraft: '#60A5FA', hyrox: '#F59E0B',
    skierg: '#F59E0B', rowing: '#60A5FA', erholung: '#4a5270', concurrent: '#EF4444',
  };
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: Object.keys(counts).map(k => COLORS[k] || '#4a5270'),
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
        borderColor: '#39D98A',
        backgroundColor: 'rgba(57,217,138,0.06)',
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
        x: { grid: { color: '#1e2438' } },
        y: { grid: { color: '#1e2438' }, reverse: true, ticks: { callback: v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}` } },
      },
    },
  });
}

export function renderRunProgressChart(canvasId, sessions) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const toDecimal = pace => {
    if (!pace || !pace.includes(':')) return null;
    const [m, s] = pace.split(':').map(Number);
    return m + (s || 0) / 60;
  };
  const parseHR = notes => {
    const m = notes?.match(/Ø HF: (\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  const running = sessions
    .filter(s => s.type === 'laufen' && s.pace_per_km)
    .slice(-10);
  if (running.length < 2) return;

  const labels = running.map(s =>
    new Date(s.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  );
  const paceData = running.map(s => toDecimal(s.pace_per_km));
  const hrData = running.map(s => parseHR(s.notes));
  const hasHR = hrData.some(v => v !== null);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pace (min/km)',
          data: paceData,
          borderColor: '#39D98A',
          backgroundColor: 'rgba(57,217,138,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          fill: true,
          yAxisID: 'yPace',
        },
        ...(hasHR ? [{
          label: 'Ø HF (bpm)',
          data: hrData,
          borderColor: '#60A5FA',
          backgroundColor: 'rgba(96,165,250,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'yHR',
        }] : []),
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          display: hasHR,
          position: 'top',
          labels: { padding: 8, font: { size: 10 }, color: '#4a5270' },
        },
      },
      scales: {
        x: { grid: { color: '#1e2438' } },
        yPace: {
          type: 'linear', position: 'left',
          reverse: true,
          grid: { color: '#1e2438' },
          ticks: {
            color: '#39D98A',
            callback: v => { const sec = Math.round((v % 1) * 60); const min = Math.floor(v) + Math.floor(sec / 60); return `${min}:${String(sec % 60).padStart(2, '0')}`; },
          },
        },
        yHR: {
          type: 'linear', position: 'right',
          display: hasHR,
          grid: { display: false },
          ticks: { color: '#60A5FA' },
        },
      },
    },
  });
}

export function renderStrengthMiniChart(canvasId, dataPoints) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: dataPoints.map(d =>
        new Date(d.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
      ),
      datasets: [{
        data: dataPoints.map(d => d.avgKg),
        borderColor: '#39D98A',
        backgroundColor: 'rgba(57,217,138,0.06)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#1e2438' }, ticks: { font: { size: 9 }, maxTicksLimit: 5 } },
        y: { grid: { color: '#1e2438' }, beginAtZero: false, ticks: { font: { size: 9 }, maxTicksLimit: 3 } },
      },
    },
  });
}
