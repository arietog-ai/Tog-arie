// js/feature_draw.js
// 시동무기 뽑기 시뮬레이터 (옵션 키는 starter와 100% 일치)

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const choice = (arr)=>arr[rand(arr.length)];

const ICON_KEY = "./assets/img/key.jpg"; // key 이미지 (jpg)

/* === 옵션 키(강화와 동일) === */
const SUB_OPTIONS = [
  "체력","공격력","방어력",
  "치명타확률","치명타데미지증가",
  "마법저항력","물리저항력",
  "치명타 저항률","치명타 대미지 감소율",
  "마법관통력","물리관통력",
  "효과적중","효과저항",
  "명중","회피"
];

/* 부위별 주스탯 */
const MAIN_STATS = {
  weapon:["공격력"],
  armor:["방어력"],
  hat:["체력"],
  shoes:["치명타데미지증가","치명타 대미지 감소율","마법저항력","효과적중","효과저항"],
  gloves:["치명타확률","치명타 저항률","물리저항력","마법관통력","물리관통력"],
};

/* 등급별 부옵 개수 (50:50) */
const SUB_COUNT_RULE = { A:[3,4], B:[2,3], C:[1,2] };

/* 0강 수치 후보(강화 프리셋 생성용) */
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

/* ===== 세션 상태 ===== */
let results = [];  // {part, grade, main, subs, src, display, forceEnable, when}
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

/* 확률 (A/B/C) */
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

/* 표시 규칙: 단일은 마지막 1개만, 자동은 조건 달성 1개만, ???는 상세 미표시 */
function updateDisplayFlags(){
  results.forEach(r => r.display = false);

  // 단일 마지막 1개
  for(let i=results.length-1;i>=0;i--){
    if(results[i].src==='single'){ results[i].display = true; break; }
  }
  // 자동 마지막 1개(조건 달성만)
  for(let i=results.length-1;i>=0;i--){
    if(results[i].src==='auto' && results[i].forceEnable){ results[i].display = true; break; }
  }
}

/* ===== 상단 요약 카드 ===== */
function renderSummaryCard(host, rec){
  if(!rec){ host.innerHTML = ''; return; }
  host.innerHTML = `
    <div class="summary-card">
      <div class="title">[${rec.grade}] ${rec.part}</div>
      <div class="meta">주스탯: <b>${rec.main}</b></div>
      <div class="meta">부스탯: ${rec.subs.join(', ')}</div>
      <div class="details" style="display:flex; gap:8px; margin-top:8px">
        <button class="btn btn-ghost" id="sum-to-starter">시동무기 강화</button>
        <span class="tag">${rec.src==='single'?'단일':'자동'} 결과</span>
      </div>
    </div>
  `;
  host.querySelector('#sum-to-starter').addEventListener('click', ()=>{
    const four = rec.subs.slice(0,4);
    const preset = { starter4: four.map(stat=>{
      const vals = INIT_VALUES[stat] || [1,1.5,2,2.5];
      return { stat, value: choice(vals) };
    })};
    sessionStorage.setItem('starter_preset', JSON.stringify(preset));
    location.hash = '#starter';
  });
}

function renderResultList(){
  updateDisplayFlags();
  const list = results.filter(r=>r.display);
  const host = byId('draw-results');

  // 상단 요약: 최신(단일 or 자동 성공) 1건
  const summaryHost = byId('draw-summary');
  let summary = null;
  for(let i=results.length-1;i>=0;i--){
    if(results[i].src==='single' || (results[i].src==='auto' && results[i].forceEnable)){
      summary = results[i]; break;
    }
  }
  renderSummaryCard(summaryHost, summary);

  host.innerHTML = list.map((r)=>{
    const enable = r.forceEnable || (r.grade==='A' && r.subs.length===4);
    return `
      <div class="card ${enable?'emph':''}" style="padding:10px; margin-bottom:10px">
        <div><b>${r.src==='single'?'단일':'자동'} 결과</b> · [${r.grade}] ${r.part}</div>
        <div>주스탯: ${r.main}</div>
        <div>부스탯: ${r.subs.join(', ')}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px">
          <button class="btn ${enable?'':'disabled'} to-starter" data-when="${r.when}">시동무기 강화</button>
          <span class="hint">※ 수동: A+부옵4개 / 자동: 조건 달성 시 즉시 활성화</span>
        </div>
      </div>
    `;
  }).join('');

  // 강화로 보내기
  host.querySelectorAll('.to-starter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.classList.contains('disabled')) return;
      const when = parseFloat(btn.dataset.when);
      const r = results.find(x=>x.when===when);
      if(!r) return;

      // 주옵 제외, 부옵만 4개
      let four = r.subs.slice(0,4);
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

  // 사용 키 표시
  const k1 = byId('used-keys');
  if(k1) k1.textContent = usedKeys;
}

/* ===== 총 결과 카드 ===== */
function closeTotalCard(){
  byId('draw-total').innerHTML = '';
}
function showTotalCardWith(text){
  byId('draw-total').innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px">
        <div class="big">총 결과</div>
        <div style="display:flex; gap:8px; align-items:center">
          <button id="copy-total" class="btn btn-ghost">📋 총 결과 복사</button>
          <button id="close-total" class="btn">닫기</button>
        </div>
      </div>
      <div style="white-space:pre-wrap; margin-top:6px" id="draw-total-text">${text}</div>
    </div>
  `;
  byId('copy-total').addEventListener('click', ()=>{
    const t = byId('draw-total-text').textContent;
    navigator.clipboard.writeText(t).then(()=> alert('총 결과가 클립보드에 복사되었습니다!'));
  });
  byId('close-total').addEventListener('click', closeTotalCard);
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
    hint.textContent = '무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능';
  }else{
    mainSel.innerHTML = MAIN_STATS[part].map(s=>`<option value="${s}">${s}</option>`).join('');
    mainSel.dataset.fixed = '0';
    hint.textContent = '무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능';
  }
  syncAutoSubs();
}
function syncAutoSubs(){
  const main = byId('auto-main').value;
  const box = byId('auto-subs');
  const pool = SUB_OPTIONS.filter(x=>x!==main);
  box.innerHTML = pool.map(s=>{
    const id = `sub-${s}`;
    return `<label><input type="checkbox" class="auto-sub" id="${id}" value="${s}" /> <span>${s}</span></label>`;
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
    counter.textContent = `선택: ${chosen.length}개 (최대 4)`;

    // 4개 초과 방지
    if(chosen.length>=4){
      checks.forEach(c=>{ if(!c.checked) c.disabled = true; });
    }else{
      checks.forEach(c=> c.disabled = false);
    }
    // 1~4개일 때만 시작 가능
    btnStart.classList.toggle('disabled', chosen.length<1 || chosen.length>4);
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
  if(rec.part !== cond.part) return false;
  if(rec.main !== cond.main) return false;
  if(rec.grade !== 'A') return false; // A급만 성공
  if(rec.subs.length !== 4) return false; // 총 부옵 4개
  for(const s of cond.subs){
    if(!rec.subs.includes(s)) return false;
  }
  return true;
}

/* ===== 메인 마운트 ===== */
export function mountDraw(app){
  // 세션 유지(초기화 X)
  loadSession();

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
        <button class="btn btn-ghost" id="draw-home">← 홈으로</button>
        <span class="pill">시동무기 뽑기</span>
        <span class="badge" style="margin-left:auto">
          <img src="${ICON_KEY}" alt="key" /> 사용한 열쇠: <b id="used-keys">0</b>개
        </span>
      </div>

      <div class="card">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
          <button class="btn btn-primary" id="single-draw">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            단일 뽑기
          </button>
          <button class="btn" id="multi-open">
            <img src="${ICON_KEY}" alt="" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;border-radius:4px" />
            ??? 뽑기
          </button>
          <button class="btn" id="auto-open">자동 뽑기(조건)</button>
          <button class="btn btn-ghost" id="show-total" style="margin-left:auto">총 결과보기</button>
        </div>

        <!-- ??? 뽑기 패널 -->
        <div id="multi-panel" style="display:none; margin-top:10px">
          <label>열쇠를 몇 개 사용하여 뽑기를 진행할까요? <b>(한 번에 최대 1000회)</b></label>
          <input type="number" id="multi-count" min="1" max="1000" value="10" />
          <div style="margin-top:6px; display:flex; gap:8px">
            <button class="btn btn-primary" id="multi-run">뽑기</button>
            <button class="btn" id="multi-cancel">취소</button>
          </div>
        </div>

        <!-- 자동 뽑기(조건) 패널 -->
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
              <select id="auto-main" data-fixed="1"></select>
              <small class="hint" id="auto-main-hint">무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능</small>
            </div>
            <div>
              <label>부옵션(1~4개)</label>
              <div id="auto-subs" class="checkbox-grid"></div>
              <div class="hint" id="auto-counter">선택: 0개 (최대 4)</div>
            </div>
          </div>
          <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
            <button class="btn btn-primary disabled" id="auto-run">조건 달성까지 자동 뽑기 시작</button>
            <button class="btn" id="auto-stop">중지</button>
            <button class="btn btn-ghost" id="auto-cancel" style="margin-left:auto">닫기</button>
          </div>
          <small class="hint">※ 자동 뽑기 중에도 "중지"로 즉시 멈출 수 있습니다.</small>
        </div>
      </div>

      <!-- ✅ 상단 요약 카드 -->
      <div id="draw-summary" style="margin-top:12px"></div>

      <div id="draw-results" style="margin-top:12px"></div>
      <div id="draw-total" style="margin-top:12px"></div>
    </section>
  `;

  const autoHideTotal = ()=> closeTotalCard();

  // 홈 → 세션 초기화 후 나가기
  byId('draw-home').addEventListener('click', ()=>{
    resetDrawSession();
    location.hash='';
  });

  // 단일 뽑기
  byId('single-draw').addEventListener('click', ()=>{
    autoHideTotal();
    makeRecord('single', false);
    renderResultList();
  });

  // ??? 뽑기
  byId('multi-open').addEventListener('click', ()=>{
    autoHideTotal();
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
    const startLen = results.length;
    for(let i=0;i<n;i++) makeRecord('multi', false);
    byId('multi-panel').style.display='none';
    renderResultList(); // 키 카운트 갱신

    // 이번 배치 요약 팝업
    const batch = results.slice(startLen);
    const A = batch.filter(r=>r.grade==='A');
    const aTotal = A.length;
    const a3 = A.filter(r=>r.subs.length===3).length;
    const a4 = A.filter(r=>r.subs.length===4).length;

    const txt =
`이번 ??? 뽑기 결과 요약

총 뽑기 횟수(이번 실행): ${n}
A급 총: ${aTotal}개
- A급(부옵 3개): ${a3}개
- A급(부옵 4개): ${a4}개`;
    showTotalCardWith(txt);
  });

  // 자동(조건) — 🔁 1회씩 돌며 화면 갱신
  byId('auto-open').addEventListener('click', ()=>{
    autoHideTotal();
    byId('auto-panel').style.display='block';
    buildAutoUI();
  });
  byId('auto-cancel').addEventListener('click', ()=>{
    byId('auto-panel').style.display='none';
  });
  byId('auto-part').addEventListener('change', syncAutoMain);
  byId('auto-main').addEventListener('change', syncAutoSubs);

  byId('auto-run').addEventListener('click', ()=>{
    if(byId('auto-run').classList.contains('disabled')) return;
    if(autoRunning) return;
    autoRunning = true; autoStop = false;

    const cond = getAutoCondition();
    const startCount = results.length;
    const startKeys = usedKeys;

    // 1개씩 뽑고 UI 갱신 (프레임 루프)
    const step = ()=>{
      if(autoStop){ autoRunning=false; return; }
      const rec = makeRecord('auto', false);
      const matched = matchCondition(rec, cond);
      if(matched){
        rec.forceEnable = true;
        renderResultList();
        const drew = results.length - startCount;
        const used = usedKeys - startKeys;
        const txt = `자동 뽑기 결과\n\n조건 달성! 총 ${drew}회 뽑음 (열쇠 ${used}개 사용)`;
        showTotalCardWith(txt);
        autoRunning=false;
        return;
      }
      renderResultList();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  byId('auto-stop').addEventListener('click', ()=>{
    autoStop = true;
  });

  // 총 결과보기(전체 집계)
  byId('show-total').addEventListener('click', ()=>{
    const total = results.length;
    const A = results.filter(r=>r.grade==='A');
    const counts = {weapon:0,armor:0,hat:0,shoes:0,gloves:0};
    A.forEach(r=>counts[r.part]++);
    const a4 = A.filter(r=>r.subs.length===4).length;

    // 무기/옷/모자: 특수 조합
    const WAH = A.filter(r=>['weapon','armor','hat'].includes(r.part));
    const pairEff = WAH.filter(r=>r.subs.includes('효과적중') && r.subs.includes('효과저항')).length;
    const pairRes = WAH.filter(r=>r.subs.includes('물리저항력') && r.subs.includes('마법저항력')).length;
    const quadAll = WAH.filter(r=>
      ['효과적중','효과저항','물리저항력','마법저항력'].every(s=>r.subs.includes(s))
    ).length;

    // 신발: 주옵-부옵 교차
    const shoesMainEffHit = A.filter(r=>r.part==='shoes' && r.main==='효과적중' && r.subs.includes('효과저항')).length;
    const shoesMainEffRes = A.filter(r=>r.part==='shoes' && r.main==='효과저항' && r.subs.includes('효과적중')).length;

    // 장갑
    const glovesPhysEffBoth = A.filter(r=>
      r.part==='gloves' && r.main==='물리저항력' &&
      r.subs.includes('효과적중') && r.subs.includes('효과저항')
    ).length;

    const totalText =
`총 결과

총 뽑기 횟수: ${total}

A급 시동무기 총 갯수 [무기:${counts.weapon} , 옷:${counts.armor} , 모자:${counts.hat} , 신발:${counts.shoes} , 장갑:${counts.gloves}]
A급 시동무기 중에 부옵션 4개인 총 갯수: ${a4}

무기/옷/모자 부위
- (효과적중 + 효과저항): ${pairEff}
- (물리저항력 + 마법저항력): ${pairRes}
- (효과적중 + 효과저항 + 물리저항력 + 마법저항력): ${quadAll}

신발 부위
- 주스탯: 효과적중 & 부스탯: 효과저항 → ${shoesMainEffHit}
- 주스탯: 효과저항 & 부스탯: 효과적중 → ${shoesMainEffRes}

장갑 부위
- 주스탯: 물리저항력 & 부스탯: (효과적중 + 효과저항) → ${glovesPhysEffBoth}
`;
    showTotalCardWith(totalText);
  });

  renderResultList();
}
