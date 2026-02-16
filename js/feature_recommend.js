// js/feature_recommend.js
// 티어 + 검색 + 필터 + 모달 + 속성색 통합버전
// 외부 json fetch 없이 내부 정의

const byId = (id)=>document.getElementById(id);

/* =====================================================
   1️⃣ 캐릭터 데이터 (characters.json 내용 그대로)
===================================================== */

const CHAR_DATA = {
  "luslec": { name:"루슬렉", image:"가주_FUG의 수장_루슬렉", attribute:"녹" },
  "troymerei": { name:"로 포 비아 트로이메라이", image:"가주_가문의 주인_트로이메라이", attribute:"녹" },
  "gustang": { name:"포 비더 구스트앙", image:"가주_가문의 주인_구스트앙", attribute:"적" },
  "urek": { name:"월하익송 우렉 마지노", image:"가주_월하익송_우렉 마지노", attribute:"청" },
  "khun_edahn": { name:"쿤 에드안", image:"황_X_쿤에드안", attribute:"황" },
  "white": { name:"화이트", image:"자_찢겨진권좌_화이트", attribute:"자" },
  "evankhell": { name:"에반켈", image:"적_지옥의염화_에반켈", attribute:"적" },
  "ren": { name:"렌", image:"녹_처단자_렌", attribute:"녹" }
  // 👉 나머지 캐릭터도 여기에 그대로 추가
};


/* =====================================================
   2️⃣ 티어 데이터 (파일 안에 직접 정의)
===================================================== */

const TIER_DATA = {
  "S": ["루슬렉","로 포 비아 트로이메라이","포 비더 구스트앙","월하익송 우렉 마지노"],
  "A": ["에반켈","쿤 에드안","화이트"],
  "B": ["렌"],
  "C": []
};


/* =====================================================
   3️⃣ 속성 색상
===================================================== */

const ATTR_COLOR = {
  "황": "#facc15",
  "자": "#a855f7",
  "적": "#ef4444",
  "청": "#3b82f6",
  "녹": "#22c55e"
};


/* =====================================================
   4️⃣ 공통 함수
===================================================== */

function getCharByName(name){
  return Object.values(CHAR_DATA).find(c=>c.name===name);
}

function renderCard(char){
  const color = ATTR_COLOR[char.attribute] || "#444";

  return `
    <div class="card char-card"
         data-name="${char.name}"
         data-attr="${char.attribute}"
         style="width:200px;border:2px solid ${color};cursor:pointer;text-align:center;">
      <img src="./assets/img/characters/${encodeURI(char.image)}.png"
           style="width:110px;border-radius:12px;margin-bottom:8px;">
      <div style="font-weight:700">${char.name}</div>
      <div style="font-size:12px;color:#aaa">${char.attribute}</div>
    </div>
  `;
}


/* =====================================================
   5️⃣ 티어표 렌더
===================================================== */

function renderTierTable(){

  let html = `<h2>🔥 티어표</h2>`;

  Object.keys(TIER_DATA).forEach(tier=>{
    html += `<h3 style="margin-top:20px">${tier} Tier</h3>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:12px;">`;

    TIER_DATA[tier].forEach(name=>{
      const char = getCharByName(name);
      if(char) html += renderCard(char);
    });

    html += `</div>`;
  });

  return html;
}


/* =====================================================
   6️⃣ 전체 캐릭터
===================================================== */

function renderAllCharacters(){

  let html = `<h2 style="margin-top:40px">📜 전체 캐릭터</h2>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:12px;">`;

  Object.values(CHAR_DATA).forEach(char=>{
    html += renderCard(char);
  });

  html += `</div>`;

  return html;
}


/* =====================================================
   7️⃣ 모달
===================================================== */

function attachModal(){
  document.querySelectorAll('.char-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const name = card.dataset.name;
      const char = getCharByName(name);
      showModal(char);
    });
  });
}

function showModal(char){

  const color = ATTR_COLOR[char.attribute] || "#444";

  const modal = document.createElement('div');
  modal.style.position='fixed';
  modal.style.inset='0';
  modal.style.background='rgba(0,0,0,.6)';
  modal.style.display='flex';
  modal.style.alignItems='center';
  modal.style.justifyContent='center';
  modal.style.zIndex='9999';

  modal.innerHTML = `
    <div style="background:#111;padding:20px;border-radius:16px;width:320px;border:2px solid ${color};">
      <h2>${char.name}</h2>
      <img src="./assets/img/characters/${encodeURI(char.image)}.png"
           style="width:140px;border-radius:12px;margin-bottom:12px;">
      <p>속성: ${char.attribute}</p>
      <button id="closeModal">닫기</button>
    </div>
  `;

  document.body.appendChild(modal);
  byId('closeModal').onclick = ()=> modal.remove();
}


/* =====================================================
   8️⃣ 검색 + 필터
===================================================== */

function attachFilter(){

  const searchInput = byId('searchInput');
  const attrSelect = byId('attrFilter');

  function filter(){
    const keyword = searchInput.value.toLowerCase();
    const attr = attrSelect.value;

    document.querySelectorAll('.char-card').forEach(card=>{
      const name = card.dataset.name.toLowerCase();
      const cardAttr = card.dataset.attr;

      const matchName = name.includes(keyword);
      const matchAttr = attr === 'ALL' || cardAttr === attr;

      card.style.display = (matchName && matchAttr) ? '' : 'none';
    });
  }

  searchInput.addEventListener('input', filter);
  attrSelect.addEventListener('change', filter);
}


/* =====================================================
   9️⃣ mount
===================================================== */

export function mountRecommend(app){

  app.innerHTML = `
    <section class="container">
      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <input id="searchInput" placeholder="캐릭터 검색..." />
        <select id="attrFilter">
          <option value="ALL">전체</option>
          <option value="황">황</option>
          <option value="자">자</option>
          <option value="적">적</option>
          <option value="청">청</option>
          <option value="녹">녹</option>
        </select>
      </div>

      ${renderTierTable()}
      ${renderAllCharacters()}
    </section>
  `;

  attachModal();
  attachFilter();
}
