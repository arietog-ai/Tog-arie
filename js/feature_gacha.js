// js/feature_gacha.js
// 가챠 UI – 등록된 가챠 모듈을 자동으로 나열/실행

import { FullMoonBox } from './gachas/full_moon_box.js';
import { FleetRandomBox } from './gachas/fleet_box.js';

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

      <!-- 결과 팝업 -->
      <div class="gacha-backdrop gacha-hidden" id="resultBackdrop">
        <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
          <header>
            <h2 id="resultTitle">뭘 뽑았는지 결과</h2>
            <div class="gacha-muted">“복사”를 눌러 카톡에 붙여넣기 하세요.</div>
          </header>
          <div class="gacha-pills" id="summaryPills"></div>
          <div class="gacha-list" id="resultList" aria-live="polite"></div>
          <div class="gacha-footer">
            <button class="gacha-btn" id="closeResult">닫기</button>
            <button class="gacha-btn" id="copyResult">복사</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const tiles = appRoot.querySelector('#gachaListTiles');
  GACHAS.forEach((g, idx) => { tiles.append(makeTile(g, idx)); });

  const q = s => appRoot.querySelector(s);
  const inputBackdrop  = q('#inputBackdrop');
  const resultBackdrop = q('#resultBackdrop');
  const drawCountEl    = q('#drawCount');
  const resultList     = q('#resultList');
  const summaryPills   = q('#summaryPills');
  const boxBadge       = q('#boxBadge');
  const resultTitleEl  = q('#resultTitle');

  let current = null;
  let lastCopyText = '';

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
    const { items, pills, copy } = current.run(n);

    resultTitleEl.textContent = `${current.title} 결과`;
    summaryPills.innerHTML = '';
    resultList.innerHTML = '';

    pills.forEach(t => summaryPills.append(pill(t)));
    items.forEach(it => {
      if (it.img === '__section__') resultList.append(sectionRow(it.name));
      else resultList.append(rowWithImage(it.name, it.qty, it.img));
    });

    lastCopyText = copy;
    show(resultBackdrop);
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

  q('#cancelInput').addEventListener('click', ()=> hide(inputBackdrop));
  q('#confirmInput').addEventListener('click', run);
  q('#closeResult').addEventListener('click', ()=> hide(resultBackdrop));
  q('#copyResult').addEventListener('click', copy);
  [inputBackdrop, resultBackdrop].forEach(bd=>{
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

  function pill(text){
    const el=document.createElement('div'); el.className='gacha-pill'; el.textContent=text; return el;
  }

  function sectionRow(title){
    const el=document.createElement('div');
    el.className='gacha-section';
    el.textContent = title;
    return el;
  }

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
}