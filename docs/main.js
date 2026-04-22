// KPI counter animation
const kpiNums = document.querySelectorAll('.kpi-num');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current = 0;
      const inc = Math.max(1, Math.ceil(target / 40));
      const timer = setInterval(() => {
        current = Math.min(current + inc, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 30);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.3 });
kpiNums.forEach(el => observer.observe(el));

// Navbar active section highlight
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('#navbar a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + entry.target.id ? '#6366f1' : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

// Architecture module descriptions
const moduleDesc = {
  CsvNotebookBuilder: 'Main orchestrator component. Manages file upload, tab navigation, and state for cleaned data, CSV text, and active workspace.',
  CsvVisualizations: 'Renders 10 chart types in both STANDARD and CUSTOM modes. Each chart panel has dynamic column selectors with type filtering.',
  NotebookViewer: '14 pre-built Python cells with explanations. Executes via usePyodide hook. Captures stdout and renders base64 images inline.',
  Firebase: 'Google sign-in with Firestore persistence. userWorks collection stores userId, fileName, csvData, and timestamp.',
  Pyodide: 'usePyodide hook loads Pyodide from CDN, pre-installs pandas/numpy/matplotlib/scipy, and injects CSV data via globals.set().',
  Analysis: 'COLUMN_KNOWLEDGE map provides domain-aware statistical commentary for medical/financial columns based on column name matching.',
};

function selectModule(el, name) {
  document.querySelectorAll('.arch-module').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
  const detail = document.getElementById('module-detail');
  detail.style.display = 'block';
  detail.innerHTML = `<strong style="color:#a5b4fc">${name}</strong><p style="color:#9ca3af;margin-top:8px;font-size:0.9rem">${moduleDesc[name]}</p>`;
}

// Chart type explorer
const chartInfo = [
  { name: 'DistPlot', desc: 'Histogram + KDE curve for a single numeric column. Reveals distribution shape, skewness, and outlier potential.', col: 'numeric' },
  { name: 'Pie Chart', desc: 'Doughnut chart for categorical proportions. Auto-selects low-cardinality column.', col: 'categorical' },
  { name: 'Violin Plot', desc: 'Distribution density grouped by a categorical column. Shows median, IQR, and tails.', col: 'numeric + categorical' },
  { name: 'HeatMap', desc: 'Pearson correlation matrix for up to 8 numeric columns. Color intensity encodes correlation strength.', col: 'multi-numeric (≤8)' },
  { name: 'PairPlot', desc: 'NxN scatter grid for up to 10 numeric columns. Diagonal shows histograms.', col: 'multi-numeric (≤10)' },
  { name: 'JointPlot', desc: 'Bivariate scatter with marginal histograms on X and Y axes.', col: '2 numeric' },
  { name: 'Bar Chart', desc: 'Mean numeric value per category. Useful for comparing groups.', col: 'categorical + numeric' },
  { name: 'Histogram', desc: 'Frequency distribution with configurable bin count.', col: 'numeric' },
  { name: 'Scatter Plot', desc: 'Two numeric axes — reveals correlation, clusters, and outliers.', col: '2 numeric' },
  { name: 'Line Chart', desc: 'Trend line over numeric or datetime X axis. Supports up to 500 points.', col: 'numeric or datetime + numeric' },
];

let activeChart = 0;
function showChart(idx) {
  activeChart = idx;
  document.querySelectorAll('.step-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  const info = chartInfo[idx];
  document.getElementById('chart-content').innerHTML = `
    <h3 style="color:#a5b4fc;margin-bottom:8px">${info.name}</h3>
    <p style="color:#e0e0ff;margin-bottom:12px">${info.desc}</p>
    <span style="font-size:12px;color:#9ca3af;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);padding:4px 10px;border-radius:20px">Columns: ${info.col}</span>
  `;
}
showChart(0);

// Evaluation radar chart
const ctx = document.getElementById('eval-chart').getContext('2d');
new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ['Ease of Use', 'Visualization Depth', 'Performance', 'Reproducibility', 'Data Cleaning', 'Domain Insights'],
    datasets: [
      {
        label: 'DataMentor',
        data: [90, 85, 80, 75, 88, 82],
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Jupyter Notebook',
        data: [55, 95, 70, 90, 50, 40],
        backgroundColor: 'rgba(168,85,247,0.2)',
        borderColor: '#a855f7',
        pointBackgroundColor: '#a855f7',
      },
      {
        label: 'Google Sheets',
        data: [95, 40, 85, 30, 60, 20],
        backgroundColor: 'rgba(236,72,153,0.2)',
        borderColor: '#ec4899',
        pointBackgroundColor: '#ec4899',
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#e0e0ff' } },
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#9ca3af', font: { size: 12 } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  },
});
