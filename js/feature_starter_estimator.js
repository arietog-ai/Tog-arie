// js/feature_starter_estimator.js  v20260301-2
// 목표 설정 & 성공확률 페이지
// 공통 상수/함수 → starter_config.js 에서 import

import { byId, copyToClipboard } from './utils.js?v=20260301-2';
import {
  PERCENT_SET, INIT_VALUES, OPTION_NAMES, STEPS, HIGH_STONES_PER_RUN, SCALE,
  fmt, scale, checkStartCfg,
  makeInitialStartCfg, loadPresetFromSession,
  startRowHTML, selectedNames, syncOptionDisables, refreshInitVal,
} from './starter_config.js?v=20260301-2';

/* ===== 정확히 k회 강화 후 가능값 ===== */
function reachableExact(startV, incs, k) {
  const start     = scale(startV);
  const incScaled = incs.map(scale);
  let counts = new Map([[0, 1]]);
  for (let i = 0; i < k; i++) {
    const next = new Map();
    for (const [s, c] of counts)
      for (const inc of incScaled)
        next.set(s + inc, (next.get(s + inc) || 0) + c);
    counts = next;
  }
  const waysMap = {}, values = [];
  if (k === 0) { values.push(startV); waysMap[0] = 1; }
  else {
    for (const [sum, ways] of counts) {
      values.push((start + sum) / SCALE);
      waysMap[sum] = ways;
    }
  }
  values.sort((a, b) => a - b);
  return { values, waysMap };
}

/* ===== 다항분포 ===== */
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function multinomialCoef(counts) {
  const n = counts.reduce((a, b) => a + b, 0);
  return factorial(n) / counts.reduce((d, k) => d * factorial(k), 1);
}
function multinomialProb(counts, m = 4) {
  return multinomialCoef(counts) * Math.pow(1 / m, counts.reduce((a, b) => a + b, 0));
}

/* ===== 정확 확률 계산 ===== */
function exactProbability(startCfg, kMap, targetMap) {
  const opts = Object.keys(startCfg);
  const ks   = opts.map(o => kMap[o] || 0);
  if (ks.reduce((a, b) => a + b, 0) !== STEPS) return 0;

  let p = multinomialProb(ks, opts.length);
  for (const o of opts) {
    const k = kMap[o] || 0;
    if (k === 0) { if (targetMap[o] !== startCfg[o]) return 0; continue; }
    const { waysMap } = reachableExact(startCfg[o], INIT_VALUES[o], k);
    const deltaScaled = scale(targetMap[o] - startCfg[o]);
    const ways  = waysMap[deltaScaled] || 0;
    const denom = Math.pow(INIT_VALUES[o].length, k);
    p *= ways / denom;
    if (p === 0) break;
  }
  return p;
}

/* ===== 마운트 ===== */
export function mountStarterEstimator(app) {
  app.innerHTML = `
    <section class="container">
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <button class="hero-btn" id="back-starter">← 시뮬레이터로</button>
        <span class="pill">강화 예상 갯수</span>
      </div>

      <div class="card">
        <h2 class="section-title">0강 옵션</h2>
        <div id="s-start"></div>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title">목표 설정 &amp; 성공확률</h2>
        <div class="pill" id="remain" style="margin-bottom:6px">남은 강화횟수: 5</div>
        <div id="goal-host"></div>
        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">시동무기 사용 갯수(기대)</div>
            <div id="out-weapons" class="big ok">-</div>
            <div id="out-p" class="muted">성공확률 p: -</div>
          </div>
          <div class="card">
            <div class="big">예상 고급숫돌</div>
            <div id="out-stones-exp" class="big ok">-</div>
            <div class="muted">20강 1회 = ${HIGH_STONES_PER_RUN}개</div>
          </div>
        </div>
        <pre id="log" style="margin-top:10px;white-space:pre-wrap;font-size:13px;background:#0f1420;padding:12px;border-radius:12px;border:1px solid var(--line);"></pre>
        <button class="hero-btn" id="copy" style="margin-top:8px">📋 결과 복사</button>
      </div>
    </section>`;

  byId('back-starter').addEventListener('click', () => { location.hash = '#starter'; });

  /* ─ 0강 폼 ─ */
  byId('s-start').innerHTML = [1,2,3,4].map(startRowHTML).join('');

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
      rebuildGoalSection();
    });
    byId(`s${i}-val`).addEventListener('change', rebuildGoalSection);
  });

  /* ─ 목표 섹션 ─ */
  const goalHost  = byId('goal-host');
  const remainEl  = byId('remain');

  function getStartCfg() {
    const names = selectedNames();
    const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
    const cfg = Object.fromEntries(names.map((n, i) => [n, vals[i]]));
    checkStartCfg(cfg);
    return cfg;
  }

  function rebuildGoalSection() {
    const startCfg = getStartCfg();
    const names    = Object.keys(startCfg);

    goalHost.innerHTML = names.map((opt, idx) => {
      const id  = `g${idx + 1}`;
      const kSel = `<select id="${id}-k">${[0,1,2,3,4,5].map(k => `<option value="${k}">${k}회</option>`).join('')}</select>`;
      const { values } = reachableExact(startCfg[opt], INIT_VALUES[opt], 0);
      const vSel = `<select id="${id}-val">${values.map(v => `<option value="${v}">${fmt(opt, v)}</option>`).join('')}</select>`;
      return `
        <div class="card" style="margin-bottom:8px">
          <div class="grid cols-3" style="align-items:end;gap:8px">
            <div><label>옵션</label><input value="${opt}" id="${id}-name" disabled /></div>
            <div><label>강화 횟수(k)</label>${kSel}</div>
            <div><label>목표 값</label>${vSel}</div>
          </div>
          <small class="muted">증가치 후보: ${INIT_VALUES[opt].join(' / ')}${PERCENT_SET.has(opt) ? ' (%)' : ''}</small>
        </div>`;
    }).join('');

    function readKMap() {
      return Object.fromEntries(names.map((opt, idx) => [opt, parseInt(byId(`g${idx+1}-k`).value, 10)]));
    }
    const setRemaining = () => {
      const used = Object.values(readKMap()).reduce((a, b) => a + b, 0);
      const left = Math.max(0, STEPS - used);
      remainEl.textContent = `남은 강화횟수: ${left}`;
      remainEl.style.color = left === 0 ? 'var(--ok)' : 'var(--muted)';
      return left;
    };
    const refreshValueChoices = () => {
      const sc = getStartCfg();
      names.forEach((opt, idx) => {
        const id  = `g${idx+1}`;
        const k   = parseInt(byId(`${id}-k`).value, 10);
        const vEl = byId(`${id}-val`);
        const prev = parseFloat(vEl.value);
        const { values } = reachableExact(sc[opt], INIT_VALUES[opt], k);
        vEl.innerHTML = values.map(v => `<option value="${v}">${fmt(opt, v)}</option>`).join('');
        if (values.includes(prev)) vEl.value = prev;
      });
    };

    names.forEach((opt, idx) => {
      const id  = `g${idx+1}`;
      byId(`${id}-k`).addEventListener('change', () => {
        let kMap = readKMap();
        const used = Object.values(kMap).reduce((a, b) => a + b, 0);
        if (used > STEPS) {
          const over = used - STEPS;
          kMap[opt] = Math.max(0, kMap[opt] - over);
          byId(`${id}-k`).value = String(kMap[opt]);
        }
        setRemaining(); refreshValueChoices();
        try { compute(); } catch (e) { showError(e); }
      });
      byId(`${id}-val`).addEventListener('change', () => {
        try { compute(); } catch (e) { showError(e); }
      });
    });

    setRemaining(); refreshValueChoices();
    try { compute(); } catch (e) { showError(e); }
  }

  function showError(e) {
    byId('out-weapons').textContent = '-';
    byId('out-stones-exp').textContent = '-';
    byId('out-p').textContent = '성공확률 p: -';
    byId('log').textContent = '⚠️ ' + e.message;
  }

  rebuildGoalSection();

  /* ─ 확률 계산 ─ */
  function compute() {
    const startCfg = getStartCfg();
    const names    = Object.keys(startCfg);
    const kMap = {}, targetMap = {};
    names.forEach((opt, idx) => {
      const id = `g${idx+1}`;
      kMap[opt]    = parseInt(byId(`${id}-k`).value, 10);
      targetMap[opt] = parseFloat(byId(`${id}-val`).value);
    });
    const sumK = Object.values(kMap).reduce((a, b) => a + b, 0);
    if (sumK !== STEPS) throw new Error(`강화 횟수 합이 ${STEPS}가 아닙니다. (현재 ${sumK})`);

    const p = exactProbability(startCfg, kMap, targetMap);
    const expW = p > 0 ? (1 / p) : Infinity;
    const expS = p > 0 ? (HIGH_STONES_PER_RUN / p) : Infinity;

    byId('out-weapons').textContent   = p > 0 ? `${expW.toFixed(2)} 개` : '∞ 개';
    byId('out-stones-exp').textContent = p > 0 ? `${expS.toFixed(2)} 개` : '∞';
    byId('out-p').textContent = `성공확률 p ≈ ${(p * 100).toFixed(6)}%`;

    byId('log').textContent =
`시뮬레이션 요약

옵션
${names.map(n => `${n} : ${fmt(n, startCfg[n])}`).join('\n')}

목표 강화 횟수(k)
${names.map(n => `${n} : ${kMap[n]}회`).join('\n')}

목표 값
${names.map(n => `${n} : ${fmt(n, targetMap[n])}`).join('\n')}

계산
- 성공확률 p ≈ ${(p * 100).toFixed(6)}%
- 기대 시동무기 개수 = ${p > 0 ? (1 / p).toFixed(4) : '∞'}
- 기대 고급숫돌 개수 = ${p > 0 ? (HIGH_STONES_PER_RUN / p).toFixed(4) : '∞'} (1회 완주 ${HIGH_STONES_PER_RUN}개)`;
  }

  byId('copy').addEventListener('click', () => copyToClipboard(byId('log').textContent, '시뮬레이션 결과가 복사되었습니다!'));
}
