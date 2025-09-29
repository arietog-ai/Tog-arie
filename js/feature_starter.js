// js/feature_starter.js
// 시동무기 강화 시뮬레이터 (사례B)
// - 옵션 4개(중복 불가) 선택 + 0강 값 선택
// - 목표값: 각 옵션별로 "해당 옵션이 k회 강화되었다고 가정"하고, 그때 도달 가능한 값들만 선택 가능
// - 실제 시뮬은 무작위 분배(균등/잔여격차)로 5회 진행 → 성공확률 p 추정 → 기대 시동무기 개수 = 1/p
// - 홈으로 버튼 포함

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
const XP_TOTAL_20 = 261900;
const HIGH_STONE_XP = 10000;
const HIGH_STONES_PER_RUN = 27;
const XP_OVERFLOW = HIGH_STONES_PER_RUN * HIGH_STONE_XP - XP_TOTAL_20; // 8100

/* ===== 유틸 ===== */
const rand = (n) => (Math.random()*n)|0;
const randomChoice = (arr) => arr[rand(arr.length)];
const unique = (arr) => Array.from(new Set(arr));
const byId = (id) => { const el=document.getElementById(id); if(!el) throw new Error(`#${id} 없음`); return el; };

function checkStartCfg(cfg){
  const keys = Object.keys(cfg);
  if(keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if(unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k=>{
    if(!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]} (허용: ${INIT_VALUES[k].join('/')})`);
  });
}

/* ===== k회 강화 시 도달 가능한 목표값 집합 계산 =====
   - start: 시작값
   - incs: 증가치 배열 (예: [1.5,2.5,3.5,4.5])
   - k: 그 옵션이 선택되어 강화되는 횟수 (0..5)
   => 반환: start + (incs 중 임의조합을 k번 더한 값들) 의 집합(소수 1자리/정수 단위 정렬)
*/
function reachableValues(start, incs, k){
  // 다항식식 합성 느낌으로 동적 구성(중복 제거)
  let sums = new Set([0]);
  for(let i=0;i<k;i++){
    const next = new Set();
    for(const s of sums){
      for(const v of incs){
        next.add(Number((s+v).toFixed(4))); // 부동소수 오차 억제
      }
    }
    sums = next;
  }
  const vals = Array.from(sums).map(s => Number((start + s).toFixed(4)));
  // 정렬(숫자 오름차순)
  vals.sort((a,b)=>a-b);
  return vals;
}

/* ===== 시뮬레이션 ===== */
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

/* ===== 뷰 ===== */
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <!-- 홈으로 -->
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="starter-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 시뮬레이터</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 강화 시뮬레이터</h2>
        <p class="muted">
          0→20강 동안 <b>총 5회</b> 강화. 한 번 강화마다 <b>4옵션 중 1개</b>만 증가, 증가치는 옵션별 <b>증가치 후보</b> 중 랜덤 적용.<br/>
          목표값은 각 옵션에 대해 "<b>그 옵션이 k회 강화되었다고 가정</b>"했을 때 도달 가능한 값만 선택할 수 있어요.
        </p>

        <div class="grid cols-2" style="margin-top:10px">
          <div>
            <h3 style="margin:6px 0">1) 0강 옵션 (중복 불가)</h3>
            <div id="starter-start"></div>
          </div>
          <div>
            <h3 style="margin:6px 0">2) 목표값 (k회 강화 가정)</h3>
            <div id="starter-goal"></div>
          </div>
        </div>

        <div class="grid cols-3" style="margin-top:10px">
          <div>
            <label>선택 정책</label>
            <select id="starter-mode">
              <option value="gap" selected>잔여 격차 가중</option>
              <option value="uniform">균등(4옵션 동확률)</option>
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
            <div class="big">② 목표 달성까지 필요한 시동무기 개수(기대)</div>
            <div class="pill" style="margin-top:6px">= 1 / p (p: 1회 완주 성공확률)</div>
            <div id="starter-out-weapons" class="big ok" style="margin-top:8px"></div>
            <div id="starter-out-p" class="muted" style="margin-top:6px"></div>
          </div>
        </div>

        <pre id="starter-log" class="mono" style="margin-top:10px"></pre>
      </div>
    </section>
  `;

  // 홈으로
  byId('starter-home-btn').addEventListener('click', ()=>{ location.hash=''; });

  /* ---------- 동적 폼: 0강 ---------- */
  const OPTION_NAMES = Object.keys(INIT_VALUES);
  const startHost = byId('starter-start');
  const goalHost  = byId('starter-goal');

  function startRow(id){
    return `
      <div class="grid cols-3" style="align-items:end; gap:8px; margin-bottom:6px">
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
        <div>
          <label>삭제</label>
          <button type="button" class="s-clear" data-id="${id}">지우기</button>
        </div>
      </div>
    `;
  }
  startHost.innerHTML = startRow(1)+startRow(2)+startRow(3)+startRow(4);

  // 0강 값 옵션 갱신
  function refreshInitVal(id){
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name = nameSel.value;
    const vals = INIT_VALUES[name] || [];
    valSel.innerHTML = vals.map(v=>`<option value="${v}">${v}</option>`).join('');
  }

  // 선택된 옵션들 수집
  function selectedNames(){
    return [1,2,3,4].map(i=>byId(`s${i}-name`).value);
  }

  // ★ 옵션 중복 방지: 이미 선택된 항목은 다른 셀렉트에서 비활성화
  function syncOptionDisables(){
    const chosen = selectedNames();
    const nameSels = Array.from(document.querySelectorAll('.s-name'));
    nameSels.forEach(sel=>{
      const current = sel.value;
      Array.from(sel.options).forEach(opt=>{
        const val = opt.value;
        if(val === current){
          opt.disabled = false; // 본인 선택은 허용
        }else{
          opt.disabled = chosen.includes(val); // 다른 곳에서 이미 선택 → disable
        }
      });
    });
  }

  // 초기화 + 이벤트 바인딩
  [1,2,3,4].forEach(i=>{
    refreshInitVal(i);
    byId(`s${i}-name`).addEventListener('change', ()=>{
      refreshInitVal(i);
      syncOptionDisables();
      rebuildGoalInputs(); // 목표 섹션도 갱신
    });
    byId(`s${i}-val`).addEventListener('change', rebuildGoalInputs);
  });
  // 지우기 버튼: 기본값 첫 항목으로 리셋
  Array.from(document.querySelectorAll('.s-clear')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      byId(`s${id}-name`).selectedIndex = 0;
      refreshInitVal(id);
      syncOptionDisables();
      rebuildGoalInputs();
    });
  });

  syncOptionDisables(); // 최초 1회
  rebuildGoalInputs();  // 최초 1회

  /* ---------- 동적 폼: 목표(k회 강화 가정) ---------- */
  function rebuildGoalInputs(){
    const names = selectedNames();
    const startVals = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
    const pairs = names.map((n,idx)=>[n,startVals[idx]]);

    // 같은 옵션 여러 번 골랐을 경우(이론상 막혀 있지만 방어)
    if(unique(names).length !== 4) {
      goalHost.innerHTML = `<div class="muted">⚠️ 0강 옵션 중복을 없애면 목표 선택이 활성화됩니다.</div>`;
      return;
    }

    // 목표 UI 빌드: 옵션명, k(0..5) 선택, 목표값 자동 리스트
    goalHost.innerHTML = pairs.map(([opt, startVal], i)=>{
      const thisId = `g${i+1}`;
      const kSel = `<select id="${thisId}-k">${[0,1,2,3,4,5].map(k=>`<option value="${k}">${k}회</option>`).join('')}</select>`;
      const vals = reachableValues(startVal, INCS[opt], 0); // 초기 k=0 표시
      const vSel = `<select id="${thisId}-val">${vals.map(v=>`<option value="${v}">${v}</option>`).join('')}</select>`;
      return `
        <div class="card" style="margin-bottom:8px">
          <div class="grid cols-3" style="align-items:end; gap:8px">
            <div>
              <label>목표 옵션</label>
              <input value="${opt}" id="${thisId}-name" disabled />
            </div>
            <div>
              <label>강화 적용 횟수(k)</label>
              ${kSel}
            </div>
            <div>
              <label>목표 값(도달 가능 집합)</label>
              ${vSel}
            </div>
          </div>
          <small class="muted">설명: 이 목표값 리스트는 "${opt}"가 k회 강화되었다고 가정할 때
          <b>증가치 후보(${INCS[opt].join('/')})</b>를 조합하여 도달 가능한 값만 보여줍니다.
          (실제 시뮬은 랜덤 분배이므로 k회가 보장되진 않습니다.)</small>
        </div>
      `;
    }).join('');

    // k 변경 시 목표값 리스트 재계산
    names.forEach((opt, idx)=>{
      const thisId = `g${idx+1}`;
      const kEl = byId(`${thisId}-k`);
      const vEl = byId(`${thisId}-val`);
      const startVal = startVals[idx];

      const refresh = ()=>{
        const k = parseInt(kEl.value,10);
        const vals = reachableValues(startVal, INCS[opt], k);
        const prev = parseFloat(vEl.value);
        vEl.innerHTML = vals.map(v=>`<option value="${v}">${v}</option>`).join('');
        // 이전 선택이 여전히 유효하면 유지
        const keep = vals.find(x=>Number(x)===Number(prev));
        if(keep!==undefined) vEl.value = prev;
      };
      kEl.addEventListener('change', refresh);
      refresh();
    });
  }

  /* ---------- 실행 ---------- */
  byId('starter-run').addEventListener('click', ()=>{
    const log = byId('starter-log');
    try{
      // 0강 수집
      const names = selectedNames();
      const values = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
      const startCfg = Object.fromEntries(names.map((n,i)=>[n, values[i]]));
      checkStartCfg(startCfg);

      // 목표 수집(각 옵션별 k 가정에 따른 목록에서 선택한 값)
      const goalCfg = {};
      names.forEach((opt, idx)=>{
        const thisId = `g${idx+1}`;
        goalCfg[opt] = parseFloat(byId(`${thisId}-val`).value);
      });

      // 시뮬 파라미터
      const trials = Math.max(5000, parseInt(byId('starter-trials').value,10) || 50000);
      const mode   = byId('starter-mode').value;

      // 출력 ①: 20강 1회 시 고급숯돌
      byId('starter-out-stones').textContent = `${HIGH_STONES_PER_RUN.toLocaleString()} 개`;

      // 확률 p 추정 → 기대 시동무기 개수 1/p
      const p = estimateP(startCfg, goalCfg, trials, mode);
      const expectedWeapons = p===0 ? Infinity : (1/p);
      byId('starter-out-weapons').textContent = (p===0 ? '∞ 개' : `${expectedWeapons.toFixed(2)} 개`);
      byId('starter-out-p').textContent = `성공확률 p ≈ ${(p*100).toFixed(4)}%  (시뮬 ${trials.toLocaleString()}회, 모드=${mode})`;

      // 상세 로그
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
