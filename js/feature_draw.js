// js/feature_draw.js
// 시동무기 뽑기 모듈

// 아이콘 경로
const ICON_KEY = "./assets/img/key.jpg";        // 실제 파일 확장자가 png면 .png로 수정
const ICON_WHET = "./assets/img/whetstone.jpg"; // 실제 파일 확장자가 png면 .png로 수정

// 상태
const state = {
  keysUsed: 0,
  pulls: [],
  savedAList: [],
};

// 확률 데이터 (간단화된 샘플)
const gradeTable = [
  { grade:"A", slot:"무기", prob:2.6 },
  { grade:"A", slot:"의상", prob:2.6 },
  { grade:"A", slot:"모자", prob:2.6 },
  { grade:"A", slot:"신발", prob:1.1 },
  { grade:"A", slot:"장갑", prob:1.1 },
  { grade:"B", slot:"무기", prob:3.9 },
  { grade:"B", slot:"의상", prob:3.9 },
  { grade:"B", slot:"모자", prob:3.9 },
  { grade:"B", slot:"신발", prob:1.65 },
  { grade:"B", slot:"장갑", prob:1.65 },
  { grade:"C", slot:"무기", prob:6.5 },
  { grade:"C", slot:"의상", prob:6.5 },
  { grade:"C", slot:"모자", prob:6.5 },
  { grade:"C", slot:"신발", prob:2.75 },
  { grade:"C", slot:"장갑", prob:2.75 },
];
const subPool = ["체력%","공격력%","방어력%","치명타 확률","치명타 대미지 증가율",
"마법 저항률","물리 저항률","치명타 저항률","치명타 대미지 감소율","마법 관통률",
"물리 관통률","효과 적중","효과 저항","명중","회피"];

// 가중치 샘플링
function weightedPick(arr){
  const sum = arr.reduce((a,b)=>a+b.prob,0);
  let r = Math.random()*sum;
  for(const e of arr){
    if(r < e.prob) return e;
    r -= e.prob;
  }
  return arr[arr.length-1];
}

// 주스탯 선택
function pickMain(slot){
  if(slot==="무기") return "공격력%";
  if(slot==="의상") return "방어력%";
  if(slot==="모자") return "체력%";
  if(slot==="신발"){
    const opts=["치명타 대미지 증가율","치명타 대미지 감소율","마법 저항률","효과 적중","효과 저항"];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  if(slot==="장갑"){
    const opts=["치명타 확률","치명타 저항률","물리 저항률","마법 관통률","물리 관통률"];
    return opts[Math.floor(Math.random()*opts.length)];
  }
}

// 부스탯 개수 선택
function pickSubCount(grade){
  const r=Math.random();
  if(grade==="C") return r<0.5?1:2;
  if(grade==="B") return r<0.5?2:3;
  if(grade==="A") return r<0.5?3:4;
  return 0;
}

// 부스탯 샘플링
function sampleSubs(main, count){
  const pool = subPool.filter(s=>s!==main);
  const out=[];
  while(out.length<count && pool.length){
    const i=Math.floor(Math.random()*pool.length);
    out.push(pool[i]);
    pool.splice(i,1);
  }
  return out;
}

function rollOnce(){
  const g=weightedPick(gradeTable);
  const main=pickMain(g.slot);
  const subs=sampleSubs(main,pickSubCount(g.grade));
  return {grade:g.grade, slot:g.slot, main, subs};
}

function showPopup(r){
  let msg="";
  if(r.grade==="A"){
    msg=`A급 ${r.slot}입니다. (주스탯: ${r.main})`;
  }else{
    msg=`${r.grade}급 ${r.slot}입니다.`;
  }
  alert(msg); // 임시: 나중에 모달 UI로 교체 가능
}

export function mountDraw(app){
  app.innerHTML=`
  <section class="container">
    <div style="display:flex; gap:8px; margin-bottom:8px">
      <button id="draw-home" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
      <span class="pill">시동무기 뽑기</span>
    </div>
    <div class="card">
      <h2 style="margin:0 0 8px">뽑기</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button id="btn-single" class="hero-btn">
          <img src="${ICON_KEY}" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;border-radius:4px"/>단일뽑기
        </button>
        <button id="btn-bulk" class="hero-btn">
          <img src="${ICON_KEY}" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;border-radius:4px"/>???뽑기
        </button>
        <button id="btn-summary" class="hero-btn" style="margin-left:auto">총 결과보기</button>
      </div>
      <div id="draw-log" class="muted" style="margin-top:8px"></div>
    </div>
    <div id="summary-wrap" style="margin-top:10px"></div>
  </section>
  `;
  document.getElementById('draw-home').onclick=()=>location.hash="#gear";
  document.getElementById('btn-single').onclick=()=>{
    state.keysUsed++;
    const r=rollOnce();
    state.pulls.push(r);
    if(r.grade==="A") state.savedAList.push(r);
    showPopup(r);
  };
  document.getElementById('btn-bulk').onclick=()=>{
    const n=parseInt(prompt("열쇠를 몇 개 사용하여 뽑기를 진행할까요? (최대 1000)"));
    if(!n||n<=0||n>1000)return;
    for(let i=0;i<n;i++){
      state.keysUsed++;
      const r=rollOnce();
      state.pulls.push(r);
      if(r.grade==="A") state.savedAList.push(r);
    }
    const aTotal=state.savedAList.length;
    const a3=state.savedAList.filter(x=>x.subs.length===3).length;
    const a4=state.savedAList.filter(x=>x.subs.length===4).length;
    alert(`A급 총 ${aTotal}개\nA급 중 옵션3개: ${a3}, 옵션4개: ${a4}`);
  };
  document.getElementById('btn-summary').onclick=()=>{
    const aTotal=state.savedAList.length;
    const a4=state.savedAList.filter(x=>x.subs.length===4).length;
    document.getElementById('summary-wrap').innerHTML=`
      <div class="card">
        <h3>총 결과</h3>
        <p>총 뽑기 횟수: ${state.pulls.length}</p>
        <p>A급 총: ${aTotal}개</p>
        <p>A급 중 옵션4개: ${a4}개</p>
      </div>
    `;
  };
}
