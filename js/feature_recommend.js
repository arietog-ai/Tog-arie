// js/feature_recommend.js

let characters = {};
let tiers = {};

let currentMode = "adventure";
let currentAttribute = "all";

export async function mountRecommend(container) {

  characters = await fetch("./data/characters.json").then(r => r.json());
  tiers = await fetch("./data/tiers.json").then(r => r.json());

  container.innerHTML = `
    <div class="container">

      <div class="recommend-header">
        <button id="home-btn">홈으로</button>
      </div>

      <div class="mode-toggle" id="mode-toggle"></div>
      <div class="attribute-filter" id="attribute-filter"></div>

      <div id="tier-container"></div>
    </div>

    <div id="recommend-modal" class="modal modal-hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>추천 시동무기</h3>
          <button id="modal-close">닫기</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>
  `;

  document.getElementById("home-btn")
    .addEventListener("click", () => location.hash = "");

  document.getElementById("modal-close")
    .addEventListener("click", closeRecommendModal);

  renderModeToggle();
  renderAttributeFilter();
  renderTierTable();
}

/* ================= MODE ================= */

function renderModeToggle() {
  const el = document.getElementById("mode-toggle");

  el.innerHTML = `
    <button class="mode-btn ${currentMode==="adventure"?"active":""}" data-mode="adventure">모험</button>
    <button class="mode-btn ${currentMode==="pvp"?"active":""}" data-mode="pvp">PvP</button>
  `;

  el.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentMode = btn.dataset.mode;
      renderModeToggle();
      renderTierTable();
    });
  });
}

/* ================= ATTRIBUTE ================= */

function renderAttributeFilter(){
  const el = document.getElementById("attribute-filter");
  const attrs = ["all","황","자","적","청","녹"];

  el.innerHTML = attrs.map(a=>`
    <button class="attr-btn ${currentAttribute===a?"active":""}" data-attr="${a}">
      ${a==="all"?"전체":a}
    </button>
  `).join("");

  el.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentAttribute = btn.dataset.attr;
      renderAttributeFilter();
      renderTierTable();
    });
  });
}

/* ================= TIER ================= */

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

      card.innerHTML = `
        <img src="./assets/img/characters/${char.image}.png" />
        <span>${char.name}</span>
      `;

      card.addEventListener("click", ()=> openRecommendModal(id));

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
      <pre>${char.recommend || "추천 시동무기 정보 없음"}</pre>
    </div>
  `;

  modal.classList.remove("modal-hidden");
}

function closeRecommendModal(){
  document.getElementById("recommend-modal")
    .classList.add("modal-hidden");
}
