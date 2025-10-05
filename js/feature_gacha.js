// js/feature_gacha.js  (v=20251005-7)
// - 2단계(제작도) 진행 시, 각 티어 뽑기 결과는 "작은 팝업"으로만 표시
// - "결과 보기"는 메인 팝업 안에 인라인으로 표시 + 복사/닫기 버튼

import { FullMoonBox } from './full_moon_box.js?v=20251005-4';
import { FleetRandomBox } from './fleet_box.js?v=20251005-7';

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

      <!-- 메인 결과(2단계 포함) 팝업 -->
      <div class="gacha-backdrop gacha-hidden" id="resultBackdrop">
        <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
          <header>
            <h2 id="resultTitle">결과</h2>
            <div class="gacha-muted" id="resultSub">“복사”를 눌러 카톡에 붙여넣기 하세요.</div>
          </header>

          <div class="gacha-pills" id="summaryPills"></div>
          <div class="gacha-list" id="resultList" aria-live="polite"></div>

          <!-- 2단계 전용 버튼 박스 -->
          <div class="gacha-actions" id="stageActions" style="display:none; margin-top:10px; flex-wrap:wrap; gap:8px"></div>

          <div class="gacha-footer">
            <button class="gacha-btn" id="closeResult">닫기</button>
            <button class="gacha-btn" id="copyResult">결과 복사(카톡용)</button>
          </div>
        </div>
      </div>

      <!-- 배치 결과 전용(작은) 팝업 -->
      <div class="gacha-backdrop gacha-hidden" id="miniBackdrop">
        <div class="gacha-mini" role="dialog" aria-modal="true" aria-labelledby="miniTitle">
          <h3 id="miniTitle" style="margin:0 0 8px 0">이번 뽑기 결과</h3>
          <div id="miniList" class="gacha-list" style="max-height:50vh"></div>
          <div class="gacha-footer">
            <button class="gacha-btn" id="miniClose">확인</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const tiles = appRoot.querySelector('#gachaListTiles');
  GACHAS.forEach((g, idx) => tiles.append(makeTile(g, idx)));

  const q = s => appRoot.querySelector(s);
  const inputBackdrop  = q('#inputBackdrop');
  const resultBackdrop = q('#resultBackdrop');
  const miniBackdrop   = q('#miniBackdrop');
  const drawCountEl    = q('#drawCount');
  const resultList     = q('#resultList');
  const summaryPills   = q('#summaryPills');
  const boxBadge       = q('#boxBadge');
  const resultTitleEl  = q('#resultTitle');
  const resultSubEl    = q('#resultSub');
  const stageActions   = q('#stageActions');
  const miniTitleEl    = q('#miniTitle');
  const miniList       = q('#miniList');

  let current = null;
  let lastCopyText = '';
  let stagedCtrl = null;

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

    if(res && res.type === 'staged'){
      stagedCtrl = res;
      renderStage1(res);
      show(resultBackdrop);
      return;
    }

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

    // 제작도 테이블
    resultList.append(stageBlueprintTable(tierOrder, blueprint.counts));

    // 제작도 별 뽑기 버튼들 (보유한 제작도만 활성화)
    stageActions.innerHTML = '';
    tierOrder.forEach(tier=>{
      const btn = button(`「${tier}」 뽑기`);
      if(!(blueprint.counts[tier] > 0)) btn.disabled = true;
      btn.addEventListener('click', ()=>{
        const batch = blueprint.drawTier(tier); // {items, count}
        // 작은 팝업으로 표시
        openMini(`${tier} (${batch.count}회)`, batch.items);
        // 남은 제작도/버튼 갱신
        const left = blueprint.counts[tier]||0;
        if(left<=0) btn.disabled = true;
        updateBlueprintRow(tier, left);
        // 복사 텍스트(총합 기준) 갱신
        lastCopyText = blueprint.getSummary().copy;
      });
      stageActions.append(btn);
    });

    // 전체 뽑기 / 결과 보기
    const runAll = button('전체 뽑기');
    runAll.addEventListener('click', ()=>{
      const batches = blueprint.drawAll();
      // 합쳐서 미니팝업으로 보여주기
      const merged = new Map();
      batches.forEach(b=>{
        b.items.forEach(it=> merged.set(it.name, (merged.get(it.name)||0) + it.qty));
      });
      openMini('전체 뽑기', mapToItemArray(merged));
      // 버튼 비활성화 + 테이블 0
      stageActions.querySelectorAll('button').forEach(b=>{
        if(b.textContent.includes('뽑기')) b.disabled = true;
      });
      tierOrder.forEach(t=> updateBlueprintRow(t, 0));
      lastCopyText = blueprint.getSummary().copy;
    });

    const showSum = button('결과 보기');
    showSum.addEventListener('click', ()=>{
      const sum = blueprint.getSummary(); // {items, pills, copy}
      renderSummary(sum);
    });

    stageActions.append(runAll, showSum);

    // 초기 복사 텍스트는 "현재까지 합계" 기준
    lastCopyText = blueprint.getSummary().copy;
  }

  function renderSummary(sum){
    resultTitleEl.textContent = `${stagedCtrl.title} – 2단계: 총 결과`;
    resultSubEl.textContent = '아래 결과를 복사/닫기 할 수 있습니다.';
    summaryPills.innerHTML = '';
    stageActions.style.display = 'flex';
    sum.pills.forEach(t => summaryPills.append(pill(t)));

    // 본문 하단에 결과와 버튼 인라인 출력
    resultList.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'card';
    box.style.background='transparent';
    box.style.border='1px dashed #20324d';
    const list = document.createElement('div');
    list.className = 'gacha-list';
    sum.items.forEach(it => list.append(rowWithImage(it.name, it.qty, it.img)));

    const actions = document.createElement('div');
    actions.className = 'gacha-footer';
    const copyBtn = button('복사');
    const closeBtn = button('닫기');
    copyBtn.addEventListener('click', ()=>{
      navigator.clipboard.writeText(sum.copy).then(()=> alert('복사 완료!'));
    });
    closeBtn.addEventListener('click', ()=> hide(resultBackdrop));

    actions.append(closeBtn, copyBtn);
    box.append(list, actions);
    resultList.append(box);

    lastCopyText = sum.copy;
  }

  // ── 작은 팝업
  function openMini(title, items){
    miniTitleEl.textContent = title;
    miniList.innerHTML = '';
    items.forEach(it=> miniList.append(rowWithImage(it.name, it.qty, it.img)));
    show(miniBackdrop);
  }

  // ── UI helpers
  q('#miniClose').addEventListener('click', ()=> hide(miniBackdrop));
  q('#cancelInput').addEventListener('click', ()=> hide(inputBackdrop));
  q('#confirmInput').addEventListener('click', run);
  q('#closeResult').addEventListener('click', ()=> hide(resultBackdrop));
  q('#copyResult').addEventListener('click', ()=>{
    navigator.clipboard.writeText(lastCopyText).then(()=> alert('복사 완료! 카톡에 붙여넣기 하세요.'));
  });
  [inputBackdrop, resultBackdrop, miniBackdrop].forEach(bd=>{
    bd.addEventListener('click', e => { if (e.target === bd) hide(bd); });
  });
  drawCountEl.addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });

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
  function stageBlueprintTable(order, counts){
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.style.background='transparent';
    wrap.style.border='1px dashed #20324d';
    wrap.style.marginBottom='10px';
    wrap.innerHTML = `<div style="font-weight:800;margin-bottom:6px">획득한 제작도</div>`;
    order.forEach(tier=>{
      const row = document.createElement('div');
      row.className = 'gacha-row';
      row.dataset.tier = tier;
      row.innerHTML = `
        <div class="gacha-item"><span>${tier}</span></div>
        <div><b id="bp-${tier}">${counts[tier]||0}</b>개</div>
      `;
      wrap.append(row);
    });
    return wrap;
  }
  function updateBlueprintRow(tier, left){
    const el = appRoot.querySelector(`#bp-${CSS.escape(tier)}`);
    if(el) el.textContent = left;
  }
  function mapToItemArray(m){
    return Array.from(m.entries()).map(([name,qty])=>({name,qty,img:''}));
  }
}