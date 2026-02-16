// feature_recommend.js
// 모험 / PvP 티어표 + 캐릭터 클릭 시 추천 세팅 표시
// characters.json + tiers.json 분리 구조 대응

let CHARACTERS = {};
let TIERS = {};
let currentMode = "adventure";

// ================================
// 초기 로딩
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderModeToggle();
  renderTierTable();
});

// ================================
// 데이터 로드
// ================================
async function loadData() {
  try {
    const charRes = await fetch("data/characters.json");
    CHARACTERS = await charRes.json();

    const tierRes = await fetch("data/tiers.json");
    TIERS = await tierRes.json();
  } catch (err) {
    console.error("데이터 로드 실패:", err);
  }
}

// ================================
// 모험 / PvP 토글 UI
// ================================
function renderModeToggle() {
  const root = document.getElementById("recommend-root");

  root.innerHTML = `
    <div class="recommend-header">
      <button id="btn-adventure" class="mode-btn active">모험</button>
      <button id="btn-pvp" class="mode-btn">PvP</button>
    </div>
    <div id="tier-container"></div>
    <div id="character-detail" class="character-detail"></div>
  `;

  document.getElementById("btn-adventure").onclick = () => {
    currentMode = "adventure";
    updateModeButtons();
    renderTierTable();
  };

  document.getElementById("btn-pvp").onclick = () => {
    currentMode = "pvp";
    updateModeButtons();
    renderTierTable();
  };
}

function updateModeButtons() {
  document.querySelectorAll(".mode-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  if (currentMode === "adventure") {
    document.getElementById("btn-adventure").classList.add("active");
  } else {
    document.getElementById("btn-pvp").classList.add("active");
  }
}

// ================================
// 티어표 렌더링
// ================================
function renderTierTable() {
  const container = document.getElementById("tier-container");
  const modeData = TIERS.modes?.[currentMode];

  if (!modeData) {
    container.innerHTML = "<p>티어 데이터가 없습니다.</p>";
    return;
  }

  container.innerHTML = "";

  Object.keys(modeData).forEach(tier => {
    const tierRow = document.createElement("div");
    tierRow.className = `tier-row tier-${tier}`;

    const label = document.createElement("div");
    label.className = "tier-label";
    label.innerText = tier;

    const characterArea = document.createElement("div");
    characterArea.className = "tier-characters";

    modeData[tier].forEach(charKey => {
      const charData = CHARACTERS[charKey];
      if (!charData) return;

      const card = document.createElement("div");
      card.className = "character-card";
      card.innerHTML = `
        <img src="assets/img/characters/${charData.image}.png" alt="${charData.name}">
        <span>${charData.name}</span>
      `;

      card.onclick = () => showCharacterDetail(charKey);
      characterArea.appendChild(card);
    });

    tierRow.appendChild(label);
    tierRow.appendChild(characterArea);
    container.appendChild(tierRow);
  });
}

// ================================
// 캐릭터 상세 (추천 세팅 표시)
// ================================
function showCharacterDetail(charKey) {
  const detail = document.getElementById("character-detail");
  const charData = CHARACTERS[charKey];

  if (!charData) return;

  detail.style.display = "block";

  detail.innerHTML = `
    <div class="detail-header">
      <h2>${charData.name}</h2>
      <button onclick="closeDetail()">닫기</button>
    </div>
    <div class="detail-body">
      <img src="assets/img/characters/${charData.image}.png">
      <pre>${charData.recommend || "추천 세팅 정보 없음"}</pre>
    </div>
  `;
}

function closeDetail() {
  document.getElementById("character-detail").style.display = "none";
}
