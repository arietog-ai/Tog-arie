// js/feature_starter.js  v20260301-2
// 시동무기 강화 시뮬레이터
// 공통 상수/함수 → starter_config.js / utils.js 에서 import

import { byId, rand, choice, copyToClipboard } from './utils.js?v=20260301-2';
import {
  PERCENT_SET, INIT_VALUES, OPTION_NAMES, STEPS, SCALE,
  fmt, scale, checkStartCfg,
  makeInitialStartCfg, loadPresetFromSession,
  startRowHTML, selectedNames, syncOptionDisables, refreshInitVal,
} from './starter_config.js?v=20260301-2';

const MC_TOTAL = 100_000_000;
const MC_BATCH = 200_000;

/* ===== 5회 강화 1회 실행 ===== */
function runOneSequence(names, startCfg) {
  const lines  = [];
  const state  = { ...startCfg };
  const counts = Object.fromEntries(names.map(n => [n, 0]));
  for (let s = 1; s <= STEPS; s++) {
    const opt  = names[rand(4)];
    const inc  = choice(INIT_VALUES[opt]);
    counts[opt]++;
    const before = state[opt];
    const after  = PERCENT_SET.has(opt)
      ? Math.round((before + inc) * 2) / 2
      : Math.round(before + inc);
    state[opt] = after;
    lines.push(`${s}회차: ${opt} +${fmt(opt, inc)}  (${fmt(opt, before)} → ${fmt(opt, after)})`);
  }
  return { lines, final: state, counts };
}

/* ===== Monte Carlo 초기화/배치 ===== */
function mcInit(names, startCfg) {
  return {
    names, startCfg, N: 0,
    sumFinalScaled: [0, 0, 0, 0],
    stop: false, doneBatches: 0,
    totalBatches: Math.ceil(MC_TOTAL / MC_BATCH),
  };
}
function mcRunBatch(stat) {
  const incArr      = stat.names.map(n => INIT_VALUES[n]);
  const startScaled = stat.names.map(n => scale(stat.startCfg[n]));
  for (let t = 0; t < MC_BATCH; t++) {
    if (stat.stop) break;
    const sumInc = [0, 0, 0, 0];
    for (let s = 0; s < STEPS; s++) {
      const i = rand(4);
      sumInc[i] += scale(incArr[i][rand(incArr[i].length)]);
    }
    for (let i = 0; i < 4; i++) stat.sumFinalScaled[i] += startScaled[i] + sumInc[i];
    stat.N++;
  }
}

function roundDisplayValue(opt, v) {
  if (PERCENT_SET.has(opt)) {
    const r = Math.round(v * 2) / 2;
    return { num: r, txt: `${r.toFixed(1)}%` };
  } else {
    const r = Math.round(v);
    return { num: r, txt: String(r) };
  }
}

/* ===== 마운트 ===== */
export function mountStarter(app) {
  app.innerHTML = `
    <section class="container">
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap;">
        <button class="hero-btn" id="starter-home-btn">← 홈으로</button>
        <button class="hero-btn" id="starter-draw-btn">← 뽑기로</button>
        <span class="pill">시동무기 강화 시뮬레이터</span>
        <button class="hero-btn" id="go-estimator" style="margin-left:auto">강화 예상 갯수</button>
      </div>

      <div class="card">
        <h2 class="section-title">0강 옵션</h2>
        <div id="starter-start"></div>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title">20강 기대값</h2>
        <p class="muted" style="margin:6px 0 10px;font-size:13px;">
          0강 구성으로 5회 강화를 대량 시뮬해 기대 최종값을 보여줍니다.
        </p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="hero-btn" id="mc-run">20강 기대값</button>
          <button class="hero-btn" id="mc-stop">중지</button>
          <button class="hero-btn" id="mc-reset">초기화</button>
          <label style="display:inline-flex;align-items:center;gap:6px;margin-left:6px">
            <input type="checkbox" id="dev-log-toggle" />
            <span class="muted">20강 강화하기</span>
          </label>
          <button class="hero-btn" id="mc-build" style="display:none">만들기</button>
          <button class="hero-btn" id="go-reforge" disabled>세공하자</button>
          <span id="mc-status" class="muted" style="margin-left:6px"></span>
          <div class="mc-progress"><div class="mc-progress__bar" id="mc-progress-bar" style="width:0%"></div></div>
        </div>
        <div id="mc-out" style="margin-top:10px"></div>
        <pre id="mc-log" style="margin-top:10px;display:none;white-space:pre-wrap;font-size:13px;"></pre>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title">목표 설정 &amp; 성공확률</h2>
        <p class="muted">이 기능은 <b>별도 페이지</b>로 분리되었습니다.
          상단의 <em>강화 예상 갯수</em> 버튼을 눌러 이동하세요.</p>
      </div>
    </section>`;

  byId('starter-home-btn').addEventListener('click', () => { location.hash = ''; });
  byId('starter-draw-btn').addEventListener('click', () => { location.hash = '#draw'; });
  byId('go-estimator').addEventListener('click', () => { location.hash = '#starter/estimator'; });

  /* ─ 0강 폼 ─ */
  byId('starter-start').innerHTML = [1,2,3,4].map(startRowHTML).join('');

  let defaultStart = loadPresetFromSession() || makeInitialStartCfg();
  const defNames = Object.keys(defaultStart);
  [1,2,3,4].forEach((i, idx) => {
    byId(`s${i}-name`).value = defNames[idx] || OPTION_NAMES[idx];
  });
  [1,2,3,4].forEach(i => refreshInitVal(i, defaultStart, false));
  syncOptionDisables();

  [1,2,3,4].forEach(i => {
    byId(`s${i}-name`).addEventListener('change', () => {
      refreshInitVal(i, {}, false);
      syncOptionDisables();
    });
  });

  /* ─ 로그 토글 ─ */
  const devToggle = byId('dev-log-toggle');
  const buildBtn  = byId('mc-build');
  const reforgeBtn= byId('go-reforge');
  const logBox    = byId('mc-log');
  const statusEl  = byId('mc-status');
  const barEl     = byId('mc-progress-bar');

  devToggle.addEventListener('change', () => {
    const on = devToggle.checked;
    buildBtn.style.display = on ? '' : 'none';
    logBox.style.display = on ? '' : 'none';
    if (!on) logBox.textContent = '';
  });

  /* ─ 만들기 ─ */
  buildBtn.addEventListener('click', () => {
    try {
      const names = selectedNames();
      const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
      const startCfg = Object.fromEntries(names.map((n, i) => [n, vals[i]]));
      checkStartCfg(startCfg);
      const { lines, final, counts } = runOneSequence(names, startCfg);
      logBox.textContent =
        `20강 강화 로그\n\n${lines.join('\n')}\n\n최종값\n${names.map(o => `${o}: ${fmt(o, final[o])} (k=${counts[o]||0})`).join('\n')}`;
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start: startCfg, final, counts }));
      reforgeBtn.disabled = false;
    } catch (e) {
      logBox.textContent = `⚠️ ${e.message}`;
    }
  });

  reforgeBtn.addEventListener('click', () => {
    if (!reforgeBtn.disabled) location.hash = '#starter/reforge';
  });

  /* ─ MC 렌더 ─ */
  function renderMC(stat) {
    if (stat.N === 0) return '';
    const avgVals = stat.sumFinalScaled.map(s => (s / stat.N) / SCALE);
    const lines = stat.names.map((opt, i) => {
      const disp = roundDisplayValue(opt, avgVals[i]);
      return `<div class="card" style="padding:10px">${opt} : ${fmt(opt, stat.startCfg[opt])} → <b>${disp.txt}</b></div>`;
    }).join('');
    return `<div class="grid cols-2" style="gap:8px;margin-top:6px">${lines}</div>`;
  }
  function updateProgress(stat) {
    const pct = Math.min(100, Math.floor((stat.N / MC_TOTAL) * 100));
    barEl.style.width = pct + '%';
    statusEl.textContent = `진행 중... (${stat.doneBatches}/${stat.totalBatches} 배치, ${pct}%)`;
  }

  function runMonteCarlo(startCfg) {
    const names = Object.keys(startCfg);
    const stat  = mcInit(names, startCfg);
    statusEl.textContent = `진행 중... (0/${stat.totalBatches} 배치, 0%)`;
    barEl.style.width = '0%';
    byId('mc-out').innerHTML = '';

    const step = () => {
      const done = stat.stop || stat.N >= MC_TOTAL;
      if (done) {
        statusEl.textContent = '완료';
        byId('mc-out').innerHTML = renderMC(stat);
        updateProgress(stat);
        return;
      }
      mcRunBatch(stat);
      stat.doneBatches++;
      if (stat.doneBatches % 2 === 0) updateProgress(stat);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    byId('mc-stop').onclick  = () => { stat.stop = true; };
    byId('mc-reset').onclick = () => {
      stat.stop = true;
      statusEl.textContent = '';
      byId('mc-out').innerHTML = '';
      barEl.style.width = '0%';
    };
  }

  byId('mc-run').addEventListener('click', () => {
    try {
      const names = selectedNames();
      const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
      const startCfg = Object.fromEntries(names.map((n, i) => [n, vals[i]]));
      checkStartCfg(startCfg);
      runMonteCarlo(startCfg);
    } catch (e) {
      statusEl.textContent = '오류';
      byId('mc-out').innerHTML = `<div class="bad">⚠️ ${e.message}</div>`;
    }
  });
}
