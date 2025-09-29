// js/feature_starter.js
// 시동무기 강화 시뮬레이터 (정확 확률 계산 버전; 시뮬 X)
// - 초기 0강: 4옵션을 중복 없이 랜덤 배정, 각 옵션의 0강 값도 랜덤 배정
// - 사용자는 옵션명/0강값을 수정할 수 있지만, 드롭다운에서 중복 방지 자동 적용
// - 목표 설정: 각 옵션의 강화횟수 k_i(0..5) 선택, 4옵션의 k 합이 정확히 5가 되도록 강제
//   + 각 옵션의 목표 수치는 "현재값 + (증가치 후보를 정확히 k_i번 합산)"으로 도달 가능한 값만 선택 가능
// - 결과: p = 확률(5회 균등강화 + 증가치 랜덤으로 목표에 정확히 도달)
//         기대 시동무기 개수 = 1/p, 기대 고급숯돌 = 27/p

/* ===== 옵션 그룹/값 정의 ===== */
const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"]; // %단위
const GROUP_B = ["회피","명중","효과적중","효과저항"]; // 수치
const GROUP_C = ["공격력","방어력","체력"]; // %단위
const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"]; // %단위

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
const STEPS = 5;                    // 4/8/12/16/20강 → 총 5회
const HIGH_STONES_PER_RUN = 27;     // 20강 1회 완주 비용(고급 숫돌)

/* ===== 유틸 ===== */
const byId = (id) => { const el=document.getElementById(id); if(!el) throw new Error(`#${id} 없음`); return el; };
const rand = (n) => (Math.random()*n)|0;
const randomChoice = (arr) => arr[rand(arr.length)];
const unique = (arr) => Array.from(new Set(arr));
const OPTION_NAMES = Object.keys(INIT_VALUES);

/* --- 부동소수 오차 방지: 모든 값을 *2 스케일로 정수화 --- */
const SCALE = 2; // 0.5 단위까지 정확
const scale = (x) => Math.round(x * SCALE);

/* ===== 초기 0강 랜덤 세팅(중복 없는 4옵션) ===== */
function randomDistinctOptions(n=4){
  const pool = OPTION_NAMES.slice();
  // Shuffle (Fisher–Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(i+1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function makeInitialStartCfg(){
  const names = randomDistinctOptions(4);
  const cfg = {};
  for(const n of names){
    cfg[n] = randomChoice(INIT_VALUES[n]);
  }
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

/* ===== 정확히 k회 강화해서 도달 가능한 값 목록 =====
   startV: 현재값, incs: 증가치 배열, k: 횟수
   반환: { values: [목표값 ...], waysMap: {scaledTargetSum: ways} }
   ways = (증가치 시퀀스의 "순서"까지 고려한 개수)  ← 확률 계산에 필요
*/
function reachableExact(startV, incs, k){
  const start = scale(startV);
  const incScaled = incs.map(scale);
  // DP over sequences length = k
  let counts = new Map(); // sum -> ways
  counts.set(0, 1); // 0회 합 = 0 ways 1

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

  // 목표값 후보와 ways 매핑
  const waysMap = {};
  const values = [];
  if(k===0){
    values.push(startV); // 그대로
    waysMap[0] = 1;
  }else{
    for(const [sum, ways] of counts.entries()){
      const v = (start + sum) / SCALE;
      values.push(v);
      waysMap[sum] = ways;
    }
  }
  // 정렬
  values.sort((a,b)=>a-b);
  return { values, waysMap };
}

/* ===== 멀티노미얼 계수 & 확률 ===== */
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function multinomialCoef(counts){ // counts=[k1,k2,k3,k4]
  const n = counts.reduce((a,b)=>a+b,0);
  let denom = 1;
  for(const k of counts) denom *= factorial(k);
  return factorial(n) / denom;
}
function multinomialProb(counts, m=4){
  // 각 스텝 옵션 균등(1/m), 총 n=Σk_i
  const n = counts.reduce((a,b)=>a+b,0);
  return multinomialCoef(counts) * Math.pow(1/m, n);
}

/* ===== 확률 계산 =====
   입력:
     startCfg: {opt: startValue}
     kMap: {opt: k_i} (합계=5)
     targetMap: {opt: targetValue} (각각 reachableExact(start, incs, k_i) 중 하나)
   출력:
     p = P(5회 균등강화 & 증가치 랜덤으로 targetMap 정확 달성)
       = Multinomial(k) * ∏_i [ ways_i / (|S_i|)^{k_i} ]
*/
function exactProbability(startCfg, kMap, targetMap){
  const opts = Object.keys(startCfg);
  const ks = opts.map(o => kMap[o] || 0);
  const n = ks.reduce((a,b)=>a+b,0);
  if(n !== STEPS) return 0;

  let p = multinomialProb(ks, opts.length); // (5!/(k1!...k4!)) * (1/4)^5

  for(const o of opts){
    const k = kMap[o] || 0;
    const incs = INCS[o];
    if(k===0){
      // k=0이면 target은 start와 동일해야 함 (UI에서 강제)
      if(targetMap[o] !== startCfg[o]) return 0;
      continue;
    }
    const { waysMap } = reachableExact(startCfg[o], incs, k);
    const deltaScaled = scale(targetMap[o] - startCfg[o]); // 합산 증가량(스케일)
    const ways = waysMap[deltaScaled] || 0;
    const denom = Math.pow(incs.length, k); // 각 강화에서 증가치 균등
    p *= (ways / denom);
    if(p===0) break;
  }
  return p;
}

/* ===== 뷰 ===== */
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <!-- 상단 내비 -->
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="starter-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 시뮬레이터</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 강화 시뮬레이터</h2>
        <p class="muted">
          0→20강 동안 <b>5회</b> 강화(매번 4옵션 중 1개만 증가, 증가치는 해당 옵션의 후보 중 랜덤).<br/>
          목표 설정은 옵션별 강화횟수 <b>k</b>를 합계 5로 맞춰 고르고, 각 옵션은 "현재값에서 정확히 k회" 가능한 값만 선택합니다.
        </p>

        <div class="grid cols-2" style="margin-top:10px">
          <div>
            <h3 style="margin:6px 0">1) 0강 옵션 (중복 불가, 기본은 랜덤 배정)</h3>
            <div id="starter-start"></div>
          </div>
          <div>
            <h3 style="margin:6px 0">2) 목표 설정 (k 합=5)</h3>
            <div class="pill" id="starter-remaining" style="margin-bottom:6px">남은 강화횟수: 5</div>
            <div id="starter-goal"></div>
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">① 20강 1회 시 고급숯돌</div>
            <div class="pill" style="margin-top:6px">고급숯돌 1개 = 10,000 XP</div>
            <div id="starter-out-stones" class="big ok" style="margin-top:8px">${HIGH_STONES_PER_RUN} 개</div>
            <div class="muted" style="margin-top:6px">완주당 숫돌 ${HIGH_STONES_PER_RUN}개 (상수)</div>
          </div>
          <div class="card">
            <div class="big">② 목표 달성까지 필요한 시동무기 개수(기대)</div>
            <div class="pill" style="margin-top:6px">= 1 / p (p: 정확 확률)</div>
            <div id="starter-out-weapons" class="big ok" style="margin-top:8px">-</div>
            <div id="starter-out-stones-exp" class="muted" style="margin-top:6px">예상 고급숯돌: -</div>
            <div id="starter-out-p" class="muted" style="margin-top:6px">성공확률 p: -</div>
          </div>
        </div>

        <pre id="starter-log" class="mono" style="margin-top:10px"></pre>
      </div>
    </section>
  `;

  // 홈 버튼
  byId('starter-home-btn').addEventListener('click', ()=>{ location.hash=''; });

  /* ---------- 0강 폼: 중복 방지 + 랜덤 초기 ---------- */
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
    valSel.innerHTML = arr.map(v=>`<option value="${v}">${v}</option>`).join('');
    if(setRandom) valSel.value = randomChoice(arr);
  }
  [1,2,3,4].forEach(i=> refreshInitVal(i, true)); // 초기 값 랜덤

  // 옵션 중복 방지(다른 선택지 비활성화)
  function selectedNames(){ return [1,2,3,4].map(i=>byId(`s${i}-name`).value); }
  function syncOptionDisables(){
    const chosen = selectedNames();
    const nameSels = Array.from(document.querySelectorAll('.s-name'));
    nameSels.forEach(sel=>{
      const current = sel.value;
      Array.from(sel.options).forEach(opt=>{
        const val = opt.value;
        if(val === current){
          opt.disabled = false;
        }else{
          opt.disabled = chosen.includes(val);
        }
      });
    });
  }
  syncOptionDisables();

  // 변경 이벤트
  [1,2,3,4].forEach(i=>{
    byId(`s${i}-name`).addEventListener('change', ()=>{
      refreshInitVal(i, false);
      syncOptionDisables();
      rebuildGoalSection(); // 목표 섹션 갱신
    });
    byId(`s${i}-val`).addEventListener('change', rebuildGoalSection);
  });

  /* ---------- 목표 설정: k 합 = 5 강제 & 값 후보 자동 ---------- */
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

    // k 슬라이더/셀렉트 + 목표값 select
    goalHost.innerHTML = names.map((opt, idx)=>{
      const id = `g${idx+1}`;
      // k=0~5 select
      const kSel = `<select id="${id}-k">${[0,1,2,3,4,5].map(k=>`<option value="${k}">${k}회</option>`).join('')}</select>`;
      // 초기엔 k=0 가정 → 후보 1개(현재값)
      const { values } = reachableExact(startCfg[opt], INCS[opt], 0);
      const vSel = `<select id="${id}-val">${values.map(v=>`<option value="${v}">${v}</option>`).join('')}</select>`;

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
          <small class="muted">증가치 후보: ${INCS[opt].join(' / ')}</small>
        </div>
      `;
    }).join('');

    // 남은 강화 횟수 표시 & k 합=5 강제
    function readKMap(){
      const kMap = {};
      names.forEach((opt, idx)=>{
        const id = `g${idx+1}`;
        kMap[opt] = parseInt(byId(`${id}-k`).value, 10);
      });
      return kMap;
    }
    function setRemaining(){
      const kMap = readKMap();
      const used = Object.values(kMap).reduce((a,b)=>a+b,0);
      const left = Math.max(0, STEPS - used);
      remainingEl.textContent = `남은 강화횟수: ${left}`;
      remainingEl.style.color = (left===0 ? 'var(--ok)' : 'var(--muted)');
      return left;
    }
    function refreshValueChoices(){
      const startCfg = getStartCfg();
      names.forEach((opt, idx)=>{
        const id = `g${idx+1}`;
        const k = parseInt(byId(`${id}-k`).value,10);
        const vEl = byId(`${id}-val`);
        const prev = parseFloat(vEl.value);
        const { values } = reachableExact(startCfg[opt], INCS[opt], k);
        vEl.innerHTML = values.map(v=>`<option value="${v}">${v}</option>`).join('');
        // 가능한 경우 이전 선택 유지
        if(values.includes(prev)) vEl.value = prev;
      });
    }

    // k 변경 처리: 합이 5를 넘으면 방금 바꾼 셀을 자동으로 줄여서 5에 맞춤
    names.forEach((opt, idx)=>{
      const id = `g${idx+1}`;
      const kEl = byId(`${id}-k`);
      kEl.addEventListener('change', ()=>{
        // 먼저 값 갱신
        let kMap = readKMap();
        let used = Object.values(kMap).reduce((a,b)=>a+b,0);
        if(used > STEPS){
          // 초과량을 현재 셀에서 줄여서 맞춤
          const over = used - STEPS;
          const cur = kMap[opt];
          kMap[opt] = Math.max(0, cur - over);
          kEl.value = String(kMap[opt]);
        }
        setRemaining();
        refreshValueChoices();
      });
    });

    setRemaining();
    refreshValueChoices();
  }

  rebuildGoalSection();

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

    // k 합 5 확인
    const sumK = Object.values(kMap).reduce((a,b)=>a+b,0);
    if(sumK !== STEPS){
      throw new Error(`강화 횟수 합이 ${STEPS}가 아닙니다. (현재 ${sumK})`);
    }

    const p = exactProbability(startCfg, kMap, targetMap); // 정확 확률
    const expectedWeapons = (p>0) ? (1/p) : Infinity;
    const expectedStones  = (p>0) ? (HIGH_STONES_PER_RUN/p) : Infinity;

    // 출력
    byId('starter-out-weapons').textContent = (p>0 ? `${expectedWeapons.toFixed(2)} 개` : '∞ 개');
    byId('starter-out-stones-exp').textContent = (p>0 ? `예상 고급숯돌: ${expectedStones.toFixed(2)} 개` : '예상 고급숯돌: ∞');
    byId('starter-out-p').textContent = `성공확률 p ≈ ${(p*100).toFixed(6)}%`;

    // 로그
    byId('starter-log').textContent =
`입력 요약
- 0강: ${JSON.stringify(startCfg)}
- k(합=5): ${JSON.stringify(kMap)}
- 목표: ${JSON.stringify(targetMap)}

계산
- 성공확률 p ≈ ${(p*100).toFixed(6)}%
- 기대 시동무기 개수 = ${p>0 ? (1/p).toFixed(4) : '∞'}
- 기대 고급숯돌 개수 = ${p>0 ? (HIGH_STONES_PER_RUN/p).toFixed(4) : '∞'} (1회 완주 27개)`;
  }

  // 결과 계산은 목표/0강 변경 시마다 자동 갱신
  function bindAutoCompute(){
    const els = [
      ...document.querySelectorAll('.s-name'),
      ...document.querySelectorAll('.s-val'),
      ...document.querySelectorAll('[id^="g"][id$="-k"]'),
      ...document.querySelectorAll('[id^="g"][id$="-val"]'),
    ];
    els.forEach(el=>{
      el.addEventListener('change', ()=>{
        try { compute(); } catch(e){
          byId('starter-out-weapons').textContent = '-';
          byId('starter-out-stones-exp').textContent = '예상 고급숯돌: -';
          byId('starter-out-p').textContent = '성공확률 p: -';
          byId('starter-log').textContent = '⚠️ ' + e.message;
        }
      });
    });
    // 초기 1회 계산
    try { compute(); } catch(e){
      byId('starter-log').textContent = '⚠️ ' + e.message;
    }
  }

  bindAutoCompute();
}