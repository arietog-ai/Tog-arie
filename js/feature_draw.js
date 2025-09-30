// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터 (옵션 키는 starter와 100% 일치)

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const choice = (arr)=>arr[rand(arr.length)];

const ICON_KEY = "./assets/img/key.jpg";

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

// 부위별 주스탯
const MAIN_STATS = {
  weapon:["공격력"],
  armor:["방어력"],
  hat:["체력"],
  shoes:["치명타데미지증가","치명타 대미지 감소율","마법저항력","효과적중","효과저항"],
  gloves:["치명타확률","치명타 저항률","물리저항력","마법관통력","물리관통력"],
};

// 등급별 부옵 개수
const SUB_COUNT_RULE = { A:[3,4], B:[2,3], C:[1,2] };

// 0강 수치 후보
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

// ===== 세션 상태 =====
let results = [];
let usedKeys = 0;
let autoRunning = false;
let autoStop = false;

export function resetDrawSession(){
  results = [];
  usedKeys = 0;
  autoRunning = false;
  autoStop = false;
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

// 등급 확률
function rollGrade(){
  const r=Math.random();
  if(r<0.20) return 'A'; 
  if(r<0.50) return 'B'; 
  return 'C';            
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

function makeRecord(src, forceEnable=false){
  usedKeys++;
  const part = choice(["weapon","armor","hat","shoes","gloves"]);
  const grade = rollGrade();
  const main = rollMainStat(part);
  const subs = rollSubs(grade, main);
  const rec = { part, grade, main, subs, src, forceEnable, display:false, when:Date.now() + Math.random() };
  results.push(rec);
  saveSession();
  return rec;
}

// 표시 규칙
function updateDisplayFlags(){
  results.forEach(r => r.display = false);
  for(let i=results.length-1;i>=0;i--){
    if(results[i].src==='single'){ results[i].display = true; break; }
  }
  for(let i=results.length-1;i>=0;i--){
    if(results[i].src==='auto' && results[i].forceEnable){ results[i].display = true; break; }
  }
}

function renderResultList(){
  updateDisplayFlags();
  const list = results.filter(r=>r.display);
  const host = byId('draw-results');

  host.innerHTML = list.map((r)=>{
    const enable = r.forceEnable || (r.grade==='A' && r.subs.length===4);
    return `
      <div class="card" style="padding:10px; margin-bottom:10px; ${enable?'border:2px solid var(--ok)':''}">
        <div><b>${r.src==='single'?'단일':'자동'} 결과</b> · [${r.grade}] ${r.part}</div>
        <div>주스탯: ${r.main}</div>
        <div>부스탯: ${r.subs.join(', ')}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px">
          <button class="hero-btn ${enable?'enabled':'disabled'} to-starter" data-when="${r.when}">시동무기 강화</button>
          <span class="hint">※ 수동: A+부옵4개 / 자동: 조건 달성 시 즉시 활성화</span>
        </div>
      </div>
    `;
  }).join('');

  host.querySelectorAll('.to-starter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.classList.contains('disabled')) return;
      const when = parseFloat(btn.dataset.when);
      const r = results.find(x=>x.when===when);
      if(!r) return;

      // 주스탯 제외 → 부옵 4개만
      const base = r.subs.slice(0,4);
      let four = base.slice();
      if(four.length<4){
        const pool = SUB_OPTIONS.filter(x=>!four.includes(x));
        while(four.length<4 && pool.length){
          const pick = choice(pool);
          four.push(pick);
          pool.splice(pool.indexOf(pick),1);
        }
      }
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

  const k1 = byId('used-keys');
  if(k1) k1.textContent = usedKeys;
}

/* ===== 자동 뽑기 조건 ===== */
function buildAutoUI(){
  syncAutoMain();
  enforceSubSelectLimit();
}
function syncAutoMain(){
  const part = byId('auto-part').value;
  const mainSel = byId('auto-main');
  const hint = byId('auto-main-hint');

  if(part==='weapon' || part==='armor' || part==='hat'){
    const fixed = MAIN_STATS[part][0];
    mainSel.innerHTML = `<option value="${fixed}">${fixed}</option>`;
    mainSel.dataset.fixed = '1';
  }else{
    mainSel.innerHTML = MAIN_STATS[part].map(s=>`<option value="${s}">${s}</option>`).join('');
    mainSel.dataset.fixed = '0';
  }
  hint.textContent = '무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능';
  syncAutoSubs();
}
function syncAutoSubs(){
  const main = byId('auto-main').value;
  const box = byId('auto-subs');
  const pool = SUB_OPTIONS.filter(x=>x!==main);
  box.innerHTML = pool.map(s=>{
    return `<label><input type="checkbox" class="auto-sub" value="${s}" /> ${s}</label>`;
  }).join('');
  enforceSubSelectLimit();
}
function enforceSubSelectLimit(){
  const subsBox = byId('auto-subs');
  const btnStart = byId('auto-run');
  const counter = byId('auto-counter');

  function refresh(){
    const checks = Array.from(subsBox.querySelectorAll('.auto-sub'));
    const chosen = checks.filter(c=>c.checked);
    counter.textContent = `선택: ${chosen.length}/최대4`;

    if(chosen.length>=4){
      checks.forEach(c=>{ if(!c.checked) c.disabled=true; });
    }else{
      checks.forEach(c=> c.disabled=false);
    }
    btnStart.classList.toggle('disabled', chosen.length<1);
  }
  subsBox.addEventListener('change', refresh);
  refresh();
}
function getAutoCondition(){
  const part = byId('auto-part').value;
  const main = byId('auto-main').value;
  const subs = Array.from(document.querySelectorAll('.auto-sub:checked')).map(x=>x.value);
  return { part, main, subs };
}
function matchCondition(rec, cond){
  if(rec.grade!=='A') return false;
  if(rec.part !== cond.part) return false;
  if(rec.main !== cond.main) return false;
  if(rec.subs.length!==4) return false;
  for(const s of cond.subs){
    if(!rec.subs.includes(s)) return false;
  }
  return true;
}

/* ===== 메인 ===== */
export function mountDraw(app){
  resetDrawSession();
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
          <button class="hero-btn" id="single-draw">단일 뽑기</button>
          <button class="hero-btn" id="multi-open">??? 뽑기</button>
          <button class="hero-btn" id="auto-open">자동 뽑기(조건)</button>
          <button class="hero-btn" id="show-total" style="margin-left:auto">총 결과보기</button>
        </div>

        <div id="auto-panel" style="display:none; margin-top:12px">
          <label>조건을 입력하세요 (부위 + 주옵션 + 부옵션 1~4개)</label>
          <div class="grid cols-3" style="margin-top:6px">
            <div>
              <label>부위</label>
              <select id="auto-part">
                <option value="weapon">무기</option>
                <option value="armor">옷</option>
                <option value="hat">모자</option>
                <option value="shoes">신발</option>
                <option value="gloves">장갑</option>
              </select>
            </div>
            <div>
              <label>주옵션</label>
              <select id="auto-main"></select>
              <small class="hint" id="auto-main-hint"></small>
            </div>
            <div>
              <label>부옵션(1~4개)</label>
              <div id="auto-subs" class="checkbox-grid"></div>
              <div class="hint" id="auto-counter">선택: 0/최대4</div>
            </div>
          </div>
          <div style="margin-top:8px; display:flex; gap:8px">
            <button class="hero-btn disabled" id="auto-run">조건 달성까지 자동 뽑기</button>
            <button class="hero-btn" id="auto-stop">중지</button>
            <button class="hero-btn" id="auto-cancel" style="margin-left:auto">닫기</button>
          </div>
        </div>
      </div>

      <div id="draw-results" style="margin-top:12px"></div>
      <div id="draw-total" style="margin-top:12px"></div>
    </section>
  `;

  byId('draw-home').addEventListener('click', ()=>{
    resetDrawSession(); location.hash='';
  });
  byId('single-draw').addEventListener('click', ()=>{ makeRecord('single'); renderResultList(); });
  byId('auto-open').addEventListener('click', ()=>{ byId('auto-panel').style.display='block'; buildAutoUI(); });
  byId('auto-cancel').addEventListener('click', ()=>{ byId('auto-panel').style.display='none'; });
  byId('auto-part').addEventListener('change', syncAutoMain);
  byId('auto-main').addEventListener('change', syncAutoSubs);

  byId('auto-run').addEventListener('click', ()=>{
    if(byId('auto-run').classList.contains('disabled')) return;
    if(autoRunning) return;
    autoRunning = true; autoStop = false;
    const cond = getAutoCondition();
    const step=()=>{
      if(autoStop){autoRunning=false;return;}
      const rec=makeRecord('auto');
      if(matchCondition(rec,cond)){
        rec.forceEnable=true;
        renderResultList();
        autoRunning=false;
        return;
      }
      renderResultList();
      setTimeout(step,0);
    };
    step();
  });
  byId('auto-stop').addEventListener('click', ()=>{ autoStop=true; });

  renderResultList();
}