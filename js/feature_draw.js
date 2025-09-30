// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터
// - 단일 뽑기, ???뽑기(최대 1000회)
// - 결과 저장(sessionStorage)
// - 총 결과보기: 조건별 상세 통계 출력
// - A급(부옵션 4개) → 강화 시뮬로 보내기 지원

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const randomChoice = (arr)=>arr[rand(arr.length)];

const GRADES = {
  A: { mainCount: [3,4], mainProb: [0.5,0.5] },
  B: { mainCount: [2,3], mainProb: [0.5,0.5] },
  C: { mainCount: [1,2], mainProb: [0.5,0.5] },
};

// 부위별 주스탯 풀
const MAIN_STATS = {
  무기:["공격력%"],
  옷:["방어력%"],
  모자:["체력%"],
  신발:["치명타 대미지 증가율","치명타 대미지 감소율","마법 저항률","효과적중","효과저항"],
  장갑:["치명타 확률","치명타 저항률","물리 저항률","마법 관통률","물리 관통률"],
};

// 부옵션 전체 풀
const SUB_STATS = [
  "체력%","공격력%","방어력%","치명타 확률","치명타 대미지 증가율","마법 저항률",
  "물리 저항률","치명타 저항률","치명타 대미지 감소율","마법 관통률","물리 관통률",
  "효과적중","효과저항","명중","회피"
];

// 등급별 뽑기 확률
const DRAW_TABLE = [
  // A급
  { grade:"A", part:"무기", prob:0.026 }, { grade:"A", part:"옷", prob:0.026 },
  { grade:"A", part:"모자", prob:0.026 }, { grade:"A", part:"신발", prob:0.011 },
  { grade:"A", part:"장갑", prob:0.011 },
  // B급
  { grade:"B", part:"무기", prob:0.039 }, { grade:"B", part:"옷", prob:0.039 },
  { grade:"B", part:"모자", prob:0.039 }, { grade:"B", part:"신발", prob:0.0165 },
  { grade:"B", part:"장갑", prob:0.0165 },
  // C급
  { grade:"C", part:"무기", prob:0.065 }, { grade:"C", part:"옷", prob:0.065 },
  { grade:"C", part:"모자", prob:0.065 }, { grade:"C", part:"신발", prob:0.0275 },
  { grade:"C", part:"장갑", prob:0.0275 },
];

// 누적 합 계산
const CDF = [];
let sumProb=0;
for(const item of DRAW_TABLE){
  sumProb+=item.prob;
  CDF.push({ ...item, acc:sumProb });
}

// 세션 결과 관리
function loadResults(){ return JSON.parse(sessionStorage.getItem("draw_results")||"[]"); }
function saveResults(res){ sessionStorage.setItem("draw_results", JSON.stringify(res)); }

// 뽑기 실행
function singleDraw(){
  const r=Math.random();
  const picked = CDF.find(it=>r<=it.acc);
  if(!picked) return null;
  const { grade, part } = picked;

  const mainStat = randomChoice(MAIN_STATS[part]);
  let subs=[];
  if(grade==="A"||grade==="B"||grade==="C"){
    const cfg = GRADES[grade];
    const count = randomChoice(cfg.mainCount);
    while(subs.length<count){
      const c = randomChoice(SUB_STATS);
      if(c!==mainStat && !subs.includes(c)) subs.push(c);
    }
  }
  return { grade, part, main:mainStat, subs };
}

// 결과 통계 요약
function summarizeResults(){
  const results=loadResults().filter(r=>r.grade==="A");
  const totalAll = loadResults().length;
  const counts={무기:0, 옷:0, 모자:0, 신발:0, 장갑:0};
  let fourSubs=0;
  let effAccResist=0,resistBoth=0,effAll=0;
  let shoeAccHasRes=0,shoeResHasAcc=0;
  let glovePhysHasBoth=0;

  results.forEach(r=>{
    counts[r.part]++;
    if(r.subs.length===4) fourSubs++;
    if(["무기","옷","모자"].includes(r.part)){
      if(r.subs.includes("효과적중")&&r.subs.includes("효과저항")) effAccResist++;
      if(r.subs.includes("물리 저항률")&&r.subs.includes("마법 저항률")) resistBoth++;
      if(["효과적중","효과저항","물리 저항률","마법 저항률"].every(x=>r.subs.includes(x))) effAll++;
    }
    if(r.part==="신발"){
      if(r.main==="효과적중"&&r.subs.includes("효과저항")) shoeAccHasRes++;
      if(r.main==="효과저항"&&r.subs.includes("효과적중")) shoeResHasAcc++;
    }
    if(r.part==="장갑"){
      if(r.main==="물리 저항률"&&r.subs.includes("효과적중")&&r.subs.includes("효과저항")) glovePhysHasBoth++;
    }
  });

  return {
    totalAll, totalA:results.length, counts, fourSubs,
    effAccResist,resistBoth,effAll,
    shoeAccHasRes,shoeResHasAcc,glovePhysHasBoth
  };
}

/* ===== 메인 마운트 ===== */
export function mountDraw(app){
  // 세션 초기화
  sessionStorage.removeItem("draw_results");

  app.innerHTML=`
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="draw-home-btn" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
      </div>

      <div class="card">
        <h2>시동무기 뽑기</h2>
        <div style="margin:10px 0; display:flex; gap:10px">
          <button id="btn-single" class="hero-btn">단일 뽑기</button>
          <button id="btn-multi" class="hero-btn">??? 뽑기</button>
          <button id="btn-summary" class="hero-btn">총 결과보기</button>
        </div>
        <div id="draw-log" style="white-space:pre-wrap; margin-top:10px"></div>
      </div>
    </section>
  `;

  byId("draw-home-btn").addEventListener("click",()=>{ location.hash=""; });
  const log=byId("draw-log");

  function logMsg(txt){ log.textContent=txt; }

  byId("btn-single").addEventListener("click",()=>{
    const res=singleDraw();
    if(!res){ logMsg("실패: 결과 없음"); return; }
    const all=loadResults(); all.push(res); saveResults(all);
    if(res.grade==="A"){
      logMsg(`🎉 A급 ${res.part}\n주스탯:${res.main}\n부옵션:${res.subs.join(",")}`);
    }else{
      logMsg(`${res.grade}급 ${res.part}입니다.`);
    }
  });

  byId("btn-multi").addEventListener("click",()=>{
    const n=parseInt(prompt("열쇠를 몇 개 사용하여 뽑기를 진행할까요? (최대 1000)"),10);
    if(!n||n<=0) return;
    if(n>1000){ alert("최대 1000개까지 가능합니다."); return; }
    const all=loadResults();
    let aCount=0,fourSubs=0;
    for(let i=0;i<n;i++){
      const res=singleDraw(); all.push(res);
      if(res.grade==="A"){ aCount++; if(res.subs.length===4) fourSubs++; }
    }
    saveResults(all);
    logMsg(`???뽑기 결과: 총 ${n}회\nA급:${aCount}, 그 중 부옵션4개:${fourSubs}`);
  });

  byId("btn-summary").addEventListener("click",()=>{
    const s=summarizeResults();
    logMsg(
`총 뽑기 횟수: ${s.totalAll}

A급 총: ${s.totalA}
부위별: 무기:${s.counts.무기}, 옷:${s.counts.옷}, 모자:${s.counts.모자}, 신발:${s.counts.신발}, 장갑:${s.counts.장갑}
A급 중 부옵션 4개: ${s.fourSubs}

무기/옷/모자:
- 효과적중+효과저항: ${s.effAccResist}
- 물리저항력+마법저항력: ${s.resistBoth}
- 효과적중+효과저항+물리저항력+마법저항력: ${s.effAll}

신발:
- 주스탯=효과적중, 부옵션에 효과저항 포함: ${s.shoeAccHasRes}
- 주스탯=효과저항, 부옵션에 효과적중 포함: ${s.shoeResHasAcc}

장갑:
- 주스탯=물리저항력, 부옵션에 효과적중+효과저항 모두 포함: ${s.glovePhysHasBoth}`
    );
  });
}
