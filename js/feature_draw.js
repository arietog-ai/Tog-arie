// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터
// - 단일 뽑기, ???뽑기(최대 1000회)
// - 결과 저장(sessionStorage)
// - 총 결과보기: 조건별 상세 통계 출력
// - 페이지 이탈/재진입 시 결과 초기화
// - 단일뽑기에서 A급+부옵4개면 "시동무기 강화로 →" 버튼 활성화
//   * 버튼 클릭 시에만 starter_preset 저장 후 #starter 로 이동

const ICON_KEY = "./assets/img/key.jpg"; // 실제 확장자 확인

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const randomChoice = (arr)=>arr[rand(arr.length)];

// 강화 초기값 테이블(강화 프리셋 값 만들 때만 사용)
// starter의 INIT_VALUES와 동일해야 함
const INIT_VALUES = {
  "물리관통력":[1.5,2.5,3.5,4.5],
  "마법관통력":[1.5,2.5,3.5,4.5],
  "물리저항력":[1.5,2.5,3.5,4.5],
  "마법저항력":[1.5,2.5,3.5,4.5],
  "치명타확률":[1.5,2.5,3.5,4.5],
  "치명타데미지증가":[1.5,2.5,3.5,4.5],
  "회피":[3,6,9,12],
  "명중":[3,6,9,12],
  "효과적중":[3,6,9,12],
  "효과저항":[3,6,9,12],
  "공격력":[1,1.5,2,2.5],
  "방어력":[1,1.5,2,2.5],
  "체력":[1,1.5,2,2.5],
  "치명타 저항률":[1.5,2.5,3.5,4.5],
  "치명타 대미지 감소율":[1.5,2.5,3.5,4.5],
};

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

// 누적 CDF
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

function pickOneCDF() {
  const r = Math.random();
  for (let i=0;i<CDF.length;i++){
    if (r <= CDF[i].acc) return CDF[i];
  }
  return CDF[CDF.length-1];
}

// 세션 저장/로드
const loadResults = () => JSON.parse(sessionStorage.getItem("draw_results") || "[]");
const saveResults = (arr) => sessionStorage.setItem("draw_results", JSON.stringify(arr));

function singleDraw(){
  const picked = pickOneCDF();
  const { grade, part } = picked;

  const main = randomChoice(MAIN_STATS[part]); // 주스탯
  const subCount = randomChoice(SUB_COUNT_RULE[grade]); // 부옵 개수
  const pool = SUB_STATS.filter(s => s !== main);
  const subs=[];
  while(subs.length<subCount && pool.length){
    const i = rand(pool.length);
    subs.push(pool[i]);
    pool.splice(i,1);
  }
  return { grade, part, main, subs, when: Date.now() };
}

// 결과 통계
function summarizeResults(){
  const all = loadResults();
  const A = all.filter(r=>r.grade==="A");

  const counts={무기:0, 옷:0, 모자:0, 신발:0, 장갑:0};
  let fourSubs=0;
  let effAccResist=0,resistBoth=0,effAll=0;
  let shoeAccHasRes=0,shoeResHasAcc=0;
  let glovePhysHasBoth=0;

  const hasAll=(arr,keys)=>keys.every(k=>arr.includes(k));

  A.forEach(r=>{
    counts[r.part]++;
    if(r.subs.length===4) fourSubs++;

    if(["무기","옷","모자"].includes(r.part)){
      if(hasAll(r.subs,["효과적중","효과저항"])) effAccResist++;
      if(hasAll(r.subs,["물리 저항률","마법 저항률"])) resistBoth++;
      if(hasAll(r.subs,["효과적중","효과저항","물리 저항률","마법 저항률"])) effAll++;
    }
    if(r.part==="신발"){
      if(r.main==="효과적중" && r.subs.includes("효과저항")) shoeAccHasRes++;
      if(r.main==="효과저항" && r.subs.includes("효과적중")) shoeResHasAcc++;
    }
    if(r.part==="장갑"){
      if(r.main==="물리 저항률" && hasAll(r.subs,["효과적중","효과저항"])) glovePhysHasBoth++;
    }
  });

  return {
    totalAll: all.length,
    totalA: A.length,
    counts,fourSubs,
    effAccResist,resistBoth,effAll,
    shoeAccHasRes,shoeResHasAcc,
    glovePhysHasBoth
  };
}

/* ====================== UI ====================== */

export function mountDraw(app){
  // 진입할 때마다 초기화(요청사항)
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
        <button id="to-starter-btn" class="hero-btn" style="margin-top:10px" disabled>시동무기 강화로 →</button>
      </div>

      <div id="summary-wrap" style="margin-top:10px"></div>
    </section>
  `;

  const log = byId("draw-log");
  const summaryWrap = byId("summary-wrap");
  const logMsg = (t)=> { log.textContent = t; };
  const starterBtn = byId("to-starter-btn");

  byId("draw-home-btn").addEventListener("click", ()=>{
    sessionStorage.removeItem("draw_results");
    location.hash = "#gear";
  });

  // 단일 뽑기 (팝업 없이 결과영역에만 표기)
  // A급 + 부옵4개면 버튼 활성화, 버튼 "클릭 시에만" 프리셋 저장 후 이동
  byId("btn-single").addEventListener("click", ()=>{
    const r = singleDraw();
    const all = loadResults(); all.push(r); saveResults(all);

    if (r.grade === "A") {
      logMsg(`🎉 A급 ${r.part}\n주스탯: ${r.main}\n부옵션: ${r.subs.join(", ")}`);
      if (r.subs.length === 4) {
        starterBtn.disabled = false;
        starterBtn.onclick = () => {
          const presetEntries = [];
          // 단일뽑기 결과에서 4옵션 구성: 주스탯 + 부옵 3개(또는 4개)
          // 강화 시뮬레이터는 4옵션이 필요하므로, 부옵이 4개면 주+부 중 4개를 사용,
          // 부옵이 3개면 주+부 3개 = 정확히 4개.
          const fourStats = [r.main, ...r.subs].slice(0,4);
          fourStats.forEach(stat=>{
            // INIT_VALUES 키와 표기가 동일해야 함
            const vals = INIT_VALUES[stat] || [1,1.5,2,2.5];
            const val = randomChoice(vals);
            presetEntries.push({ stat, value: val });
          });
          sessionStorage.setItem("starter_preset", JSON.stringify({ starter4: presetEntries }));
          location.hash = "#starter";
        };
      }
    } else {
      logMsg(`${r.grade}급 ${r.part}입니다.`);
      // A급이 아니면 버튼 계속 비활성화 유지
      starterBtn.disabled = true;
      starterBtn.onclick = null;
    }
  });

  // ??? 뽑기
  byId("btn-multi").addEventListener("click", ()=>{
    const raw = prompt("열쇠를 몇 개 사용하여 뽑기를 진행할까요? (최대 1000)");
    if (raw === null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n<=0){ alert("양의 정수를 입력하세요."); return; }
    if (n>1000){ alert("최대 1000개까지 가능합니다."); return; }

    const all = loadResults();
    let aTotal=0, a3=0, a4=0;
    for (let i=0;i<n;i++){
      const r = singleDraw();
      all.push(r);
      if (r.grade === "A") {
        aTotal++;
        if (r.subs.length===3) a3++;
        if (r.subs.length===4) a4++;
      }
    }
    saveResults(all);
    logMsg(`???뽑기 결과: 총 ${n}회\nA급:${aTotal}개 (부옵3:${a3} / 부옵4:${a4})`);
    // 일괄 뽑기는 강화 프리셋 전송 없음(요청사항: 단일뽑기에서만)
  });

  // 총 결과보기
  byId("btn-summary").addEventListener("click", ()=>{
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
  });
}