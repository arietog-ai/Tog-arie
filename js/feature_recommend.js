let characters = {};
let tiers = {};

let currentMode = "adventure";
let currentAttribute = "all";

export async function renderRecommendView(container) {

  characters = await fetch("./data/characters.json").then(res => res.json());
  tiers = await fetch("./data/tiers.json").then(res => res.json());

  container.innerHTML = `
    <div class="container">

      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <button onclick="history.back()">뒤로가기</button>
        <button onclick="location.hash='#home'">홈</button>
      </div>

      <div class="mode-toggle" id="mode-toggle"></div>
      <div class="attribute-filter" id="attribute-filter"></div>
      <div id="tier-container"></div>

    </div>

    <div id="recommend-modal" class="modal modal-hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>추천 시동무기</h3>
          <button onclick="closeModal()">닫기</button>
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
  const container = document.getElementById("mode-toggle");

  container.innerHTML = `
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

/* ================= ATTRIBUTE ================= */

function renderAttributeFilter(){
  const container = document.getElementById("attribute-filter");

  const attrs = ["all","황","자","적","청","녹"];

  container.innerHTML = attrs.map(attr => `
    <button 
      class="attr-btn ${currentAttribute === attr ? "active" : ""}"
      onclick="changeAttribute('${attr}')">
      ${attr === "all" ? "전체" : attr}
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
  const modeData = tiers.modes[currentMode];

  container.innerHTML = "";

  Object.keys(modeData).forEach(tier => {

    const row = document.createElement("div");
    row.className = "tier-row";

    const label = document.createElement("div");
    label.className = `tier-label tier-${tier}`;
    label.innerText = tier;

    const list = document.createElement("div");
    list.className = "tier-list";

    modeData[tier].forEach(id => {

      const char = characters[id];
      if(!char) return;

      if(currentAttribute !== "all" && char.attribute !== currentAttribute)
        return;

      const card = document.createElement("div");
      card.className = "character-card";
      card.onclick = () => openModal(id);

      card.innerHTML = `
        <img src="./assets/img/characters/${char.image}.png" />
        <span>${char.name}</span>
      `;

      list.appendChild(card);
    });

    if(list.children.length > 0){
      row.appendChild(label);
      row.appendChild(list);
      container.appendChild(row);
    }
  });
}

/* ================= MODAL ================= */

function openModal(id){
  const char = characters[id];

  const modal = document.getElementById("recommend-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = `
    <img src="./assets/img/characters/${char.image}.png" />
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <pre>${char.recommend || "추천 시동무기 정보 없음"}</pre>
    </div>
  `;

  modal.classList.remove("modal-hidden");
}

window.closeModal = function(){
  document.getElementById("recommend-modal").classList.add("modal-hidden");
}
