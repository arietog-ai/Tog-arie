// js/feature_pack_value_analysis.js

import { copyText } from './utils.js';

export async function mountPackValueAnalysis(app) {
  app.innerHTML = `
    <section class="container">
      <div class="card" style="text-align:center;padding:40px;">
        <p>⏳ 데이터 불러오는 중...</p>
      </div>
    </section>`;

  let data;
  try {
    const res = await fetch('./data/gacha_ticket_rank.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} — 파일을 찾을 수 없습니다`);
    data = await res.json();
  } catch (err) {
    app.innerHTML = `
      <section class="container">
        <div class="card">
          <h2>⚠️ 데이터 로딩 실패</h2>
          <p style="color:var(--muted);">${err.message}</p>
          <button class="hero-btn" id="goHomeBtn" style="margin-top:16px;">← 홈으로</button>
        </div>
      </section>`;
    document.getElementById('goHomeBtn')?.addEventListener('click', () => { location.hash = ''; });
    return;
  }

  const anchor = data.anchor_price;
  const ranked = data.packs
    .map(pack => ({ ...pack, efficiency: (1 - pack.ticket_unit_price / anchor) * 100 }))
    .sort((a, b) => b.efficiency - a.efficiency);

  const rows = ranked.map((pack, idx) => {
    const cls = pack.efficiency < 0 ? 'rank-negative' : pack.efficiency >= 80 ? 'rank-high' : pack.efficiency >= 50 ? 'rank-mid' : '';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${pack.name}</td>
        <td>${pack.price.toLocaleString()}원</td>
        <td>${pack.ticket_unit_price.toLocaleString()}원</td>
        <td class="${cls}">${pack.efficiency.toFixed(1)}%</td>
      </tr>`;
  }).join('');

  app.innerHTML = `
    <section class="container">
      <div class="card" style="max-width:1000px;margin:0 auto;">
        <div class="rank-card-title">기원 티켓 이득율 순위표</div>
        <div class="rank-subtitle">기준 단가: ${anchor.toLocaleString()}원</div>
        <table class="rank-table">
          <thead>
            <tr><th>#</th><th>상품명</th><th>가격</th><th>기원 단가</th><th>이득율</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:center;margin-top:24px;">
          <button class="hero-btn" id="goHomeBtn">← 홈으로</button>
        </div>
      </div>
    </section>`;

  document.getElementById('goHomeBtn')?.addEventListener('click', () => { location.hash = ''; });
}
