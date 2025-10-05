// js/feature_gacha.js
// 2025 보름달 상자 가챠 (최대 100회) – 결과 카톡 복사 지원
// - 결과 표시: 같은 계열(예: '암시장 티켓 N개')은 숫자 합산해서 최종값만 표기

export function mountGacha(appRoot){
  appRoot.innerHTML = `
    <section class="gacha-card">
      <h1>가챠 뽑기</h1>
      <p class="gacha-muted">이미지를 누르면 뽑기 개수 입력 팝업이 열립니다. (최대 100개)</p>

      <div class="gacha-tile">
        <img id="imgFullMoon" src="./assets/img/full_moon_box.jpg" alt="2025 보름달 상자" />
        <div>
          <div style="font-weight:800;font-size:18px;margin-bottom:6px">2025 보름달 상자</div>
          <p class="gacha-muted" style="margin-bottom:10px">이미지 설명: <em>2025 보름달상자 뽑기</em></p>
          <div class="gacha-actions">
            <button class="gacha-btn" id="btnFullMoonOpen">뽑기 시작</button>
            <button class="gacha-btn" id="btnHome">← 홈으로</button>
          </div>
        </div>
      </div>

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
            <span class="gacha-pill">2025 보름달 상자</span>
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
            <button class="gacha-btn" id="copyResult">결과 복사(카톡용)</button>
          </div>
        </div>
      </div>
    </section>
  `;

  // ===== 확률 테이블 (합계 100%) =====
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

  // ===== 엘리먼트 =====
  const q = sel => appRoot.querySelector(sel);
  const inputBackdrop  = q('#inputBackdrop');
  const resultBackdrop = q('#resultBackdrop');
  const drawCountEl    = q('#drawCount');
  const resultList     = q('#resultList');
  const summaryPills   = q('#summaryPills');

  // ===== 이벤트 바인딩 =====
  q('#imgFullMoon').addEventListener('click', openInput);
  q('#btnFullMoonOpen').addEventListener('click', openInput);
  q('#btnHome').addEventListener('click', ()=> location.hash='');

  q('#cancelInput').addEventListener('click', ()=> hide(inputBackdrop));
  q('#confirmInput').addEventListener('click', runGacha);
  q('#closeResult').addEventListener('click', ()=> hide(resultBackdrop));
  q('#copyResult').addEventListener('click', copyResult);

  // 배경 클릭으로 닫기
  [inputBackdrop, resultBackdrop].forEach(bd=>{
    bd.addEventListener('click', (e)=>{ if(e.target===bd) hide(bd); });
  });
  // Enter로 실행
  drawCountEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter') runGacha(); });

  function openInput(){
    drawCountEl.value = '';
    show(inputBackdrop);
    setTimeout(()=>drawCountEl.focus(), 20);
  }
  function show(el){ el.classList.remove('gacha-hidden'); el.style.display='flex'; }
  function hide(el){ el.style.display='none'; el.classList.add('gacha-hidden'); }

  function buildCDF(pool){
    const out=[]; let acc=0;
    for(const [name,p] of pool){ acc+=p; out.push([name,acc]); }
    out[out.length-1][1]=100; // 오차 방지
    return out;
  }
  function drawOnce(){
    const r=Math.random()*100;
    for(const [name,acc] of CDF) if(r<acc) return name;
    return CDF[CDF.length-1][0];
  }
  function simulate(n){
    const m=new Map();
    for(let i=0;i<n;i++){
      const it=drawOnce();
      m.set(it,(m.get(it)||0)+1);
    }
    return m; // Map<"항목명(숫자 포함)", 횟수>
  }

  let lastCopyText = '';

  function runGacha(){
    const n = parseInt(drawCountEl.value,10);
    if(!(n>=1 && n<=100)){
      alert('뽑기 개수는 1~100 사이의 정수만 가능합니다.');
      drawCountEl.focus(); return;
    }
    hide(inputBackdrop);

    const counts = simulate(n);
    renderResult(n, counts);
    show(resultBackdrop);
  }

  // === 결과 출력: 같은 계열은 숫자 합산해서 최종만 표시 ===
  function renderResult(total, map){
    resultList.innerHTML = '';
    summaryPills.innerHTML = '';

    // 1) 정의 순서 기반으로 이번 실행에 등장한 항목만 수집
    const ordered=[];
    for(const [name] of POOL){
      const c = map.get(name)||0;
      if(c>0) ordered.push([name,c]); // ["암시장 티켓 15개", 1] ...
    }

    // 2) 같은 "계열"로 합치기
    //   - 규칙: 항목명 마지막의 "숫자+개"를 추출하여 base와 수량을 분리
    //     예) "암시장 티켓 15개" -> base="암시장 티켓", unit=15
    //         최종 합계 = unit * count
    const merged = new Map(); // Map<base, totalQuantity>
    const orderOfBase = [];   // 출력 순서 유지를 위한 base 등장 순서
    for(const [name,count] of ordered){
      const m = name.match(/^(.*?)(\d[\d,]*)개$/); // 끝이 "123개"
      if(!m){
        // 숫자 없는 고정형 항목은 "개수" 그대로(횟수 단위) 표시를 위해 1개=개수 취급
        const base = name.trim();
        if(!merged.has(base)) orderOfBase.push(base);
        merged.set(base, (merged.get(base)||0) + count); // ex) "SSR+ 동료 선택 상자 1개" 같은 것도 1*count 형태지만 숫자 없음 → 횟수 누적
        continue;
      }
      const base = m[1].trim();
      const unit = parseInt(m[2].replace(/,/g,''),10) || 0;
      const add  = unit * count;
      if(!merged.has(base)) orderOfBase.push(base);
      merged.set(base, (merged.get(base)||0) + add);
    }

    // 3) 요약 정보
    //    희귀 기준: base 이름 기준으로 카운트(원하면 조정 가능)
    const rareSet = new Set([
      "SSR+ 동료 선택 상자",
      "암시장 티켓",
      "일반 소환 티켓",
      "빛나는 레볼루션 조각",
      "SSR+ 영혼석"
    ]);
    let rareKinds = 0;
    for(const base of orderOfBase){
      if(rareSet.has(base)) rareKinds++;
    }

    summaryPills.append(pill(`총 ${total}회`));
    summaryPills.append(pill(`종류 ${orderOfBase.length}개`));
    if(rareKinds>0) summaryPills.append(pill(`희귀 ${rareKinds}종`));

    // 4) 결과 리스트 (정의 순서 기반 base 등장 순서로 출력)
    for(const base of orderOfBase){
      const qty = merged.get(base);
      // 숫자 없는 항목은 "개" 대신 "개" 그대로(=횟수) 표기
      // 예) "SSR+ 동료 선택 상자"는 개수 자체가 의미(선택 상자 1개 단위) → "SSR+ 동료 선택 상자 1개"
      resultList.append(row(`${base} ${Number(qty).toLocaleString()}개`, ''));
    }

    // 5) 복사용 텍스트
    const now = new Date().toLocaleString('ko-KR',{hour12:false});
    const lines = [];
    lines.push(`[2025 보름달 상자] 뽑기 결과`);
    lines.push(`총 ${total}회 | 종류 ${orderOfBase.length}개${rareKinds>0?` | 희귀 ${rareKinds}종`:''}`);
    for(const base of orderOfBase){
      lines.push(`- ${base} ${Number(merged.get(base)).toLocaleString()}개`);
    }
    lines.push(`(생성: ${now})`);
    lastCopyText = lines.join('\n');
  }

  function copyResult(){
    navigator.clipboard.writeText(lastCopyText).then(()=>{
      alert('복사 완료! 카톡에 붙여넣기 하세요.');
    }).catch(()=>{
      const ta=document.createElement('textarea');
      ta.value=lastCopyText; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      alert('복사 완료! 카톡에 붙여넣기 하세요.');
    });
  }

  function pill(text){
    const el=document.createElement('div'); el.className='gacha-pill'; el.textContent=text; return el;
  }
  function row(left,right){
    const el=document.createElement('div'); el.className='gacha-row';
    const l=document.createElement('div'); l.textContent=left;
    const r=document.createElement('div'); r.textContent=right;
    el.append(l,r); return el;
  }
}