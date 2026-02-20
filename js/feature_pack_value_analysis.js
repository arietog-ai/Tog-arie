// js/feature_pack_value_analysis.js

export async function mountPackValueAnalysis(app){

  const res = await fetch('./data/gacha_ticket_rank.json');
  const data = await res.json();

  const anchor = data.anchor_price;

  // 🔥 이득율 계산 + 정렬
  const ranked = data.packs
    .map(pack => {
      const efficiency =
        (1 - (pack.ticket_unit_price / anchor)) * 100;
      return { ...pack, efficiency };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  // 🔥 테이블 행 생성
  const rows = ranked.map((pack, idx) => {

    let className = '';

    if (pack.efficiency < 0) {
      className = 'rank-negative';       // 🔴 마이너스
    } else if (pack.efficiency >= 80) {
      className = 'rank-high';           // 🟢 80% 이상
    } else if (pack.efficiency >= 50) {
      className = 'rank-mid';            // 🟡 50% 이상
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${pack.name}</td>
        <td>${pack.price.toLocaleString()}원</td>
        <td>${pack.ticket_unit_price.toLocaleString()}원</td>
        <td class="${className}">
          ${pack.efficiency.toFixed(1)}%
        </td>
      </tr>
    `;
  }).join('');

  // 🔥 HTML 렌더
  app.innerHTML = `
    <section class="container">
      <div class="card" style="max-width:1000px;margin:0 auto;">
        <div class="rank-card-title">
          기원 티켓 이득율 순위표
        </div>
        <div class="rank-subtitle">
          기준 단가: ${anchor.toLocaleString()}원
        </div>

        <table class="rank-table">
          <thead>
            <tr>
              <th>#</th>
              <th>상품명</th>
              <th>가격</th>
              <th>기원 단가</th>
              <th>이득율</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="text-align:center;margin-top:24px;">
          <button id="goHomeBtn">
            ← 홈으로
          </button>
        </div>
      </div>
    </section>
  `;

  // 🔥 CSP 대응 (inline onclick 제거)
  const homeBtn = document.getElementById('goHomeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      location.hash = '';
    });
  }
}
