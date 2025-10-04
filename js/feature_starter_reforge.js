// js/feature_starter_reforge.js
// 세공하자 v2.4.4 (모바일 초압축 3열)
// - 영혼(파랑): k 재분배 + 수치 전면 재분배
// - 시동(빨강): k 유지 + 수치 전면 재분배
// - 데스크탑: [옵션 | 0강 | 강화 | 현재 | 범위]
// - 모바일: 3열 [옵션 | 0강 | 값(●●○○○ · 현재 · (범위))]

const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"];
const GROUP_B = ["회피","명중","효과적중","효과저항"];
const GROUP_C = ["공격력","방어력","체력"];
const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"];
const PERCENT_SET = new Set([...GROUP_A, ...GROUP_C, ...GROUP_D]);

const INIT_VALUES = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5,2.5,3.5,4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3,6,9,12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1,1.5,2,2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5,2.5,3.5,4.5]])),
};
const STEPS = 5;

const byId = (id)=>document.getElementById(id);
const choice = (arr)=>arr[(Math.random()*arr.length)|0];
const fmt = (opt,v)=> PERCENT_SET.has(opt) ? `${v}%` : `${v}`;
const roundP = (opt, v)=> PERCENT_SET.has(opt) ? Math.round(v*2)/2 : Math.round(v);

// 0강(기초) 1회 롤
function rollBase(opt){ return choice(INIT_VALUES[opt]); }

// k회 강화 적용 (증가치 랜덤)
function applyIncrements(opt, baseVal, k){
  let v = baseVal;
  for(let i=0;i<k;i++){
    v = roundP(opt, v + choice(INIT_VALUES[opt]));
  }
  return v;
}

// 범위(기초 min/max 포함)
function rangeFor(opt, k){
  const bases = INIT_VALUES[opt];
  const incs  = INIT_VALUES[opt];
  const min = Math.min(...bases) + k * Math.min(...incs);
  const max = Math.max(...bases) + k * Math.max(...incs);
  return { min: roundP(opt, min), max: roundP(opt, max) };
}

// 영혼(파랑): k 재분배 + 전면 재배정
function rerollBlue(names){
  const k = [0,0,0,0];
  for(let i=0;i<STEPS;i++) k[(Math.random()*4)|0]++;
  const base={}, final={}, counts={};
  names.forEach((opt, i)=>{
    base[opt]   = rollBase(opt);
    counts[opt] = k[i];
    final[opt]  = applyIncrements(opt, base[opt], k[i]);
  });
  return { base, final, counts };
}

// 시동(빨강): k 유지 + 전면 재배정
function rerollRed(names, countsFixed){
  const base={}, final={};
  names.forEach(opt=>{
    const k = countsFixed[opt]||0;
    base[opt]  = rollBase(opt);
    final[opt] = applyIncrements(opt, base[opt], k);
  });
  return { base, final };
}

// 강화 점칸(UI) – 데스크탑 셀
function kDotsCell(k){
  let html = '<div class="kdots" aria-label="강화 단계">';
  for(let i=0;i<5;i++) html += `<span class="${i<k?'on':''}"></span>`;
  html += '</div>';
  return html;
}
// 모바일 압축용 한 줄
function compactValue(opt, base, k, now, rng){
  // 점칸을 아주 작은 인라인 점들로
  let dots = '<span class="kdots-inline">';
  for(let i=0;i<5;i++) dots += `<i class="${i<k?'on':''}"></i>`;
  dots += '</span>';
  const nowTxt = k ? fmt(opt, now) : '-';
  return `${dots} <b class="now">${nowTxt}</b> <span class="range">(${fmt(opt, rng.min)} ~ ${fmt(opt, rng.max)})</span>`;
}

export function mountStarterReforge(app){
  let item;
  try{ item = JSON.parse(sessionStorage.getItem('starter_item')||'null'); }catch{ item=null; }
  if(!item){
    app.innerHTML = `
      <section class="container">
        <div class="card">
          <h2 style="margin-top:0">세공하자</h2>
          <p class="muted">먼저 <b>#starter</b>에서 "20강 강화하기 → 만들기"를 실행해 주세요.</p>
          <button class="hero-btn" onclick="location.hash='#starter'">← 시뮬레이터로</button>
        </div>
      </section>`;
    return;
  }

  const names = item.names;
  let counts  = { ...item.counts }; // k 초기값
  let base    = {};                 // 0강(기초)
  let final   = {};                 // 현재값

  // 첫 렌더: 현재 k 기준으로 0강을 새로 굴려서 표시
  names.forEach(opt=>{
    base[opt]  = rollBase(opt);
    final[opt] = applyIncrements(opt, base[opt], counts[opt]||0);
  });

  let blueUsed = 0, redUsed = 0;

  function renderTable(){
    const rows = names.map(opt=>{
      const k = counts[opt]||0;
      const rng = rangeFor(opt, k);
      const nowVal = final[opt];

      return `
        <tr>
          <td class="optcell"><span class="optdot"></span>${opt}</td>
          <td class="basecell">${fmt(opt, base[opt])}</td>

          <!-- 데스크탑용 개별 셀 -->
          <td class="kcell only-desktop">${kDotsCell(k)}</td>
          <td class="valcell only-desktop"><b>${k ? fmt(opt, nowVal) : '-'}</b></td>
          <td class="rangecell only-desktop">${fmt(opt, rng.min)} ~ ${fmt(opt, rng.max)}</td>

          <!-- 모바일 초압축 한 셀 -->
          <td class="compact only-mobile">
            ${compactValue(opt, base[opt], k, nowVal, rng)}
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="table-wrap">
        <table class="gear-table">
          <thead class="only-desktop">
            <tr><th>옵션</th><th>0강</th><th>강화</th><th>현재</th><th>범위</th></tr>
          </thead>
          <thead class="only-mobile">
            <tr><th>옵션</th><th>0강</th><th>값</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function render(){
    app.innerHTML = `
      <section class="container">
        <div class="toprow">
          <button class="hero-btn" id="back">← 강화로</button>
          <span class="pill">세공하자</span>
          <span class="badge" style="margin-left:auto">
            <img src="./assets/img/dice_blue.jpg" alt="" class="dicon" /> 영혼: <b id="blue-used">${blueUsed}</b>
          </span>
          <span class="badge">
            <img src="./assets/img/dice_red.jpg" alt="" class="dicon" /> 시동: <b id="red-used">${redUsed}</b>
          </span>
        </div>

        <div class="card">
          <div class="titlebar">
            <h2 class="section-title">현재 시동무기</h2>
            <div class="title-actions">
              <button class="dice-btn" id="roll-blue" aria-label="영혼 주사위">
                <img src="./assets/img/dice_blue.jpg" alt="" /><span>돌리기</span>
              </button>
              <button class="dice-btn" id="roll-red" aria-label="시동 주사위">
                <img src="./assets/img/dice_red.jpg" alt="" /><span>돌리기</span>
              </button>
            </div>
          </div>
          ${renderTable()}
        </div>
      </section>
    `;

    byId('back').addEventListener('click', ()=>{ location.hash='#starter'; });

    byId('roll-blue').addEventListener('click', ()=>{
      const r = rerollBlue(names);
      base   = r.base;
      final  = r.final;
      counts = r.counts;
      blueUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start: base, final, counts }));
      render();
    });

    byId('roll-red').addEventListener('click', ()=>{
      const r = rerollRed(names, counts);
      base   = r.base;
      final  = r.final;
      redUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start: base, final, counts }));
      render();
    });
  }

  render();
}