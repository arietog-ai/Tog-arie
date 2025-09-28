import { TWO_WEEKS, hourlyFor, nf, nf1, loadShopItems } from './hardmode_data.js';

export async function mountShop(container){
  container.innerHTML = `
    <div class="container">
      <div class="card" style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div style="display:flex;gap:8px;align-items:center">
          <button id="go-home" style="width:auto">← 돌아가기</button>
          <h2 style="margin:0">개척상점 계산기</h2>
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
        <div class="pill">결과 복사 / 부족 층 계산</div>
        <div class="grid cols-2" style="margin-top:8px">
          <button id="btnCopy">결과 복사</button>
          <button id="btnNeed">부족 시 최소 층 계산</button>
        </div>
        <pre id="copyText" class="muted" style="margin-top:8px"></pre>
      </div>
    </div>
  `;

  // 돌아가기: 해시 라우팅으로 홈 이동(히스토리 유무와 무관)
  container.querySelector('#go-home').addEventListener('click', ()=>{
    location.hash = '';
  });

  // 데이터 로드
  const diag = container.querySelector('#diag');
  let items = await loadShopItems();
  if(!items || !items.length){
    diag.style.display = 'block';
    diag.innerHTML = `
      <div class="pill">진단</div>
      <div style="margin-top:6px">
        상점 데이터가 비었습니다. <code>data/hardmode_shop_items.json</code> 경로/문법을 확인하세요.
      </div>
    `;
    items = [];
  }

  const el = (id)=> container.querySelector('#'+id);
  const itemsEl = el('items');
  let picked = new Set();

  function renderCurrent(){
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const perH = hourlyFor(f,z);
    const two = Math.round(perH*TWO_WEEKS);
    el('curLabel').textContent = `${f}층 ${z}구역`;
    el('curHour').textContent  = `시급: ${nf1(perH)} / h · 2주: ${nf(two)}`;
  }

  // 안전한 이미지 로더(404 시 .jpg↔.png 자동 스왑 1회)
  function createItemCard(r, idx){
    const card = document.createElement('div');
    card.className = 'item-card';

    const top = document.createElement('div');
    top.className = 'item-top';

    const img = document.createElement('img');
    img.alt = r.cat;
    img.src = r.img;
    img.onerror = ()=>{
      try{
        const u = new URL(img.src, location.href);
        if(u.pathname.endsWith('.jpg')) u.pathname = u.pathname.replace(/\.jpg$/i,'.png');
        else if(u.pathname.endsWith('.png')) u.pathname = u.pathname.replace(/\.png$/i,'.jpg');
        img.onerror = null;
        img.src = u.pathname + u.search + u.hash;
      }catch(_){}
    };

    const cap = document.createElement('div');
    cap.className = 'cap';
    cap.textContent = `${r.cat} · ${r.name} × ${r.times}회`;

    top.appendChild(img);
    top.appendChild(cap);

    const bottom = document.createElement('div');
    bottom.className = 'item-bottom';
    bottom.innerHTML = `
      <div class="price">${nf(r.price)}</div>
      <div class="item-check"><input type="checkbox" data-idx="${idx}" ${picked.has(idx)?'checked':''}></div>
    `;

    card.appendChild(top);
    card.appendChild(bottom);
    return card;
  }

  function renderItems(){
    itemsEl.innerHTML = '';
    items.forEach((r, idx)=>{
      const card = createItemCard(r, idx);
      itemsEl.appendChild(card);
    });
  }

  function selectedTotal(){
    let sum=0, lines=[], count=0;
    picked.forEach(i=>{
      const r = items[i]; if(!r) return;
      const t = r.price * r.times;
      sum += t; count += r.times;
      lines.push(`${r.cat}·${r.name} × ${r.times}회: ${nf(t)}`);
    });
    return {sum, lines, count};
  }

  function buildCopy(){
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const per = hourlyFor(f,z);
    const two = Math.round(per*TWO_WEEKS);
    const {sum, lines, count} = selectedTotal();
    el('copyText').textContent =
`[블러연합 계산]
현재 위치: ${f}층 ${z}구역
시급: ${nf1(per)} / h
2주 누적: ${nf(two)}

선택 항목 수: ${count}
선택 항목 합계: ${nf(sum)}
- 상세:
${lines.length ? lines.join('\n') : '선택 없음'}`;
  }

  function updateCalc(){
    renderCurrent();
    const f = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const perH = hourlyFor(f,z);
    const income = Math.round(perH*TWO_WEEKS);

    const {sum, lines} = selectedTotal();
    el('needSum').textContent = nf(sum);
    el('needDetail').textContent = lines.length ? lines.join(' / ') : '선택된 항목이 없습니다.';

    if(sum===0){
      el('judge').textContent='항목을 선택하세요'; el('judge').className='big';
      el('lack').textContent=''; buildCopy(); return;
    }
    if(income >= sum){
      el('judge').textContent='구매 가능'; el('judge').className='big ok';
      el('lack').textContent=`2주 누적: ${nf(income)} ≥ 필요: ${nf(sum)}`;
    }else{
      el('judge').textContent='부족'; el('judge').className='big bad';
      el('lack').textContent=`부족분: ${nf(sum - income)} (2주: ${nf(income)})`;
    }
    buildCopy();
  }

  function neededFloor(){
    const start = Number(el('floor-input').value);
    const z = el('zone-input').value;
    const {sum} = selectedTotal();
    if(sum===0){ alert('항목을 먼저 선택하세요.'); return; }

    let f = start;
    while(f <= 3000 && (hourlyFor(f,z)*TWO_WEEKS) < sum) f++;

    const incomeAtStart = Math.round(hourlyFor(start,z)*TWO_WEEKS);
    const lack = Math.max(0, sum - incomeAtStart);
    const ok = (lack===0);

    el('judge').textContent = ok ? '구매 가능' : '부족';
    el('judge').className = ok ? 'big ok' : 'big bad';
    el('lack').textContent =
      ok ? `현재 층에서 구매 가능` :
           `부족분: ${nf(lack)} → 최소 ${f}층 ${z}구역에서 가능 (2주 기준)`;

    buildCopy();
  }

  // 이벤트 바인딩
  container.addEventListener('input', (e)=>{
    if(e.target.matches('#floor-input, #zone-input')) updateCalc();
  });
  itemsEl.addEventListener('change', (e)=>{
    if(e.target.matches('input[type="checkbox"]')){
      const i = Number(e.target.dataset.idx);
      e.target.checked ? picked.add(i) : picked.delete(i);
      updateCalc();
    }
  });
  container.querySelector('#btnCopy').addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(container.querySelector('#copyText').textContent);
      alert('결과가 복사되었습니다.');
    }catch{
      alert('복사 실패: 브라우저 권한을 확인하세요.');
    }
  });
  container.querySelector('#btnNeed').addEventListener('click', neededFloor);

  // 초기 렌더
  renderItems();
  updateCalc();
}