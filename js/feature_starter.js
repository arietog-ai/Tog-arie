// js/feature_starter.js
// "시동무기 강화 시뮬레이터" 메인 뷰 & 시뮬레이션 로직

// ===== 옵션 그룹 및 초기값/증가량 =====
const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"]; // %단위
const GROUP_B = ["회피","명중","효과적중","효과저항"]; // 수치 단위
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

// ===== 강화/재료 상수 =====
const STEPS = 5; // 4,8,12,16,20강 → 총 5회 증가
const XP_TOTAL_20 = 261900;
const HIGH_STONE_XP = 10000;
const HIGH_STONES_PER_RUN = 27;
const XP_OVERFLOW = HIGH_STONES_PER_RUN * HIGH_STONE_XP - XP_TOTAL_20; // 8100

// ===== 내부 유틸 =====
function randomChoice(arr){ return arr[(Math.random()*arr.length)|0]; }

// 단일 시뮬레이션
function simulateOneRun(startCfg, goalCfg){
  const values = {...startCfg};
  for(let i=0;i<STEPS;i++){
    const keys = Object.keys(values);
    const target = randomChoice(keys);
    const inc = randomChoice(INCS[target]);
    values[target] += inc;
  }
  return Object.keys(goalCfg).every(k => values[k] >= goalCfg[k]);
}

// 몬테카를로 반복 실행
function runMC(startCfg, goalCfg, trials=50000){
  let wins=0;
  for(let i=0;i<trials;i++){
    if(simulateOneRun(startCfg, goalCfg)) wins++;
  }
  const p = wins/trials;
  return {
    trials,
    success_prob: p,
    expected_attempts: p===0 ? Infinity : (1/p),
    expected_high_stones: p===0 ? Infinity : (HIGH_STONES_PER_RUN/p),
    per_run: {
      stones: HIGH_STONES_PER_RUN,
      xp_total: XP_TOTAL_20,
      xp_per_stone: HIGH_STONE_XP,
      xp_overflow: XP_OVERFLOW
    }
  };
}

// ===== 뷰 랜더링 =====
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <div class="card">
        <h2>시동무기 강화 시뮬레이터</h2>
        <p class="muted">0→20강 (총 5회 랜덤 분배). 목표값 달성 확률과 기대 재료량을 계산합니다.</p>

        <div class="grid cols-2" style="margin-top:12px">
          <div>
            <label>0강 옵션 (JSON)</label>
            <textarea id="starter-start" rows="6" style="width:100%">{ 
  "물리관통력":2.5,
  "치명타확률":1.5,
  "회피":6,
  "명중":3
}</textarea>
            <small class="muted">※ 중복 불가, 허용된 초기값만 사용</small>
          </div>
          <div>
            <label>목표값 (JSON)</label>
            <textarea id="starter-goal" rows="6" style="width:100%">{ 
  "물리관통력":15,
  "치명타확률":12,
  "회피":30,
  "명중":21
}</textarea>
          </div>
        </div>

        <div style="margin-top:12px">
          <label>시뮬레이션 횟수</label>
          <input id="starter-trials" type="number" value="50000" min="1000" step="1000" />
        </div>

        <button id="starter-run" style="margin-top:14px">시뮬레이션 실행</button>
        <pre id="starter-result" class="mono" style="margin-top:14px"></pre>
      </div>
    </section>
  `;

  // 실행 이벤트
  document.getElementById('starter-run').addEventListener('click', ()=>{
    const resultBox = document.getElementById('starter-result');
    try{
      const startCfg = JSON.parse(document.getElementById('starter-start').value);
      const goalCfg  = JSON.parse(document.getElementById('starter-goal').value);
      const trials   = parseInt(document.getElementById('starter-trials').value,10) || 50000;

      const res = runMC(startCfg, goalCfg, trials);
      resultBox.textContent =
        `성공확률 p = ${(res.success_prob*100).toFixed(4)}%\n` +
        `예상 시도 횟수 ≈ ${res.expected_attempts===Infinity?'∞':res.expected_attempts.toFixed(2)} 회\n` +
        `예상 고급숯돌 ≈ ${res.expected_high_stones===Infinity?'∞':res.expected_high_stones.toFixed(2)} 개\n\n` +
        `[1회 완주 기준]\n` +
        `고급숯돌 ${res.per_run.stones}개 (XP ${res.per_run.xp_total.toLocaleString()})\n` +
        `숯돌당 ${res.per_run.xp_per_stone} XP, 잉여 XP ${res.per_run.xp_overflow}`;
    }catch(e){
      resultBox.textContent = "❌ 오류: " + e.message;
    }
  });
}
