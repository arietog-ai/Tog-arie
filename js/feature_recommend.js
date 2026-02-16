let characters = {};
let tiers = {};

let currentMode = "adventure";
let currentAttribute = "all";

async function initRecommend() {
  characters = await fetch("data/characters.json").then(res => res.json());
  tiers = await fetch("data/tiers.json").then(res => res.json());

  renderAttributeFilter();
  renderModeToggle();
  renderTierTable();
}

function renderModeToggle() {
  const container = document.getElementById("mode-toggle");

  container.innerHTML = `
    <button class="mode-btn ${currentMode === "adventure" ? "active" : ""}" onclick="changeMode('adventure')">모험</button>
    <button class="mode-btn ${currentMode === "pvp" ? "active" : ""}" onclick="changeMode('pvp')">PvP</button>
  `;
}

function changeMode(mode) {
  currentMode = mode;
  renderModeToggle();
  renderTierTable();
}

function renderAttributeFilter() {
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

function changeAttribute(attr) {
  currentAttribute = attr;
  renderAttributeFilter();
  renderTierTable();
}

function renderTierTable() {
  const container = document.getElementById("tier-container");
  const modeData = tiers.modes[currentMode];

  container.innerHTML = "";

  Object.keys(modeData).forEach(tier => {
    const tierRow = document.createElement("div");
    tierRow.className = "tier-row";

    const tierTitle = document.createElement("div");
    tierTitle.className = `tier-label tier-${tier}`;
    tierTitle.innerText = tier;

    const tierList = document.createElement("div");
    tierList.className = "tier-list";

    modeData[tier].forEach(id => {
      const char = characters[id];
      if (!char) return;

      if (currentAttribute !== "all" && char.attribute !== currentAttribute) return;

      const card = document.createElement("div");
      card.className = "character-card";
      card.onclick = () => openModal(id);

      card.innerHTML = `
        <img src="assets/img/characters/${char.image}.png" />
        <span>${char.name}</span>
      `;

      tierList.appendChild(card);
    });

    tierRow.appendChild(tierTitle);
    tierRow.appendChild(tierList);
    container.appendChild(tierRow);
  });
}

function openModal(id) {
  const char = characters[id];

  const modal = document.getElementById("recommend-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = `
    <img src="assets/img/characters/${char.image}.png" />
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <pre>${char.recommend || "추천 시동무기 정보 없음"}</pre>
    </div>
  `;

  modal.classList.remove("modal-hidden");
}

function closeModal() {
  document.getElementById("recommend-modal").classList.add("modal-hidden");
}

document.addEventListener("DOMContentLoaded", initRecommend);
