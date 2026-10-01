(function () {
  'use strict';

  const KM_PER_MILE = 1.609344;
  const tracks = window.GT7_TRACKS || [];

  const timeInput = document.getElementById('timeInput');
  const timeSegMM = document.querySelector('[data-seg="mm"]');
  const timeSegSS = document.querySelector('[data-seg="ss"]');
  const timeSegMS = document.querySelector('[data-seg="ms"]');
  const timeFeedback = document.getElementById('timeFeedback');

  const trackSelect = document.getElementById('trackSelect');
  const distanceInput = document.getElementById('distanceInput');
  const distanceUnit = document.getElementById('distanceUnit');
  const trackHint = document.getElementById('trackHint');

  const calcBtn = document.getElementById('calcBtn');
  const resultPanel = document.getElementById('resultPanel');
  const primarySpeed = document.getElementById('primarySpeed');
  const secondarySpeed = document.getElementById('secondarySpeed');
  const primaryLabel = document.getElementById('primaryLabel');
  const primaryBar = document.getElementById('primaryBar');
  const secondaryBar = document.getElementById('secondaryBar');
  const resultMeta = document.getElementById('resultMeta');

  const unitBtns = document.querySelectorAll('.unit-btn');
  const unitIndicator = document.querySelector('.unit-indicator');

  let currentUnit = 'km';
  let lastDistanceKm = null;
  let lastTimeSeconds = null;

  // ===== Populate tracks =====
  function initTracks() {
    tracks.forEach((t, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${t.name} · ${t.km.toFixed(3)} km`;
      opt.dataset.km = t.km;
      trackSelect.appendChild(opt);
    });
  }

  // ===== Time parsing & formatting =====
  function formatTimeInput(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    let mm = '--', ss = '--', ms = '---';
    if (digits.length >= 1) mm = digits.slice(0, Math.min(2, digits.length));
    if (digits.length >= 3) ss = digits.slice(2, Math.min(4, digits.length));
    if (digits.length >= 5) ms = digits.slice(4, Math.min(7, digits.length));
    else if (digits.length === 4) {
      ms = digits.slice(4);
      while (ms.length < 3) ms = '0' + ms;
    }
    return { raw: digits, mm, ss, ms };
  }

  function renderTimeMask(formatted) {
    timeSegMM.textContent = formatted.mm;
    timeSegSS.textContent = formatted.ss;
    timeSegMS.textContent = formatted.ms;
  }

  function parseTimeToSeconds(formatted) {
    const mm = parseInt(formatted.mm, 10);
    const ss = parseInt(formatted.ss, 10);
    const ms = parseInt(formatted.ms, 10);
    if (isNaN(mm) || isNaN(ss) || isNaN(ms)) return null;
    if (ss > 59) return null;
    if (ms > 999) return null;
    return mm * 60 + ss + ms / 1000;
  }

  function setFeedback(msg, status = '') {
    timeFeedback.textContent = msg;
    timeFeedback.className = 'input-feedback' + (status ? ' ' + status : '');
  }

  // ===== Distance / unit handling =====
  function getDistanceKm() {
    const v = parseFloat(distanceInput.value);
    if (isNaN(v) || v <= 0) return null;
    return currentUnit === 'km' ? v : v * KM_PER_MILE;
  }

  function setDistanceFromKm(km) {
    const display = currentUnit === 'km' ? km : km / KM_PER_MILE;
    distanceInput.value = display.toFixed(3);
  }

  function updateUnitIndicator() {
    const active = document.querySelector('.unit-btn.active');
    if (active && unitIndicator) {
      const rect = active.getBoundingClientRect();
      const parentRect = active.parentElement.getBoundingClientRect();
      unitIndicator.style.left = (rect.left - parentRect.left) + 'px';
      unitIndicator.style.width = rect.width + 'px';
    }
  }

  function switchUnit(newUnit) {
    if (newUnit === currentUnit) return;
    const distKm = getDistanceKm();
    currentUnit = newUnit;
    distanceUnit.textContent = newUnit;
    if (distKm !== null) setDistanceFromKm(distKm);
    unitBtns.forEach(b => {
      const isActive = b.dataset.unit === newUnit;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    });
    updateUnitIndicator();
    if (lastDistanceKm !== null && lastTimeSeconds !== null) {
      renderResult(lastDistanceKm, lastTimeSeconds);
    }
  }

  // ===== Calculation core =====
  function calculate() {
    const formatted = formatTimeInput(timeInput.value);
    const totalSeconds = parseTimeToSeconds(formatted);
    const distanceKm = getDistanceKm();

    if (totalSeconds === null) {
      setFeedback('INVALID TIME FORMAT', 'error');
      shake(timeInput.parentElement);
      return;
    }
    if (totalSeconds <= 0) {
      setFeedback('TIME MUST BE GREATER THAN 0', 'error');
      shake(timeInput.parentElement);
      return;
    }
    if (distanceKm === null) {
      setFeedback('ENTER A VALID DISTANCE', 'error');
      shake(distanceInput.parentElement);
      return;
    }

    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds - mins * 60;
    setFeedback(`TIME LOCKED · ${mins}m ${secs.toFixed(3)}s`, 'ok');

    lastDistanceKm = distanceKm;
    lastTimeSeconds = totalSeconds;
    renderResult(distanceKm, totalSeconds);
  }

  function renderResult(distanceKm, totalSeconds) {
    const hours = totalSeconds / 3600;
    const kmh = distanceKm / hours;
    const mph = kmh / KM_PER_MILE;

    const primaryVal = currentUnit === 'km' ? kmh : mph;
    const primaryLabelText = currentUnit === 'km' ? 'KM/H' : 'MPH';
    const secondaryVal = currentUnit === 'km' ? mph : kmh;
    const secondaryLabelText = currentUnit === 'km' ? 'MPH' : 'KM/H';

    primaryLabel.textContent = primaryLabelText;
    animateNumber(primarySpeed, primaryVal);
    animateNumber(secondarySpeed, secondaryVal);

    // bars (capped for display)
    const kmhPct = Math.min(100, (kmh / 400) * 100);
    const mphPct = Math.min(100, (mph / 250) * 100);
    primaryBar.style.width = (currentUnit === 'km' ? kmhPct : mphPct) + '%';
    secondaryBar.style.width = (currentUnit === 'km' ? mphPct : kmhPct) + '%';

    // meta line
    const trackOpt = trackSelect.selectedOptions[0];
    const trackName = trackOpt && trackOpt.value !== '' ? trackOpt.text.split(' · ')[0] : 'CUSTOM ROUTE';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds - mins * 60;
    resultMeta.textContent = `${trackName} · ${mins}:${secs.toFixed(3).padStart(6, '0')}`;

    resultPanel.classList.add('visible');
    triggerScan();
  }

  function animateNumber(el, target) {
    const duration = 700;
    const startVal = parseFloat(el.textContent) || 0;
    const startTs = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = startVal + (target - startVal) * eased;
      el.textContent = cur.toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(1);
    }
    requestAnimationFrame(step);
  }

  function triggerScan() {
    const scan = resultPanel.querySelector('.scan-line');
    if (!scan) return;
    scan.style.animation = 'none';
    scan.offsetHeight;
    scan.style.animation = '';
  }

  function shake(el) {
    el.style.animation = 'none';
    el.style.transform = 'translateX(0)';
    el.offsetHeight;
    el.style.transition = 'transform 0.06s';
    let n = 0;
    const seq = [0, -6, 6, -4, 4, -1, 1, 0];
    const iv = setInterval(() => {
      el.style.transform = `translateX(${seq[n]}px)`;
      n++;
      if (n >= seq.length) {
        clearInterval(iv);
        el.style.transform = '';
        el.style.transition = '';
      }
    }, 40);
  }

  // ===== Event bindings =====
  function bindEvents() {
    timeInput.addEventListener('input', () => {
      const formatted = formatTimeInput(timeInput.value);
      timeInput.value = formatted.raw;
      renderTimeMask(formatted);
      const total = parseTimeToSeconds(formatted);
      if (formatted.raw.length === 0) {
        setFeedback('Enter your lap time');
      } else if (total === null) {
        setFeedback('INVALID TIME', 'error');
      } else {
        const mins = Math.floor(total / 60);
        const secs = total - mins * 60;
        setFeedback(`READY · ${mins}:${secs.toFixed(3).padStart(6, '0')}`, 'ok');
      }
    });

    timeInput.addEventListener('focus', () => {
      renderTimeMask(formatTimeInput(timeInput.value));
    });

    trackSelect.addEventListener('change', () => {
      const opt = trackSelect.selectedOptions[0];
      if (opt && opt.value !== '' && opt.dataset.km) {
        const km = parseFloat(opt.dataset.km);
        setDistanceFromKm(km);
        trackHint.textContent = 'PRESET LOCKED';
      } else {
        trackHint.textContent = 'CUSTOM ROUTE';
      }
      if (lastDistanceKm !== null && lastTimeSeconds !== null) {
        renderResult(getDistanceKm(), lastTimeSeconds);
      }
    });

    distanceInput.addEventListener('input', () => {
      if (lastDistanceKm !== null && lastTimeSeconds !== null && timeInput.value.length > 0) {
        const km = getDistanceKm();
        if (km !== null) renderResult(km, lastTimeSeconds);
      }
    });

    unitBtns.forEach(b => {
      b.addEventListener('click', () => switchUnit(b.dataset.unit));
    });

    calcBtn.addEventListener('click', calculate);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calculate();
      }
    });

    window.addEventListener('resize', updateUnitIndicator);
  }

  // ===== Init =====
  function init() {
    initTracks();
    bindEvents();
    renderTimeMask({ mm: '--', ss: '--', ms: '---' });
    requestAnimationFrame(updateUnitIndicator);
    setTimeout(updateUnitIndicator, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();