// js/feature_pack_value_analysis.js

export async function mountPackValueAnalysis(app){

  const res = await fetch('./data/gacha_ticket_rank.json');
  const data = await res.json();

  const anchor = data.anchor_price;

  // 🔥 이득율 계산 + 정렬
  const ranked = data.packs.map(pack => {
    const efficiency = (1 - (pack.ticket_unit_price / anchor)) * 100;
    return {
      ...pack,
      efficiency: efficiency
    };
  }).sort((a, b) => b.efficiency - a.efficiency);

  // 🔥 HTML 생성
  let rows = ranked.map((pack, idx) => {

    const color =
      pack.efficiency >= 0
        ? '#7cf29a'
        : '#ff8a8a';

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${pack.name}</td>
        <td>${pack.price.toLocaleString()}원</td>
        <td>${pack.ticket_unit_price.toLocaleString()}원</td>
        <td style="color:${color}">
          ${pack.efficiency.toFixed(1)}%
        </td>
      </tr>
    `;
  }).join('');

  app.innerHTML = `
    <section class="container">
      <div class="card" style="max-width:1000px;margin:0 auto;">
        <h2>기원 티켓 이득율 순위표</h2>
        <p class="muted">기준 단가: ${anchor.toLocaleString()}원</p>

        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="border-bottom:1px solid #333;">
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

        <button style="margin-top:20px;" onclick="location.hash=''">
          ← 홈으로
        </button>
      </div>
    </section>
  `;
}
