// js/feature_draw.js
// 시동무기 뽑기 모듈
import { INIT_VALUES, rand } from "./feature_starter.js";

const ICON_KEY = "./assets/img/key.png";

const byId = (id) => document.getElementById(id);

function randChoice(arr) { return arr[rand(arr.length)]; }

// 결과 저장
function loadResults(){ 
  return JSON.parse(sessionStorage.getItem("draw_results")||"[]"); 
}
function saveResults(arr){ 
  sessionStorage.setItem("draw_results", JSON.stringify(arr)); 
}

// 단일 뽑기
function singleDraw(){
  // 간단 예시 확률 (실제 확률표 그대로 넣어도 됨)
  const gradePool = [
    { g:"A", p:0.1 }, { g:"B", p:0.3 }, { g:"C", p:0.6 }
  ];
  const r = Math.random();
  let acc=0, grade="C";
  for(const it of gradePool){ acc+=it.p; if(r<=acc){ grade=it.g; break; } }

  const parts=["무기","옷","모자","신발","장갑"];
  const part = randChoice(parts);

  // 주스탯
  let main="공격력%";
  if(part==="옷") main="방어력%";
  else if(part==="모자") main="체력%";
  else if(part==="신발") main=randChoice(["치명타 대미지 증가율","치명타 대미지 감소율","마법 저항률","효과 적중","효과 저항"]);
  else if(part==="장갑") main=randChoice(["치명타 확률","치명타 저항률","물리 저항률","마법 관통률","물리 관통률"]);

  // 부옵 개수
  let subCount=2;
  if(grade==="C") subCount = rand()<0.5?1:2;
  if(grade==="B") subCount = rand()<0.5?2:3;
  if(grade==="A") subCount = rand()<0.5?3:4;

  // 부옵 pool
  const pool = ["체력","공격력","방어력","치명타 확률","치명타 대미지 증가율","마법 저항률","물리 저항률","치명타 저항률","치명타 대미지 감소율","마법 관통률","물리 관통률","효과 적중","효과 저항","명중","회피"];
  const subs=[];
  while(subs.length<subCount){
    const c=randChoice(pool);
    if(c!==main && !subs.includes(c)) subs.push(c);
  }

  return { grade, part, main, subs };
}

// 결과 요약
function summarizeResults(){
  const all = loadResults();
  const results = all.filter(r=>r.grade==="A");

  const counts={무기:0, 옷:0, 모자:0, 신발:0, 장갑:0};
  let fourSubs=0, effAccResist=0,resistBoth=0,effAll=0;
  let shoeAccHasRes=0,shoeResHasAcc=0,glovePhysHasBoth=0;

  results.forEach(r=>{
    counts[r.part]++;
    if(r.subs.length===4) fourSubs++;
    if(["무기","옷","모자"].includes(r.part)){
      if(r.subs.includes("효과 적중")&&r.subs.includes("효과 저항")) effAccResist++;
      if(r.subs.includes("물리 저항률")&&r.subs.includes("마법 저항률")) resistBoth++;
      if(["효과 적중","효과 저항","물리 저항률","마법 저항률"].every(x=>r.subs.includes(x))) effAll++;
    }
    if(r.part==="신발"){
      if(r.main==="효과 적중"&&r.subs.includes("효과 저항")) shoeAccHasRes++;
      if(r.main==="효과 저항"&&r.subs.includes("효과 적중")) shoeResHasAcc++;
    }
    if(r.part==="장갑"){
      if(r.main==="물리 저항률"&&r.subs.includes("효과 적중")&&r.subs.includes("효과 저항")) glovePhysHasBoth++;
    }
  });

  return {
    totalAll: all.length,
    totalA: results.length,
    counts,fourSubs,
    effAccResist,resistBoth,effAll,
    shoeAccHasRes,shoeResHasAcc,glovePhysHasBoth
  };
}

export function mountDraw(app){
  sessionStorage.removeItem("draw_results");

  app.innerHTML=`
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

  // 단일 뽑기
  byId("btn-single").addEventListener("click", ()=>{
    const r = singleDraw();
    const all = loadResults(); all.push(r); saveResults(all);

    if (r.grade === "A") {
      logMsg(`🎉 A급 ${r.part}\n주스탯: ${r.main}\n부옵션: ${r.subs.join(", ")}`);
      if (r.subs.length === 4) {
        starterBtn.disabled = false;
        const preset={};
        const allOpts=[r.main,...r.subs];
        allOpts.forEach(opt=>{
          const vals=INIT_VALUES[opt];
          const val=vals[rand(vals.length)];
          preset[opt]=val;
        });
        sessionStorage.setItem("starter_preset", JSON.stringify(preset));
      }
    } else {
      logMsg(`${r.grade}급 ${r.part}입니다.`);
    }
  });

  // ??? 뽑기
  byId("btn-multi").addEventListener("click", ()=>{
    const raw = prompt("열쇠를 몇 개 사용하여 뽑기를 진행할까요? (최대 1000)");
    if (raw === null) return;
    const n = parseInt(raw,10);
    if (!Number.isFinite(n) || n<=0){ alert("양의 정수를 입력하세요."); return; }
    if (n>1000){ alert("최대 1000개까지 가능합니다."); return; }

    const all = loadResults();
    let aTotal=0,a3=0,a4=0;
    for(let i=0;i<n;i++){
      const r=singleDraw(); all.push(r);
      if(r.grade==="A"){ aTotal++; if(r.subs.length===3)a3++; if(r.subs.length===4)a4++; }
    }
    saveResults(all);
    logMsg(`???뽑기 결과: 총 ${n}회\nA급:${aTotal}개 (부옵3:${a3} / 부옵4:${a4})`);
  });

  // 총 결과보기
  byId("btn-summary").addEventListener("click", ()=>{
    const s=summarizeResults();
    summaryWrap.innerHTML=`
      <div class="card">
        <div class="big">총 결과</div>
        <div style="margin-top:8px; white-space:pre-wrap">
총 뽑기 횟수: ${s.totalAll}
A급 시동무기 총 갯수 [무기:${s.counts.무기}, 옷:${s.counts.옷}, 모자:${s.counts.모자}, 신발:${s.counts.신발}, 장갑:${s.counts.장갑}]
A급 부옵4개: ${s.fourSubs}
무기/옷/모자 - 효과적중+효과저항: ${s.effAccResist}
무기/옷/모자 - 물리저항+마법저항: ${s.resistBoth}
무기/옷/모자 - 효과적중+효과저항+물리저항+마법저항: ${s.effAll}
신발 주=효과적중 & 부=효과저항: ${s.shoeAccHasRes}
신발 주=효과저항 & 부=효과적중: ${s.shoeResHasAcc}
장갑 주=물리저항 & 부=효과적중+효과저항: ${s.glovePhysHasBoth}
        </div>
      </div>
    `;
  });

  // 강화 시뮬로 이동
  starterBtn.addEventListener("click", ()=>{
    location.hash="#starter";
  });
}