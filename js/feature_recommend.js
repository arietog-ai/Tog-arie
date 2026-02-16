// js/feature_recommend.js

let characters = {};
let tiers = {};

let currentMode = "adventure";
let currentAttribute = "all";

export async function mountRecommend(container) {

  characters = await fetch("./data/characters.json").then(res => res.json());
  tiers = await fetch("./data/tiers.json").then(res => res.json());

  container.innerHTML = `
    <div class="container">

      <div class="recommend-header">
        <button onclick="history.back()">← 뒤로가기</button>
        <button onclick="location.hash=''">홈</button>
      </div>

      <div class="mode-toggle" id="mode-toggle"></div>
      <div class="attribute-filter" id="attribute-filter"></div>

      <div id="tier-container"></div>
    </div>

    <div id="recommend-modal" class="modal modal-hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>추천 시동무기</h3>
          <button onclick="closeRecommendModal()">닫기</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>
  `;

  renderModeToggle();
  renderAttributeFilter();
  renderTierTable();
}

/* ================= MODE ================= */

function renderModeToggle() {
  const el = document.getElementById("mode-toggle");

  el.innerHTML = `
    <button class="mode-btn ${currentMode === "adventure" ? "active" : ""}"
      onclick="changeMode('adventure')">모험</button>

    <button class="mode-btn ${currentMode === "pvp" ? "active" : ""}"
      onclick="changeMode('pvp')">PvP</button>
  `;
}

window.changeMode = function(mode){
  currentMode = mode;
  renderModeToggle();
  renderTierTable();
}

/* ================= ATTRIBUTE FILTER ================= */

function renderAttributeFilter(){
  const el = document.getElementById("attribute-filter");

  const attrs = ["all","황","자","적","청","녹"];

  el.innerHTML = attrs.map(a => `
    <button 
      class="attr-btn ${currentAttribute === a ? "active" : ""}"
      onclick="changeAttribute('${a}')">
      ${a === "all" ? "전체" : a}
    </button>
  `).join("");
}

window.changeAttribute = function(attr){
  currentAttribute = attr;
  renderAttributeFilter();
  renderTierTable();
}

/* ================= TIER TABLE ================= */

function renderTierTable(){
  const container = document.getElementById("tier-container");
  container.innerHTML = "";

  const modeData = tiers.modes[currentMode];

  Object.keys(modeData).forEach(tier => {

    const row = document.createElement("div");
    row.className = `tier-row tier-${tier}`;

    const label = document.createElement("div");
    label.className = "tier-label";
    label.innerText = tier;

    const charWrap = document.createElement("div");
    charWrap.className = "tier-characters";

    modeData[tier].forEach(id => {

      const char = characters[id];
      if(!char) return;

      if(currentAttribute !== "all" && char.attribute !== currentAttribute)
        return;

      const card = document.createElement("div");
      card.className = "character-card";
      card.onclick = () => openRecommendModal(id);

      card.innerHTML = `
        <img src="./assets/img/characters/${char.image}.png" />
        <span>${char.name}</span>
      `;

      charWrap.appendChild(card);
    });

    if(charWrap.children.length > 0){
      row.appendChild(label);
      row.appendChild(charWrap);
      container.appendChild(row);
    }
  });
}

/* ================= MODAL ================= */

function openRecommendModal(id){
  const char = characters[id];

  const modal = document.getElementById("recommend-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = `
    <img src="./assets/img/characters/${char.image}.png" />
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <p style="margin:6px 0 12px; font-size:13px; color:#aaa;">
        ※ 캐릭터를 누르면 추천 시동무기가 표시됩니다.
      </p>
      <pre>${char.recommend || "추천 시동무기 정보 없음"}</pre>
    </div>
  `;

  modal.classList.remove("modal-hidden");
}

window.closeRecommendModal = function(){
  document.getElementById("recommend-modal")
    .classList.add("modal-hidden");
};
