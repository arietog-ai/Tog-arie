// js/feature_draw.js
// 시동무기 뽑기 모듈
// - 단일뽑기: 팝업(B/C 단순, A는 주스텟 표시) + 키 사용 + 상태 저장
// - ???뽑기: 입력(1~1000) 받아서 일괄 뽑기 → 간단 요약 팝업(A 총개수/부옵3/부옵4)
// - 총 결과보기: 단일/일괄 합산 통계 + 조건별 카운트
// - A급 카드엔 "강화 시뮬로" 버튼(단일뽑기 + 부옵 4개일 때만 활성)
//   → 세션스토리지 preset에 0강 4옵션 세팅 후 #starter로 이동

/* ==================== 데이터/상수 ==================== */

const SLOTS = ["무기","의상","모자","신발","장갑"];
const SUB_POOL = [
  "체력%","공격력%","방어력%","치명타 확률","치명타 대미지 증가율",
  "마법 저항률","물리 저항률","치명타 저항률","치명타 대미지 감소율",
  "마법 관통률","물리 관통률","효과 적중","효과 저항","명중","회피"
];

// 등급·부위·아이템ID(1/2) 가중치 (합=100)
const WEIGHTS = [
  // A
  { grade:"A", slot:"무기",  itemId:1, w:2.6 }, { grade:"A", slot:"무기",  itemId:2, w:2.6 },
  { grade:"A", slot:"의상",  itemId:1, w:2.6 }, { grade:"A", slot:"의상",  itemId:2, w:2.6 },
  { grade:"A", slot:"모자",  itemId:1, w:2.6 }, { grade:"A", slot:"모자",  itemId:2, w:2.6 },
  { grade:"A", slot:"신발",  itemId:1, w:1.1 }, { grade:"A", slot:"신발",  itemId:2, w:1.1 },
  { grade:"A", slot:"장갑",  itemId:1, w:1.1 }, { grade:"A", slot:"장갑",  itemId:2, w:1.1 },
  // B
  { grade:"B", slot:"무기",  itemId:1, w:3.9 }, { grade:"B", slot:"무기",  itemId:2, w:3.9 },
  { grade:"B", slot:"의상",  itemId:1, w:3.9 }, { grade:"B", slot:"의상",  itemId:2, w:3.9 },
  { grade:"B", slot:"모자",  itemId:1, w:3.9 }, { grade:"B", slot:"모자",  itemId:2, w:3.9 },
  { grade:"B", slot:"신발",  itemId:1, w:1.65 },{ grade:"B", slot:"신발",  itemId:2, w:1.65 },
  { grade:"B", slot:"장갑",  itemId:1, w:1.65 },{ grade:"B", slot:"장갑",  itemId:2, w:1.65 },
  // C
  { grade:"C", slot:"무기",  itemId:1, w:6.5 }, { grade:"C", slot:"무기",  itemId:2, w:6.5 },
  { grade:"C", slot:"의상",  itemId:1, w:6.5 }, { grade:"C", slot:"의상",  itemId:2, w:6.5 },
  { grade:"C", slot:"모자",  itemId:1, w:6.5 }, { grade:"C", slot:"모자",  itemId:2, w:6.5 },
  { grade:"C", slot:"신발",  itemId:1, w:2.75 },{ grade:"C", slot:"신발",  itemId:2, w:2.75 },
  { grade:"C", slot:"장갑",  itemId:1, w:2.75 },{ grade:"C", slot:"장갑",  itemId:2, w:2.75 },
];

const MAIN_RULE = {
  "무기":  [{stat:"공격력%", p:1}],
  "의상":  [{stat:"방어력%", p:1}],
  "모자":  [{stat:"체력%", p:1}],
  "신발":  [
    {stat:"치명타 대미지 증가율", p:0.2},
    {stat:"치명타 대미지 감소율", p:0.2},
    {stat:"마법 저항률",         p:0.2},
    {stat:"효과 적중",           p:0.2},
    {stat:"효과 저항",           p:0.2},
  ],
  "장갑":  [
    {stat:"치명타 확률", p:0.2},
    {stat:"치명타 저항률", p:0.2},
    {stat:"물리 저항률",  p:0.2},
    {stat:"마법 관통률",  p:0.2},
    {stat:"물리 관통률",  p:0.2},
  ],
};

const SUB_COUNT_RULE = {
  "C": [ {k:1, p:0.5}, {k:2, p:0.5} ],
  "B": [ {k:2, p:0.5}, {k:3, p:0.5} ],
  "A": [ {k:3, p:0.5}, {k:4, p:0.5} ],
};

// 강화 시뮬 0강 값 풀 (feature_starter.js와 동일 규칙)
const INIT_VALUES = {
  "물리관통률":[1.5,2.5,3.5,4.5],
  "마법관통률":[1.5,2.5,3.5,4.5],
  "물리 저항률":[1.5,2.5,3.5,4.5],
  "마법 저항률":[1.5,2.5,3.5,4.5],
  "치명타 확률":[1.5,2.5,3.5,4.5],
  "치명타 대미지 증가율":[1.5,2.5,3.5,4.5],

  "회피":[3,6,9,12],
  "명중":[3,6,9,12],
  "효과 적중":[3,6,9,12],
  "효과 저항":[3,6,9,12],

  "공격력%":[1,1.5,2,2.5],
  "방어력%":[1,1.5,2,2.5],
  "체력%":[1,1.5,2,2.5],

  "치명타 저항률":[1.5,2.5,3.5,4.5],
  "치명타 대미지 감소율":[1.5,2.5,3.5,4.5],
};

const PERCENT_SET = new Set([
  "공격력%","방어력%","체력%",
  "물리관통률","마법관통률","물리 저항률","마법 저항률",
  "치명타 확률","치명타 대미지 증가율","치명타 저항률","치명타 대미지 감소율",
]);

const fmt = (stat, v) => (PERCENT_SET.has(stat) ? `${v}%` : `${v}`);

/* ==================== 상태 ==================== */

const state = {
  keysUsed: 0,
  pulls: [], // {grade,slot,itemId, main, subs[], subCount, when, source:"single"|"bulk"}
  aSaved: [] // A급 저장(강화용 카드): {id, slot, main, subs(3 or 4), starter4[], source}
};

function persist() {
  sessionStorage.setItem('draw_state', JSON.stringify(state));
}
function restore() {
  const raw = sessionStorage.getItem('draw_state');
  if(!raw) return;
  try {
    const o = JSON.parse(raw);
    Object.assign(state, o);
  } catch {}
}

/* ==================== 유틸/샘플링 ==================== */

function weightedPick(items, wKey="w"){
  const sum = items.reduce((a,b)=>a+(b[wKey]||0),0);
  let r = Math.random()*sum, acc=0;
  for(const it of items){
    acc += (it[wKey]||0);
    if(r <= acc) return it;
  }
  return items[items.length-1];
}

function pickMain(slot){
  const arr = MAIN_RULE[slot];
  return weightedPick(arr, "p").stat;
}

function pickSubCount(grade){
  const arr = SUB_COUNT_RULE[grade];
  return weightedPick(arr, "p").k;
}

function sampleWithoutReplacement(arr, k){
  const pool = arr.slice();
  for(let i=pool.length-1;i>0;i--){
    const j = (Math.random()*(i+1))|0;
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool.slice(0, k);
}

function assignInitialValues(fourStats){ // [{stat}]
  return fourStats.map(s => ({
    stat: s.stat,
    value: randomChoice(INIT_VALUES[s.stat] || [1]) // safety
  }));
}

function randomChoice(arr){ return arr[(Math.random()*arr.length)|0]; }

/* ==================== 핵심: 1회 뽑기 ==================== */

function rollOnce(){
  const pick = weightedPick(WEIGHTS);
  const main = pickMain(pick.slot);
  const subCount = pickSubCount(pick.grade);
  // 부스텟은 주스텟 제외 + 중복 금지
  const pool = SUB_POOL.filter(s => s !== main);
  const subs = sampleWithoutReplacement(pool, subCount);
  return {
    grade: pick.grade,
    slot: pick.slot,
    itemId: pick.itemId,
    main,
    subs,
    subCount,
    when: Date.now(),
  };
}

/* ==================== UI 구성 ==================== */

const byId = (id)=>document.getElementById(id);

function popup(msg, extraButtons=[]){
  // 간단 모달
  let wrap = document.createElement('div');
  wrap.style.cssText = `
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,.5); z-index:9999; padding:16px;
  `;
  let card = document.createElement('div');
  card.className = 'card';
  card.style.maxWidth = '520px';
  card.innerHTML = `
    <div style="white-space:pre-wrap;line-height:1.5">${msg}</div>
    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
      ${extraButtons.map(b=>`<button class="modal-btn" data-key="${b.key}">${b.label}</button>`).join('')}
      <button class="modal-btn" data-key="ok">확인</button>
    </div>
  `;
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  return new Promise(res=>{
    wrap.addEventListener('click', (e)=>{
      const btn = e.target.closest('.modal-btn');
      if(!btn) return;
      const key = btn.getAttribute('data-key');
      document.body.removeChild(wrap);
      res(key);
    }, {once:true});
  });
}

function renderSummaryInto(el){
  // 총 결과보기 요약
  const total = state.pulls.length;
  const aPulls = state.pulls.filter(p=>p.grade==="A");
  const bySlot = {무기:0,의상:0,모자:0,신발:0,장갑:0};
  aPulls.forEach(p=>bySlot[p.slot]++);
  const aWith4 = aPulls.filter(p=>p.subs.length===4).length;

  // 조건 카운트
  const isWHM = (subs)=>subs.includes("물리 저항률") && subs.includes("마법 저항률");
  const isEE  = (subs)=>subs.includes("효과 적중") && subs.includes("효과 저항");

  const WCH = aPulls.filter(p=>["무기","의상","모자"].includes(p.slot));
  const cnt1 = WCH.filter(p=>isEE(p.subs)).length;
  const cnt2 = WCH.filter(p=>isWHM(p.subs)).length;
  const cnt3 = WCH.filter(p=>isEE(p.subs)&&isWHM(p.subs)).length;

  const SHOES = aPulls.filter(p=>p.slot==="신발");
  const s1 = SHOES.filter(p=>p.main==="효과 적중" && p.subs.includes("효과 저항")).length;
  const s2 = SHOES.filter(p=>p.main==="효과 저항" && p.subs.includes("효과 적중")).length;

  const GLOVES = aPulls.filter(p=>p.slot==="장갑");
  const g1 = GLOVES.filter(p=>p.main==="물리 저항률" && p.subs.includes("효과 적중") && p.subs.includes("효과 저항")).length;

  el.innerHTML = `
    <div class="card">
      <div class="big">총 결과보기</div>
      <div class="grid cols-2" style="margin-top:8px">
        <div>
          <div class="pill">총 뽑기 시행 횟수</div>
          <div style="margin-top:6px" class="big">${total} 회</div>
          <div class="muted" style="margin-top:6px">열쇠 사용량(누적): ${state.keysUsed} 개</div>
        </div>
        <div>
          <div class="pill">A급 시동무기</div>
          <div style="margin-top:6px">총 ${aPulls.length} 개</div>
          <div class="muted">[무기:${bySlot.무기} / 의상:${bySlot.의상} / 모자:${bySlot.모자} / 신발:${bySlot.신발} / 장갑:${bySlot.장갑}]</div>
          <div style="margin-top:6px">A급 중 부옵 4개: <b>${aWith4}</b> 개</div>
        </div>
      </div>

      <div class="grid cols-2" style="margin-top:10px">
        <div class="card">
          <div class="pill">무기/의상/모자 조건</div>
          <div style="margin-top:6px">1) 효과적중 + 효과저항: <b>${cnt1}</b> 개</div>
          <div>2) 물리저항력 + 마법저항력: <b>${cnt2}</b> 개</div>
          <div>3) (1)+(2) 동시에: <b>${cnt3}</b> 개</div>
        </div>
        <div class="card">
          <div class="pill">신발/장갑 조건</div>
          <div style="margin-top:6px">신발-주:효과적중 & 부:효과저항: <b>${s1}</b> 개</div>
          <div>신발-주:효과저항 & 부:효과적중: <b>${s2}</b> 개</div>
          <div style="margin-top:6px">장갑-주:물리저항률 & 부:효과적중+효과저항: <b>${g1}</b> 개</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:10px">
      <div class="pill">A급 목록(최신순)</div>
      <div id="a-list" style="margin-top:8px; display:grid; gap:8px"></div>
    </div>
  `;

  // A급 카드 리스트
  const aList = byId('a-list');
  const aSorted = state.pulls
    .filter(p=>p.grade==="A")
    .slice()
    .sort((a,b)=>b.when-a.when);

  for(const p of aSorted){
    const isSingle = p.source==="single";
    const canSim = isSingle && p.subs.length===4; // 조건: 단일뽑기 + 부옵 4개
    const id = `a-${p.slot}-${p.itemId}-${p.when}`;
    const subsTxt = p.subs.length ? p.subs.join(', ') : '(부옵 없음)';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div><b>A급 ${p.slot}</b> · 주스텟: ${p.main}</div>
      <div class="muted">부옵(${p.subs.length}): ${subsTxt}</div>
      <div style="margin-top:8px; display:flex; gap:8px">
        <button class="hero-btn" data-simid="${id}" ${canSim?'':'disabled'}>강화 시뮬로</button>
        <span class="muted">${isSingle?'단일뽑기':'일괄'}</span>
      </div>
    `;
    aList.appendChild(card);

    if(canSim){
      card.querySelector('button[data-simid]').addEventListener('click', ()=>{
        // 0강 4옵션 구성: 주1 + (subs 3개; subs=4면 랜덤 제거)
        let sub3 = p.subs.slice(0,3);
        if(p.subs.length===4){
          // 랜덤으로 하나 제외
          const idx = (Math.random()*4)|0;
          sub3 = p.subs.filter((_,i)=>i!==idx).slice(0,3);
        }
        const fourStats = [{stat:p.main}, ...sub3.map(s=>({stat:s}))];
        const starter4 = assignInitialValues(fourStats);

        sessionStorage.setItem('starter_preset', JSON.stringify({ starter4 }));
        location.hash = '#starter';
      });
    }
  }
}

/* ==================== 마운트 ==================== */

export function mountDraw(app){
  restore();

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="draw-home" class="hero-btn" style="padding:10px 12px">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
      </div>

      <div class="card">
        <h2 style="margin:0 0 8px">뽑기</h2>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="btn-single" class="hero-btn">단일뽑기</button>
          <button id="btn-bulk" class="hero-btn">???뽑기</button>
          <button id="btn-summary" class="hero-btn" style="margin-left:auto">총 결과보기</button>
        </div>
        <div id="draw-log" class="muted" style="margin-top:8px"></div>
      </div>

      <div id="summary-wrap" style="margin-top:10px"></div>
    </section>
  `;

  byId('draw-home').addEventListener('click', ()=>{ location.hash=''; });

  byId('btn-single').addEventListener('click', async ()=>{
    state.keysUsed += 1;
    const r = rollOnce();
    r.source = "single";
    state.pulls.push(r);
    persist();

    // 팝업: A는 주스텟 표시, B/C는 단순
    if(r.grade==="A"){
      await popup(`A급 ${r.slot}입니다.\n(주스텟: ${r.main})`);
    }else{
      await popup(`${r.grade}급 ${r.slot}입니다.`);
    }

    byId('draw-log').textContent = `단일뽑기 완료 · 누적 열쇠: ${state.keysUsed}`;
  });

  byId('btn-bulk').addEventListener('click', async ()=>{
    // 입력 모달
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.5); z-index:9999; padding:16px;
    `;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '420px';
    card.innerHTML = `
      <div style="font-weight:700; margin-bottom:8px">열쇠를 몇 개 사용하여 뽑기를 진행할까요?</div>
      <input id="bulk-n" type="number" min="1" max="1000" value="10" />
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px">
        <button id="bulk-cancel">취소</button>
        <button id="bulk-run">뽑기</button>
      </div>
    `;
    wrap.appendChild(card);
    document.body.appendChild(wrap);

    const close = ()=>document.body.removeChild(wrap);

    await new Promise(resolve=>{
      byId('bulk-cancel').addEventListener('click', ()=>{ close(); resolve('cancel'); }, {once:true});
      byId('bulk-run').addEventListener('click', ()=>{ resolve('run'); }, {once:true});
    });

    if(!document.getElementById('bulk-n')) return; // 취소됨
    const n = Math.max(1, Math.min(1000, parseInt(byId('bulk-n').value||'0',10)));
    close();

    // 실행
    let aTotal=0, a3=0, a4=0;
    state.keysUsed += n;
    for(let i=0;i<n;i++){
      const r = rollOnce();
      r.source = "bulk";
      state.pulls.push(r);
      if(r.grade==="A"){
        aTotal++;
        if(r.subs.length===3) a3++;
        if(r.subs.length===4) a4++;
      }
    }
    persist();

    await popup(`일괄 ${n}회 완료\nA급 총 ${aTotal}개\n- 부옵 3개: ${a3}개\n- 부옵 4개: ${a4}개`);
    byId('draw-log').textContent = `일괄 ${n}회 완료 · 누적 열쇠: ${state.keysUsed}`;
  });

  byId('btn-summary').addEventListener('click', ()=>{
    renderSummaryInto(byId('summary-wrap'));
  });
}
