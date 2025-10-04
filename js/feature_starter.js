// js/feature_starter.js
// - 20강 기대값 MC(1e8) + 진행률바 유지
// - 체크박스 라벨 → "20강 강화하기"
// - "샘플 5회 실행" → "만들기" (실제 5회 강화 수행)
// - "세공하자" 버튼: 만들기 후 활성화, #starter/reforge로 이동하며 시동무기 데이터 전달

/* 옵션/상수/유틸 */
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
const INCS = INIT_VALUES;

const STEPS = 5;
const MC_TOTAL = 100000000;
const MC_BATCH = 200000;

const byId = (id)=>document.getElementById(id);
const rand = (n)=>(Math.random()*n)|0;
const choice = (arr)=>arr[rand(arr.length)];
const unique = (arr)=>Array.from(new Set(arr));
const OPTION_NAMES = Object.keys(INIT_VALUES);
const fmt = (opt,v)=> PERCENT_SET.has(opt) ? `${v}%` : `${v}`;
const SCALE = 2;
const scale = (x)=>Math.round(x*SCALE);

function randomDistinctOptions(n=4){
  const pool = OPTION_NAMES.slice();
  for(let i=pool.length-1;i>0;i--){ const j=rand(i+1); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  return pool.slice(0,n);
}
function makeInitialStartCfg(){
  const names = randomDistinctOptions(4);
  const cfg = {};
  for(const n of names){ cfg[n] = choice(INIT_VALUES[n]); }
  return cfg;
}
function checkStartCfg(cfg){
  const keys = Object.keys(cfg);
  if(keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if(unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k=>{
    if(!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if(!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]}`);
  });
}
function roundDisplayValue(opt, v){
  if(PERCENT_SET.has(opt)){
    const r = Math.round(v*2)/2; return { num:r, txt:`${r.toFixed(1)}%` };
  }else{
    const r = Math.round(v);     return { num:r, txt:String(r) };
  }
}

/* 5회 상세 시퀀스 1회 실행 → 로그/카운트/최종값 */
function runOneSequence(names, startCfg){
  const lines = [];
  const state = { ...startCfg };
  const counts = { [names[0]]:0, [names[1]]:0, [names[2]]:0, [names[3]]:0 };

  for(let s=1; s<=STEPS; s++){
    const i = (Math.random()*4)|0;
    const opt = names[i];
    const inc = choice(INCS[opt]);
    counts[opt] = (counts[opt]||0)+1;
    const before = state[opt];
    const after = PERCENT_SET.has(opt)
      ? Math.round((before + inc)*2)/2
      : Math.round(before + inc);
    state[opt] = after;
    lines.push(`${s}회차: ${opt} +${fmt(opt, inc)}  (${fmt(opt, before)} → ${fmt(opt, after)})`);
  }
  return { lines, final: state, counts };
}

/* Monte Carlo */
function mcInit(names, startCfg){
  return { names, startCfg, N:0, sumFinalScaled:[0,0,0,0], stop:false, doneBatches:0, totalBatches:Math.ceil(MC_TOTAL/MC_BATCH) };
}
function mcRunBatch(stat){
  const incArr = stat.names.map(n=>INCS[n]);
  const startScaled = stat.names.map(n=>scale(stat.startCfg[n]));
  for(let t=0;t<MC_BATCH;t++){
    if(stat.stop) break;
    const sumIncScaled=[0,0,0,0];
    for(let s=0;s<STEPS;s++){
      const i=(Math.random()*4)|0;
      const inc=incArr[i][(Math.random()*incArr[i].length)|0];
      sumIncScaled[i]+=scale(inc);
    }
    for(let i=0;i<4;i++){
      stat.sumFinalScaled[i]+= (startScaled[i]+sumIncScaled[i]);
    }
    stat.N++;
  }
}

/* 뷰 */
export function mountStarter(app){
  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center">
        <button id="starter-home-btn" class="hero-btn">← 홈으로</button>
        <button id="starter-draw-btn" class="hero-btn">← 시동무기 뽑기로</button>
        <span class="pill">시동무기 강화 시뮬레이터</span>
        <button id="go-estimator" class="hero-btn" style="margin-left:auto">강화 예상 갯수</button>
      </div>

      <div class="card">
        <h2 class="section-title" style="margin-top:0">0강 옵션</h2>
        <div id="starter-start"></div>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title" style="margin-top:0">20강 기대값</h2>
        <p class="muted" style="margin:6px 0 10px">
          0강 구성으로 5회 강화를 대량 시뮬해 옵션별 기대 최종값을 보여줍니다. (퍼센트형 0.5 단위, 수치형 정수 반올림)
        </p>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
          <button id="mc-run" class="hero-btn">20강 기대값</button>
          <button id="mc-stop" class="hero-btn">중지</button>
          <button id="mc-reset" class="hero-btn">초기화</button>

          <!-- 체크박스 → '만들기' 버튼 노출 -->
          <label style="display:inline-flex; align-items:center; gap:6px; margin-left:6px">
            <input type="checkbox" id="dev-log-toggle" />
            <span class="muted">20강 강화하기</span>
          </label>
          <button id="mc-build" class="hero-btn" style="display:none">만들기</button>

          <!-- 만들기 후 활성화되는 세공 버튼 -->
          <button id="go-reforge" class="hero-btn" disabled>세공하자</button>

          <span id="mc-status" class="muted" style="margin-left:6px"></span>
          <div class="mc-progress" aria-hidden="true"><div class="mc-progress__bar" id="mc-progress-bar" style="width:0%"></div></div>
        </div>

        <div id="mc-out" style="margin-top:10px"></div>
        <pre id="mc-log" class="output" style="margin-top:10px; display:none"></pre>
      </div>

      <div class="card" style="margin-top:12px">
        <h2 class="section-title" style="margin-top:0">목표 설정 & 성공확률</h2>
        <p class="muted">이 기능은 <b>별도 페이지</b>로 분리되었습니다. 상단의 <em>강화 예상 갯수</em> 버튼을 눌러 이동하세요.</p>
      </div>
    </section>
  `;

  byId('starter-home-btn').addEventListener('click', ()=>{ location.hash=''; });
  byId('starter-draw-btn').addEventListener('click', ()=>{ location.hash='#draw'; });
  byId('go-estimator').addEventListener('click', ()=>{ location.hash='#starter/estimator'; });

  // 0강 폼 구성
  const startHost = byId('starter-start');
  function startRow(id){
    return `
      <div class="grid cols-2" style="align-items:end; gap:8px; margin-bottom:8px">
        <div>
          <label>항목</label>
          <select class="s-name" id="s${id}-name">
            ${OPTION_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>0강 값</label>
          <select class="s-val" id="s${id}-val"></select>
        </div>
      </div>`;
  }
  startHost.innerHTML = startRow(1)+startRow(2)+startRow(3)+startRow(4);

  let defaultStart = makeInitialStartCfg();
  try{
    const raw = sessionStorage.getItem('starter_preset');
    if(raw){
      const preset = JSON.parse(raw);
      sessionStorage.removeItem('starter_preset');
      defaultStart = {};
      preset.starter4.forEach(o=>{ defaultStart[o.stat] = o.value; });
    }
  }catch(e){}
  const defNames = Object.keys(defaultStart);
  [1,2,3,4].forEach((i,idx)=>{
    const nameSel = byId(`s${i}-name`);
    const n = defNames[idx] || OPTION_NAMES[idx];
    nameSel.value = n;
  });
  function refreshInitVal(id, setRandom=false){
    const nameSel = byId(`s${id}-name`);
    const valSel  = byId(`s${id}-val`);
    const name = nameSel.value;
    const arr = INIT_VALUES[name];
    valSel.innerHTML = arr.map(v=>`<option value="${v}">${fmt(name, v)}</option>`).join('');
    if(setRandom) valSel.value = choice(arr);
    else if(defaultStart[name]!=null) valSel.value = defaultStart[name];
  }
  [1,2,3,4].forEach(i=> refreshInitVal(i, true));
  function selectedNames(){ return [1,2,3,4].map(i=>byId(`s${i}-name`).value); }
  function syncOptionDisables(){
    const chosen = selectedNames();
    const nameSels = Array.from(document.querySelectorAll('.s-name'));
    nameSels.forEach(sel=>{
      const current = sel.value;
      Array.from(sel.options).forEach(opt=>{
        const val = opt.value;
        opt.disabled = (val!==current) && chosen.includes(val);
      });
    });
  }
  syncOptionDisables();
  [1,2,3,4].forEach(i=>{
    byId(`s${i}-name`).addEventListener('change', ()=>{
      refreshInitVal(i, false);
      syncOptionDisables();
    });
  });

  // 진행률/로그 토글
  const devToggle = byId('dev-log-toggle');
  const buildBtn  = byId('mc-build');
  const reforgeBtn= byId('go-reforge');
  const logBox    = byId('mc-log');
  const statusEl  = byId('mc-status');
  const barEl     = byId('mc-progress-bar');

  devToggle.addEventListener('change', ()=>{
    const on = devToggle.checked;
    buildBtn.style.display = on ? '' : 'none';
    logBox.style.display = on ? '' : 'none';
    if(!on){ logBox.textContent = ''; }
  });

  // 만들기: 5회 강화 실행 + 결과 저장 + 세공 버튼 활성화
  buildBtn.addEventListener('click', ()=>{
    try{
      const names = selectedNames();
      const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
      const startCfg = Object.fromEntries(names.map((n,i)=>[n, vals[i]]));
      checkStartCfg(startCfg);

      const { lines, final, counts } = runOneSequence(names, startCfg);
      logBox.textContent = `20강 강화 로그\n\n${lines.join('\n')}\n\n최종값\n${names.map(o=>`${o}: ${fmt(o, final[o])} (k=${counts[o]||0})`).join('\n')}`;

      // 세공 페이지로 넘길 데이터: 시작값/최종값/증가횟수
      const item = { names, start: startCfg, final, counts };
      sessionStorage.setItem('starter_item', JSON.stringify(item));
      reforgeBtn.disabled = false;
    }catch(e){
      logBox.textContent = `⚠️ ${e.message}`;
    }
  });

  // 세공 페이지로 이동
  reforgeBtn.addEventListener('click', ()=>{
    if(reforgeBtn.disabled) return;
    location.hash = '#starter/reforge';
  });

  // MC 렌더/실행
  function renderMC(stat){
    const { names, startCfg, sumFinalScaled, N } = stat;
    if(N===0) return '';
    const avgVals = sumFinalScaled.map(s => (s/N)/SCALE);
    const lines = names.map((opt,i)=>{
      const disp = roundDisplayValue(opt, avgVals[i]);
      return `<div class="card" style="padding:10px">${opt} : ${fmt(opt, startCfg[opt])} -> <b>${disp.txt}</b></div>`;
    }).join('');
    return `<div class="grid cols-2" style="gap:8px; margin-top:6px">${lines}</div>`;
  }
  function updateProgress(stat){
    const pct = Math.min(100, Math.floor((stat.N / MC_TOTAL) * 100));
    barEl.style.width = pct + '%';
    statusEl.textContent = `진행 중... (${stat.doneBatches} / ${stat.totalBatches} 배치, ${pct}%)`;
  }
  function runMonteCarlo(startCfg){
    const names = Object.keys(startCfg);
    const stat = mcInit(names, startCfg);
    statusEl.textContent = `진행 중... (0 / ${stat.totalBatches} 배치, 0%)`;
    barEl.style.width = '0%';
    byId('mc-out').innerHTML = '';

    const step = ()=>{
      if(stat.stop){
        statusEl.textContent = '완료';
        byId('mc-out').innerHTML = renderMC(stat);
        updateProgress(stat);
        return;
      }
      const remain = MC_TOTAL - stat.N;
      if(remain<=0){
        statusEl.textContent = '완료';
        byId('mc-out').innerHTML = renderMC(stat);
        updateProgress(stat);
        return;
      }
      mcRunBatch(stat);
      stat.doneBatches++;
      if(stat.doneBatches % 2 === 0){ updateProgress(stat); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    byId('mc-stop').onclick = ()=>{ stat.stop = true; };
    byId('mc-reset').onclick = ()=>{
      stat.stop = true;
      statusEl.textContent = '';
      byId('mc-out').innerHTML = '';
      barEl.style.width = '0%';
    };
  }
  byId('mc-run').addEventListener('click', ()=>{
    try{
      const names = selectedNames();
      const vals  = [1,2,3,4].map(i => parseFloat(byId(`s${i}-val`).value));
      const startCfg = Object.fromEntries(names.map((n,i)=>[n, vals[i]]));
      checkStartCfg(startCfg);
      runMonteCarlo(startCfg);
    }catch(e){
      statusEl.textContent = '오류';
      byId('mc-out').innerHTML = `<div class="bad">⚠️ ${e.message}</div>`;
    }
  });
}