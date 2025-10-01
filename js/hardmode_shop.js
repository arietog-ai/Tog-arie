// js/hardmode_shop.js
import { TWO_WEEKS, hourlyFor, nf, nf1, loadShopItems } from './hardmode_data.js';

// 이미지 실패 진단
const brokenImages = [];
function renderBrokenDiag(){
  const box = document.getElementById('diag');
  if(!box) return;
  const lines = [];
  if(brokenImages.length){
    lines.push(`이미지 로드 실패 ${brokenImages.length}건`);
    lines.push('※ 파일명/확장자/대소문자/경로를 assets/img/ 와 일치시키세요.');
    brokenImages.forEach((u,i)=>lines.push(`${i+1}. ${u}`));
  }
  box.style.display = lines.length ? 'block' : 'none';
  box.textContent = lines.join('\n');
}

export async function mountShop(container){
  container.innerHTML = `
    <div class="container">
      <div class="card" style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div style="display:flex;gap:8px;align-items:center">
          <button id="go-home" class="btn btn-ghost" style="width:auto">← 돌아가기</button>
          <h2 class="section-title" style="margin:0">개척상점 계산기</h2>
        </div>
      </div>

      <div class="card" id="diag" style="display:none"></div>

      <div class="card" style="margin-top:12px">
        <div class="grid cols-3">
          <div>
            <label>현재 층수</label>
            <input id="floor-input" type="number" min="1" max="9999" value="171">
          </div>
          <div>
            <label>구역</label>
            <select id="zone-input">
              <option value="A">A (1–20)</option>
              <option value="B">B (21–40)</option>
              <option value="C">C (41–60)</option>
            </select>
          </div>
          <div class="card">
            <div class="pill">선택 구역</div>
            <div id="curLabel" class="big" style="margin-top:6px"></div>
            <div id="curHour" class="muted"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="pill">검색 / 필터</div>
        <div class="filter-bar">
          <input id="search-input" type="text" placeholder="아이템 검색 (이름/카테고리)" style="max-width:280px">
          <div id="filter-chips" class="filter-bar"></div>
          <div style="flex:1"></div>
          <button id="btn-select-all" class="btn" style="width:auto">전체 선택</button>
          <button id="btn-deselect-all" class="btn btn-ghost" style="width:auto">전체 해제</button>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="pill">아이템 선택 (체크 시 즉시 반영)</div>
        <div id="items" class="item-grid" style="margin-top:10px"></div>
      </div>

      <div class="grid cols-2" style="margin-top:12px">
        <div class="card">
          <div class="pill">선택 항목 합계</div>
          <div id="needSum" class="big"></div>
          <div id="needDetail" class="muted"></div>
        </div>
        <div class="card">
          <div class="pill">판정</div>
          <div id="judge" class="big"></div>
          <div id="lack" class="muted"></div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="pill">복사 포맷</div>
        <div class="filter-bar">
          <label class="filter-chip"><input type="radio" name="copyfmt" value="short" checked> 짧게</label>
          <label class="filter-chip"><input type="radio" name="copyfmt" value="full"> 자세히</label>
          <div style="flex:1"></div>
          <button id="btnNeed" class="btn" style="width:auto">부족 시 최소 층 계산</button>
          <button id="btnCopy" class="btn btn-primary" style="width:auto">결과 복사</button>
        </div>
        <pre id="copyText" class="muted" style="margin-top:8px; white-space:pre-wrap"></pre>
      </div>

      <!-- Sticky 결과바 -->
      <div class="sticky-bar">
        <div class="sticky-inner">
          <div>
            <div class="pill">현재 위치</div>
            <div id="sticky-pos" class="big"></div>
          </div>
          <div>
            <div class="pill">2주 누적</div>
            <div id="sticky-two" class="big"></div>
          </div>
          <div>
            <div class="pill">선택 합계</div>
            <div id="sticky-sum" class="big"></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
            <button id="sticky-copy" class="btn btn-ghost" style="width:auto">복사</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const diag = container.querySelector('#diag');
  const itemsEl = container.querySelector('#items');
  const chipsEl = container.querySelector('#filter-chips');
  const searchEl = container.querySelector('#search-input');
  const el = id => container.querySelector(`#${id}`);

  el('go-home').addEventListener('click', ()=> location.hash = '');

  // 📥 데이터 로드 + 진단 표시(원시/검증 개수)
  let rawCount = 0, okCount = 0, items = [];
  {
    const load = await loadShopItems();
    rawCount = load.rawCount; okCount = load.okCount; items = load.items;
    diag.style.display = 'block';
    diag.textContent = `진단: JSON 원시 ${rawCount}개 / 검증 통과 ${okCount}개`;
    if(!okCount){
      diag.textContent += '\n※ 모든 항목이 검증에서 탈락했습니다. 이미지 경로/확장자를 확인하세요.';
    }
  }

  if(!items.length){
    return;
  }

  /* ========= 상태/필터 ========= */
  const state = { picked:new Set(), category:'전체', keyword:'' };
  const categories = ['전체', ...Array.from(new Set(items.map(x=>x.cat)))];

  function setupFilters(){
    chipsEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    categories.forEach(cat=>{
      const chip = document.createElement('div');
      chip.className = 'filter-chip' + (cat===state.category?' active':'');
      chip.textContent = cat;
      chip.addEventListener('click', ()=>{
        state.category = cat;
        chipsEl.querySelectorAll('.filter-chip').forEach(n=>n.classList.remove('active'));
        chip.classList.add('active');
        renderItems(); updateCalc();
      });
      frag.appendChild(chip);
    });
    chipsEl.appendChild(frag);

    searchEl.addEventListener('input', ()=>{
      state.keyword = (searchEl.value||'').trim();
      renderItems(); updateCalc();
    });

    el('btn-select-all').addEventListener('click', ()=>{
      filteredItems().forEach((_, idxInFiltered)=>{
        const globalIdx = filteredIndexToGlobalIndex(idxInFiltered);
        state.picked.add(globalIdx);
      });
      renderItems(); updateCalc();
    });
    el('btn-deselect-all').addEventListener('click', ()=>{
      filteredItems().forEach((_, idxInFiltered)=>{
        const globalIdx = filteredIndexToGlobalIndex(idxInFiltered);
        state.picked.delete(globalIdx);
      });
      renderItems(); updateCalc();
    });
  }

  function filteredItems(){
    const kw = state.keyword.toLowerCase();
    return items
      .map((it, i)=>({it, i}))
      .filter(({it}) => (state.category==='전체' || it.cat===state.category))
      .filter(({it}) => !kw || it.cat.toLowerCase().includes(kw) || it.name.toLowerCase().includes(kw));
  }
  let lastFiltered = [];
  function filteredIndexToGlobalIndex(i){ return lastFiltered[i]?.i; }

  function createItemCard(r, idxGlobal){
    const card = document.createElement('div'); card.className = 'item-card';

    const top = document.createElement('div'); top.className = 'item-top';
    const img = document.createElement('img');
    img.alt = r.cat; img.loading = 'lazy';

    const src0 = r.img.startsWith('http') ? r.img : (r.img.startsWith('./') ? r.img : ('./'+r.img));
    img.src = src0;
    img.onerror = () => {
      try{
        const u = new URL(img.src, location.href);
        if (u.pathname.match(/\.[A-Za-z0-9]+$/)) {
          const isJpg = /\.jpe?g$/i.test(u.pathname);
          u.pathname = u.pathname.replace(/\.[A-Za-z0-9]+$/, isJpg ? '.png' : '.jpg');
          img.onerror = () => { brokenImages.push(img.src); renderBrokenDiag(); };
          img.src = u.pathname + u.search + u.hash;
        } else {
          brokenImages.push(img.src); renderBrokenDiag();
        }
      }catch{
        brokenImages.push(img.src); renderBrokenDiag();
      }
    };

    const cap = document.createElement('div'); cap.className = 'cap';
    cap.textContent = `${r.cat} · ${r.name} × ${r.times}회`;
    top.appendChild(img); top.appendChild(cap);

    const bottom = document.createElement('div'); bottom.className = 'item-bottom';
    const priceDiv = document.createElement('div'); priceDiv.className = 'price'; priceDiv.textContent = nf(r.price);
    const checkDiv = document.createElement('div'); checkDiv.className = 'item-check';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.idx = idxGlobal;
    if(state.picked.has(idxGlobal)) checkbox.checked = true;
    checkDiv.appendChild(checkbox);

    bottom.appendChild(priceDiv); bottom.appendChild(checkDiv);
    card.appendChild(top); card.appendChild(bottom);
    return card;
  }

  function renderItems(){
    itemsEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    lastFiltered = filteredItems();
    lastFiltered.forEach(({it, i})=> frag.appendChild(createItemCard(it, i)));
    itemsEl.appendChild(frag);
    renderBrokenDiag();
  }

  function selectedTotal(){
    let sum=0, lines=[], count=0;
    state.picked.forEach(i=>{
      const r = items[i]; if(!r) return;
      const t = r.price * r.times;
      sum += t; count += r.times;
      lines.push(`${r.cat}·${r.name} × ${r.times}회: ${nf(t)}`);
    });
    return {sum, lines, count};
  }

  function renderCurrent(){
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const perH = hourlyFor(f,z);
    const two = Math.round(perH*TWO_WEEKS);
    el('curLabel').textContent = `${f}층 ${z}구역`;
    el('curHour').textContent  = `시급: ${nf1(perH)} / h · 2주: ${nf(two)}`;
    el('sticky-pos').textContent = `${f}층 ${z}구역`;
    el('sticky-two').textContent = `${nf(two)}`;
  }

  function buildCopyText(){
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const per = hourlyFor(f,z);
    const two = Math.round(per*TWO_WEEKS);
    const {sum, lines, count} = selectedTotal();
    const fmt = (container.querySelector('input[name="copyfmt"]:checked')?.value) || 'short';
    if(fmt === 'short'){
      return `[블러연합 계산] ${f}층 ${z}구역 · 시급 ${nf1(per)}/h · 2주 ${nf(two)} · 선택합계 ${nf(sum)} (${count}개)`;
    }else{
      return `[블러연합 계산]
현재 위치: ${f}층 ${z}구역
시급: ${nf1(per)} / h
2주 누적: ${nf(two)}

선택 항목 수: ${count}
선택 항목 합계: ${nf(sum)}
- 상세:
${lines.length ? lines.join('\n') : '선택 없음'}`;
    }
  }

  function updateCalc(){
    renderCurrent();
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const income = Math.round(hourlyFor(f,z)*TWO_WEEKS);

    const {sum, lines} = selectedTotal();
    el('needSum').textContent = nf(sum);
    el('needDetail').textContent = lines.length ? lines.join(' / ') : '선택된 항목이 없습니다.';

    const judge = el('judge'), lack = el('lack');
    if(sum===0){
      judge.textContent='항목을 선택하세요'; judge.className='big';
      lack.textContent='';
    }else if(income >= sum){
      judge.textContent='구매 가능'; judge.className='big ok';
      lack.textContent=`2주 누적: ${nf(income)} ≥ 필요: ${nf(sum)}`;
    }else{
      judge.textContent='부족'; judge.className='big bad';
      lack.textContent=`부족분: ${nf(sum - income)} (2주: ${nf(income)})`;
    }

    el('sticky-sum').textContent = nf(sum);
    const copyBox = document.getElementById('copyText');
    if(copyBox) copyBox.textContent = buildCopyText();
  }

  function neededFloor(){
    const start = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const { sum } = selectedTotal();
    if(sum === 0){ alert('항목을 먼저 선택하세요.'); return; }
    let f = start;
    while(f <= 3000 && (hourlyFor(f,z)*TWO_WEEKS) < sum) f++;
    const lack = sum - Math.round(hourlyFor(start,z)*TWO_WEEKS);
    el('lack').textContent = lack <= 0
      ? '현재 층에서 구매 가능'
      : `부족분: ${nf(lack)} → 최소 ${f}층 ${z}구역 필요`;
    const copyBox = document.getElementById('copyText');
    if(copyBox) copyBox.textContent = buildCopyText();
  }

  /* ========= 이벤트 ========= */
  container.addEventListener('input', (e)=>{
    if(e.target.matches('#floor-input, #zone-input')) updateCalc();
    if(e.target.name === 'copyfmt'){
      const copyBox = document.getElementById('copyText');
      if(copyBox) copyBox.textContent = buildCopyText();
    }
  });
  itemsEl.addEventListener('change', (e)=>{
    if(e.target.matches('input[type="checkbox"]')){
      const i = Number(e.target.dataset.idx);
      e.target.checked ? state.picked.add(i) : state.picked.delete(i);
      updateCalc();
    }
  });
  document.getElementById('btnNeed').addEventListener('click', neededFloor);
  document.getElementById('btnCopy').addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(buildCopyText());
      alert('결과가 복사되었습니다.');
    }catch{ alert('복사 실패: 브라우저 권한을 확인하세요.'); }
  });
  document.getElementById('sticky-copy').addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(buildCopyText());
      alert('결과가 복사되었습니다.');
    }catch{ alert('복사 실패: 브라우저 권한을 확인하세요.'); }
  });

  // 초기 설정
  setupFilters();
  renderItems();
  updateCalc();
}
