// js/feature_recommend.js
// 🔥 모험/PvP + 속성필터 + 모달 상세창 + 홈버튼 포함 최종본

const CHARACTER_PATH = "./assets/img/characters/";

let CHAR_DATA = {};
let TIER_DATA = {};
let currentMode = "adventure";
let currentAttribute = "ALL";

export async function mountRecommend(app){

  app.innerHTML = `
    <section class="container">

      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="hero-btn" id="go-home">🏠 홈</button>
        <button class="hero-btn" onclick="history.back()">⬅ 뒤로가기</button>
      </div>

      <div class="recommend-header">
        <button class="mode-btn active" data-mode="adventure">모험</button>
        <button class="mode-btn" data-mode="pvp">PvP</button>
      </div>

      <div class="attribute-filter">
        <button class="attr-btn active" data-attr="ALL">전체</button>
        <button class="attr-btn" data-attr="녹">녹</button>
        <button class="attr-btn" data-attr="적">적</button>
        <button class="attr-btn" data-attr="청">청</button>
        <button class="attr-btn" data-attr="황">황</button>
        <button class="attr-btn" data-attr="자">자</button>
      </div>

      <div id="tier-wrapper"></div>

      <div id="character-modal" class="modal-hidden"></div>
    </section>
  `;

  document.getElementById("go-home").onclick = () => location.hash = "";

  CHAR_DATA = await fetch("./data/characters.json").then(r=>r.json());
  TIER_DATA = await fetch("./data/tiers.json").then(r=>r.json());

  bindModeButtons();
  bindAttributeButtons();
  renderTiers();
}

/* ================= MODE ================= */

function bindModeButtons(){
  document.querySelectorAll(".mode-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll(".mode-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      renderTiers();
    };
  });
}

/* ================= ATTRIBUTE ================= */

function bindAttributeButtons(){
  document.querySelectorAll(".attr-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll(".attr-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentAttribute = btn.dataset.attr;
      renderTiers();
    };
  });
}

/* ================= TIER RENDER ================= */

function renderTiers(){
  const wrapper = document.getElementById("tier-wrapper");
  wrapper.innerHTML = "";

  const tiers = TIER_DATA.modes[currentMode];

  Object.keys(tiers).forEach(tier=>{
    const charIds = tiers[tier];

    const filtered = charIds.filter(id=>{
      if(currentAttribute==="ALL") return true;
      return CHAR_DATA[id]?.attribute === currentAttribute;
    });

    if(filtered.length===0) return;

    const row = document.createElement("div");
    row.className = `tier-row tier-${tier}`;

    row.innerHTML = `
      <div class="tier-label">${tier}</div>
      <div class="tier-characters">
        ${filtered.map(id=>renderCharacterCard(id)).join("")}
      </div>
    `;

    wrapper.appendChild(row);
  });

  bindCharacterClicks();
}

/* ================= CHARACTER CARD ================= */

function renderCharacterCard(id){
  const char = CHAR_DATA[id];
  if(!char) return "";

  return `
    <div class="character-card" data-id="${id}">
      <img src="${CHARACTER_PATH}${encodeURI(char.image)}.png">
      <span>${char.name}</span>
    </div>
  `;
}

/* ================= MODAL ================= */

function bindCharacterClicks(){
  document.querySelectorAll(".character-card").forEach(card=>{
    card.onclick = ()=>{
      openModal(card.dataset.id);
    };
  });
}

function openModal(id){
  const modal = document.getElementById("character-modal");
  const char = CHAR_DATA[id];

  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${char.name}</h2>
        <button onclick="closeModal()">✖</button>
      </div>

      <div class="modal-body">
        <img src="${CHARACTER_PATH}${encodeURI(char.image)}.png">
        <div>
          <h3>추천 시동무기</h3>
          <pre>${char.recommend || "정보 없음"}</pre>
        </div>
      </div>
    </div>
  `;
}

window.closeModal = function(){
  document.getElementById("character-modal").className="modal-hidden";
};
