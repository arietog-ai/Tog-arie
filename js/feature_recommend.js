// js/feature_recommend.js  (v=20251123-3)
// 캐릭터 추천 이미지 카드 버전

const byId = (id)=>document.getElementById(id);

/* ================================
   1️⃣ 캐릭터 이미지 매핑
   (필요한 캐릭터 계속 추가하면 됨)
================================ */

const IMAGE_MAP = {
  "로 포 비아 트로이메라이": "가주_가문의 주인_트로이메라이.png",
  "포 비더 구스트앙": "가주_가문의 주인_구스트앙.png",
  "월하익송 우렉 마지노": "가주_월하익송_우렉 마지노.png",

  "데이터 자하드": "녹_데이터_자하드.png",
  "자하드공주": "녹_자하드의공주.png",
  "렌": "녹_처단자_렌.png",
  "레이첼": "녹_콜_불멸의화신_레이첼.png"
};


/* ================================
   2️⃣ 추천 데이터 (카드 구조)
   → 앞으로 여기만 추가하면 됨
================================ */

const RECOMMEND_DATA = [
  {
    tier: "👑 가주급 (최상위)",
    characters: [
      {
        name: "로 포 비아 트로이메라이",
        content: "바리(★) 4세트\n옵션: 효적, 마관\n보조: 룬다 4세트 (효적, 마관)"
      },
      {
        name: "포 비더 구스트앙",
        content: "바리(★) 4세트\n옵션: 효적, 물관"
      },
      {
        name: "월하익송 우렉 마지노",
        content: "바리(★) / 도리스 4세트\n옵션: 효적, 물관"
      }
    ]
  },
  {
    tier: "🟢 녹 속성 예시",
    characters: [
      {
        name: "데이터 자하드",
        content: "알로 / 바리 4세트\n옵션: 마저, 물리 관통"
      },
      {
        name: "자하드공주",
        content: "모험: 바리 4\n보스: 라이마고22\nPvP: 알로 4"
      },
      {
        name: "렌",
        content: "엘 4세트\n옵션: 저항(62.5%), 치댐증, 마법 관통"
      }
    ]
  }
];


/* ================================
   3️⃣ 카드 렌더 함수
================================ */

function renderCharacterCard(char){

  const file = IMAGE_MAP[char.name];
  let imageHTML = "";

  if(file){
    const path = `./assets/img/characters/${file}`;
    imageHTML = `
      <img 
        src="${encodeURI(path)}"
        alt="${char.name}"
        style="
          width:120px;
          border-radius:12px;
          margin-bottom:8px;
          object-fit:cover;
        "
      />
    `;
  }

  return `
    <div class="card" style="
        width:220px;
        padding:12px;
        text-align:center;
        transition:0.2s;
      ">
      ${imageHTML}
      <div style="font-weight:700;margin-bottom:6px;">
        ${char.name}
      </div>
      <div style="
          white-space:pre-wrap;
          font-size:13px;
          line-height:1.4;
        ">
        ${char.content}
      </div>
    </div>
  `;
}


/* ================================
   4️⃣ mount 함수
================================ */

export function mountRecommend(app){

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

    html += `
      <h2 style="margin:24px 0 12px;">
        ${section.tier}
      </h2>
      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:14px;
      ">
    `;

    section.characters.forEach(char => {
      html += renderCharacterCard(char);
    });

    html += `</div>`;
  });

  wrapper.innerHTML = html;
}
