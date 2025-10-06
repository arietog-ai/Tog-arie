// js/feature_gacha.js  (v=20251005-10)
// 가챠 허브: 보름달 상자(맨 위), 부유선 랜덤상자 + ← 홈으로 버튼

import { FleetRandomBox } from './fleet_box.js?v=20251005-9';
import { FullMoonBox }   from './full_moon_box.js?v=20251005-8';

function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }
function pillsHTML(list){ return list.map(x=>`<span class="gacha-pill">${x}</span>`).join(''); }
function itemRowHTML(it){
  if(it.type==='section'){ return `<div class="gacha-section">${it.text}</div>`; }
  return `
  <div class="gacha-row">
    <div class="gacha-item">
      ${it.img ? `<img class="gacha-icon" src="${it.img}" alt="" />` : ''}
      <span>${it.name}</span>
    </div>
    <strong>${(it.qty ?? 0).toLocaleString()}개</strong>
  </div>`;
}

function openInputModal({title, subtitle, max=100, onSubmit}){
  const $back = el(`<div class="gacha-backdrop" style="display:flex"></div>`);
  const $modal = el(`
    <div class="gacha-modal">
      <header>
        <h2>${title}</h2>
        <p class="gacha-muted">${subtitle || '원하는 개수를 눌러 뽑기 개수를 입력하세요. (최대 100개)'}</p>
      </header>

      <div class="gacha-field" style="margin:6px 0 10px">
        <label class="muted" style="min-width:44px">개수</label>
        <input class="gacha-input" id="gachaCount" inputmode="numeric" placeholder="예: 10" />
      </div>

      <div class="gacha-footer">
        <button class="gacha-btn" id="btnCancel">취소</button>
        <button class="gacha-btn gacha-btn-primary" id="btnRun">뽑기 실행</button>
      </div>
    </div>
  `);
  $back.appendChild($modal);
  document.body.appendChild($back);

  const $in = $modal.querySelector('#gachaCount');
  setTimeout(()=> $in.focus(), 20);

  const close=()=> $back.remove();
  $modal.querySelector('#btnCancel').addEventListener('click', close);
  $back.addEventListener('click', e=>{ if(e.target===$back) close(); });

  $modal.querySelector('#btnRun').addEventListener('click', ()=>{
    let n = parseInt(($in.value||'').replace(/\D/g,''),10);
    if(!Number.isFinite(n) || n<=0) n = 1;
    if(n > max) n = max;
    close();
    onSubmit(n);
  });
}

function openResultModal({title, pills=[], items=[], copyText=''}) {
  const $back = el(`<div class="gacha-backdrop" style="display:flex"></div>`);
  const $modal = el(`
    <div class="gacha-modal">
      <header>
        <h2>${title} 결과</h2>
        <p class="gacha-muted">“복사”를 눌러 카톡에 붙여넣기 하세요.</p>
        <div class="gacha-pills">${pillsHTML(pills)}</div>
      </header>

      <div class="gacha-list">
        ${items.map(itemRowHTML).join('')}
      </div>

      <div class="gacha-footer">
        <button class="gacha-btn" id="btnClose">닫기</button>
        <button class="gacha-btn gacha-btn-primary" id="btnCopy">복사</button>
      </div>
    </div>
  `);
  $back.appendChild($modal);
  document.body.appendChild($back);

  const close=()=> $back.remove();
  $modal.querySelector('#btnClose').addEventListener('click', close);
  $back.addEventListener('click', e=>{ if(e.target===$back) close(); });

  $modal.querySelector('#btnCopy').addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(copyText);
      $modal.querySelector('#btnCopy').textContent = '복사됨';
      setTimeout(()=>{ $modal.querySelector('#btnCopy').textContent='복사'; }, 1200);
    }catch(_){ alert('클립보드 복사에 실패했습니다.'); }
  });
}

/* ----------------------- 메인 마운트 ----------------------- */
export function mountGacha(root){
  root.innerHTML = `
  <section class="container gacha-card">
    <div class="gacha-actions" style="justify-content:flex-end; margin-bottom:8px">
      <button class="gacha-btn" id="btnHome">← 홈으로</button>
    </div>

    <h1>가챠 뽑기</h1>
    <p class="gacha-muted">원하는 상자를 눌러 뽑기 개수를 입력하세요. (최대 100개)</p>

    <div class="gacha-tiles">

      <!-- 2025 보름달 상자 (맨 위) -->
      <div class="gacha-tile">
        <img src="./assets/img/full_moon_box.jpg" alt="2025 보름달 상자"/>
        <div>
          <h3 style="margin:0 0 6px 0">2025 보름달 상자</h3>
          <p class="gacha-muted" style="margin:0 0 10px">확률형 보상 시뮬레이터</p>
          <div class="gacha-actions">
            <button class="gacha-btn gacha-btn-primary" id="btnMoon">뽑기 시작</button>
          </div>
        </div>
      </div>

      <!-- 부유선 랜덤상자 -->
      <div class="gacha-tile">
        <img src="./assets/img/fleet_random_box.jpg" alt="부유선 랜덤상자"/>
        <div>
          <h3 style="margin:0 0 6px 0">부유선 랜덤상자</h3>
          <p class="gacha-muted" style="margin:0 0 10px">제작도 → 부유선 2단계 추첨</p>
          <div class="gacha-actions">
            <button class="gacha-btn gacha-btn-primary" id="btnFleet">뽑기 시작</button>
          </div>
        </div>
      </div>

    </div>
  </section>
  `;

  // ← 홈으로
  root.querySelector('#btnHome').addEventListener('click', ()=>{
    // app.js의 navigate와 의존 없이 바로 홈으로
    location.hash = '';
  });

  // 보름달 상자
  root.querySelector('#btnMoon').addEventListener('click', ()=>{
    openInputModal({
      title: '뽑기 개수 입력',
      subtitle: '한 번에 최대 100개까지 가능합니다.',
      max: 100,
      onSubmit(n){
        const { items, pills, copy } = FullMoonBox.run(n);
        openResultModal({ title: '2025 보름달 상자', pills, items, copyText: copy });
      }
    });
  });

  // 부유선 랜덤상자
  root.querySelector('#btnFleet').addEventListener('click', ()=>{
    openInputModal({
      title: '뽑기 개수 입력',
      subtitle: '한 번에 최대 100개까지 가능합니다.',
      max: 100,
      onSubmit(n){
        const { items, pills, copy } = FleetRandomBox.run(n);
        openResultModal({ title: '부유선 랜덤상자', pills, items, copyText: copy });
      }
    });
  });
}