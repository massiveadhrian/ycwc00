// ============================================
// DHRYZN — Custom Canvas Charts
// ============================================

const PRIMARY = '#7C5CFF';
const PRIMARY_LIGHT = '#A78BFA';
const SUCCESS = '#34D399';
const WARNING = '#FBBF24';
const ERROR = '#F87171';
const SURFACE = '#1E1E32';
const TEXT_SEC = '#A9A9B2';
const BORDER = 'rgba(124, 92, 255, 0.12)';

function setupCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

// ---- Bar Chart ----
export function drawBarChart(canvas, data, labels, options = {}) {
  const w = options.width || 480;
  const h = options.height || 200;
  const ctx = setupCanvas(canvas, w, h);
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const max = Math.max(...data, 1);
  const barWidth = Math.min(36, (chartW / data.length) * 0.6);
  const gap = (chartW - barWidth * data.length) / (data.length + 1);

  // Grid lines
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // Bars
  data.forEach((val, i) => {
    const x = padding.left + gap + i * (barWidth + gap);
    const barH = (val / max) * chartH;
    const y = padding.top + chartH - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, PRIMARY);
    grad.addColorStop(1, 'rgba(124, 92, 255, 0.4)');
    ctx.fillStyle = grad;

    // Rounded top
    const r = Math.min(4, barWidth / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, y + barH);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = TEXT_SEC;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i] || '', x + barWidth / 2, h - padding.bottom + 18);
  });

  // Y-axis labels
  ctx.fillStyle = TEXT_SEC;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = Math.round(max - (max / 4) * i);
    const y = padding.top + (chartH / 4) * i;
    ctx.fillText(val, padding.left - 8, y + 4);
  }
}

// ---- Line Chart ----
export function drawLineChart(canvas, data, labels, options = {}) {
  const w = options.width || 480;
  const h = options.height || 200;
  const ctx = setupCanvas(canvas, w, h);
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // Line
  const points = data.map((val, i) => ({
    x: padding.left + (chartW / (data.length - 1)) * i,
    y: padding.top + chartH - ((val - min) / range) * chartH
  }));

  // Area gradient
  const grad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
  grad.addColorStop(0, 'rgba(124, 92, 255, 0.2)');
  grad.addColorStop(1, 'rgba(124, 92, 255, 0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - padding.bottom);
  points.forEach((p, i) => {
    if (i === 0) ctx.lineTo(p.x, p.y);
    else {
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line stroke
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else {
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
    }
  });
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Points
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = PRIMARY;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = TEXT_SEC;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    const x = padding.left + (chartW / (data.length - 1)) * i;
    ctx.fillText(label, x, h - padding.bottom + 18);
  });
}

// ---- Circular Progress / Gauge ----
export function drawCircularProgress(canvas, percent, options = {}) {
  const size = options.size || 140;
  const ctx = setupCanvas(canvas, size, size);
  const center = size / 2;
  const radius = size / 2 - 12;
  const lineWidth = options.lineWidth || 10;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * percent) / 100;

  // Track
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.1)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress
  const grad = ctx.createLinearGradient(0, 0, size, size);
  let color1 = PRIMARY;
  let color2 = PRIMARY_LIGHT;
  if (percent >= 80) { color1 = SUCCESS; color2 = '#6EE7B7'; }
  else if (percent < 50) { color1 = ERROR; color2 = '#FCA5A5'; }
  else if (percent < 70) { color1 = WARNING; color2 = '#FDE68A'; }
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.strokeStyle = grad;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ---- Radial Gauge (Semi-circle) ----
export function drawRadialGauge(canvas, percent, options = {}) {
  const size = options.size || 120;
  const ctx = setupCanvas(canvas, size, size);
  const center = size / 2;
  const radius = size / 2 - 12;
  const lineWidth = options.lineWidth || 10;
  const startAngle = Math.PI;
  const totalAngle = Math.PI;
  const endAngle = startAngle + totalAngle * (percent / 100);

  // Track
  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, startAngle + totalAngle);
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.1)';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Progress
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, ERROR);
  grad.addColorStop(0.5, WARNING);
  grad.addColorStop(1, SUCCESS);

  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.strokeStyle = grad;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}
