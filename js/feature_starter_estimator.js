// js/feature_starter_estimator.js
// 목표 설정 & 성공확률 전용 페이지

import { byId, rand, choice } from './utils.js';
import {
  INIT_VALUES, INCS, OPTION_NAMES, PERCENT_SET,
  STEPS, HIGH_STONES_PER_RUN, SCALE,
  fmt, scale,
  makeInitialStartCfg, checkStartCfg,
} from './starter_config.js';

/* ── 정확히 k회 강화 결과 후보 ── */
function reachableExact(startV, incs, k) {
  const start     = scale(startV);
  const incScaled = incs.map(scale);
  let counts = new Map([[0, 1]]);
  for (let i = 0; i < k; i++) {
    const next = new Map();
    for (const [s, c] of counts) {
      for (const inc of incScaled) {
        const ns = s + inc;
        next.set(ns, (next.get(ns) || 0) + c);
      }
    }
    counts = next;
  }
  const waysMap = {};
  const values  = [];
  if (k === 0) { values.push(startV); waysMap[0] = 1; }
  else {
    for (const [sum, ways] of counts) {
      values.push((start + sum) / SCALE);
      waysMap[sum] = ways;
    }
  }
  return { values: values.sort((a, b) => a - b), waysMap };
}

/* ── 확률 계산 ── */
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function multinomialProb(counts, m = 4) {
  const n    = counts.reduce((a, b) => a + b, 0);
  let denom  = 1; for (const k of counts) denom *= factorial(k);
  return (factorial(n) / denom) * Math.pow(1 / m, n);
}
function exactProbability(startCfg, kMap, targetMap) {
  const opts = Object.keys(startCfg);
  const ks   = opts.map(o => kMap[o] || 0);
  if (ks.reduce((a, b) => a + b, 0) !== STEPS) return 0;
  let p = multinomialProb(ks, opts.length);
  for (const o of opts) {
    const k = kMap[o] || 0;
    if (k === 0) { if (targetMap[o] !== startCfg[o]) return 0; continue; }
    const { waysMap } = reachableExact(startCfg[o], INCS[o], k);
    const deltaScaled = scale(targetMap[o] - startCfg[o]);
    p *= (waysMap[deltaScaled] || 0) / Math.pow(INCS[o].length, k);
    if (p === 0) break;
  }
  return p;
}

/* ── 뷰 ── */
export function mountStarterEstimator(app) {
  app.innerHTML = `
    <section class="container">
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
        <button id="back-starter" class="hero-btn">← 시뮬레이터로</button>
        <span class="pill">강화 예상 갯수</span>
      </div>

      <div class="card">
        <h2 class="section-title" style="margin-top:0">0강 옵션</h2>
        <div id="s-start"></div>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title" style="margin-top:0">목표 설정 &amp; 성공확률</h2>
        <div class="pill" id="remain" style="margin-bottom:6px">남은 강화횟수: 5</div>
        <div id="goal-host"></div>

        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">시동무기 사용 갯수(기대)</div>
            <div id="out-weapons" class="big ok">-</div>
            <div id="out-p" class="muted">성공확률 p: -</div>
          </div>
          <div class="card">
            <div class="big">예상 고급숫돌 사용갯수</div>
            <div id="out-stones-exp" class="big ok">-</div>
            <div class="muted">고급숫돌 1개 = 10,000 XP (20강 1회=27개)</div>
          </div>
        </div>

        <pre id="log" class="output" style="margin-top:10px"></pre>
        <button id="copy" class="hero-btn" style="margin-top:8px">📋 결과 복사</button>
      </div>
    </section>
  `;

  byId('back-starter').addEventListener('click', () => { location.hash = '#starter'; });

  /* ── 0강 폼 ── */
  const startHost = byId('s-start');
  const startRow = id => `
    <div class="grid cols-2" style="align-items:end;gap:8px;margin-bottom:8px">
      <div>
        <label>항목</label>
        <select class="s-name" id="s${id}-name">
          ${OPTION_NAMES.map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>0강 값</label>
        <select class="s-val" id="s${id}-val"></select>
      </div>
    </div>`;
  startHost.innerHTML = startRow(1) + startRow(2) + startRow(3) + startRow(4);

  let defaultStart = makeInitialStartCfg();
  try {
    const raw = sessionStorage.getItem('starter_preset');
    if (raw) {
      const preset = JSON.parse(raw);
      sessionStorage.removeItem('starter_preset');
      defaultStart = {};
      preset.starter4.forEach(o => { defaultStart[o.stat] = o.value; });
    }
  } catch (_) {}

  const defNames = Object.keys(defaultStart);
  [1, 2, 3, 4].forEach((i, idx) => {
    byId(`s${i}-name`).value = defNames[idx] || OPTION_NAMES[idx];
  });

  function refreshInitVal(id, setRandom = false) {
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name    = nameSel.value;
    const arr     = INIT_VALUES[name];
    valSel.innerHTML = arr.map(v => `<option value="${v}">${fmt(name, v)}</option>`).join('');
    if (setRandom) valSel.value = choice(arr);
    else if (defaultStart[name] != null) valSel.value = defaultStart[name];
  }
  [1, 2, 3, 4].forEach(i => refreshInitVal(i, true));

  function selectedNames() { return [1, 2, 3, 4].map(i => byId(`s${i}-name`).value); }
  function syncOptionDisables() {
    const chosen = selectedNames();
    document.querySelectorAll('.s-name').forEach(sel => {
      const cur = sel.value;
      Array.from(sel.options).forEach(opt => {
        opt.disabled = opt.value !== cur && chosen.includes(opt.value);
      });
    });
  }
  syncOptionDisables();
  [1, 2, 3, 4].forEach(i => {
    byId(`s${i}-name`).addEventListener('change', () => {
      refreshInitVal(i, false); syncOptionDisables(); rebuildGoalSection();
    });
    byId(`s${i}-val`).addEventListener('change', rebuildGoalSection);
  });

  /* ── 목표 섹션 ── */
  function getStartCfg() {
    const names = selectedNames();
    const vals  = [1, 2, 3, 4].map(i => parseFloat(byId(`s${i}-val`).value));
    const cfg   = Object.fromEntries(names.map((n, i) => [n, vals[i]]));
    checkStartCfg(cfg);
    return cfg;
  }

  function rebuildGoalSection() {
    const startCfg = getStartCfg();
    const names    = Object.keys(startCfg);
    const goalHost = byId('goal-host');
    const remainEl = byId('remain');

    goalHost.innerHTML = names.map((opt, idx) => {
      const id    = `g${idx + 1}`;
      const kSel  = `<select id="${id}-k">${[0,1,2,3,4,5].map(k => `<option value="${k}">${k}회</option>`).join('')}</select>`;
      const { values } = reachableExact(startCfg[opt], INCS[opt], 0);
      const vSel  = `<select id="${id}-val">${values.map(v => `<option value="${v}">${fmt(opt, v)}</option>`).join('')}</select>`;
      return `
        <div class="card" style="margin-bottom:8px">
          <div class="grid cols-3" style="align-items:end;gap:8px">
            <div>
              <label>옵션</label>
              <input value="${opt}" id="${id}-name" disabled />
            </div>
            <div>
              <label>강화 횟수(k)</label>${kSel}
            </div>
            <div>
              <label>목표 값</label>${vSel}
            </div>
          </div>
          <small class="muted">증가치 후보: ${INCS[opt].join(' / ')}${PERCENT_SET.has(opt) ? ' (%)' : ''}</small>
        </div>`;
    }).join('');

    const readKMap = () => Object.fromEntries(
      names.map((opt, idx) => [opt, parseInt(byId(`g${idx+1}-k`).value, 10)])
    );
    const setRemaining = () => {
      const used = Object.values(readKMap()).reduce((a, b) => a + b, 0);
      const left = Math.max(0, STEPS - used);
      remainEl.textContent = `남은 강화횟수: ${left}`;
      remainEl.style.color = left === 0 ? 'var(--ok)' : 'var(--muted)';
      return left;
    };
    const refreshValueChoices = () => {
      names.forEach((opt, idx) => {
        const k    = parseInt(byId(`g${idx+1}-k`).value, 10);
        const vEl  = byId(`g${idx+1}-val`);
        const prev = parseFloat(vEl.value);
        const { values } = reachableExact(getStartCfg()[opt], INCS[opt], k);
        vEl.innerHTML = values.map(v => `<option value="${v}">${fmt(opt, v)}</option>`).join('');
        if (values.includes(prev)) vEl.value = prev;
      });
    };

    names.forEach((opt, idx) => {
      const kEl = byId(`g${idx+1}-k`);
      kEl.addEventListener('change', () => {
        const kMap = readKMap();
        const over = Object.values(kMap).reduce((a, b) => a + b, 0) - STEPS;
        if (over > 0) { kMap[opt] = Math.max(0, kMap[opt] - over); kEl.value = String(kMap[opt]); }
        setRemaining(); refreshValueChoices();
        try { compute(); } catch (e) { showError(e); }
      });
      byId(`g${idx+1}-val`).addEventListener('change', () => { try { compute(); } catch (e) { showError(e); } });
    });

    setRemaining(); refreshValueChoices();
    try { compute(); } catch (e) { showError(e); }
  }

  function showError(e) {
    byId('out-weapons').textContent     = '-';
    byId('out-stones-exp').textContent  = '-';
    byId('out-p').textContent           = '성공확률 p: -';
    byId('log').textContent             = '⚠️ ' + e.message;
  }

  rebuildGoalSection();

  function compute() {
    const startCfg = getStartCfg();
    const names    = Object.keys(startCfg);
    const kMap     = Object.fromEntries(names.map((opt, idx) => [opt, parseInt(byId(`g${idx+1}-k`).value, 10)]));
    const targetMap= Object.fromEntries(names.map((opt, idx) => [opt, parseFloat(byId(`g${idx+1}-val`).value)]));

    const sumK = Object.values(kMap).reduce((a, b) => a + b, 0);
    if (sumK !== STEPS) throw new Error(`강화 횟수 합이 ${STEPS}가 아닙니다. (현재 ${sumK})`);

    const p               = exactProbability(startCfg, kMap, targetMap);
    const expectedWeapons = p > 0 ? 1 / p : Infinity;
    const expectedStones  = p > 0 ? HIGH_STONES_PER_RUN / p : Infinity;

    byId('out-weapons').textContent    = p > 0 ? `${expectedWeapons.toFixed(2)} 개` : '∞ 개';
    byId('out-stones-exp').textContent = p > 0 ? `${expectedStones.toFixed(2)} 개`  : '∞';
    byId('out-p').textContent          = `성공확률 p ≈ ${(p * 100).toFixed(6)}%`;

    byId('log').textContent = `시뮬레이션 요약\n\n옵션\n${
      names.map(n => `${n} : ${fmt(n, startCfg[n])}`).join('\n')
    }\n\n목표 강화 횟수(k)\n${
      names.map(n => `${n} : ${kMap[n]}회`).join('\n')
    }\n\n목표 값\n${
      names.map(n => `${n} : ${fmt(n, targetMap[n])}`).join('\n')
    }\n\n계산\n- 성공확률 p ≈ ${(p * 100).toFixed(6)}%\n- 기대 시동무기 개수 = ${
      p > 0 ? (1/p).toFixed(4) : '∞'
    }\n- 기대 고급숫돌 개수 = ${
      p > 0 ? (HIGH_STONES_PER_RUN/p).toFixed(4) : '∞'
    } (1회 완주 27개)`;
  }

  byId('copy').addEventListener('click', () => {
    navigator.clipboard.writeText(byId('log').textContent)
      .then(() => alert('시뮬레이션 결과가 복사되었습니다!'));
  });
}
