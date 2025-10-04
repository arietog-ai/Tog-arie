// js/feature_starter_reforge.js
// "세공하자" 페이지
// - starter_item(sessionStorage)에서 0강(start), 20강(final), counts(k_i) 로드
// - 파랑 주사위: k_i 자체를 다시 랜덤(5회 분배) + 증가치도 랜덤 → 완전 재배정
// - 빨강 주사위: k_i 고정, 증가치만 랜덤 → 각 옵션별 (최소~최대) 범위 보여주고 그 안에서 랜덤
// - 주사위 사용 갯수 카운트(파랑/빨강 별도)

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

function applyIncrements(opt, startVal, k, incs){
  // k회 만큼 증가치를 랜덤으로 뽑아 합산
  let v = startVal;
  for(let i=0;i<k;i++){
    const inc = choice(incs);
    v = roundP(opt, v + inc);
  }
  return v;
}

function rerollBlue(names, start){
  // 5회를 4옵션에 무작위 분배, 증가치도 랜덤
  const k = [0,0,0,0];
  for(let i=0;i<STEPS;i++) k[(Math.random()*4)|0]++;
  const final = {};
  const counts = {};
  names.forEach((opt, idx)=>{
    counts[opt] = k[idx];
    final[opt]  = applyIncrements(opt, start[opt], k[idx], INIT_VALUES[opt]);
  });
  return { final, counts };
}

function rerollRed(names, start, countsFixed){
  // k_i 고정, 증가치만 랜덤
  const final = {};
  names.forEach((opt, idx)=>{
    const k = countsFixed[opt] || 0;
    final[opt] = applyIncrements(opt, start[opt], k, INIT_VALUES[opt]);
  });
  return { final };
}

function minMaxFor(opt, startVal, k){
  const incs = INIT_VALUES[opt];
  const min = roundP(opt, startVal + k * Math.min(...incs));
  const max = roundP(opt, startVal + k * Math.max(...incs));
  return { min, max };
}

export function mountStarterReforge(app){
  // 데이터 로드
  let item;
  try{ item = JSON.parse(sessionStorage.getItem('starter_item')||'null'); }catch(e){ item = null; }
  if(!item){
    app.innerHTML = `
      <section class="container">
        <div class="card">
          <h2 style="margin-top:0">세공하자</h2>
          <p class="muted">만들기된 시동무기가 없습니다. 먼저 <b>#starter</b>에서 "20강 강화하기 → 만들기"를 실행해 주세요.</p>
          <button class="hero-btn" onclick="location.hash='#starter'">← 시뮬레이터로</button>
        </div>
      </section>`;
    return;
  }

  const { names, start, final, counts } = item;
  let blueUsed = 0, redUsed = 0;
  let curCounts = { ...counts };
  let curFinal  = { ...final };

  function rowHtml(opt){
    const k = curCounts[opt]||0;
    const dots = '•'.repeat(k) || '-';
    const range = minMaxFor(opt, start[opt], k);
    return `
      <div class="card" style="padding:10px">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap">
          <div><b>${opt}</b></div>
          <div class="muted">k=${k} (${dots})</div>
        </div>
        <div class="muted" style="margin-top:6px">0강: ${fmt(opt, start[opt])}</div>
        <div style="margin-top:6px">현재: <b>${fmt(opt, curFinal[opt])}</b></div>
        <div class="muted" style="margin-top:6px">범위: ${fmt(opt, range.min)} ~ ${fmt(opt, range.max)}</div>
      </div>`;
  }

  function render(){
    const list = names.map(rowHtml).join('');
    app.innerHTML = `
      <section class="container">
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
          <button class="hero-btn" id="back">← 강화로</button>
          <span class="pill">세공하자</span>
          <span class="badge" style="margin-left:auto"><img src="./assets/img/dice_blue.jpg" alt="" style="width:14px;height:14px;border-radius:3px" /> 파랑 주사위: <b id="blue-used">${blueUsed}</b></span>
          <span class="badge"><img src="./assets/img/dice_red.jpg" alt="" style="width:14px;height:14px;border-radius:3px" /> 빨강 주사위: <b id="red-used">${redUsed}</b></span>
        </div>

        <div class="card">
          <h2 style="margin-top:0">현재 시동무기</h2>
          <div class="grid cols-2" id="list">${list}</div>
        </div>

        <div class="card" style="margin-top:12px">
          <h3 style="margin-top:0">주사위</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="hero-btn" id="roll-blue">
              <img src="./assets/img/dice_blue.jpg" alt="" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;border-radius:4px" />
              파랑 주사위 (강화수치 재배정)
            </button>
            <button class="hero-btn" id="roll-red">
              <img src="./assets/img/dice_red.jpg" alt="" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;border-radius:4px" />
              빨강 주사위 (범위 내 재설정)
            </button>
            <button class="hero-btn" id="save-item">저장</button>
          </div>
          <p class="hint" style="margin-top:6px">
            • 파랑: 5회 강화 분배(k)를 다시 랜덤으로 만들고 증가치도 새로 부여합니다.<br/>
            • 빨강: 현재 k는 유지하고, 증가치만 다시 굴립니다(옵션별 최소~최대 범위 내).
          </p>
        </div>
      </section>
    `;

    byId('back').addEventListener('click', ()=>{ location.hash='#starter'; });
    byId('roll-blue').addEventListener('click', ()=>{
      const r = rerollBlue(names, start);
      curCounts = r.counts;
      curFinal  = r.final;
      blueUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start, final:curFinal, counts:curCounts }));
      render();
    });
    byId('roll-red').addEventListener('click', ()=>{
      const r = rerollRed(names, start, curCounts);
      curFinal = r.final;
      redUsed++;
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start, final:curFinal, counts:curCounts }));
      render();
    });
    byId('save-item').addEventListener('click', ()=>{
      sessionStorage.setItem('starter_item', JSON.stringify({ names, start, final:curFinal, counts:curCounts }));
      alert('현재 시동무기를 저장했습니다.');
    });
  }

  render();
}