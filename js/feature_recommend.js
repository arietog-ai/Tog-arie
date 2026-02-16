// js/feature_recommend.js  (v=20251123-4)
// 전체 추천 데이터 카드 + 이미지 자동 매핑 버전

const byId = (id)=>document.getElementById(id);

/* =====================================================
   1️⃣ 이미지 매핑
   👉 키는 "캐릭터명만" 정확히 맞추면 됨
===================================================== */

const IMAGE_MAP = {

  // 👑 가주급
  "로 포 비아 트로이메라이": "가주_가문의 주인_트로이메라이.png",
  "포 비더 구스트앙": "가주_가문의 주인_구스트앙.png",
  "월하익송 우렉 마지노": "가주_월하익송_우렉 마지노.png",

  // 🟢 녹
  "데이터 자하드": "녹_데이터_자하드.png",
  "모험가 자하드": "녹_X_자하드.png",
  "렌": "녹_처단자_렌.png",
  "레이첼": "녹_콜_불멸의화신_레이첼.png",
  "칼라반": "녹_무의정수_칼라반.png",
  "야스라차": "녹_지략가_야스라챠.png",
  "자하드공주": "녹_자하드의공주.png",
  "아리아": "녹_망가진시간_아리아.png",
  "로 포 비아 라슈트": "녹_키마이라_라슈트.png",
  "로 포 비아 로바돈": "녹_야전사령관_로바돈.png",

  // 🔴 적
  "에반켈": "적_지옥의염화_에반켈.png",
  "비올레": "적_가시_비올레.png",
  "하진성": "적_X_하진성.png",
  "알벨다": "적_영혼의조각_알벨다.png",
  "유이진": "적_콜_입학용병_유이진.png",
  "엘리스": "적_콜_포레스트_엘리스.png",
  "베타": "적_이탈자_베타.png",

  // 🔵 청
  "데마체": "청_데이터_쿤마스체니.png",
  "우렉": "청_X_우렉마지노.png",
  "카이저": "청_X_카이저.png",
  "에스카노르": "청_콜_더원_에스카노르.png",
  "가람": "청_X_가람.png",
  "야마": "청_케이지주인_야마.png",
  "알피네": "청_그림자인간_알피네.png",

  // 🟡 황
  "쿤 에드안": "황_X_쿤에드안.png",
  "연이랑": "황_위대한가문_연 이랑.png",
  "에반": "황_빠른배_에반.png",
  "데우렉": "황_데이터_우렉마지노.png",
  "차": "황_태초인_차.png",
  "모리 칼리오페": "황_콜_모리칼리오페.png"
};


/* =====================================================
   2️⃣ 추천 데이터 (전체)
===================================================== */

const RECOMMEND_DATA = [

  /* ================= 황 ================= */
  {
    tier: "🟡 황 속성",
    characters: [
      { name:"쿤 에드안", content:"바리(★) / 엘 4\n효적, 마관" },
      { name:"연이랑", content:"도리스(★) 4\n치댐증, 마관" },
      { name:"에반", content:"바리(★) / 룬다 4\n효저, 물저" },
      { name:"데우렉", content:"바리 4\n효저, 저항" },
      { name:"쿤 아센시오", content:"바리 4\n마저, 물리 관통 / 물저" },
      { name:"크로노스 하유리", content:"라이 / 바리 4\n치댐증, 마법 관통" },
      { name:"포 비더 위고", content:"바리(★) 4\n효저, 물리 관통" },
      { name:"모리 칼리오페", content:"바리(★) 4\n치댐증, 물리 관통" },
      { name:"아우구스구스", content:"바리 4\n치댐증, 물리 관통" },
      { name:"토코야미 토와", content:"바리(★) / 룬다 4\n효적/효저, 물저" },
      { name:"아리 브라이트 샤론", content:"바리(★) / 룬다 4\n효저, 물저" },
      { name:"차", content:"바리(★) 4\n효적, 물관" },
      { name:"로 포 비아 에블린", content:"바리(★) / 룬다 / 명월 4\n효적, 물관" }
    ]
  },

  /* ================= 자 ================= */
  {
    tier: "🟣 자 속성",
    characters: [
      { name:"카라카", content:"명월 / 바리 4\n저항" },
      { name:"전창", content:"바리(★) / 엘 / 선댄스 4\n효적, 마관" },
      { name:"데구앙", content:"바리(★) 4\n효저, 물리 저항" },
      { name:"화이트", content:"바리 4\n치댐증/효저, 마법 관통" },
      { name:"헬 조", content:"바리 4\n치댐증/효적, 물리 관통" },
      { name:"스쁠 하유라", content:"바리(★) / 룬다 / 도리스 4\n효저/물저" },
      { name:"가오리 라헬", content:"엘 / 바리 4\n치댐증/효적, 마법 관통" },
      { name:"은어 쿤", content:"도리스(★) / 룬다 / 바리 4\n효저/마저, 물저" }
    ]
  },

  /* ================= 적 ================= */
  {
    tier: "🔴 적 속성",
    characters: [
      { name:"에반켈", content:"바리 4\n치댐증/효적, 마법 관통/저항" },
      { name:"비올레", content:"선댄스 4\n치댐증, 마법 관통" },
      { name:"하진성", content:"라이 / 바리 4\n치댐증, 물리 관통" },
      { name:"각라", content:"명월 / 바리 4\n효저, 물저" },
      { name:"알벨다", content:"바리(★) / 라이마고22 4\n효저, 물저" },
      { name:"유이진", content:"알로 4\n마저, 물리 관통" },
      { name:"엘리스", content:"엘 / 압그(★) 4\n저항/치댐증/마저, 마법 관통" },
      { name:"스쁠샤샤", content:"바리 / 룬다(★) / 도리스 4\n효저/물저" },
      { name:"베타", content:"라이마고22 / 라이안나 4\n치댐증, 마법 관통" }
    ]
  },

  /* ================= 청 ================= */
  {
    tier: "🔵 청 속성",
    characters: [
      { name:"데마체", content:"라이마고22(★) / 라플 4\n치댐증/효저, 마법 관통" },
      { name:"우렉", content:"저돌파 바리 4 / 5레볼↑ 바리 4\n마저/치댐증, 물리 관통" },
      { name:"카이저 시리즈", content:"선댄스 4\n치댐증, 물리 관통" },
      { name:"에스카노르", content:"바리(★) / 명월 / 라이안나 4\n저항" },
      { name:"가람", content:"바리(★) / 룬다 / 엘 4\n마저/효적, 물저/마법 관통" },
      { name:"뿔밤", content:"바리(★) / 라플 / 엘 4\n치댐증/효저, 마법 관통" },
      { name:"xsr도원", content:"바리(★) / 엘 4\n치댐증, 물리 관통" },
      { name:"베이로드 야마", content:"바리 4\n저항" },
      { name:"xsr+우렉", content:"바리 4\n저항" },
      { name:"알피네", content:"바리 4\n효적, 물저" }
    ]
  },

  /* ================= 녹 ================= */
  {
    tier: "🟢 녹 속성",
    characters: [
      { name:"데이터 자하드", content:"알로 / 바리 4\n마저, 물리 관통" },
      { name:"렌", content:"엘 4\n저항(62.5%), 치댐증, 마법 관통" },
      { name:"잼유리", content:"바리(★) / 라이 4\n저항" },
      { name:"레이첼", content:"엘 4\n마법 관통" },
      { name:"치이화", content:"바리(★) / 도리스(★) / 룬다 / 라플 4\n효저, 물리 저항" },
      { name:"칼라반", content:"딜: 알로 / 바리 4\n탱: 바리 4" },
      { name:"야스라차", content:"바리 4\n마저/효적/치댐증, 마법 관통" },
      { name:"자하드공주", content:"모험: 바리 4\n보스: 라이마고22\nPvP: 알로 4" },
      { name:"아리아", content:"바리(★) / 알로 4\n효적/치댐증, 물리 관통" },
      { name:"로 포 비아 라슈트", content:"바리(★) / 엘 4\n효적, 마법 관통" },
      { name:"로 포 비아 로바돈", content:"룬다 / 도리스 4\n효적, 물저/물리 관통" }
    ]
  }

];



/* =====================================================
   3️⃣ 렌더 함수
===================================================== */

function renderCharacterCard(char){

  const file = IMAGE_MAP[char.name];
  let imageHTML = "";

  if(file){
    const path = `./assets/img/characters/${file}`;
    imageHTML = `
      <img src="${encodeURI(path)}"
           alt="${char.name}"
           style="width:120px;border-radius:12px;margin-bottom:8px;">
    `;
  }

  return `
    <div class="card" style="width:220px;padding:12px;text-align:center;">
      ${imageHTML}
      <div style="font-weight:700;margin-bottom:6px;">
        ${char.name}
      </div>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.4;">
        ${char.content}
      </div>
    </div>
  `;
}


/* =====================================================
   4️⃣ mount
===================================================== */

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

    html += `<h2 style="margin:24px 0 12px;">${section.tier}</h2>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:14px;">`;

    section.characters.forEach(char=>{
      html += renderCharacterCard(char);
    });

    html += `</div>`;
  });

  wrapper.innerHTML = html;
}
