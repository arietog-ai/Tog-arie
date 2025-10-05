// js/feature_gacha.js  (v=20251005-5)
// 가챠 UI – 등록된 가챠 모듈을 자동으로 나열/실행
// - 단일형(run → {items,pills,copy})
// - 2단계형(run → {type:'staged', ...}) 모두 지원

import { FullMoonBox } from './full_moon_box.js?v=20251005-4';
import { FleetRandomBox } from './fleet_box.js?v=20251005-5';

export function mountGacha(appRoot){
  const GACHAS = [ FullMoonBox, FleetRandomBox ];

  appRoot.innerHTML = `
    <section class="gacha-card">
      <h1>가챠 뽑기</h1>
      <p class="gacha-muted">원하는 상자를 눌러 뽑기 개수를 입력하세요. (최대 100개)</p>
      <div id="gachaListTiles" class="gacha-tiles"></div>

      <!-- 입력 팝업 -->
      <div class="gacha-backdrop gacha-hidden" id="inputBackdrop">
        <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="inputTitle">
          <header>
            <h2 id="inputTitle">뽑기 개수 입력</h2>
            <div class="gacha-muted">한 번에 최대 <b>100개</b>까지 가능합니다.</div>
          </header>
          <div class="gacha-field">
            <label for="drawCount" class="gacha-muted">개수</label>
            <input id="drawCount" class="gacha-input" type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="예: 10" />
            <span class="gacha-pill" id="boxBadge">상자 선택</span>
          </div>
          <div class="gacha-footer">
            <button class="gacha-btn" id="cancelInput">취소</button>
            <button class="gacha-btn gacha-btn-primary" id="confirmInput">뽑기 실행</button>
          </div>
        </div>
      </div>

      <!-- 결과/단계 팝업 -->
      <div class="gacha-backdrop gacha-hidden" id="resultBackdrop">
        <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
          <header>
            <h2 id="resultTitle">결과</h2>
            <div class="gacha-muted" id="resultSub">“복사”를 눌러 카톡에 붙여넣기 하세요.</div>
          </header>

          <!-- 요약 정보 -->
          <div class="gacha-pills" id="summaryPills"></div>

          <!-- (단일형) 결과 리스트 / (2단계형) 제작도 안내 + 즉시 결과 영역 -->
          <div class="gacha-list" id="resultList" aria-live="polite"></div>

          <!-- (2단계형) 전용 액션 버튼 박스 -->
          <div class="gacha-actions" id="stageActions" style="display:none; margin-top:10px; flex-wrap:wrap; gap:8px"></div>

          <div class="gacha-footer">
            <button class="gacha-btn" id="closeResult">닫기</button>
            <button class="gacha-btn" id="copyResult">결과 복사(카톡용)</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const tiles = appRoot.querySelector('#gachaListTiles');
  GACHAS.forEach((g, idx) => tiles.append(makeTile(g, idx)));

  // 팝업 & 결과 제어
  const q = s => appRoot.querySelector(s);
  const inputBackdrop  = q('#inputBackdrop');
  const resultBackdrop = q('#resultBackdrop');
  const drawCountEl    = q('#drawCount');
  const resultList     = q('#resultList');
  const summaryPills   = q('#summaryPills');
  const boxBadge       = q('#boxBadge');
  const resultTitleEl  = q('#resultTitle');
  const resultSubEl    = q('#resultSub');
  const stageActions   = q('#stageActions');

  let current = null;
  let lastCopyText = '';
  let stagedCtrl = null; // 2단계형 컨트롤러

  function openInput(mod){
    current = mod;
    boxBadge.textContent = mod.title;
    drawCountEl.value = '';
    show(inputBackdrop);
    setTimeout(()=> drawCountEl.focus(), 20);
  }

  function run(){
    const n = parseInt(drawCountEl.value, 10);
    if (!(n >= 1 && n <= 100)) { alert('뽑기 개수는 1~100 사이 정수만 가능합니다.'); return; }
    hide(inputBackdrop);

    const res = current.run(n);

    // === (A) 2단계형: 제작도 → 부유선 ===
    if(res && res.type === 'staged'){
      stagedCtrl = res; // { title, pills, blueprint:{counts,drawTier,drawAll,getSummary,copySummary}, tierOrder }
      renderStage1(res);
      show(resultBackdrop);
      return;
    }

    // === (B) 단일형 ===
    const { items, pills, copy } = res;
    resultTitleEl.textContent = `${current.title} 결과`;
    resultSubEl.textContent = '“복사”를 눌러 카톡에 붙여넣기 하세요.';
    summaryPills.innerHTML = '';
    resultList.innerHTML = '';
    stageActions.style.display = 'none';
    pills.forEach(t => summaryPills.append(pill(t)));
    items.forEach(it => resultList.append(rowWithImage(it.name, it.qty, it.img)));
    lastCopyText = copy;
    show(resultBackdrop);
  }

  function renderStage1(res){
    const { title, pills, blueprint, tierOrder } = res;
    resultTitleEl.textContent = `${title} – 1단계: 제작도 결과`;
    resultSubEl.textContent = '제작도별 “뽑기”를 진행하세요. (각 버튼은 1회만 동작)';
    summaryPills.innerHTML = '';
    resultList.innerHTML = '';
    stageActions.style.display = 'flex';

    pills.forEach(t => summaryPills.append(pill(t)));
    // 제작도 표 + 즉시 결과 영역
    const counts = blueprint.counts; // {일반:x,고급:y,희귀:z,전설:w}
    resultList.append(stageBlueprintTable(tierOrder, counts));
    resultList.append(stageInstantArea());

    // 액션 버튼들
    stageActions.innerHTML = '';
    tierOrder.forEach(tier=>{
      const btn = button(`「${tier}」 뽑기`);
      if(!(counts[tier] > 0)) btn.disabled = true;
      btn.addEventListener('click', ()=>{
        const batch = blueprint.drawTier(tier); // {items, count}
        // 즉시 결과 출력
        renderInstant(batch, tier);
        // 버튼/카운트 갱신
        const left = blueprint.counts[tier];
        if(left<=0) btn.disabled = true;
        // 제작도 테이블도 갱신
        updateBlueprintTable(tier, left);
      });
      stageActions.append(btn);
    });

    // 전체 뽑기 / 결과 보기 / 복사
    const runAll = button('전체 뽑기');
    runAll.addEventListener('click', ()=>{
      const batches = blueprint.drawAll(); // [{tier,items,count},...]
      renderInstantMerge(batches);
      // 모든 버튼 비활성화 + 테이블 0으로
      stageActions.querySelectorAll('button').forEach(b=>{
        if(b.textContent.includes('뽑기')) b.disabled = true;
      });
      tierOrder.forEach(t=> updateBlueprintTable(t, 0));
    });
    const showSum = button('결과 보기');
    showSum.addEventListener('click', ()=>{
      const sum = blueprint.getSummary(); // {items, pills, copy}
      renderSummary(sum);
    });
    const copyBtn = q('#copyResult');
    copyBtn.onclick = ()=>{
      const sum = blueprint.getSummary();
      navigator.clipboard.writeText(sum.copy).then(()=> alert('복사 완료! 카톡에 붙여넣기 하세요.'));
    };

    stageActions.append(runAll, showSum);
    // 초기 복사 텍스트는 "현재까지 합계" 기준으로
    lastCopyText = blueprint.getSummary().copy;
  }

  // ============ 렌더 헬퍼들 ============
  function stageBlueprintTable(order, counts){
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.style.background='transparent';
    wrap.style.border='1px dashed #20324d';
    wrap.style.marginBottom='10px';
    wrap.innerHTML = `
      <div style="font-weight:800;margin-bottom:6px">획득한 제작도</div>
      <div id="bpRows"></div>
    `;
    const rows = wrap.querySelector('#bpRows');
    order.forEach(tier=>{
      const row = document.createElement('div');
      row.className = 'gacha-row';
      row.dataset.tier = tier;
      row.innerHTML = `
        <div class="gacha-item"><span>${tier}</span></div>
        <div><b id="bp-${tier}">${counts[tier]||0}</b>개</div>
      `;
      rows.append(row);
    });
    return wrap;
  }
  function updateBlueprintTable(tier, left){
    const el = appRoot.querySelector(`#bp-${CSS.escape(tier)}`);
    if(el) el.textContent = left;
  }
  function stageInstantArea(){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div style="font-weight:800;margin:6px 0 4px">이번 뽑기 결과</div>
      <div id="instantArea" class="gacha-list" style="max-height:260px; border-style:solid"></div>
    `;
    return wrap;
  }
  function renderInstant(batch, tier){
    const host = appRoot.querySelector('#instantArea');
    host.innerHTML = '';
    const title = document.createElement('div');
    title.style.margin='4px 0 8px';
    title.textContent = `(${tier}) ${batch.count}회`;
    host.append(title);
    batch.items.forEach(it=> host.append(rowWithImage(it.name, it.qty, it.img)));
    // 복사 텍스트도 “현재까지 합계” 기준으로 갱신
    if(stagedCtrl) lastCopyText = stagedCtrl.blueprint.getSummary().copy;
  }
  function renderInstantMerge(batches){
    const host = appRoot.querySelector('#instantArea');
    host.innerHTML = '';
    const title = document.createElement('div');
    const total = batches.reduce((s,b)=>s+(b.count||0),0);
    title.style.margin='4px 0 8px';
    title.textContent = `전체 뽑기 (${total}회)`;
    host.append(title);
    // 합쳐서 보여주기
    const merged = new Map();
    batches.forEach(b=>{
      b.items.forEach(it=>{
        merged.set(it.name, (merged.get(it.name)||0) + it.qty);
      });
    });
    Array.from(merged.entries()).forEach(([name,qty])=>{
      host.append(rowWithTextOnly(name, qty));
    });
    if(stagedCtrl) lastCopyText = stagedCtrl.blueprint.getSummary().copy;
  }
  function renderSummary(sum){
    resultTitleEl.textContent = `${stagedCtrl.title} – 2단계: 총 결과`;
    resultSubEl.textContent = '“복사”를 눌러 카톡에 붙여넣기 하세요.';
    summaryPills.innerHTML = '';
    stageActions.style.display = 'flex';
    sum.pills.forEach(t => summaryPills.append(pill(t)));
    resultList.innerHTML = '';
    sum.items.forEach(it => resultList.append(rowWithImage(it.name, it.qty, it.img)));
    lastCopyText = sum.copy;
  }

  function copy(){
    navigator.clipboard.writeText(lastCopyText).then(()=>{
      alert('복사 완료! 카톡에 붙여넣기 하세요.');
    }).catch(()=>{
      const ta=document.createElement('textarea');
      ta.value=lastCopyText; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      alert('복사 완료!');
    });
  }

  // 이벤트
  q('#cancelInput').addEventListener('click', ()=> hide(inputBackdrop));
  q('#confirmInput').addEventListener('click', run);
  q('#closeResult').addEventListener('click', ()=> hide(resultBackdrop));
  q('#copyResult').addEventListener('click', copy);
  [inputBackdrop, resultBackdrop].forEach(bd=>{
    bd.addEventListener('click', e => { if (e.target === bd) hide(bd); });
  });
  drawCountEl.addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });

  // helpers
  function show(el){ el.style.display='flex'; el.classList.remove('gacha-hidden'); }
  function hide(el){ el.style.display='none'; el.classList.add('gacha-hidden'); }

  function makeTile(mod, idx){
    const wrap = document.createElement('div');
    wrap.className = 'gacha-tile';
    wrap.innerHTML = `
      <img src="${mod.thumb}" alt="${mod.title}" onerror="this.style.opacity=.2" />
      <div>
        <div style="font-weight:800;font-size:18px;margin-bottom:6px">${mod.title}</div>
        <p class="gacha-muted" style="margin-bottom:10px">${mod.description||''}</p>
        <div class="gacha-actions">
          <button class="gacha-btn" data-open="${idx}">뽑기 시작</button>
        </div>
      </div>
    `;
    wrap.querySelector('[data-open]').addEventListener('click', ()=> openInput(mod));
    wrap.querySelector('img').addEventListener('click', ()=> openInput(mod));
    return wrap;
  }

  function pill(text){ const el=document.createElement('div'); el.className='gacha-pill'; el.textContent=text; return el; }
  function button(text){ const b=document.createElement('button'); b.className='gacha-btn'; b.textContent=text; return b; }
  function rowWithImage(label, qty, src){
    const el=document.createElement('div'); el.className='gacha-row';
    const left=document.createElement('div'); left.className='gacha-item';
    const img=document.createElement('img'); img.className='gacha-icon'; img.src=src||''; img.alt=label;
    const span=document.createElement('span'); span.textContent=label;
    left.append(img,span);
    const right=document.createElement('div'); right.textContent=`${Number(qty).toLocaleString()}개`;
    el.append(left,right);
    return el;
  }
  function rowWithTextOnly(label, qty){
    const el=document.createElement('div'); el.className='gacha-row';
    const left=document.createElement('div'); left.className='gacha-item';
    const span=document.createElement('span'); span.textContent=label;
    left.append(span);
    const right=document.createElement('div'); right.textContent=`${Number(qty).toLocaleString()}개`;
    el.append(left,right);
    return el;
  }
}