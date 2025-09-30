// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터

const byId = (id)=>document.getElementById(id);
function rand(n){ return Math.floor(Math.random()*n); }
function choice(arr){ return arr[rand(arr.length)]; }

// ★ 옵션명 통일 (starter.js와 동일)
const OPTIONS = {
  weapon: ["공격력"],
  armor: ["방어력"],
  hat: ["체력"],
  shoes: ["치명타데미지증가","치명타대미지감소율","마법저항력","효과적중","효과저항"],
  gloves: ["치명타확률","치명타저항률","물리저항력","마법관통력","물리관통력"]
};
const SUB_OPTIONS = [
  "체력","공격력","방어력","치명타확률","치명타데미지증가",
  "마법저항력","물리저항력","치명타저항률","치명타대미지감소율",
  "마법관통력","물리관통력","효과적중","효과저항","명중","회피"
];

let results = [];
let usedKeys = 0;

function resetSession(){
  results = [];
  usedKeys = 0;
  sessionStorage.removeItem('draw_results');
  sessionStorage.removeItem('used_keys');
}

function saveSession(){
  sessionStorage.setItem('draw_results', JSON.stringify(results));
  sessionStorage.setItem('used_keys', usedKeys);
}

function loadSession(){
  results = JSON.parse(sessionStorage.getItem('draw_results')||'[]');
  usedKeys = parseInt(sessionStorage.getItem('used_keys')||'0',10);
}

function rollGrade(){
  // 단순: A 10%, B 20%, C 70% (예시, 실제 확률 반영 가능)
  const r = Math.random()*100;
  if(r<10) return 'A';
  if(r<30) return 'B';
  return 'C';
}

function rollMainStat(part){
  if(OPTIONS[part]) return choice(OPTIONS[part]);
  return choice(SUB_OPTIONS);
}

function rollSubs(grade, mainStat){
  let n = 0;
  if(grade==='C') n = Math.random()<0.5?1:2;
  else if(grade==='B') n = Math.random()<0.5?2:3;
  else if(grade==='A') n = Math.random()<0.5?3:4;
  const pool = SUB_OPTIONS.filter(x=>x!==mainStat);
  const subs=[];
  while(subs.length<n){
    const c = choice(pool);
    if(!subs.includes(c)) subs.push(c);
  }
  return subs;
}

function singleDraw(){
  usedKeys++;
  const parts = ["weapon","armor","hat","shoes","gloves"];
  const part = choice(parts);
  const grade = rollGrade();
  const main = rollMainStat(part);
  const subs = rollSubs(grade, main);
  const res = {part, grade, main, subs};
  results.push(res);
  saveSession();
  return res;
}

function renderResultList(){
  const host = byId('draw-results');
  host.innerHTML = results.map((r,i)=>{
    const isTarget = (r.grade==='A' && r.subs.length===4);
    return `
      <div class="card" style="padding:6px; margin-bottom:6px; ${isTarget?'border:2px solid var(--ok)':''}">
        <div><b>${i+1}.</b> [${r.grade}] ${r.part}</div>
        <div>주스탯: ${r.main}</div>
        <div>부스탯: ${r.subs.join(', ')}</div>
        <button class="hero-btn to-starter ${isTarget?'':'disabled'}" data-idx="${i}">시동무기 강화</button>
        <small class="muted">※ A급 + 부옵션 4개일 경우만 활성화됩니다.</small>
      </div>`;
  }).join('');
  host.querySelectorAll('.to-starter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.classList.contains('disabled')) return;
      const idx = parseInt(btn.dataset.idx,10);
      const r = results[idx];
      sessionStorage.setItem('starter_preset', JSON.stringify({
        starter4: [
          {stat:r.main, value:1.5},
          ...r.subs.slice(0,3).map(s=>({stat:s, value:1.5}))
        ]
      }));
      location.hash = '#starter';
    });
  });
  // 열쇠 사용량 표시 갱신
  const keySpan = document.querySelector('#key-count');
  if(keySpan) keySpan.textContent = usedKeys;
}

export function mountDraw(app){
  resetSession(); // 새로 들어오면 초기화
  loadSession();

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button class="hero-btn" id="draw-home">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
      </div>

      <div class="card">
        <button class="hero-btn" id="single-draw">단일 뽑기</button>
        <button class="hero-btn" id="multi-draw">??? 뽑기</button>
        <div id="multi-input" style="display:none; margin-top:8px">
          <label>열쇠를 몇 개 사용하여 뽑기를 진행할까요? (한 번에 최대 1000회)</label>
          <input type="number" id="multi-count" min="1" max="1000" value="10" />
          <div style="margin-top:6px; display:flex; gap:6px">
            <button class="hero-btn" id="multi-confirm">뽑기</button>
            <button class="hero-btn" id="multi-cancel">취소</button>
          </div>
        </div>
        <button class="hero-btn" id="show-total" style="margin-top:10px">총 결과보기</button>
      </div>

      <div id="draw-results" style="margin-top:12px"></div>
      <div id="draw-total" style="margin-top:12px"></div>
    </section>
  `;

  byId('draw-home').addEventListener('click', ()=>{ location.hash=''; });
  byId('single-draw').addEventListener('click', ()=>{
    singleDraw();
    renderResultList();
  });
  byId('multi-draw').addEventListener('click', ()=>{
    byId('multi-input').style.display='block';
  });
  byId('multi-cancel').addEventListener('click', ()=>{
    byId('multi-input').style.display='none';
  });
  byId('multi-confirm').addEventListener('click', ()=>{
    const n = parseInt(byId('multi-count').value,10);
    if(!n || n<1 || n>1000) return alert('1~1000 사이의 숫자를 입력하세요');
    for(let i=0;i<n;i++) singleDraw();
    renderResultList();
    byId('multi-input').style.display='none';
  });
  byId('show-total').addEventListener('click', ()=>{
    const total = results.length;
    const aItems = results.filter(r=>r.grade==='A');
    const aCount = aItems.length;
    const a4 = aItems.filter(r=>r.subs.length===4).length;

    const glovesSpec = aItems.filter(r=>
      r.part==='gloves' && r.main==='물리저항력' &&
      r.subs.includes('효과적중') && r.subs.includes('효과저항')
    ).length;

    byId('draw-total').innerHTML = `
      <div class="card">
        <h3>총 결과</h3>
        <div>총 뽑기 횟수: ${total}</div>
        <div>A급 총: ${aCount}개</div>
        <div>A급 중 옵션4개: ${a4}개</div>
        <div>장갑(물리저항력+효과적중+효과저항): ${glovesSpec}개</div>
      </div>
    `;
  });

  renderResultList();
}