// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터 (옵션 키는 starter와 100% 일치)

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const choice = (arr)=>arr[rand(arr.length)];

// === 옵션 키(강화와 동일) ===
const SUB_OPTIONS = [
  "체력","공격력","방어력",
  "치명타확률","치명타데미지증가",
  "마법저항력","물리저항력",
  "치명타 저항률","치명타 대미지 감소율",
  "마법관통력","물리관통력",
  "효과적중","효과저항",
  "명중","회피"
];

// 부위별 주스탯(옵션 키 일치)
const MAIN_STATS = {
  weapon:["공격력"],
  armor:["방어력"],
  hat:["체력"],
  shoes:["치명타데미지증가","치명타 대미지 감소율","마법저항력","효과적중","효과저항"],
  gloves:["치명타확률","치명타 저항률","물리저항력","마법관통력","물리관통력"],
};

// 등급별 부옵 개수 50:50
const SUB_COUNT_RULE = { A:[3,4], B:[2,3], C:[1,2] };

// 0강 수치 후보(강화 프리셋 생성용) — starter와 동일 키 사용
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

const ICON_KEY = "./assets/img/key.jpg"; // 경로/확장자 확인

// 세션 상태
let results = [];
let usedKeys = 0;

function resetSession(){
  results=[]; usedKeys=0;
  sessionStorage.removeItem('draw_results');
  sessionStorage.removeItem('used_keys');
}
function loadSession(){
  results = JSON.parse(sessionStorage.getItem('draw_results')||'[]');
  usedKeys = parseInt(sessionStorage.getItem('used_keys')||'0',10);
}
function saveSession(){
  sessionStorage.setItem('draw_results', JSON.stringify(results));
  sessionStorage.setItem('used_keys', usedKeys);
}

// 간단 등급 분포 (원문 확률표를 써도 됨)
function rollGrade(){
  const r=Math.random();
  if(r<0.20) return 'A'; // 20%
  if(r<0.50) return 'B'; // 30%
  return 'C';            // 50%
}
function rollMainStat(part){ return choice(MAIN_STATS[part]); }
function rollSubs(grade, main){
  const pool = SUB_OPTIONS.filter(x=>x!==main);
  const n = choice(SUB_COUNT_RULE[grade]);
  const subs=[];
  while(subs.length<n){
    const c=choice(pool);
    if(!subs.includes(c)) subs.push(c);
  }
  return subs;
}

function singleDraw(){
  usedKeys++;
  const part = choice(["weapon","armor","hat","shoes","gloves"]);
  const grade = rollGrade();
  const main = rollMainStat(part);
  const subs = rollSubs(grade, main);
  const rec = { part, grade, main, subs, when:Date.now() };
  results.push(rec);
  saveSession();
  return rec;
}

// UI 렌더
function renderResultList(){
  const host = byId('draw-results');
  host.innerHTML = results.map((r,i)=>{
    const isA4 = (r.grade==='A' && r.subs.length===4);
    return `
      <div class="card" style="padding:10px; margin-bottom:10px; ${isA4?'border:2px solid var(--ok)':''}">
        <div><b>${i+1}.</b> [${r.grade}] ${r.part}</div>
        <div>주스탯: ${r.main}</div>
        <div>부스탯: ${r.subs.join(', ')}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px">
          <button class="hero-btn ${isA4?'enabled':'disabled'} to-starter" data-idx="${i}">시동무기 강화</button>
          <span class="hint">※ A급 + 부옵션 4개일 경우만 활성화됩니다.</span>
        </div>
      </div>
    `;
  }).join('');

  // 버튼 핸들링
  host.querySelectorAll('.to-starter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.classList.contains('disabled')) return;
      const idx = parseInt(btn.dataset.idx,10);
      const r = results[idx];
      // 주 + 부 3개 = 총 4옵션 프리셋
      const four = [r.main, ...r.subs].slice(0,4);
      const preset = {
        starter4: four.map(stat=>{
          const vals = INIT_VALUES[stat] || [1,1.5,2,2.5];
          return { stat, value: choice(vals) };
        })
      };
      sessionStorage.setItem('starter_preset', JSON.stringify(preset));
      location.hash = '#starter';
    });
  });

  // 상단/홈 키 카운트 갱신
  const keySpan = document.querySelector('#key-count');
  if(keySpan) keySpan.textContent = usedKeys;

  // 페이지 내 키 카운트 표시
  const kLabel = byId('used-keys');
  if(kLabel) kLabel.textContent = usedKeys;
}

export function mountDraw(app){
  // 요구사항: 페이지 들어올 때마다 초기화
  resetSession();
  loadSession();

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
        <button class="hero-btn" id="draw-home">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
        <span class="badge" style="margin-left:auto">
          <img src="${ICON_KEY}" alt="key" /> 사용한 열쇠: <b id="used-keys">0</b>개
        </span>
      </div>

      <div class="card">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
          <button class="hero-btn" id="single-draw">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            단일 뽑기
          </button>

          <button class="hero-btn" id="multi-open">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            ??? 뽑기
          </button>

          <button class="hero-btn" id="show-total" style="margin-left:auto">총 결과보기</button>
        </div>

        <div id="multi-panel" style="display:none; margin-top:10px">
          <label>열쇠를 몇 개 사용하여 뽑기를 진행할까요? <b>(한 번에 최대 1000회)</b></label>
          <input type="number" id="multi-count" min="1" max="1000" value="10" />
          <div style="margin-top:6px; display:flex; gap:8px">
            <button class="hero-btn" id="multi-run">뽑기</button>
            <button class="hero-btn" id="multi-cancel">취소</button>
          </div>
        </div>
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

  byId('multi-open').addEventListener('click', ()=>{
    byId('multi-panel').style.display='block';
  });
  byId('multi-cancel').addEventListener('click', ()=>{
    byId('multi-panel').style.display='none';
  });
  byId('multi-run').addEventListener('click', ()=>{
    const n = parseInt(byId('multi-count').value,10);
    if(!Number.isFinite(n) || n<1 || n>1000){
      alert('1~1000 사이의 정수를 입력하세요. (한 번에 최대 1000회)');
      return;
    }
    for(let i=0;i<n;i++) singleDraw();
    byId('multi-panel').style.display='none';
    renderResultList();
  });

  byId('show-total').addEventListener('click', ()=>{
    const total = results.length;
    const A = results.filter(r=>r.grade==='A');
    const counts = {weapon:0,armor:0,hat:0,shoes:0,gloves:0};
    A.forEach(r=>counts[r.part]++);
    const a4 = A.filter(r=>r.subs.length===4).length;

    // 요구 조건에서 일부 예시(장갑 특정 조합)
    const glovePhysEffBoth = A.filter(r=>
      r.part==='gloves' && r.main==='물리저항력' &&
      r.subs.includes('효과적중') && r.subs.includes('효과저항')
    ).length;

    byId('draw-total').innerHTML = `
      <div class="card">
        <div class="big">총 결과</div>
        <div style="white-space:pre-wrap; margin-top:6px">
총 뽑기 횟수: ${total}

A급 시동무기 총 갯수 [무기:${counts.weapon} , 옷:${counts.armor} , 모자:${counts.hat} , 신발:${counts.shoes} , 장갑:${counts.gloves}]
A급 시동무기 중에 부옵션 4개인 총 갯수: ${a4}

장갑 부위에서
  - 주스탯: 물리저항력 / 부스탯: 효과적중과 효과저항 동시 → ${glovePhysEffBoth}
        </div>
      </div>
    `;
  });

  renderResultList();
}