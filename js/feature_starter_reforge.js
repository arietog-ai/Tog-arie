/* ===== 시동무기 세공 (영혼/시동 주사위) ===== */
import { byId, fmt } from "./util.js";

export function mountStarterReforge(el) {
  el.innerHTML = `
    <div class="container">
      <div class="toprow">
        <button onclick="navigate('enhance')" class="hero-btn">← 강화로</button>
        <div class="badge"><img src="./assets/img/dice_blue.jpg" class="dicon"> 영혼: <b id="blueCnt">0</b></div>
        <div class="badge"><img src="./assets/img/dice_red.jpg" class="dicon"> 시동: <b id="redCnt">0</b></div>
      </div>

      <div class="card">
        <h2>현재 시동무기</h2>
        <div class="title-actions">
          <button id="rerollBlue" class="dice-btn">
            <img src="./assets/img/dice_blue.jpg" alt="blue"> 돌리기
          </button>
          <button id="rerollRed" class="dice-btn">
            <img src="./assets/img/dice_red.jpg" alt="red"> 돌리기
          </button>
        </div>

        <div id="reforgeTable" class="table-wrap"></div>
      </div>
    </div>
  `;

  /* === 내부 데이터 === */
  const names = ["마법저항력","효과저항","명중","치명타확률"];
  const baseRange = {
    "마법저항력": [3, 9],
    "효과저항": [9, 36],
    "명중": [6, 24],
    "치명타확률": [1.5, 4.5],
  };
  const incRange = {
    "마법저항력": [1.5, 2.5],
    "효과저항": [3, 6],
    "명중": [3, 6],
    "치명타확률": [0.5, 1],
  };

  const state = {
    blue: 1,
    red: 0,
    counts: {}, // 강화 단계(k)
    base: {},   // 0강
    final: {}   // 현재값
  };

  /* === 초기화 === */
  names.forEach(n => {
    state.counts[n] = Math.floor(Math.random()*5);
    const baseVal = randRange(...baseRange[n]);
    const inc = state.counts[n] * randRange(...incRange[n]);
    state.base[n] = baseVal;
    state.final[n] = Math.round((baseVal + inc) * 10) / 10;
  });

  render();

  /* === 랜덤 함수 === */
  function randRange(min,max){ return min + Math.random()*(max-min); }

  /* === 표 렌더 === */
  function renderTable(){
    return `
      <table class="gear-compact">
        <tbody>
          ${names.map(opt=>{
            const k = state.counts[opt]||0;
            const range = rangeFor(opt, k);
            const now = fmt(opt, state.final[opt]);
            return `
              <tr>
                <td class="kcell">${kDots(k)}</td>
                <td class="optcell">${opt}</td>
                <td class="valcell"><b>${now}</b></td>
                <td class="rangecell">${fmt(opt, range.min)} ~ ${fmt(opt, range.max)}</td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  function render(){
    byId("reforgeTable").innerHTML = `
      <div class="gear-table-wrap">
        ${renderTable()}
      </div>
    `;
    byId("blueCnt").textContent = state.blue;
    byId("redCnt").textContent = state.red;
  }

  /* === 범위 계산 === */
  function rangeFor(opt, k){
    const [bmin,bmax] = baseRange[opt];
    const [imin,imax] = incRange[opt];
    const min = Math.round((bmin + imin*k)*10)/10;
    const max = Math.round((bmax + imax*k)*10)/10;
    return {min,max};
  }

  /* === 강화 점 === */
  function kDots(k){
    return `<div class="kdots">${[...Array(5)].map((_,i)=>
      `<span class="${i<k?'on':''}"></span>`).join("")}</div>`;
  }

  /* === 파랑 주사위 (영혼: 단계 재분배 + 수치 재설정) === */
  function rerollBlue(){
    if(state.blue<=0)return alert("영혼 주사위가 부족합니다.");
    state.blue--;
    names.forEach(opt=>{
      state.counts[opt] = Math.floor(Math.random()*5);
      const baseVal = randRange(...baseRange[opt]);
      const inc = state.counts[opt]*randRange(...incRange[opt]);
      state.base[opt]=baseVal;
      state.final[opt]=Math.round((baseVal+inc)*10)/10;
    });
    render();
  }

  /* === 빨강 주사위 (시동: 단계 유지, 수치 재분배) === */
  function rerollRed(){
    if(state.red<=0)return alert("시동 주사위가 부족합니다.");
    state.red--;
    names.forEach(opt=>{
      const k = state.counts[opt];
      const baseVal = randRange(...baseRange[opt]);
      const inc = k*randRange(...incRange[opt]);
      state.base[opt]=baseVal;
      state.final[opt]=Math.round((baseVal+inc)*10)/10;
    });
    render();
  }

  /* === 이벤트 === */
  byId("rerollBlue").onclick=()=>{ rerollBlue(); };
  byId("rerollRed").onclick=()=>{ rerollRed(); };
}