// js/feature_starter_reforge.js  (v=20251005-7)
// - util.js 의존 제거
// - 글로벌 onclick 미사용
// - 요구사항: k>=4 옵션 등장 시 행/값 반짝 + 1.5초 동안 돌리기 버튼 잠금(비활성화)

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
function rerollBlue(names){
  // 5회를 4옵션에 다항분포로 분배(k) + 각 옵션의 base도 새로 뽑고 증가치 재적용
  const ks=[0,0,0,0]; for(let i=0;i<STEPS;i++) ks[(Math.random()*4)|0]++;
  const base={}, final={}, counts={};
  names.forEach((opt,i)=>{ base[opt]=rollBase(opt); counts[opt]=ks[i]; final[opt]=applyIncrements(opt,base[opt],ks[i]); });
  return {base,final,counts};
}
function rerollRed(names, countsFixed){
  // 단계(k)는 유지, base와 증가치만 재분배
  const base={}, final={};
  names.forEach(opt=>{ const k=countsFixed[opt]||0; base[opt]=rollBase(opt); final[opt]=applyIncrements(opt,base[opt],k); });
  return {base,final};
}
function kDotsCell(k){
  let s='<div class="kdots" aria-label="강화 단계">';
  for(let i=0;i<5;i++) s+=`<span class="${i<k?'on':''}"></span>`;
  return s+'</div>';
}

/* ===== 인라인 스타일(세공 화면에만) ===== */
function ensureInlineStyle(){
  if(document.getElementById('reforge-inline-style')) return;
  const css = `
  /* 범위 축소 + 반짝 효과(행/값) + 버튼 잠금 스타일 */
  .reforge .dice-btn.disabled{ opacity:.5; cursor:not-allowed !important; filter:saturate(.6); }
  .reforge tr.flash{ animation:reforgeFlash 1.4s ease-in-out; background:rgba(124,242,154,.08); }
  @keyframes reforgeFlash{ 0%{background:rgba(124,242,154,.20);} 100%{background:transparent;} }
  .reforge .spark{ animation:reforgeSpark 1.2s ease-in-out; color:#7cf29a; }
  @keyframes reforgeSpark{ 0%,100%{text-shadow:none;} 50%{text-shadow:0 0 8px #7cf29a;} }
  `;
  const el = document.createElement('style');
  el.id = 'reforge-inline-style';
  el.textContent = css;
  document.head.appendChild(el);
}

/* ===== 메인 ===== */
export function mountStarterReforge(app){
  ensureInlineStyle();

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
  let base   = {},                 // 현재 0강(표시 안 함)
      final  = {};                 // 현재 값
  names.forEach(opt=>{ base[opt]=rollBase(opt); final[opt]=applyIncrements(opt,base[opt],counts[opt]||0); });

  let blueUsed=0, redUsed=0;

  // 렌더: flashTargets는 {옵션명:true} 형태로 k>=4만 반짝
  const renderTable = (flashTargets={}) => `
    <div class="table-wrap">
      <table class="gear-compact">
        <tbody>
          ${names.map(opt=>{
            const k = counts[opt]||0;
            const rng = rangeFor(opt,k);
            const rowFlash = flashTargets[opt] ? ' class="flash"' : '';
            const valFlash = flashTargets[opt] ? ' class="spark"' : '';
            return `
              <tr${rowFlash}>
                <td class="kcell">${kDotsCell(k)}</td>
                <td class="optcell">${opt}</td>
                <td class="valcell"><b${valFlash}>${fmt(opt, final[opt])}</b></td>
                <td class="rangecell">${fmt(opt,rng.min)} ~ ${fmt(opt,rng.max)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  function lockButtons(){
    const b = byId('roll-blue');
    const r = byId('roll-red');
    [b,r].forEach(btn=>{
      btn.classList.add('disabled');
      btn.setAttribute('disabled','disabled');
    });
    setTimeout(()=>{
      [b,r].forEach(btn=>{
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
      });
    }, 1500);
  }

  function render(flashTargets={}){
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
          ${renderTable(flashTargets)}
        </div>
      </section>`;

    byId('back').addEventListener('click', ()=>{ location.hash='#starter'; });

    byId('roll-blue').addEventListener('click', ()=>{
      const r = rerollBlue(names);
      base = r.base; final = r.final; counts = r.counts; blueUsed++;

      // k>=4 옵션을 강조 대상으로
      const flashTargets = {};
      names.forEach(o=>{ if((counts[o]||0) >= 4) flashTargets[o]=true; });

      // 세션 저장
      sessionStorage.setItem('starter_item', JSON.stringify({names, start:base, final, counts}));

      // 재렌더 + 버튼 잠금
      render(flashTargets);
      lockButtons();
    });

    byId('roll-red').addEventListener('click', ()=>{
      const r = rerollRed(names, counts);
      base = r.base; final = r.final; redUsed++;

      const flashTargets = {};
      names.forEach(o=>{ if((counts[o]||0) >= 4) flashTargets[o]=true; });

      sessionStorage.setItem('starter_item', JSON.stringify({names, start:base, final, counts}));
      render(flashTargets);
      lockButtons();
    });
  }

  render();
}