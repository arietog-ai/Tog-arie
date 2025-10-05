// js/feature_starter_reforge.js  (v=20251005-9)
// - util.js 의존 제거, 전역 onclick 미사용
// - 표 구성: [강화 점] | [옵션] | [현재] | [범위]
// - 파랑(영혼) 주사위: k·수치 재분배 → k≥4 존재 시 반짝 + 버튼 1.5초 잠금
// - 빨강(시동) 주사위: k 유지, 수치만 재분배 → 지연/비활성화 없이 즉시 반영

const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"]; // %
const GROUP_B = ["회피","명중","효과적중","효과저항"]; // 수치
const GROUP_C = ["공격력","방어력","체력"]; // %
const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"]; // %
const PERCENT_SET = new Set([...GROUP_A, ...GROUP_C, ...GROUP_D]);

const INIT_VALUES = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5,2.5,3.5,4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3,6,9,12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1,1.5,2,2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5,2.5,3.5,4.5]])),
};
const STEPS = 5;

/* ===== 유틸 ===== */
const byId = (id)=>document.getElementById(id);
const fmt  = (opt,v)=> PERCENT_SET.has(opt) ? `${v}%` : `${v}`;

function roundP(opt,v){ return PERCENT_SET.has(opt) ? Math.round(v*2)/2 : Math.round(v); }
function rollBase(opt){ const a=INIT_VALUES[opt]; return a[(Math.random()*a.length)|0]; }
function applyIncrements(opt, base, k){
  let v=base; const incs=INIT_VALUES[opt];
  for(let i=0;i<k;i++){ v = roundP(opt, v + incs[(Math.random()*incs.length)|0]); }
  return v;
}
function rangeFor(opt,k){
  const b=INIT_VALUES[opt], inc=INIT_VALUES[opt];
  const min = roundP(opt, Math.min(...b) + k*Math.min(...inc));
  const max = roundP(opt, Math.max(...b) + k*Math.max(...inc));
  return {min, max};
}

/* ===== 주사위 롤 ===== */
function rerollBlue(names){
  // 5회를 4옵션에 분배(k) + 각 옵션 base 랜덤 + 증가치 재적용
  const ks=[0,0,0,0]; for(let i=0;i<STEPS;i++) ks[(Math.random()*4)|0]++;
  const base={}, final={}, counts={};
  names.forEach((opt,i)=>{ base[opt]=rollBase(opt); counts[opt]=ks[i]; final[opt]=applyIncrements(opt,base[opt],ks[i]); });
  return {base,final,counts};
}
function rerollRed(names, countsFixed){
  // k 유지, base/증가치 재분배
  const base={}, final={};
  names.forEach(opt=>{ const k=countsFixed[opt]||0; base[opt]=rollBase(opt); final[opt]=applyIncrements(opt,base[opt],k); });
  return {base,final};
}

/* ===== 표시 ===== */
function kDotsCell(k){
  let s='<div class="kdots" aria-label="강화 단계">';
  for(let i=0;i<5;i++) s+=`<span class="${i<k?'on':''}"></span>`;
  return s+'</div>';
}

/* ===== 메인 ===== */
export function mountStarterReforge(app){
  let item;
  try{ item = JSON.parse(sessionStorage.getItem('starter_item')||'null'); }catch{ item=null; }

  if(!item){
    app.innerHTML=`
      <section class="container reforge">
        <div class="card">
          <h2 style="margin-top:0">세공하자</h2>
          <p class="muted">먼저 <b>#starter</b>에서 "20강 강화하기 → 만들기"를 실행해 주세요.</p>
          <button class="hero-btn" id="go-starter">← 시뮬레이터로</button>
        </div>
      </section>`;
    byId('go-starter').addEventListener('click', ()=>{ location.hash='#starter'; });
    return;
  }

  const names = item.names;
  let counts = {...item.counts};   // k 유지
  let base   = {},                 // 0강(표시는 안 함)
      final  = {};                 // 현재값
  names.forEach(opt=>{ base[opt]=rollBase(opt); final[opt]=applyIncrements(opt,base[opt],counts[opt]||0); });

  let blueUsed=0, redUsed=0;

  const renderTable = () => `
    <div class="table-wrap">
      <table class="gear-compact">
        <tbody>
          ${names.map(opt=>{
            const k = counts[opt]||0;
            const rng = rangeFor(opt,k);
            return `
              <tr data-opt="${opt}">
                <td class="kcell">${kDotsCell(k)}</td>
                <td class="optcell">${opt}</td>
                <td class="valcell"><b>${fmt(opt, final[opt])}</b></td>
                <td class="rangecell">${fmt(opt,rng.min)} ~ ${fmt(opt,rng.max)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  function render(){
    app.innerHTML=`
      <section class="container reforge">
        <div class="toprow">
          <button class="hero-btn" id="back">← 강화로</button>
          <span class="pill">세공하자</span>
          <span class="badge" style="margin-left:auto"><img src="./assets/img/dice_blue.jpg" class="dicon" alt=""> 영혼: <b id="bused">${blueUsed}</b></span>
          <span class="badge"><img src="./assets/img/dice_red.jpg" class="dicon" alt=""> 시동: <b id="rused">${redUsed}</b></span>
        </div>
        <div class="card">
          <div class="titlebar">
            <h2 class="section-title">현재 시동무기</h2>
            <div class="title-actions">
              <button class="dice-btn" id="roll-blue"><img src="./assets/img/dice_blue.jpg" alt=""><span>돌리기</span></button>
              <button class="dice-btn" id="roll-red"><img src="./assets/img/dice_red.jpg" alt=""><span>돌리기</span></button>
            </div>
          </div>
          ${renderTable()}
        </div>
      </section>`;

    byId('back').addEventListener('click', ()=>{ location.hash='#starter'; });

    // 🔹 파랑: k/수치 재분배 → k≥4가 있으면 반짝 + 버튼 1.5초 잠금
    byId('roll-blue').addEventListener('click', ()=>{
      const r = rerollBlue(names);
      base = r.base; final = r.final; counts = r.counts; blueUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({names, start:base, final, counts}));
      render();                    // DOM 갱신
      triggerFlashIfHighK();       // k≥4 있을 때만 연출 + 잠금
    });

    // 🔸 빨강: k 유지, 수치만 재분배 → 지연/비활성화 없이 즉시 반영
    byId('roll-red').addEventListener('click', ()=>{
      const r = rerollRed(names, counts);
      base = r.base; final = r.final; redUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({names, start:base, final, counts}));
      render();                    // 끝. (반짝/잠금 없음)
    });
  }

  function triggerFlashIfHighK(){
    const rows = Array.from(app.querySelectorAll('.reforge .gear-compact tbody tr'));
    let hasHigh = false;

    names.forEach((opt, i) => {
      const k = counts[opt] || 0;
      if (k >= 4 && rows[i]) {
        hasHigh = true;
        rows[i].classList.add('flash');
        const valB = rows[i].querySelector('.valcell b');
        if (valB) valB.classList.add('spark');
        setTimeout(() => {
          rows[i].classList.remove('flash');
          if (valB) valB.classList.remove('spark');
        }, 1500);
      }
    });

    if (hasHigh) {
      const blueBtn = byId('roll-blue');
      const redBtn  = byId('roll-red');
      [blueBtn, redBtn].forEach(btn => {
        btn.classList.add('disabled');
        btn.disabled = true;
      });
      setTimeout(() => {
        [blueBtn, redBtn].forEach(btn => {
          btn.classList.remove('disabled');
          btn.disabled = false;
        });
      }, 1500);
    }
  }

  render();
}