// js/feature_starter.js
// 시동무기 강화 시뮬레이터
// - 정확 확률 계산(목표 k합=5, 값 정확히 일치)
// - 몬테카를로(다회 시뮬) 20강 기대/케이스 뷰: 사용자 정의 회수로 5회 강화 과정을 반복하여 "모드 기반 기대값" + "옵션별 최고 케이스 4종" 출력
// - 드로우(뽑기) 프리셋 연동: 부옵 4개만 가져와 0강 셋팅

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
const INCS = INIT_VALUES; // 증가치 후보는 0강 후보와 동일

/* ===== 강화/재료 상수 ===== */
const STEPS = 5;                // 총 5회 강화
const HIGH_STONES_PER_RUN = 27; // 20강 1회 완주 = 고급숫돌 27개

/* ===== 유틸 ===== */
const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const choice = (arr)=>arr[rand(arr.length)];
const unique = (arr)=>Array.from(new Set(arr));
const OPTION_NAMES = Object.keys(INIT_VALUES);
const fmt = (opt,v)=> PERCENT_SET.has(opt) ? `${v}%` : `${v}`;

/* === (0.5 단위 정합성을 위한) 스케일 === */
const SCALE = 2;
const scale = (x)=>Math.round(x*SCALE);

/* ===== 0강 랜덤/프리셋 ===== */
function randomDistinctOptions(n=4){
  const pool = OPTION_NAMES.slice();
  for(let i=pool.length-1;i>0;i--){ const j=rand(i+1); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  return pool.slice(0,n);
}
function makeInitialStartCfg(){
  const names = randomDistinctOptions(4);
  const cfg = {};
  for(const n of names){ cfg[n] = choice(INIT_VALUES[n]); }
  return cfg;
}

/* ===== 검증 ===== */
function checkStartCfg(cfg){
  const keys = Object.keys(cfg);
  if(keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if(unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k=>{
    if(!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]}`);
  });
}

/* ===== 정확히 k회 강화 결과(값 후보 + 경우의수) ===== */
function reachableExact(startV, incs, k){
  const start = scale(startV);
  const incScaled = incs.map(scale);
  let counts = new Map(); counts.set(0,1);
  for(let i=0;i<k;i++){
    const next = new Map();
    for(const [s, c] of counts.entries()){
      for(const inc of incScaled){
        const ns = s + inc;
        next.set(ns, (next.get(ns)||0) + c);
      }
    }
    counts = next;
  }
  const waysMap = {}; const values = [];
  if(k===0){ values.push(startV); waysMap[0]=1; }
  else{
    for(const [sum,ways] of counts.entries()){
      const v = (start + sum) / SCALE;
      values.push(v);
      waysMap[sum] = ways;
    }
  }
  values.sort((a,b)=>a-b);
  return { values, waysMap };
}

/* ===== 멀티노미얼 ===== */
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function multinomialCoef(counts){
  const n = counts.reduce((a,b)=>a+b,0);
  let denom = 1; for(const k of counts) denom*=factorial(k);
  return factorial(n)/denom;
}
function multinomialProb(counts, m=4){
  const n = counts.reduce((a,b)=>a+b,0);
  return multinomialCoef(counts)*Math.pow(1/m, n);
}

/* ===== 확률 계산 (정확) ===== */
function exactProbability(startCfg, kMap, targetMap){
  const opts = Object.keys(startCfg);
  const ks = opts.map(o=>kMap[o]||0);
  if(ks.reduce((a,b)=>a+b,0)!==STEPS) return 0;

  let p = multinomialProb(ks, opts.length); // 옵션 선택(균등)
  for(const o of opts){
    const k = kMap[o]||0;
    if(k===0){
      if(targetMap[o]!==startCfg[o]) return 0;
      continue;
    }
    const { waysMap } = reachableExact(startCfg[o], INCS[o], k);
    const deltaScaled = scale(targetMap[o] - startCfg[o]);
    const ways = waysMap[deltaScaled] || 0;
    const denom = Math.pow(INCS[o].length, k); // 증가치 후보 균등
    p *= (ways/denom);
    if(p===0) break;
  }
  return p;
}

/* ===== 뷰 ===== */
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="starter-home-btn" class="hero-btn">← 홈으로</button>
        <button id="starter-draw-btn" class="hero-btn">← 시동무기 뽑기로</button>
        <span class="pill">시동무기 강화 시뮬레이터</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 강화 시뮬레이터</h2>
        <p class="muted">0→20강 동안 총 5회 강화. 목표(k 합=5)를 분배하고 결과를 확인하세요.</p>

        <div class="grid cols-2" style="margin-top:10px">
          <div>
            <h3>1) 0강 옵션</h3>
            <div id="starter-start"></div>
          </div>
          <div>
            <h3>2) 목표 설정</h3>
            <div class="pill" id="starter-remaining" style="margin-bottom:6px">남은 강화횟수: 5</div>
            <div id="starter-goal"></div>
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">① 시동무기 사용 갯수(기대)</div>
            <div id="starter-out-weapons" class="big ok">-</div>
            <div id="starter-out-p" class="muted">성공확률 p: -</div>
          </div>
          <div class="card">
            <div class="big">② 예상 고급숫돌 사용갯수</div>
            <div id="starter-out-stones-exp" class="big ok">-</div>
            <div class="muted">고급숫돌 1개 = 10,000 XP (20강 1회=27개)</div>
          </div>
        </div>

        <pre id="starter-log" class="mono" style="margin-top:10px"></pre>
        <button id="starter-copy" style="margin-top:8px">📋 결과 복사</button>

        <!-- ▼▼ 몬테카를로 20강 기대/케이스 -->
        <div class="card" style="margin-top:12px">
          <h3>20강 기대값(몬테카를로)</h3>
          <p class="muted">지정한 0강으로 5회 강화 시퀀스를 다회 시뮬합니다. 결과가 가장 자주 나온(모드) "강화횟수·최종수치"를 기대값으로 표시하고, 각 옵션이 메인이 되는 4가지 케이스도 함께 보여줍니다.</p>
          <div class="grid cols-3" style="gap:8px">
            <div>
              <label>시뮬레이션 횟수</label>
              <input id="mc-n" type="number" min="1000" step="1000" value="1000000" />
            </div>
            <div style="display:flex; align-items:flex-end">
              <button id="mc-run" class="hero-btn">20강 시뮬 돌리기</button>
            </div>
            <div style="display:flex; align-items:flex-end">
              <span id="mc-status" class="muted"></span>
            </div>
          </div>

          <div id="mc-out" style="margin-top:10px">
            <!-- 결과 출력 -->
          </div>
        </div>
      </div>
    </section>
  `;

  byId('starter-home-btn').addEventListener('click', ()=>{ location.hash=''; });
  byId('starter-draw-btn').addEventListener('click', ()=>{ location.hash='#draw'; });

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

  // 랜덤 기본값 혹은 프리셋(드로우 → 부옵4개)
  let defaultStart = makeInitialStartCfg();
  try{
    const raw = sessionStorage.getItem('starter_preset');
    if(raw){
      const preset = JSON.parse(raw);
      sessionStorage.removeItem('starter_preset');
      defaultStart = {};
      preset.starter4.forEach(o=>{ defaultStart[o.stat] = o.value; });
    }
  }catch(e){}

  const defNames = Object.keys(defaultStart);
  [1,2,3,4].forEach((i,idx)=>{
    const nameSel = byId(`s${i}-name`);
    const n = defNames[idx] || OPTION_NAMES[idx];
    nameSel.value = n;
  });

  function refreshInitVal(id, setRandom=false){
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name = nameSel.value;
    const arr = INIT_VALUES[name];
    valSel.innerHTML = arr.map(v=>`<option value="${v}">${fmt(name, v)}</option>`).join('');
    if(setRandom) valSel.value = choice(arr);
    else if(defaultStart[name]!=null) valSel.value = defaultStart[name];
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

    // k 합 표시/제어 & 값 후보 갱신
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

    // 이벤트: k/값 변경 → 합 5 유지 + 후보 갱신 + compute()
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

  /* ---------- 정확 확률 계산 ---------- */
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

    // 로그(요약)
    const optionLog = names.map(n=>`${n} : ${fmt(n, startCfg[n])}`).join('\n');
    const kLog = names.map(n=>`${n} : ${kMap[n]}회`).join('\n');
    const targetLog = names.map(n=>`${n} : ${fmt(n, targetMap[n])}`).join('\n');

    const text =
`시뮬레이션 요약

옵션
${optionLog}

목표 강화 횟수(k)
${kLog}

목표 값
${targetLog}

계산
- 성공확률 p ≈ ${(p*100).toFixed(6)}%
- 기대 시동무기 개수 = ${p>0 ? (1/p).toFixed(4) : '∞'}
- 기대 고급숫돌 개수 = ${p>0 ? (HIGH_STONES_PER_RUN/p).toFixed(4) : '∞'} (1회 완주 27개)`;

    byId('starter-log').textContent = text;
  }

  // 복사
  byId('starter-copy').addEventListener('click', ()=>{
    navigator.clipboard.writeText(byId('starter-log').textContent)
      .then(()=> alert('시뮬레이션 결과가 복사되었습니다!'));
  });

  /* ========== 20강 몬테카를로 시뮬 ========== */
  function mcSimulate(startCfg, N){
    const names = Object.keys(startCfg); // 4개
    const idxMap = Object.fromEntries(names.map((n,i)=>[n,i]));
    const incArr = names.map(n => INCS[n]); // [[],[],[],[]]
    const startScaled = names.map(n => scale(startCfg[n]));

    // 통계 구조
    const hitCounts = names.map(()=> new Uint32Array(STEPS+1));      // [4][0..5]
    const valueFreq = names.map(()=> Array.from({length:STEPS+1},()=> new Map())); // [4][k] -> Map(valueScaled -> count)
    const atLeast1 = names.map(()=>0); // 각 옵션이 1회 이상 맞은 횟수

    // 루프
    for(let t=0;t<N;t++){
      const hits = [0,0,0,0];
      const sumScaled = [0,0,0,0];

      // 5회
      for(let s=0;s<STEPS;s++){
        const i = rand(4);                      // 어떤 옵션이 맞았는가 (균등)
        const incs = incArr[i];
        const inc = incs[rand(incs.length)];    // 증가치 후보 균등
        sumScaled[i] += scale(inc);
        hits[i]++;
      }

      // 통계 반영
      for(let i=0;i<4;i++){
        const k = hits[i];
        hitCounts[i][k]++;

        const finalScaled = startScaled[i] + sumScaled[i];
        const vf = valueFreq[i][k];
        vf.set(finalScaled, (vf.get(finalScaled)||0)+1);

        if(k>0) atLeast1[i]++;
      }
    }

    return { names, startCfg, hitCounts, valueFreq, atLeast1, N };
  }

  function argmaxIndex(arr){
    let mi=0, mv=arr[0];
    for(let i=1;i<arr.length;i++){
      if(arr[i]>mv){ mv=arr[i]; mi=i; }
    }
    return mi;
  }
  function modalValueForK(mapForK){ // Map(scaledValue -> count)에서 최빈값(동률이면 큰 값)
    let bestV=null, bestC=-1;
    for(const [v,c] of mapForK.entries()){
      if(c>bestC || (c===bestC && v>bestV)){ bestC=c; bestV=v; }
    }
    return bestV;
  }

  function renderMCResult(stat){
    const { names, startCfg, hitCounts, valueFreq, atLeast1, N } = stat;

    // A) 모드 기반 기대 결과
    const expRows = names.map((opt, i)=>{
      const kMode = argmaxIndex(hitCounts[i]);
      const mapK = valueFreq[i][kMode];
      const vScaled = modalValueForK(mapK);
      const v = (vScaled??scale(startCfg[opt]))/SCALE;
      return { opt, kMode, v };
    });

    // B) 옵션별 최고 케이스 4종
    // 규칙:
    //  - 메인 X: kx = X의 최빈 강화횟수
    //  - R = 5 - kx
    //  - 나머지 옵션은 "1회 이상 맞은 빈도"가 높은 순으로 1씩 배분 (R개), 나머지는 0
    //  - 각 옵션 값은 해당 k에서 "최빈 최종값" (없으면 가능한 최대값) 사용
    const rankBy1 = atLeast1.map((c,i)=>({i,c})).sort((a,b)=>b.c-a.c).map(o=>o.i);

    function valueFor(i, k){
      if(k===0) return startCfg[names[i]];
      const mapK = valueFreq[i][k];
      if(mapK && mapK.size){
        const vScaled = modalValueForK(mapK);
        return vScaled/SCALE;
      }
      // fallback: 가능한 최대 증가치 기준의 상한값
      const maxInc = Math.max(...INCS[names[i]]);
      return startCfg[names[i]] + k*maxInc;
    }

    const cases = names.map((optX, ix)=>{
      const kx = argmaxIndex(hitCounts[ix]);
      const assign = [0,0,0,0];
      assign[ix]=kx;
      let R = STEPS - kx;
      if(R>0){
        for(const j of rankBy1){
          if(j===ix) continue;
          if(R<=0) break;
          assign[j] += 1; R--;
        }
      }
      const entry = names.map((opt, i)=>({
        opt, k: assign[i], v: valueFor(i, assign[i])
      }));
      return { main: optX, rows: entry };
    });

    // ===== 출력 HTML =====
    const expHtml = `
      <div class="card" style="margin-top:8px">
        <h4 style="margin:0 0 6px">모드 기반 기대 결과</h4>
        <div class="grid cols-2" style="gap:8px">
          ${expRows.map(r=>`
            <div class="card" style="padding:10px">
              <div><b>${r.opt}</b></div>
              <div class="muted">기대 강화횟수(모드): ${r.kMode}회</div>
              <div>기대 최종값: <b>${fmt(r.opt, r.v)}</b></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const casesHtml = `
      <div class="card" style="margin-top:8px">
        <h4 style="margin:0 0 6px">옵션별 최고 케이스 4종 (모드 기반 규칙)</h4>
        ${cases.map(c=>{
          return `
            <div class="card" style="margin-bottom:8px">
              <div class="big" style="margin-bottom:6px">메인: ${c.main}</div>
              <div class="grid cols-2" style="gap:8px">
                ${c.rows.map(r=>`
                  <div class="card" style="padding:10px">
                    <div><b>${r.opt}</b></div>
                    <div class="muted">강화: ${r.k}회</div>
                    <div>값: <b>${fmt(r.opt, r.v)}</b></div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    return expHtml + casesHtml;
  }

  byId('mc-run').addEventListener('click', ()=>{
    try{
      const startCfg = getStartCfg();
      let N = parseInt(byId('mc-n').value,10);
      if(!Number.isFinite(N) || N<1000){ N=1000; byId('mc-n').value = '1000'; }

      // 진행 표시
      byId('mc-status').textContent = `진행 중... ( ${N.toLocaleString()} 회 )`;
      // UI 잠깐 비움
      byId('mc-out').innerHTML = '';

      // 큰 N 처리: 프레임 쉬어가며 돌리기
      // 간단히 한 번에 처리 (최적화된 루프) → 렌더 후 실행
      setTimeout(()=>{
        const stat = mcSimulate(startCfg, N);
        const html = renderMCResult(stat);
        byId('mc-out').innerHTML = html;
        byId('mc-status').textContent = `완료 ( ${N.toLocaleString()} 회 )`;
      }, 0);

    }catch(e){
      byId('mc-status').textContent = '오류';
      byId('mc-out').innerHTML = `<div class="bad">⚠️ ${e.message}</div>`;
    }
  });
}