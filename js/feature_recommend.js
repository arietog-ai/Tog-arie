// js/feature_recommend.js

let characters = {};
let tiers = {};

let currentMode = "adventure";
let currentAttribute = "all";

let isMounted = false; // 🔥 중복 mount 방지

export async function mountRecommend(container) {

  if (isMounted) return;
  isMounted = true;

  try {
  const [charRes, tierRes] = await Promise.all([
    fetch("./data/characters.json"),
    fetch("./data/tiers.json")
  ]);

  if (!charRes.ok || !tierRes.ok) {
    throw new Error("JSON load failed");
  }

  characters = await charRes.json();
  tiers = await tierRes.json();
  
  } catch (err) {
    container.innerHTML = `
      <div class="container">
        <div class="card">
          <h2>데이터 로딩 실패</h2>
          <p>characters.json / tiers.json 경로 확인</p>
        </div>
      </div>
    `;
    console.error(err);
    return;
  }

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

  // 🔥 홈 버튼
  document.getElementById("home-btn")
    .addEventListener("click", () => {
      isMounted = false;
      location.hash = "";
    });

  // 🔥 모달 닫기 버튼
  document.getElementById("modal-close")
    .addEventListener("click", closeModal);

  // 🔥 배경 클릭 시 닫기
  document.getElementById("recommend-modal")
    .addEventListener("click", e => {
      if (e.target.id === "recommend-modal") closeModal();
    });

  // 🔥 ESC 키 닫기
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

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

  const modeData = tiers.modes?.[currentMode];
  if (!modeData) return;

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
      if (!char) return;

      if (currentAttribute !== "all" && char.attribute !== currentAttribute)
        return;

      const card = document.createElement("div");
      card.className = "character-card";

      card.innerHTML = `
        <img src="./assets/img/characters/${char.image}.png" alt="${char.name}">
        <span>${char.name}</span>
      `;

      card.addEventListener("click", ()=> openModal(id));

      charWrap.appendChild(card);
    });

    if (charWrap.children.length > 0) {
      row.appendChild(label);
      row.appendChild(charWrap);
      container.appendChild(row);
    }
  });
}

/* ================= MODAL ================= */

function openModal(id){
  const char = characters[id];
  if (!char) return;

  const modal = document.getElementById("recommend-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = `
    <img src="./assets/img/characters/${char.image}.png">
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <pre>${char.recommend || "추천 시동무기 정보 없음"}</pre>
    </div>
  `;

  modal.classList.remove("modal-hidden");
}

function closeModal(){
  const modal = document.getElementById("recommend-modal");
  if (!modal) return;
  modal.classList.add("modal-hidden");
}
