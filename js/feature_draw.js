// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터
// - 단일 뽑기, ???뽑기(최대 1000회)
// - 결과 저장(sessionStorage)
// - 총 결과보기: 조건별 상세 통계 출력
// - 페이지 이탈 후 재진입 시 결과 초기화
// - 버튼에 열쇠 아이콘 표시

const ICON_KEY = "./assets/img/key.jpg"; // 실제 확장자가 .png면 .png로 바꿔주세요

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const randomChoice = (arr)=>arr[rand(arr.length)];

// 부위별 주스탯
const MAIN_STATS = {
  무기:["공격력%"],
  옷:["방어력%"],
  모자:["체력%"],
  신발:["치명타 대미지 증가율","치명타 대미지 감소율","마법 저항률","효과적중","효과저항"],
  장갑:["치명타 확률","치명타 저항률","물리 저항률","마법 관통률","물리 관통률"],
};

// 부옵 전체 풀(주스탯과 중복 금지)
const SUB_STATS = [
  "체력%","공격력%","방어력%","치명타 확률","치명타 대미지 증가율","마법 저항률",
  "물리 저항률","치명타 저항률","치명타 대미지 감소율","마법 관통률","물리 관통률",
  "효과적중","효과저항","명중","회피"
];

// 등급별 부옵 개수(50:50)
const SUB_COUNT_RULE = { A:[3,4], B:[2,3], C:[1,2] };

/* ------------------------------------------------------------------ */
/* 확률 테이블: 각 부위당 '2개 슬롯'으로 분리하여 총합 1.0 보장           */
/* ------------------------------------------------------------------ */
const DRAW_TABLE = [
  // A (2.6% *2 *3 + 1.1% *2 *2 = 20%)
  {grade:"A", part:"무기",  idx:1, prob:0.026}, {grade:"A", part:"무기",  idx:2, prob:0.026},
  {grade:"A", part:"옷",    idx:1, prob:0.026}, {grade:"A", part:"옷",    idx:2, prob:0.026},
  {grade:"A", part:"모자",  idx:1, prob:0.026}, {grade:"A", part:"모자",  idx:2, prob:0.026},
  {grade:"A", part:"신발",  idx:1, prob:0.011}, {grade:"A", part:"신발",  idx:2, prob:0.011},
  {grade:"A", part:"장갑",  idx:1, prob:0.011}, {grade:"A", part:"장갑",  idx:2, prob:0.011},

  // B (3.9% *2 *3 + 1.65% *2 *2 = 30%)
  {grade:"B", part:"무기",  idx:1, prob:0.039}, {grade:"B", part:"무기",  idx:2, prob:0.039},
  {grade:"B", part:"옷",    idx:1, prob:0.039}, {grade:"B", part:"옷",    idx:2, prob:0.039},
  {grade:"B", part:"모자",  idx:1, prob:0.039}, {grade:"B", part:"모자",  idx:2, prob:0.039},
  {grade:"B", part:"신발",  idx:1, prob:0.0165},{grade:"B", part:"신발",  idx:2, prob:0.0165},
  {grade:"B", part:"장갑",  idx:1, prob:0.0165},{grade:"B", part:"장갑",  idx:2, prob:0.0165},

  // C (6.5% *2 *3 + 2.75% *2 *2 = 50%)
  {grade:"C", part:"무기",  idx:1, prob:0.065}, {grade:"C", part:"무기",  idx:2, prob:0.065},
  {grade:"C", part:"옷",    idx:1, prob:0.065}, {grade:"C", part:"옷",    idx:2, prob:0.065},
  {grade:"C", part:"모자",  idx:1, prob:0.065}, {grade:"C", part:"모자",  idx:2, prob:0.065},
  {grade:"C", part:"신발",  idx:1, prob:0.0275},{grade:"C", part:"신발",  idx:2, prob:0.0275},
  {grade:"C", part:"장갑",  idx:1, prob:0.0275},{grade:"C", part:"장갑",  idx:2, prob:0.0275},
];

// 누적 CDF (for-loop 전용, 마지막은 반드시 1.0)
const CDF = (() => {
  let acc = 0;
  const out = DRAW_TABLE.map(row => {
    acc += row.prob;
    return { ...row, acc };
  });
  const last = out[out.length - 1];
  if (Math.abs(last.acc - 1.0) > 1e-10) last.acc += (1.0 - last.acc);
  return out;
})();

// 선택(부동소수 에지 방지: for-loop + 마지막 강제 선택)
function pickOneCDF() {
  const r = Math.random(); // [0,1)
  for (let i = 0; i < CDF.length; i++) {
    if (r <= CDF[i].acc) return CDF[i];
  }
  return CDF[CDF.length - 1]; // fallback
}

// 세션 저장/로드
const loadResults = () => JSON.parse(sessionStorage.getItem("draw_results") || "[]");
const saveResults = (arr) => sessionStorage.setItem("draw_results", JSON.stringify(arr));

function singleDraw() {
  const picked = pickOneCDF(); // 절대 null 아님
  const { grade, part } = picked;

  const main = randomChoice(MAIN_STATS[part]); // 주스탯
  const subCount = randomChoice(SUB_COUNT_RULE[grade]); // 부옵 갯수
  const pool = SUB_STATS.filter(s => s !== main);
  const subs = [];
  while (subs.length < subCount && pool.length) {
    const i = rand(pool.length);
    subs.push(pool[i]);
    pool.splice(i, 1);
  }
  return { grade, part, main, subs, when: Date.now() };
}

// 요약 통계
function summarizeResults() {
  const all = loadResults();
  const A = all.filter(r => r.grade === "A");

  const counts = { 무기:0, 옷:0, 모자:0, 신발:0, 장갑:0 };
  let fourSubs = 0;
  let effAccResist = 0, resistBoth = 0, effAll = 0;
  let shoeAccHasRes = 0, shoeResHasAcc = 0;
  let glovePhysHasBoth = 0;

  const hasAll = (arr, ks) => ks.every(k => arr.includes(k));

  A.forEach(r => {
    counts[r.part] = (counts[r.part] || 0) + 1;
    if (r.subs.length === 4) fourSubs++;

    if (["무기","옷","모자"].includes(r.part)) {
      if (hasAll(r.subs, ["효과적중","효과저항"])) effAccResist++;
      if (hasAll(r.subs, ["물리 저항률","마법 저항률"])) resistBoth++;
      if (hasAll(r.subs, ["효과적중","효과저항","물리 저항률","마법 저항률"])) effAll++;
    }

    if (r.part === "신발") {
      if (r.main === "효과적중" && r.subs.includes("효과저항")) shoeAccHasRes++;
      if (r.main === "효과저항" && r.subs.includes("효과적중")) shoeResHasAcc++;
    }

    if (r.part === "장갑") {
      if (r.main === "물리 저항률" && hasAll(r.subs, ["효과적중","효과저항"])) glovePhysHasBoth++;
    }
  });

  return {
    totalAll: all.length,
    totalA: A.length,
    counts,
    fourSubs,
    effAccResist, resistBoth, effAll,
    shoeAccHasRes, shoeResHasAcc,
    glovePhysHasBoth
  };
}

/* ====================== UI ====================== */

export function mountDraw(app) {
  // 요구사항: 진입 시마다 결과 초기화
  sessionStorage.removeItem("draw_results");

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="draw-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">시동무기 뽑기</h2>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
          <button id="btn-single" class="hero-btn">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            단일 뽑기
          </button>
          <button id="btn-multi" class="hero-btn">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            ??? 뽑기
          </button>
          <button id="btn-summary" class="hero-btn" style="margin-left:auto">총 결과보기</button>
        </div>
        <div id="draw-log" class="muted" style="white-space:pre-wrap; margin-top:10px"></div>
      </div>

      <div id="summary-wrap" style="margin-top:10px"></div>
    </section>
  `;

  const log = byId("draw-log");
  const summaryWrap = byId("summary-wrap");
  const logMsg = (t)=> { log.textContent = t; };

  // 홈(허브)으로 이동할 때도 초기화
  byId("draw-home-btn").addEventListener("click", ()=>{
    sessionStorage.removeItem("draw_results");
    location.hash = "#gear";
  });

  // 단일 뽑기
  byId("btn-single").addEventListener("click", ()=>{
    try {
      const r = singleDraw(); // 절대 null 아님
      const all = loadResults(); all.push(r); saveResults(all);

      if (r.grade === "A") {
        alert(`A급 ${r.part}입니다.\n(주스탯: ${r.main})`);
        logMsg(`🎉 A급 ${r.part}\n주스탯: ${r.main}\n부옵션: ${r.subs.join(", ")}`);
      } else {
        alert(`${r.grade}급 ${r.part}입니다.`);
        logMsg(`${r.grade}급 ${r.part}입니다.`);
      }
    } catch (e) {
      console.error(e);
      logMsg("예상치 못한 오류가 발생했습니다. (단일뽑기)");
    }
  });

  // ??? 뽑기
  byId("btn-multi").addEventListener("click", ()=>{
    try {
      const raw = prompt("열쇠를 몇 개 사용하여 뽑기를 진행할까요? (최대 1000)");
      if (raw === null) return; // 취소
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0) { alert("양의 정수를 입력하세요."); return; }
      if (n > 1000) { alert("최대 1000개까지 가능합니다."); return; }

      const all = loadResults();
      let aTotal=0, a3=0, a4=0;
      for (let i=0; i<n; i++) {
        const r = singleDraw();
        all.push(r);
        if (r.grade === "A") {
          aTotal++;
          if (r.subs.length === 3) a3++;
          if (r.subs.length === 4) a4++;
        }
      }
      saveResults(all);

      // 팝업 + 로그 모두 표시
      alert(`일괄 ${n}회 완료\nA급 총 ${aTotal}개\n- 부옵 3개: ${a3}개\n- 부옵 4개: ${a4}개`);
      logMsg(`???뽑기 결과: 총 ${n}회\nA급:${aTotal}개 (부옵3:${a3} / 부옵4:${a4})`);
    } catch (e) {
      console.error(e);
      logMsg("예상치 못한 오류가 발생했습니다. (일괄뽑기)");
    }
  });

  // 총 결과보기
  byId("btn-summary").addEventListener("click", ()=>{
    try {
      const s = summarizeResults();
      summaryWrap.innerHTML = `
        <div class="card">
          <div class="big">총 결과</div>
          <div style="margin-top:8px; white-space:pre-wrap">
총 뽑기 횟수: ${s.totalAll}

A급 시동무기 총 갯수 [무기:${s.counts.무기} , 옷:${s.counts.옷} , 모자:${s.counts.모자} , 신발:${s.counts.신발} , 장갑:${s.counts.장갑}]
A급 시동무기 중에 부옵션 4개인 총 갯수: ${s.fourSubs}

무기/옷/모자 부위에서
  1) 효과적중,효과저항이 같이 있는 갯수: ${s.effAccResist}
  2) 물리저항력,마법저항력이 같이 있는 갯수: ${s.resistBoth}
  3) 효과적중,효과저항,물리저항력,마법저항력이 같이 있는 갯수: ${s.effAll}

신발 부위에서
  - 주스탯: 효과적중 / 부스탯: 효과저항 → ${s.shoeAccHasRes}
  - 주스탯: 효과저항 / 부스탯: 효과적중 → ${s.shoeResHasAcc}

장갑 부위에서
  - 주스탯: 물리 저항률 / 부스탯: 효과적중과 효과저항 동시 → ${s.glovePhysHasBoth}
          </div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      summaryWrap.innerHTML = `<div class="card">총 결과를 표시하는 중 오류가 발생했습니다.</div>`;
    }
  });
}
