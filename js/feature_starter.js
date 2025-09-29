// js/feature_starter.js
// 시동무기 강화 시뮬레이터 (정확 확률 계산 버전)
// - 진입 시 0강: 4옵션 중복 없이 랜덤, 각 옵션 0강 값도 랜덤
// - 목표: 옵션별 강화횟수 k(합=5) 강제, "현재값에서 정확히 k회"로 가능한 값만 선택
// - 확률: 시뮬 없이 정확 계산 → 기대 시동무기 개수 = 1/p, 기대 고급숫돌 = 27/p
// - 홈으로 버튼 포함

/* ===== 옵션 그룹/값 정의 ===== */
const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"]; // %
const GROUP_B = ["회피","명중","효과적중","효과저항"]; // 수치
const GROUP_C = ["공격력","방어력","체력"]; // %
const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"]; // %
const PERCENT_SET = new Set([...GROUP_A, ...GROUP_C, ...GROUP_D]);

const INIT_VALUES = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5,2.5,3.5,4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3,6,9,12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1,1.5,2,2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5,2.5,3.5,4.5]])),
};
const INCS = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5,2.5,3.5,4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3,6,9,12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1,1.5,2,2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5,2.5,3.5,4.5]])),
};

/* ===== 강화/재료 상수 ===== */
const STEPS = 5;                // 4/8/12/16/20강 → 총 5회
const HIGH_STONES_PER_RUN = 27; // 20강 1회 완주 비용(고급숫돌)

/* ===== 유틸 ===== */
const byId = (id) => { const el=document.getElementById(id); if(!el) throw new Error(`#${id} 없음`); return el; };
const rand = (n) => (Math.random()*n)|0;
const randomChoice = (arr) => arr[rand(arr.length)];
const unique = (arr) => Array.from(new Set(arr));
const OPTION_NAMES = Object.keys(INIT_VALUES);
const fmt = (opt, v) => PERCENT_SET.has(opt) ? `${v}%` : `${v}`;

/* --- 부동소수 오차 방지: 모든 값을 *2 스케일로 정수화 --- */
const SCALE = 2; // 0.5 단위까지 정확
const scale = (x) => Math.round(x * SCALE);

/* ===== 초기 0강 랜덤 세팅(중복 없는 4옵션) ===== */
function randomDistinctOptions(n=4){
  const pool = OPTION_NAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(i+1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
function makeInitialStartCfg(){
  const names = randomDistinctOptions(4);
  const cfg = {};
  for(const n of names){ cfg[n] = randomChoice(INIT_VALUES[n]); }
  return cfg;
}

/* ===== 0강 유효성 검사 ===== */
function checkStartCfg(cfg){
  const keys = Object.keys(cfg);
  if(keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if(unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k=>{
    if(!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]} (허용: ${INIT_VALUES[k].join('/')})`);
  });
}

/* ===== 정확히 k회 강화해서 도달 가능한 값 목록 + 경우의 수(순서 포함) ===== */
function reachableExact(startV, incs, k){
  const start = scale(startV);
  const incScaled = incs.map(scale);
  let counts = new Map(); // sum -> ways
  counts.set(0, 1);
  for(let i=0;i<k;i++){
    const next = new Map();
    for(const [s, c] of counts.entries()){
      for(const inc of incScaled){
        const ns = s + inc;
        next.set(ns, (next.get(ns) || 0) + c);
      }
    }
    counts = next;
  }
  const waysMap = {};
  const values = [];
  if(k===0){
    values.push(startV);
    waysMap[0] = 1;
  }else{
    for(const [sum, ways] of counts.entries()){
      const v = (start + sum) / SCALE;
      values.push(v);
      waysMap[sum] = ways;
    }
  }
  values.sort((a,b)=>a-b);
  return { values, waysMap };
}

/* ===== 멀티노미얼 계수/확률 ===== */
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function multinomialCoef(counts){
  const n = counts.reduce((a,b)=>a+b,0);
  let denom = 1; for(const k of counts) denom *= factorial(k);
  return factorial(n) / denom;
}
function multinomialProb(counts, m=4){
  const n = counts.reduce((a,b)=>a+b,0);
  return multinomialCoef(counts) * Math.pow(1/m, n);
}

/* ===== 정확 확률 계산 ===== */
function exactProbability(startCfg, kMap, targetMap){
  const opts = Object.keys(startCfg);
  const ks = opts.map(o => kMap[o] || 0);
  if (ks.reduce((a,b)=>a+b,0) !== STEPS) return 0;

  let p = multinomialProb(ks, opts.length); // 옵션 균등 선택 확률

  for(const o of opts){
    const k = kMap[o] || 0;
    if(k===0){
      if(targetMap[o] !== startCfg[o]) return 0; // k=0이면 값이 그대로여야 함
      continue;
    }
    const { waysMap } = reachableExact(startCfg[o], INCS[o], k);
    const deltaScaled = scale(targetMap[o] - startCfg[o]);
    const ways = waysMap[deltaScaled] || 0;
    const denom = Math.pow(INCS[o].length, k); // 증가치 후보 균등
    p *= (ways / denom);
    if(p===0) break;
  }
  return p;
}

/* ===== 뷰 ===== */
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="starter-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 시뮬레이터</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 강화 시뮬레이터</h2>
        <p class="muted">
          0→20강 동안 <b>5회</b> 강화(매번 4옵션 중 1개만 증가, 증가치는 옵션의 후보 중 랜덤).<br/>
          목표는 옵션별 k(합=5)를 고르고, "현재값에서 정확히 k회"로 가능한 값만 선택합니다. (% 항목은 %로 표기)
        </p>

        <div class="grid cols-2" style="margin-top:10px">
          <div>
            <h3 style="margin:6px 0">1) 0강 옵션 (중복 불가, 기본 랜덤)</h3>
            <div id="starter-start"></div>
          </div>
          <div>
            <h3 style="margin:6px 0">2) 목표 설정 (k 합=5)</h3>
            <div class="pill" id="starter-remaining" style="margin-bottom:6px">남은 강화횟수: 5</div>
            <div id="starter-goal"></div>
          </div>
        </div>

        <!-- 결과: 1) 시동무기 사용 갯수(기대) → 2) 예상 고급숫돌 사용갯수 -->
        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">① 목표 달성까지 필요한 시동무기 개수(기대)</div>
            <div class="pill" style="margin-top:6px">= 1 / p (p: 정확 확률)</div>
            <div id="starter-out-weapons" class="big ok" style="margin-top:8px">-</div>
            <div id="starter-out-p" class="muted" style="margin-top:6px">성공확률 p: -</div>
          </div>
          <div class="card">
            <div class="big">② 예상 고급숫돌 사용갯수</div>
            <div class="pill" style="margin-top:6px">= 27 / p</div>
            <div id="starter-out-stones-exp" class="big ok" style="margin-top:8px">-</div>
            <div class="muted" style="margin-top:6px">고급숫돌 1개 = 10,000 XP</div>
          </div>
        </div>

        <pre id="starter-log" class="mono" style="margin-top:10px"></pre>
      </div>
    </section>
  `;

  // 홈
  byId('starter-home-btn').addEventListener('click', ()=>{ location.hash=''; });

  /* ---------- 0강 폼 ---------- */
  const startHost = byId('starter-start');

  function startRow(id){
    return `
      <div class="grid cols-2" style="align-items:end; gap:8px; margin-bottom:6px">
        <div>
          <label>옵션 ${id}</label>
          <select class="s-name" id="s${id}-name">
            ${OPTION_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>0강 값</label>
          <select class="s-val" id="s${id}-val"></select>
        </div>
      </div>
    `;
  }
  startHost.innerHTML = startRow(1)+startRow(2)+startRow(3)+startRow(4);

  // 랜덤 초기 배정
  const defaultStart = makeInitialStartCfg();
  [1,2,3,4].forEach((i,idx)=>{
    const nameSel = byId(`s${i}-name`);
    const n = Object.keys(defaultStart)[idx];
    nameSel.value = n;
  });

  function refreshInitVal(id, setRandom=false){
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name = nameSel.value;
    const arr = INIT_VALUES[name];
    valSel.innerHTML = arr.map(v=>`<option value="${v}">${fmt(name, v)}</option>`).join('');
    if(setRandom) valSel.value = randomChoice(arr);
  }
  [1,2,3,4].forEach(i=> refreshInitVal(i, true));

  // 옵션 중복 방지
  function selectedNames(){ return [1,2,3,4].map(i=>byId(`s${i}-name`).value); }
  function syncOptionDisables(){
    const chosen = selectedNames();
    const nameSels = Array.from(document.querySelectorAll('.s-name'));
    nameSels.forEach(sel=>{
      const current = sel.value;
      Array.from(sel.options).forEach(opt=>{
        const val = opt.value;
        opt.disabled = (val!==current) && chosen.includes(val);
      });
    });
  }
  syncOptionDisables();

  [1,2,3,4].forEach(i=>{
    byId(`s${i}-name`).addEventListener('change', ()=>{
      refreshInitVal(i, false);
      syncOptionDisables();
      rebuildGoalSection();
    });
    byId(`s${i}-val`).addEventListener('change', rebuildGoalSection);
  });

  /* ---------- 목표 섹션 ---------- */
  const goalHost = byId('starter-goal');
  const remainingEl = byId('starter-remaining');

  function getStartCfg(){
    const names = selectedNames();
    const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
    const cfg = Object.fromEntries(names.map((n,i)=>[n, vals[i]]));
    checkStartCfg(cfg);
    return cfg;
  }

  function rebuildGoalSection(){
    const startCfg = getStartCfg();
    const names = Object.keys(startCfg);

    // 빌드
    goalHost.innerHTML = names.map((opt, idx)=>{
      const id = `g${idx+1}`;
      const kSel = `<select id="${id}-k">${[0,1,2,3,4,5].map(k=>`<option value="${k}">${k}회</option>`).join('')}</select>`;
      const { values } = reachableExact(startCfg[opt], INCS[opt], 0);
      const vSel = `<select id="${id}-val">${values.map(v=>`<option value="${v}">${fmt(opt, v)}</option>`).join('')}</select>`;
      return `
        <div class="card" style="margin-bottom:8px">
          <div class="grid cols-3" style="align-items:end; gap:8px">
            <div>
              <label>옵션</label>
              <input value="${opt}" id="${id}-name" disabled />
            </div>
            <div>
              <label>강화 횟수(k)</label>
              ${kSel}
            </div>
            <div>
              <label>목표 값(정확히 k회 가능값)</label>
              ${vSel}
            </div>
          </div>
          <small class="muted">증가치 후보: ${INCS[opt].join(' / ')}${PERCENT_SET.has(opt)?' (%)':''}</small>
        </div>
      `;
    }).join('');

    // k 합 표시
    const readKMap = ()=>{
      const kMap = {};
      names.forEach((opt, idx)=>{
        const id = `g${idx+1}`;
        kMap[opt] = parseInt(byId(`${id}-k`).value, 10);
      });
      return kMap;
    };
    const setRemaining = ()=>{
      const used = Object.values(readKMap()).reduce((a,b)=>a+b,0);
      const left = Math.max(0, STEPS - used);
      remainingEl.textContent = `남은 강화횟수: ${left}`;
      remainingEl.style.color = (left===0 ? 'var(--ok)' : 'var(--muted)');
      return left;
    };
    const refreshValueChoices = ()=>{
      const startCfg2 = getStartCfg();
      names.forEach((opt, idx)=>{
        const id = `g${idx+1}`;
        const k = parseInt(byId(`${id}-k`).value,10);
        const vEl = byId(`${id}-val`);
        const prev = parseFloat(vEl.value);
        const { values } = reachableExact(startCfg2[opt], INCS[opt], k);
        vEl.innerHTML = values.map(v=>`<option value="${v}">${fmt(opt, v)}</option>`).join('');
        if(values.includes(prev)) vEl.value = prev;
      });
    };

    // 이벤트: k 변경 → 합 5 맞추고, 값 후보 갱신, compute()
    names.forEach((opt, idx)=>{
      const id = `g${idx+1}`;
      const kEl = byId(`${id}-k`);
      const vEl = byId(`${id}-val`);

      kEl.addEventListener('change', ()=>{
        let kMap = readKMap();
        let used = Object.values(kMap).reduce((a,b)=>a+b,0);
        if(used > STEPS){
          const over = used - STEPS;
          kMap[opt] = Math.max(0, kMap[opt] - over);
          kEl.value = String(kMap[opt]);
        }
        setRemaining();
        refreshValueChoices();
        try { compute(); } catch(e) { showComputeError(e); }
      });

      vEl.addEventListener('change', ()=>{
        try { compute(); } catch(e) { showComputeError(e); }
      });
    });

    // 초기 표시 + 초기 계산
    setRemaining();
    refreshValueChoices();
    try { compute(); } catch(e) { showComputeError(e); }
  }

  function showComputeError(e){
    byId('starter-out-weapons').textContent = '-';
    byId('starter-out-stones-exp').textContent = '-';
    byId('starter-out-p').textContent = '성공확률 p: -';
    byId('starter-log').textContent = '⚠️ ' + e.message;
  }

  rebuildGoalSection(); // 최초 1회

  /* ---------- 계산 실행(정확 확률) ---------- */
  function compute(){
    const startCfg = getStartCfg();
    const names = Object.keys(startCfg);

    // kMap / targetMap 수집
    const kMap = {};
    const targetMap = {};
    names.forEach((opt, idx)=>{
      const id = `g${idx+1}`;
      kMap[opt] = parseInt(byId(`${id}-k`).value,10);
      targetMap[opt] = parseFloat(byId(`${id}-val`).value);
    });

    const sumK = Object.values(kMap).reduce((a,b)=>a+b,0);
    if(sumK !== STEPS) throw new Error(`강화 횟수 합이 ${STEPS}가 아닙니다. (현재 ${sumK})`);

    const p = exactProbability(startCfg, kMap, targetMap);
    const expectedWeapons = (p>0) ? (1/p) : Infinity;
    const expectedStones  = (p>0) ? (HIGH_STONES_PER_RUN/p) : Infinity;

    byId('starter-out-weapons').textContent = (p>0 ? `${expectedWeapons.toFixed(2)} 개` : '∞ 개');
    byId('starter-out-stones-exp').textContent = (p>0 ? `${expectedStones.toFixed(2)} 개` : '∞');
    byId('starter-out-p').textContent = `성공확률 p ≈ ${(p*100).toFixed(6)}%`;

    // 로그: % 표기 반영
    const startLog = Object.fromEntries(names.map(n=>[n, fmt(n, startCfg[n])]));
    const targetLog = Object.fromEntries(names.map(n=>[n, fmt(n, targetMap[n])]));
    byId('starter-log').textContent =
`입력 요약
- 0강: ${JSON.stringify(startLog)}
- k(합=5): ${JSON.stringify(kMap)}
- 목표: ${JSON.stringify(targetLog)}

계산
- 성공확률 p ≈ ${(p*100).toFixed(6)}%
- 기대 시동무기 개수 = ${p>0 ? (1/p).toFixed(4) : '∞'}
- 기대 고급숫돌 개수 = ${p>0 ? (HIGH_STONES_PER_RUN/p).toFixed(4) : '∞'} (1회 완주 27개)`;
  }
}