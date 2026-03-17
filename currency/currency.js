(function () {
  'use strict';

  const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW'];
  const FLAGS = { USD: '🇺🇸', EUR: '🇪🇺', JPY: '🇯🇵', GBP: '🇬🇧', CNY: '🇨🇳', KRW: '🇰🇷' };
  const NAMES = { USD: '米ドル', EUR: 'ユーロ', JPY: '日本円', GBP: '英ポンド', CNY: '人民元', KRW: '韓国ウォン' };
  const REFRESH_INTERVAL = 60;

  const baseSelect = document.getElementById('base-currency');
  const amountInput = document.getElementById('amount');
  const ratesGrid = document.getElementById('rates-grid');
  const lastUpdatedEl = document.getElementById('last-updated');
  const countdownEl = document.getElementById('countdown');
  const errorEl = document.getElementById('error-message');
  const chartCanvas = document.getElementById('rate-chart');
  const chartTargetSelect = document.getElementById('chart-target');

  let rates = {};
  let countdown = REFRESH_INTERVAL;
  let countdownTimer = null;
  let historicalData = null;

  // --- Init ---
  function init() {
    const saved = localStorage.getItem('preferredBaseCurrency');
    if (saved && CURRENCIES.includes(saved)) {
      baseSelect.value = saved;
    }

    populateChartTargetSelect();
    baseSelect.addEventListener('change', onBaseChange);
    amountInput.addEventListener('input', renderRates);
    chartTargetSelect.addEventListener('change', () => {
      fetchHistorical();
    });

    fetchRates();
    startCountdown();
  }

  function populateChartTargetSelect() {
    const base = baseSelect.value;
    chartTargetSelect.innerHTML = '';
    CURRENCIES.filter(c => c !== base).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = FLAGS[c] + ' ' + c;
      chartTargetSelect.appendChild(opt);
    });
  }

  function onBaseChange() {
    localStorage.setItem('preferredBaseCurrency', baseSelect.value);
    populateChartTargetSelect();
    fetchRates();
    fetchHistorical();
  }

  // --- Fetch latest rates ---
  async function fetchRates() {
    const base = baseSelect.value;
    const targets = CURRENCIES.filter(c => c !== base).join(',');
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${targets}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      rates = data.rates;
      errorEl.hidden = true;
      renderRates();
      updateTimestamp();
      resetCountdown();

      // Also fetch historical on first load
      if (!historicalData) fetchHistorical();
    } catch (err) {
      showError('レート取得に失敗しました: ' + err.message);
    }
  }

  function renderRates() {
    const base = baseSelect.value;
    const amount = parseFloat(amountInput.value) || 0;

    if (!Object.keys(rates).length) return;

    ratesGrid.innerHTML = '';
    CURRENCIES.filter(c => c !== base).forEach(currency => {
      const rate = rates[currency];
      if (rate == null) return;
      const converted = amount * rate;

      const card = document.createElement('div');
      card.className = 'rate-card';
      card.innerHTML = `
        <span class="currency-name">${FLAGS[currency]} ${currency} — ${NAMES[currency]}</span>
        <span class="converted-amount">${formatNumber(converted, currency)}</span>
        <span class="rate-info">1 ${base} = ${formatRate(rate)} ${currency}</span>
      `;
      ratesGrid.appendChild(card);
    });
  }

  function formatNumber(n, currency) {
    if (['JPY', 'KRW'].includes(currency)) {
      return Math.round(n).toLocaleString();
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatRate(r) {
    if (r >= 100) return r.toFixed(2);
    if (r >= 1) return r.toFixed(4);
    return r.toFixed(6);
  }

  // --- Countdown ---
  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdown--;
      countdownEl.textContent = `更新まで ${countdown}s`;
      if (countdown <= 0) {
        fetchRates();
      }
    }, 1000);
  }

  function resetCountdown() {
    countdown = REFRESH_INTERVAL;
    countdownEl.textContent = `更新まで ${countdown}s`;
  }

  function updateTimestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    lastUpdatedEl.textContent = `最終更新: ${hh}:${mm}:${ss}`;
  }

  // --- Error ---
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  // --- Historical chart ---
  async function fetchHistorical() {
    const base = baseSelect.value;
    const target = chartTargetSelect.value;
    if (!target) return;

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const fmt = d => d.toISOString().slice(0, 10);
    const url = `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${base}&to=${target}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      historicalData = data.rates;
      drawChart(target);
    } catch (err) {
      // Silently fail for chart — rates still work
      console.error('Chart fetch failed:', err);
    }
  }

  function drawChart(target) {
    if (!historicalData) return;

    const ctx = chartCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    chartCanvas.width = w * dpr;
    chartCanvas.height = h * dpr;
    chartCanvas.style.width = w + 'px';
    chartCanvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const dates = Object.keys(historicalData).sort();
    const values = dates.map(d => historicalData[d][target]);

    if (!values.length) return;

    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const margin = range * 0.1;
    const yMin = minV - margin;
    const yMax = maxV + margin;

    const xScale = (i) => pad.left + (i / (dates.length - 1)) * cw;
    const yScale = (v) => pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#e8e6e1';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (ch / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Y labels
      const val = yMax - ((yMax - yMin) / gridLines) * i;
      ctx.fillStyle = '#6b6b6b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 100 ? val.toFixed(1) : val.toFixed(3), pad.left - 8, y + 4);
    }

    // X labels (show ~5 dates)
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(dates.length / 5));
    for (let i = 0; i < dates.length; i += labelStep) {
      const x = xScale(i);
      const d = dates[i].slice(5); // MM-DD
      ctx.fillText(d, x, h - pad.bottom + 20);
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, 'rgba(74, 143, 127, 0.15)');
    grad.addColorStop(1, 'rgba(74, 143, 127, 0.0)');

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    for (let i = 1; i < values.length; i++) {
      ctx.lineTo(xScale(i), yScale(values[i]));
    }
    ctx.lineTo(xScale(values.length - 1), pad.top + ch);
    ctx.lineTo(xScale(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    for (let i = 1; i < values.length; i++) {
      ctx.lineTo(xScale(i), yScale(values[i]));
    }
    ctx.strokeStyle = '#4a8f7f';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots on hover area (just endpoints)
    [0, values.length - 1].forEach(i => {
      ctx.beginPath();
      ctx.arc(xScale(i), yScale(values[i]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4a8f7f';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Redraw chart on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (historicalData && chartTargetSelect.value) {
        drawChart(chartTargetSelect.value);
      }
    }, 200);
  });

  init();
})();
