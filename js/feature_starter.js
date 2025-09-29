// js/feature_starter.js
// 시동무기 강화 시뮬레이터 (사례B 규칙)
// - 0→20강 동안 총 5회(4/8/12/16/20강) 증가
// - 매 스텝 4옵션 중 1개 선택 → 그 옵션의 이산 증가량 중 랜덤 적용
// - 출력:
//   ① 20강 한 번 시도 시 고급숯돌 수(=27개)
//   ② 목표 달성까지 필요한 시동무기 개수(= 1/p 기대값)

const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"]; // %
const GROUP_B = ["회피","명중","효과적중","효과저항"]; // 수치
const GROUP_C = ["공격력","방어력","체력"]; // %
const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"]; // %

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

const STEPS = 5;                    // 4/8/12/16/20강 → 5회
const XP_TOTAL_20 = 261900;
const HIGH_STONE_XP = 10000;
const HIGH_STONES_PER_RUN = 27;
const XP_OVERFLOW = HIGH_STONES_PER_RUN * HIGH_STONE_XP - XP_TOTAL_20; // 8100

function randomChoice(arr){ return arr[(Math.random()*arr.length)|0]; }
function unique(arr){ return Array.from(new Set(arr)); }
function byId(id){ const el=document.getElementById(id); if(!el) throw new Error(`#${id} 없음`); return el; }

function checkStartCfg(cfg){
  const keys = Object.keys(cfg);
  if(keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if(unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k=>{
    if(!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]} (허용: ${INIT_VALUES[k].join('/')})`);
  });
}

function simulateOneRun(startCfg, goalCfg, pickMode='gap'){
  const values = {...startCfg};
  const targets = Object.keys(goalCfg);
  const getPending = () => targets.filter(k => values[k] < goalCfg[k]);

  for(let i=0;i<STEPS;i++){
    const pending = getPending();
    if(pending.length === 0) break;

    let chosen;
    if(pickMode === 'uniform'){
      chosen = randomChoice(targets);
    }else{
      const gaps = targets.map(k => Math.max(0, goalCfg[k] - values[k]));
      const sum = gaps.reduce((a,b)=>a+b,0);
      if(sum <= 0){
        chosen = randomChoice(targets);
      }else{
        let r = Math.random()*sum, acc=0;
        for(let idx=0; idx<targets.length; idx++){
          acc += gaps[idx];
          if(r <= acc){ chosen = targets[idx]; break; }
        }
        if(!chosen) chosen = targets[targets.length-1];
      }
    }

    const inc = randomChoice(INCS[chosen]);
    values[chosen] += inc;
  }

  return targets.every(k => values[k] >= goalCfg[k]);
}

function estimateP(startCfg, goalCfg, trials=50000, pickMode='gap'){
  let wins = 0;
  for(let i=0;i<trials;i++){
    if(simulateOneRun(startCfg, goalCfg, pickMode)) wins++;
  }
  return wins / trials;
}

export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <!-- 상단 미니 내비: 홈으로 -->
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="starter-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 시뮬레이터</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 강화 시뮬레이터</h2>
        <p class="muted">0→20강(5회 랜덤 분배). 0강/목표를 선택하면 
        <b>① 1회 완주 숫돌</b>과 <b>② 목표 달성까지 필요한 시동무기 개수</b>를 보여줍니다.</p>

        <div class="grid cols-2" style="margin-top:10px">
          <div>
            <h3 style="margin:6px 0">1) 0강 옵션 선택 (중복 불가)</h3>
            <div id="starter-start"></div>
          </div>
          <div>
            <h3 style="margin:6px 0">2) 목표값 선택 (위에서 고른 4옵션)</h3>
            <div id="starter-goal"></div>
          </div>
        </div>

        <div class="grid cols-3" style="margin-top:10px">
          <div>
            <label>선택 정책</label>
            <select id="starter-mode">
              <option value="gap" selected>잔여 격차 가중</option>
              <option value="uniform">균등</option>
            </select>
          </div>
          <div>
            <label>시뮬레이션 횟수</label>
            <input id="starter-trials" type="number" min="5000" step="5000" value="50000" />
          </div>
          <div>
            <label>실행</label>
            <button id="starter-run">시뮬레이션 실행</button>
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:10px">
          <div class="card">
            <div class="big">① 20강 1회 시 고급숯돌</div>
            <div class="pill" style="margin-top:6px">고급숯돌 1개 = 10,000 XP</div>
            <div id="starter-out-stones" class="big ok" style="margin-top:8px"></div>
            <div class="muted" style="margin-top:6px">
              총 필요 XP: ${XP_TOTAL_20.toLocaleString()} / 완주당 숫돌 ${HIGH_STONES_PER_RUN}개 (잉여 ${XP_OVERFLOW.toLocaleString()} XP)
            </div>
          </div>
          <div class="card">
            <div class="big">② 목표 달성까지 필요한 시동무기 개수(기대값)</div>
            <div class="pill" style="margin-top:6px">= 1 / p (p: 1회 완주 성공확률)</div>
            <div id="starter-out-weapons" class="big ok" style="margin-top:8px"></div>
            <div id="starter-out-p" class="muted" style="margin-top:6px"></div>
          </div>
        </div>

        <pre id="starter-log" class="mono" style="margin-top:10px"></pre>
      </div>
    </section>
  `;

  // 홈으로 이동
  document.getElementById('starter-home-btn').addEventListener('click', ()=>{
    // app.js 라우터는 해시 기반 → 빈 해시로 보내면 홈 렌더
    location.hash = '';
  });

  const OPTION_NAMES = Object.keys(INIT_VALUES);
  const startHost = byId('starter-start');
  const goalHost  = byId('starter-goal');

  function makeStartRow(id){
    return `
      <div class="grid cols-2" style="align-items:end; gap:8px; margin-bottom:6px">
        <div>
          <label>옵션 ${id}</label>
          <select id="s${id}-name">
            ${OPTION_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>0강 값</label>
          <select id="s${id}-val"></select>
        </div>
      </div>
    `;
  }

  startHost.innerHTML = makeStartRow(1)+makeStartRow(2)+makeStartRow(3)+makeStartRow(4);

  function refreshInitVal(id){
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name = nameSel.value;
    valSel.innerHTML = INIT_VALUES[name].map(v=>`<option value="${v}">${v}</option>`).join('');
  }
  [1,2,3,4].forEach(i=>{
    refreshInitVal(i);
    byId(`s${i}-name`).addEventListener('change', ()=>{
      refreshInitVal(i);
      rebuildGoalInputs();
    });
  });

  function rebuildGoalInputs(){
    const names = [1,2,3,4].map(i=>byId(`s${i}-name`).value);
    const html = names.map(n=>{
      const choices = INIT_VALUES[n];
      return `
        <div class="grid cols-2" style="align-items:end; gap:8px; margin-bottom:6px">
          <div>
            <label>목표 옵션</label>
            <input value="${n}" disabled />
          </div>
          <div>
            <label>목표 값</label>
            <select id="g-${n}">
              ${choices.map(v=>`<option value="${v}">${v}</option>`).join('')}
            </select>
          </div>
        </div>`;
    }).join('');
    goalHost.innerHTML = html;
  }
  rebuildGoalInputs();

  byId('starter-run').addEventListener('click', ()=>{
    const log = byId('starter-log');
    try{
      const startPairs = [1,2,3,4].map(i=>[
        byId(`s${i}-name`).value,
        parseFloat(byId(`s${i}-val`).value)
      ]);
      const names = startPairs.map(([n])=>n);
      if(unique(names).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');

      const startCfg = Object.fromEntries(startPairs);
      checkStartCfg(startCfg);

      const goalCfg = {};
      for(const n of names){
        goalCfg[n] = parseFloat(byId(`g-${n}`).value);
      }

      const trials = Math.max(5000, parseInt(byId('starter-trials').value,10) || 50000);
      const mode   = byId('starter-mode').value;

      byId('starter-out-stones').textContent = `${HIGH_STONES_PER_RUN.toLocaleString()} 개`;

      const p = estimateP(startCfg, goalCfg, trials, mode);
      const expectedWeapons = p===0 ? Infinity : (1/p);
      byId('starter-out-weapons').textContent = (p===0 ? '∞ 개' : `${expectedWeapons.toFixed(2)} 개`);
      byId('starter-out-p').textContent = `성공확률 p ≈ ${(p*100).toFixed(4)}%  (시뮬 ${trials.toLocaleString()}회, 모드=${mode})`;

      log.textContent =
        `입력 요약
- 0강: ${JSON.stringify(startCfg)}
- 목표: ${JSON.stringify(goalCfg)}
- 정책: ${mode}, 시뮬: ${trials.toLocaleString()}회

결과
- ① 20강 1회 시 고급숯돌: ${HIGH_STONES_PER_RUN}개 (총 XP ${XP_TOTAL_20.toLocaleString()}, 잉여 ${XP_OVERFLOW.toLocaleString()} XP)
- ② 목표 달성까지 필요한 시동무기(기대값): ${p===0 ? '∞ 개' : expectedWeapons.toFixed(2) + ' 개'}
-   참고) 성공확률 p ≈ ${(p*100).toFixed(4)}%`;
    }catch(e){
      log.textContent = '❌ 오류: ' + e.message;
    }
  });
}
