import {TWO_WEEKS, hourlyFor, loadShopItems, nf, nf1} from './hardmode_data.js';

export function mountShop(root){
  root.innerHTML = `
    <div class="container">
      <div class="card">
        <div class="grid cols-3">
          <div>
            <label>현재 층수</label>
            <input id="floor" type="number" value="171" min="1" />
          </div>
          <div>
            <label>구역</label>
            <select id="zone">
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
        <div class="pill">아이템 선택 (세부 품목)</div>
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
        <div class="pill">결과 복사</div>
        <div class="row" style="margin-top:8px">
          <button id="btnCopy">복사</button>
          <button id="btnNeed">부족 시 최소 층 계산</button>
        </div>
        <pre id="copyText" class="muted" style="margin-top:8px"></pre>
      </div>
    </div>
  `;

  const el = (id)=> document.getElementById(id);
  const itemsEl = el('items');
  let items = [];
  let picked = new Set();

  function renderCurrent(){
    const f = Number(el('floor').value);
    const z = el('zone').value;
    const perH = hourlyFor(f,z);
    const two = Math.round(perH*TWO_WEEKS);
    el('curLabel').textContent = `${f}층 ${z}구역`;
    el('curHour').textContent = `시급: ${nf1(perH)} / h · 2주: ${nf(two)}`;
  }

  function renderItems(){
    itemsEl.innerHTML = '';
    items.forEach((r, idx)=>{
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-top">
          <img src="${r.img}" alt="${r.cat}">
          <div class="cap">${r.cat} · ${r.name} × ${r.times}회</div>
        </div>
        <div class="item-bottom">
          <div class="price">${nf(r.price)}</div>
          <div class="item-check">
            <input type="checkbox" data-i="${idx}" ${picked.has(idx)?'checked':''}/>
          </div>
        </div>
      `;
      itemsEl.appendChild(card);
    });
  }

  function selectedTotal(){
    let sum=0, lines=[];
    picked.forEach(i=>{
      const r = items[i];
      const t = r.price * r.times;
      sum += t;
      lines.push(`${r.cat}·${r.name} × ${r.times}회: ${nf(t)}`);
    });
    return {sum, lines};
  }

  function updateCalc(){
    renderCurrent();
    const f = Number(el('floor').value);
    const z = el('zone').value;
    const perH = hourlyFor(f,z);
    const income = Math.round(perH*TWO_WEEKS);
    const {sum, lines} = selectedTotal();

    el('needSum').textContent = nf(sum);
    el('needDetail').textContent = lines.length ? lines.join(' / ') : '선택된 항목이 없습니다.';

    if(sum===0){ el('judge').textContent='항목을 선택하세요'; el('judge').className='big'; el('lack').textContent=''; buildCopy(); return; }
    if(income >= sum){ el('judge').textContent='구매 가능'; el('judge').className='big ok'; el('lack').textContent=`2주 누적: ${nf(income)} ≥ 필요: ${nf(sum)}`; }
    else{ el('judge').textContent='부족'; el('judge').className='big bad'; el('lack').textContent=`부족분: ${nf(sum - income)} (2주: ${nf(income)})`; }

    buildCopy();
  }

  function neededFloor(){
    const start = Number(el('floor').value);
    const z = el('zone').value;
    const {sum} = selectedTotal();
    if(sum===0){ alert('항목을 먼저 선택하세요.'); return; }
    let f = start;
    while(f <= 2000 && (hourlyFor(f,z)*TWO_WEEKS) < sum) f++;
    const incomeAtStart = Math.round(hourlyFor(start,z)*TWO_WEEKS);
    const lack = Math.max(0, sum - incomeAtStart);
    const ok = (lack===0);
    el('judge').textContent = ok ? '구매 가능' : '부족';
    el('judge').className = ok ? 'big ok' : 'big bad';
    el('lack').textContent = ok ? `현재 층에서 구매 가능` : `부족분: ${nf(lack)} → 최소 ${f}층 ${z}구역에서 가능 (2주 기준)`;
    buildCopy();
  }

  function buildCopy(){
    const f = Number(el('floor').value);
    const z = el('zone').value;
    const per = hourlyFor(f,z);
    const two = Math.round(per*TWO_WEEKS);
    const {sum, lines} = selectedTotal();
    const text =
`[블러연합 계산]
현재 위치: ${f}층 ${z}구역
시급: ${nf1(per)} / h
2주 누적: ${nf(two)}

선택 항목 합계: ${nf(sum)}
- 상세:
${lines.length ? lines.join('\n') : '선택 없음'}`;
    el('copyText').textContent = text;
  }

  el('floor').addEventListener('input', updateCalc);
  el('zone').addEventListener('change', updateCalc);
  itemsEl.addEventListener('change', (e)=>{
    if(e.target.matches('input[type="checkbox"]')){
      const i = Number(e.target.dataset.i);
      e.target.checked ? picked.add(i) : picked.delete(i);
      updateCalc();
    }
  });
  el('btnCopy')?.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(el('copyText').textContent); alert('복사되었습니다.'); }
    catch{ alert('복사 실패: 권한을 확인하세요.'); }
  });
  el('btnNeed')?.addEventListener('click', neededFloor);

  loadShopItems().then(list=>{
    items = list;
    renderItems();
    updateCalc();
  });
}
