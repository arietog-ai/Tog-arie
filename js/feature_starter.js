// js/feature.starter.js
import {
  STARTER_INITS, STARTER_INCS,
  STARTER_UPGRADE_STEPS,
  STARTER_HIGH_STONES_PER_RUN,
  STARTER_XP_TOTAL_20, STARTER_HIGH_STONE_XP, STARTER_XP_OVERFLOW
} from './data.js';

// ---- 유틸 ----
function uniqueKeys(obj){ return new Set(Object.keys(obj)).size === Object.keys(obj).length; }
function randomChoice(arr){ return arr[(Math.random()*arr.length)|0]; }

function checkStartCfg(startCfg){
  if(Object.keys(startCfg).length !== 4) throw new Error('옵션은 정확히 4개여야 합니다.');
  if(!uniqueKeys(startCfg)) throw new Error('옵션 중복 불가입니다.');
  for(const k of Object.keys(startCfg)){
    if(!STARTER_INITS[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!STARTER_INITS[k].includes(startCfg[k])) throw new Error(`0강 값 불일치: ${k}=${startCfg[k]} (허용: ${STARTER_INITS[k].join('/')})`);
  }
}

function feasible(startCfg, goals){
  // 최대 증가 합으로 물리적 가능 여부 빠른 체크
  const maxAfter = {...startCfg};
  for(let i=0;i<STARTER_UPGRADE_STEPS;i++){
    // 매 스텝 한 옵션만 증가 → 가장 부족한 옵션에 "가능 최대 증가"를 준다고 가정
    // 보수적 상한: 각 옵션에 남은 스텝을 다 몰아줄 수 없으니, 간단 체크만(빠른 경고용)
    const pendings = Object.keys(goals).filter(k => (maxAfter[k]??-1) < goals[k]);
    if(pendings.length===0) break;
    // 부족폭 가장 큰 옵션 찾기
    pendings.sort((a,b)=>(goals[b]-maxAfter[b])-(goals[a]-maxAfter[a]));
    const t = pendings[0];
    const incs = STARTER_INCS[t];
    maxAfter[t] += Math.max(...incs);
  }
  return Object.keys(goals).every(k => (maxAfter[k]??-1) >= goals[k]);
}

function simulateOneRun(startCfg, goals, mode='gap'){
  const values = {...startCfg};
  const getPending = () => Object.keys(goals).filter(k => values[k] < goals[k]);

  for(let step=0; step<STARTER_UPGRADE_STEPS; step++){
    const pending = getPending();
    if(pending.length===0) break;

    let target;
    if(mode==='uniform'){
      target = randomChoice(pending);
    }else{
      // gap 가중
      const gaps = pending.map(k => goals[k] - values[k]);
      const sum = gaps.reduce((a,b)=>a+b,0);
      let r = Math.random()*sum, acc=0;
      for(let i=0;i<pending.length;i++){
        acc += gaps[i];
        if(r<=acc){ target = pending[i]; break; }
      }
      if(!target) target = pending[pending.length-1];
    }
    const inc = randomChoice(STARTER_INCS[target]);
    values[target] = (values[target] ?? 0) + inc;
  }
  return Object.keys(goals).every(k => (values[k] ?? -1) >= goals[k]);
}

function runMC(startCfg, goals, trials=100000, mode='gap'){
  let wins=0;
  for(let i=0;i<trials;i++){
    if(simulateOneRun(startCfg, goals, mode)) wins++;
  }
  const p = wins / trials;
  return {
    trials,
    success_prob: p,
    expected_attempts_to_goal: p===0 ? Infinity : 1/p,
    expected_high_stones_to_goal: p===0 ? Infinity : (STARTER_HIGH_STONES_PER_RUN / p),
    stones_per_run: STARTER_HIGH_STONES_PER_RUN,
    xp_required_total: STARTER_XP_TOTAL_20,
    xp_per_high_stone: STARTER_HIGH_STONE_XP,
    xp_overflow_per_run: STARTER_XP_OVERFLOW
  };
}

// ---- 뷰 ----
export function renderStarter(container){
  container.innerHTML = `
    <section class="card">
      <h2>시동무기 강화 시뮬레이터 (사례B)</h2>
      <div class="grid">
        <div>
          <h3>1) 0강 옵션 선택 (중복 불가)</h3>
          <div id="starter-start"></div>
          <small>그룹별 허용 초기값을 따라야 합니다.</small>
          <h3 style="margin-top:12px">2) 목표값 입력</h3>
          <div id="starter-goal"></div>
          <h3 style="margin-top:12px">3) 설정</h3>
          <label>선택 정책
            <select id="starter-mode">
              <option value="gap">잔여 격차 가중</option>
              <option value="uniform">균등</option>
            </select>
          </label>
          <label>시뮬레이션 횟수
            <input id="starter-trials" type="number" min="1000" step="1000" value="100000"/>
          </label>
          <button id="starter-run" class="btn">시뮬레이션 실행</button>
        </div>
        <div>
          <h3>결과</h3>
          <div id="starter-result" class="mono"></div>
          <div class="hint">
            <img src="./assets/img/whetstone.png" alt="whetstone" style="height:18px;vertical-align:middle;margin-right:6px;">
            20강 1회 완주 비용: 고급숯돌 27개 (총 XP 261,900, 1개 = 10,000 XP, 잉여 8,100 XP)
          </div>
        </div>
      </div>
    </section>
  `;

  // 동적 폼 빌드
  const startHost = container.querySelector('#starter-start');
  const goalHost  = container.querySelector('#starter-goal');

  const OPTION_NAMES = Object.keys(STARTER_INITS);
  function makeSelect(id){
    return `
      <div class="row">
        <select id="${id}-name">${OPTION_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}</select>
        <select id="${id}-val"></select>
      </div>
    `;
  }
  startHost.innerHTML = makeSelect('s1') + makeSelect('s2') + makeSelect('s3') + makeSelect('s4');

  function refreshInitVal(id){
    const name = document.getElementById(`${id}-name`).value;
    const valSel = document.getElementById(`${id}-val`);
    valSel.innerHTML = STARTER_INITS[name].map(v=>`<option value="${v}">${v}</option>`).join('');
  }
  ['s1','s2','s3','s4'].forEach(id=>{
    refreshInitVal(id);
    document.getElementById(`${id}-name`).addEventListener('change', ()=>refreshInitVal(id));
  });

  // 목표 입력: 선택된 4옵션에만 숫자 입력
  function rebuildGoalInputs(){
    const chosen = ['s1','s2','s3','s4'].map(id=>document.getElementById(`${id}-name`).value);
    goalHost.innerHTML = chosen.map(n=>
      `<label>${n} <input type="number" step="0.1" min="0" id="goal-${n}" placeholder="목표값"></label>`
    ).join('');
  }
  rebuildGoalInputs();
  ['s1','s2','s3','s4'].forEach(id=>{
    document.getElementById(`${id}-name`).addEventListener('change', rebuildGoalInputs);
  });

  // 실행
  const btn = container.querySelector('#starter-run');
  const out = container.querySelector('#starter-result');
  btn.addEventListener('click', ()=>{
    try{
      const s = ['s1','s2','s3','s4'].map(id=>{
        const name = document.getElementById(`${id}-name`).value;
        const val  = parseFloat(document.getElementById(`${id}-val`).value);
        return [name,val];
      });
      // 중복 체크
      const names = s.map(([n])=>n);
      if(new Set(names).size!==4) throw new Error('0강 옵션이 중복되었습니다.');

      const startCfg = Object.fromEntries(s);
      checkStartCfg(startCfg);

      // 목표
      const goals = {};
      for(const n of names){
        const v = parseFloat(document.getElementById(`goal-${n}`).value);
        if(Number.isNaN(v)) throw new Error(`목표값이 비어있습니다: ${n}`);
        goals[n]=v;
      }

      // 물리적 가능성 빠른 점검
      if(!feasible(startCfg, goals)){
        out.textContent = `경고: 목표가 물리적으로 매우 어려워 보입니다(최대 증가 합 기준). 그래도 시뮬을 진행합니다…`;
      }else{
        out.textContent = '';
      }

      const trials = Math.max(1000, parseInt(document.getElementById('starter-trials').value,10) || 100000);
      const mode   = document.getElementById('starter-mode').value;

      const res = runMC(startCfg, goals, trials, mode);
      const p = res.success_prob;

      const text =
        `성공확률 p = ${p.toFixed(6)}\n` +
        `예상 시도 횟수 ≈ ${p===0? '∞' : (1/p).toFixed(2)} 회\n` +
        `예상 고급숯돌 ≈ ${p===0? '∞' : (STARTER_HIGH_STONES_PER_RUN/p).toFixed(2)} 개\n` +
        `\n[참고]\n` +
        `1회 완주(0→20강): 고급숯돌 ${STARTER_HIGH_STONES_PER_RUN}개, 총 XP ${STARTER_XP_TOTAL_20.toLocaleString()} (숯돌당 ${STARTER_HIGH_STONE_XP.toLocaleString()} XP, 잉여 ${STARTER_XP_OVERFLOW.toLocaleString()} XP)`;

      out.textContent = text;
    }catch(e){
      out.textContent = '오류: ' + e.message;
    }
  });
}
