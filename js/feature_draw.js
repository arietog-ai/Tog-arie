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
  const pool = SUB_OPTIONS.filter(x=>x!==main); // 주옵 제외
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

// ====== 자동뽑기(조건) ======
let autoRunning = false;
function autoDrawOnce(){
  // 1회 뽑기
  return singleDraw();
}
function getAutoCondition(){
  const part = byId('auto-part').value;
  const mainSel = byId('auto-main');
  const main = mainSel.dataset.fixed === '1' ? mainSel.value /*고정값*/ : mainSel.value;
  const subs = Array.from(document.querySelectorAll('.auto-sub:checked')).map(x=>x.value);
  return { part, main, subs };
}
// 조건 검사: part 일치 + main 일치 + (선택된 부옵들이 모두 포함)
function matchCondition(rec, cond){
  if(rec.part !== cond.part) return false;
  if(rec.main !== cond.main) return false;
  for(const s of cond.subs){
    if(!rec.subs.includes(s)) return false;
  }
  return true;
}

// UI 렌더
function renderResultList(){
  const host = byId('draw-results');
  host.innerHTML = results.map((r,i)=>{
    const isA4 = (r.grade==='A' && r.subs.length===4);
    const forceEnable = r.forceEnable === true; // 자동뽑기 조건으로 잡은 아이템은 무조건 활성
    const enable = forceEnable || isA4;
    return `
      <div class="card" style="padding:10px; margin-bottom:10px; ${enable?'border:2px solid var(--ok)':''}">
        <div><b>${i+1}.</b> [${r.grade}] ${r.part}</div>
        <div>주스탯: ${r.main}</div>
        <div>부스탯: ${r.subs.join(', ')}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px">
          <button class="hero-btn ${enable?'enabled':'disabled'} to-starter" data-idx="${i}">시동무기 강화</button>
          <span class="hint">※ 수동뽑기는 A급+부옵4개일 때 활성화, 자동뽑기 조건 달성 시 즉시 활성화됩니다.</span>
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
      // 주 + 부 3개 = 총 4옵션 프리셋(부옵이 3개 미만이면 가능한 만큼 넣고, 부족하면 랜덤 보충)
      const base = [r.main, ...r.subs].slice(0,4);
      let four = base.slice();
      if(four.length<4){
        // 주옵 제외에서 랜덤 보충(중복/주옵 제외)
        const pool = SUB_OPTIONS.filter(x=>x!==r.main && !four.includes(x));
        while(four.length<4 && pool.length){
          const pick = choice(pool);
          four.push(pick);
          // pool에서 제거
          const idx2 = pool.indexOf(pick);
          if(idx2>=0) pool.splice(idx2,1);
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
          <button class="hero-btn" id="single-draw">단일 뽑기</button>
          <button class="hero-btn" id="multi-open">??? 뽑기</button>
          <button class="hero-btn" id="auto-open">자동 뽑기(조건)</button>
          <button class="hero-btn" id="show-total" style="margin-left:auto">총 결과보기</button>
        </div>

        <!-- ??? 뽑기 패널 -->
        <div id="multi-panel" style="display:none; margin-top:10px">
          <label>열쇠를 몇 개 사용하여 뽑기를 진행할까요? <b>(한 번에 최대 1000회)</b></label>
          <input type="number" id="multi-count" min="1" max="1000" value="10" />
          <div style="margin-top:6px; display:flex; gap:8px">
            <button class="hero-btn" id="multi-run">뽑기</button>
            <button class="hero-btn" id="multi-cancel">취소</button>
          </div>
        </div>

        <!-- 자동 뽑기(조건) 패널 -->
        <div id="auto-panel" style="display:none; margin-top:12px">
          <label>조건을 입력하세요 (부위 + 주옵션 + 부옵션(중복 불가, 주옵 제외))</label>
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
              <label>부옵션(복수 선택)</label>
              <div id="auto-subs" style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px; max-height:160px; overflow:auto"></div>
            </div>
          </div>
          <div style="margin-top:8px; display:flex; gap:8px">
            <button class="hero-btn" id="auto-run">조건 달성까지 자동 뽑기 시작</button>
            <button class="hero-btn" id="auto-cancel">닫기</button>
          </div>
          <small class="hint">※ 매우 희귀한 조합은 시간이 오래 걸릴 수 있습니다.(UI 응답성을 위해 내부적으로 배치 실행합니다)</small>
        </div>
      </div>

      <div id="draw-results" style="margin-top:12px"></div>

      <div id="draw-total" style="margin-top:12px">
        <!-- 총 결과 UI가 여기 렌더됩니다 -->
      </div>
    </section>
  `;

  byId('draw-home').addEventListener('click', ()=>{ location.hash=''; });

  // 단일
  byId('single-draw').addEventListener('click', ()=>{
    singleDraw();
    renderResultList();
  });

  // ??? 뽑기
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

  // 자동(조건) 패널
  byId('auto-open').addEventListener('click', ()=>{
    byId('auto-panel').style.display='block';
    syncAutoMain(); // 초기 주옵/부옵 목록 구성
  });
  byId('auto-cancel').addEventListener('click', ()=>{
    byId('auto-panel').style.display='none';
  });

  // 부위 변경 시 주옵/부옵 목록 갱신
  byId('auto-part').addEventListener('change', syncAutoMain);

  // 자동 실행
  byId('auto-run').addEventListener('click', ()=>{
    if(autoRunning) return;
    const cond = getAutoCondition();
    // 부옵션 유효성: 주옵 중복 금지 + 중복 체크
    if(cond.subs.includes(cond.main)){
      alert('부옵션에 주옵과 동일한 옵션은 선택할 수 없습니다.');
      return;
    }
    if(new Set(cond.subs).size !== cond.subs.length){
      alert('부옵션은 중복 선택할 수 없습니다.');
      return;
    }
    autoRunning = true;
    const startCount = results.length;
    const startKeys = usedKeys;

    // 배치로 돌려 UI 프리즈 방지 (한 배치에 200회)
    const BATCH = 200;
    let foundIndex = -1;

    const step = ()=>{
      for(let i=0;i<BATCH;i++){
        const rec = autoDrawOnce();
        if(matchCondition(rec, cond)){
          // 조건 달성 → 해당 레코드 카드 강화 버튼 강제 활성
          rec.forceEnable = true;
          foundIndex = results.length - 1;
          break;
        }
      }
      renderResultList();
      if(foundIndex>=0){
        autoRunning = false;
        const drew = results.length - startCount;
        const used = usedKeys - startKeys;
        // 결과 안내 + 해당 카드로 스크롤
        const msg = `조건 달성! 총 ${drew}회 뽑음 (열쇠 ${used}개 사용)`;
        const totalBox = byId('draw-total');
        totalBox.innerHTML = `
          <div class="card">
            <div class="big">자동 뽑기 결과</div>
            <div style="margin-top:6px">${msg}</div>
          </div>
        `;
        // 해당 카드로 살짝 스크롤
        setTimeout(()=>{
          const targetCard = byId('draw-results').children[foundIndex];
          if(targetCard) targetCard.scrollIntoView({behavior:'smooth', block:'center'});
        }, 50);
        return;
      }
      // 계속
      setTimeout(step, 0);
    };
    step();
  });

  // 총 결과
  byId('show-total').addEventListener('click', ()=>{
    // 집계
    const total = results.length;
    const A = results.filter(r=>r.grade==='A');
    const counts = {weapon:0,armor:0,hat:0,shoes:0,gloves:0};
    A.forEach(r=>counts[r.part]++);
    const a4 = A.filter(r=>r.subs.length===4).length;

    // 예시: 장갑 특정 조합
    const glovePhysEffBoth = A.filter(r=>
      r.part==='gloves' && r.main==='물리저항력' &&
      r.subs.includes('효과적중') && r.subs.includes('효과저항')
    ).length;

    const totalText =
`총 결과

총 뽑기 횟수: ${total}

A급 시동무기 총 갯수 [무기:${counts.weapon} , 옷:${counts.armor} , 모자:${counts.hat} , 신발:${counts.shoes} , 장갑:${counts.gloves}]
A급 시동무기 중에 부옵션 4개인 총 갯수: ${a4}

장갑 부위에서
- 주스탯: 물리저항력 / 부스탯: 효과적중과 효과저항 동시 → ${glovePhysEffBoth}
`;

    // UI 렌더 + 복사 버튼
    byId('draw-total').innerHTML = `
      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px">
          <div class="big">총 결과</div>
          <button id="copy-total" class="hero-btn">📋 총 결과 복사</button>
        </div>
        <div style="white-space:pre-wrap; margin-top:6px" id="draw-total-text">${totalText}</div>
      </div>
    `;

    // 복사 기능
    byId('copy-total').addEventListener('click', ()=>{
      const text = byId('draw-total-text').textContent;
      navigator.clipboard.writeText(text)
        .then(()=> alert('총 결과가 클립보드에 복사되었습니다!'));
    });
  });

  renderResultList();
}

/* ====== 부위/주옵/부옵 UI 동기화 ====== */
function syncAutoMain(){
  const part = byId('auto-part').value;
  const mainSel = byId('auto-main');
  const hint = byId('auto-main-hint');

  // 무기/옷/모자: 주옵 고정
  if(part==='weapon' || part==='armor' || part==='hat'){
    const fixed = MAIN_STATS[part][0];
    mainSel.innerHTML = `<option value="${fixed}">${fixed}</option>`;
    mainSel.dataset.fixed = '1';
    hint.textContent = '무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능';
  }else{
    // 신발/장갑: 주옵 선택 가능
    mainSel.innerHTML = MAIN_STATS[part].map(s=>`<option value="${s}">${s}</option>`).join('');
    mainSel.dataset.fixed = '0';
    hint.textContent = '무기/옷/모자는 주옵 고정, 신발/장갑은 선택 가능';
  }

  // 부옵 체크박스(주옵 제외 + 중복 방지)
  syncAutoSubs();
}
function syncAutoSubs(){
  const mainSel = byId('auto-main');
  const main = mainSel.value;
  const box = byId('auto-subs');

  const pool = SUB_OPTIONS.filter(x=>x!==main);
  box.innerHTML = pool.map(s=>{
    const id = `sub-${s}`;
    return `
      <label style="display:flex; align-items:center; gap:6px">
        <input type="checkbox" class="auto-sub" id="${id}" value="${s}" />
        <span>${s}</span>
      </label>
    `;
  }).join('');

  // 주옵 변경 시에도 부옵 다시 구성
  byId('auto-main').addEventListener('change', ()=>{
    syncAutoSubs();
  }, { once:true });
}