// js/feature_gacha.js
// 인덱스에서 "가챠 뽑기" 버튼 → 보름달 상자 가챠(최대 100회) → 결과 팝업 + 카톡 복사

(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // 0) 엔트리 포인트: 화면에 “가챠 뽑기” 진입 버튼 & 섹션 주입
  document.addEventListener('DOMContentLoaded', () => {
    injectEntryButton();   // 떠있는 FAB (기존 메뉴 없을 때도 접근 가능)
    injectGachaSection();  // 페이지 섹션 (제목/이미지/설명)
    wireEvents();
  });

  function injectEntryButton(){
    const fab = document.createElement('button');
    fab.id = 'gachaFab';
    fab.className = 'gacha-btn gacha-btn-primary gacha-fab';
    fab.textContent = '🎲 가챠 뽑기';
    fab.title = '가챠 뽑기';
    fab.addEventListener('click', () => {
      scrollToGacha();
    });
    document.body.appendChild(fab);
  }

  function injectGachaSection(){
    if ($('#page-gacha')) return;

    const wrap = document.createElement('section');
    wrap.id = 'page-gacha';
    wrap.className = 'gacha-card';
    wrap.innerHTML = `
      <h1>가챠 뽑기</h1>
      <p class="gacha-muted">이미지를 누르면 뽑기 개수 입력 팝업이 열립니다. (최대 100개)</p>

      <div class="gacha-tile">
        <img id="imgFullMoon" src="assets/img/full_moon_box.jpg" alt="2025 보름달 상자" />
        <div>
          <div style="font-weight:800;font-size:18px;margin-bottom:6px">2025 보름달 상자</div>
          <p class="gacha-muted" style="margin-bottom:10px">이미지 설명: <em>2025 보름달상자 뽑기</em></p>
          <div class="gacha-actions">
            <button class="gacha-btn" id="btnFullMoonOpen">뽑기 시작</button>
          </div>
        </div>
      </div>
    `;
    // 섹션은 body 끝에 붙여도 되고, 메인 컨테이너가 있으면 그 뒤에 붙여도 됨
    document.body.appendChild(wrap);

    // 입력 모달
    const input = document.createElement('div');
    input.id = 'gachaInputBackdrop';
    input.className = 'gacha-backdrop';
    input.innerHTML = `
      <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="gachaInputTitle">
        <header>
          <h2 id="gachaInputTitle">뽑기 개수 입력</h2>
          <div class="gacha-muted">한 번에 최대 <b>100개</b>까지 가능합니다.</div>
        </header>
        <div class="gacha-field">
          <label for="gachaCount" class="gacha-muted">개수</label>
          <input id="gachaCount" class="gacha-input" type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="예: 10" />
          <span class="gacha-pill">2025 보름달 상자</span>
        </div>
        <div class="gacha-footer">
          <button class="gacha-btn" id="gachaCancel">취소</button>
          <button class="gacha-btn gacha-btn-primary" id="gachaRun">뽑기 실행</button>
        </div>
      </div>
    `;
    document.body.appendChild(input);

    // 결과 모달
    const result = document.createElement('div');
    result.id = 'gachaResultBackdrop';
    result.className = 'gacha-backdrop';
    result.innerHTML = `
      <div class="gacha-modal" role="dialog" aria-modal="true" aria-labelledby="gachaResultTitle">
        <header>
          <h2 id="gachaResultTitle">뭘 뽑았는지 결과</h2>
          <div class="gacha-muted">아래 내역은 이번 실행 결과입니다. “복사”를 눌러 카톡에 붙여넣기 하세요.</div>
        </header>
        <div class="gacha-pills" id="gachaSummary"></div>
        <div class="gacha-list" id="gachaList" aria-live="polite"></div>
        <div class="gacha-footer">
          <button class="gacha-btn" id="gachaClose">닫기</button>
          <button class="gacha-btn" id="gachaCopy">결과 복사(카톡용)</button>
        </div>
      </div>
    `;
    document.body.appendChild(result);
  }

  function scrollToGacha(){
    const sec = $('#page-gacha');
    if (!sec) return;
    window.scrollTo({ top: sec.offsetTop - 10, behavior: 'smooth' });
    // 브라우저 탭 제목 가변 변경(요청사항 반영)
    const old = document.title;
    if (!old.includes('가챠 뽑기')) document.title = `${old} · 가챠 뽑기`;
  }

  function wireEvents(){
    $('#btnFullMoonOpen')?.addEventListener('click', openInput);
    $('#imgFullMoon')?.addEventListener('click', openInput);

    $('#gachaCancel')?.addEventListener('click', () => hide($('#gachaInputBackdrop')));
    $('#gachaRun')?.addEventListener('click', runGacha);
    $('#gachaClose')?.addEventListener('click', () => hide($('#gachaResultBackdrop')));

    // 배경 클릭으로 닫기
    $('#gachaInputBackdrop')?.addEventListener('click', e => { if(e.target.id==='gachaInputBackdrop') hide(e.currentTarget); });
    $('#gachaResultBackdrop')?.addEventListener('click', e => { if(e.target.id==='gachaResultBackdrop') hide(e.currentTarget); });

    // Enter로 실행
    $('#gachaCount')?.addEventListener('keydown', e => { if(e.key==='Enter') runGacha(); });
  }

  function show(el){ el.style.display = 'flex'; }
  function hide(el){ el.style.display = 'none'; }

  function openInput(){
    const inp = $('#gachaCount');
    inp.value = '';
    show($('#gachaInputBackdrop'));
    setTimeout(()=>inp.focus(), 30);
  }

  // === 확률 테이블 (합계 100%)
  const POOL = [
    ["SSR+ 동료 선택 상자 1개", 0.25],
    ["특별 시동무기 세트 선택 상자 1개", 3.00],
    ["암시장 티켓 30개", 0.25],
    ["암시장 티켓 20개", 0.50],
    ["암시장 티켓 15개", 3.00],
    ["암시장 티켓 10개", 5.00],
    ["일반 소환 티켓 100개", 0.25],
    ["일반 소환 티켓 50개", 0.50],
    ["일반 소환 티켓 30개", 3.00],
    ["일반 소환 티켓 20개", 5.00],
    ["빛나는 레볼루션 조각 10,000개", 0.25],
    ["빛나는 레볼루션 조각 5,000개", 0.50],
    ["빛나는 레볼루션 조각 3,000개", 3.00],
    ["빛나는 레볼루션 조각 1,000개", 5.00],
    ["레볼루션 조각 1,200개", 0.75],
    ["레볼루션 조각 500개", 5.00],
    ["레볼루션 원석 100개", 0.50],
    ["레볼루션 원석 20개", 3.00],
    ["SSR+ 영혼석 60개", 1.00],
    ["SSR+ 영혼석 30개", 5.00],
    ["SSR 영혼석 60개", 5.00],
    ["시동 주사위 10개", 0.75],
    ["시동 주사위 3개", 5.00],
    ["영혼 주사위 10개", 3.00],
    ["영혼 주사위 5개", 5.00],
    ["고급 신해의 숫돌 30개", 6.00],
    ["고급 신해의 숫돌 20개", 6.00],
    ["고급 신해의 숫돌 10개", 6.00],
    ["마스터키 250개", 6.00],
    ["마스터키 200개", 6.00],
    ["성장 재화 선택 상자(24h) 20개", 0.50],
    ["성장 재화 선택 상자(24h) 10개", 3.00],
    ["A등급 시동무기 선택상자 10개", 3.00],
  ];
  const CDF = buildCDF(POOL);

  function buildCDF(pool){
    const out = []; let acc = 0;
    for (const [name, p] of pool){ acc += p; out.push([name, acc]); }
    out[out.length-1][1] = 100; // 오차 방지
    return out;
  }
  function drawOnce(cdf){
    const r = Math.random()*100;
    for (const [name, acc] of cdf) if (r < acc) return name;
    return cdf[cdf.length-1][0];
  }
  function simulate(times){
    const map = new Map();
    for (let i=0;i<times;i++){
      const item = drawOnce(CDF);
      map.set(item, (map.get(item)||0)+1);
    }
    return map;
  }

  let lastCopyText = '';

  function runGacha(){
    const n = parseInt($('#gachaCount').value,10);
    if(!(n>=1 && n<=100)){
      alert('뽑기 개수는 1~100 사이의 정수만 가능합니다.');
      $('#gachaCount').focus();
      return;
    }
    hide($('#gachaInputBackdrop'));

    const counts = simulate(n);
    renderResult(n, counts);
    show($('#gachaResultBackdrop'));
  }

  function renderResult(total, map){
    const list = $('#gachaList'); list.innerHTML = '';
    const pills = $('#gachaSummary'); pills.innerHTML = '';

    const ordered = [];
    for (const [name] of POOL){
      const c = map.get(name)||0;
      if (c>0) ordered.push([name,c]);
    }
    const kinds = ordered.length;
    const rareSet = new Set([
      "SSR+ 동료 선택 상자 1개",
      "암시장 티켓 30개",
      "일반 소환 티켓 100개",
      "빛나는 레볼루션 조각 10,000개",
      "SSR+ 영혼석 60개"
    ]);
    let rare = 0;
    for (const [name,c] of ordered) if (rareSet.has(name)) rare += c;

    pills.append(pill(`총 ${total}회`));
    pills.append(pill(`종류 ${kinds}개`));
    if (rare>0) pills.append(pill(`희귀 ${rare}회`));

    for (const [name,cnt] of ordered){
      list.append(row(name, `${cnt}개`));
    }

    const now = new Date().toLocaleString('ko-KR', { hour12:false });
    const lines = [];
    lines.push(`[2025 보름달 상자] 뽑기 결과`);
    lines.push(`총 ${total}회 | 종류 ${kinds}개${rare>0?` | 희귀 ${rare}회`:''}`);
    for (const [name,cnt] of ordered) lines.push(`- ${name} x ${cnt}`);
    lines.push(`(생성: ${now})`);
    lastCopyText = lines.join('\n');

    $('#gachaCopy').onclick = async ()=>{
      try{
        await navigator.clipboard.writeText(lastCopyText);
        alert('복사 완료! 카톡에 붙여넣기 하세요.');
      }catch{
        // 폴백
        const ta = document.createElement('textarea');
        ta.value = lastCopyText; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        alert('복사 완료! 카톡에 붙여넣기 하세요.');
      }
    };
  }

  function pill(text){
    const el = document.createElement('div');
    el.className = 'gacha-pill'; el.textContent = text; return el;
  }
  function row(left,right){
    const el = document.createElement('div'); el.className='gacha-row';
    const l = document.createElement('div'); l.textContent = left;
    const r = document.createElement('div'); r.textContent = right;
    el.append(l,r); return el;
  }
})();