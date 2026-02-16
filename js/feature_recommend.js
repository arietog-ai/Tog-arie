// js/feature_recommend.js
// characters.json 기반 자동 이미지 매핑 버전

const byId = (id)=>document.getElementById(id);

/* =====================================================
   1️⃣ 캐릭터 데이터 로드
===================================================== */

let CHARACTER_DATA = {};

async function loadCharacters(){
  const res = await fetch('./data/characters.json');
  CHARACTER_DATA = await res.json();
}

/* =====================================================
   2️⃣ 이미지 경로 생성 (공백 안전 처리)
===================================================== */

function getImagePath(imageName){
  if(!imageName) return "";
  const rawPath = `./assets/img/characters/${imageName}.png`;
  return encodeURI(rawPath);
}

/* =====================================================
   3️⃣ 추천 데이터
===================================================== */

const RECOMMEND_DATA = [
  {
    tier: "👑 가주급 (최상위)",
    characters: [
      { key:"luslec", content:"PvP 바리 세팅 (효적, 마관)\n압그 세팅 (효적, 마관)" },
      { key:"troymerei", content:"바리(★) 4세트\n효적, 마관\n보조: 룬다 4세트" },
      { key:"gustang", content:"바리(★) 4세트\n효적, 물관" },
      { key:"urek", content:"바리(★) / 도리스 4세트\n효적, 물관" }
    ]
  }
];

/* =====================================================
   4️⃣ 카드 렌더
===================================================== */

function renderCharacterCard(char){

  const data = CHARACTER_DATA[char.key];
  if(!data) return "";

  const imagePath = getImagePath(data.image);

  return `
    <div class="card" style="width:220px;padding:12px;text-align:center;">
      <img src="${imagePath}"
           alt="${data.name}"
           style="width:120px;border-radius:12px;margin-bottom:8px;">
      <div style="font-weight:700;margin-bottom:6px;">
        ${data.name}
      </div>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.4;">
        ${char.content}
      </div>
    </div>
  `;
}

/* =====================================================
   5️⃣ mount
===================================================== */

export async function mountRecommend(app){

  await loadCharacters();

  app.innerHTML = `
    <section class="container">
      <div style="display:flex; gap:8px; margin-bottom:12px; align-items:center">
        <button class="hero-btn" id="rec-home">← 홈으로</button>
        <span class="pill">캐릭터 추천정보</span>
      </div>
      <div id="recommend-wrapper"></div>
    </section>
  `;

  byId('rec-home').addEventListener('click', ()=>{
    location.hash = '';
  });

  const wrapper = byId('recommend-wrapper');

  let html = "";

  RECOMMEND_DATA.forEach(section => {

    html += `<h2 style="margin:24px 0 12px;">${section.tier}</h2>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:14px;">`;

    section.characters.forEach(char=>{
      html += renderCharacterCard(char);
    });

    html += `</div>`;
  });

  wrapper.innerHTML = html;
}
