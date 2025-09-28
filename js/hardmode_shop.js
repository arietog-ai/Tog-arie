import { TWO_WEEKS, hourlyFor, nf, nf1, loadShopItems } from './hardmode_data.js';

export async function mountShop(container) {
  container.innerHTML = `<h2>개척상점 계산기</h2>`;

  const items = await loadShopItems();

  // 입력 UI
  const inputDiv = document.createElement('div');
  inputDiv.className = 'input-section';
  inputDiv.innerHTML = `
    <label>현재 층: <input id="floor-input" type="number" min="1" max="999" value="141"></label>
    <label>구역:
      <select id="zone-input">
        <option value="A">A (1-20)</option>
        <option value="B">B (21-40)</option>
        <option value="C">C (41-60)</option>
      </select>
    </label>
  `;
  container.appendChild(inputDiv);

  // 아이템 선택 UI
  const shopDiv = document.createElement('div');
  shopDiv.className = 'shop-section';

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="card-top">
        <img src="${item.img}" alt="${item.cat}" class="shop-img">
        <div class="shop-name">${item.cat}<br><small>${item.name}</small></div>
      </div>
      <div class="card-bottom">
        <span class="shop-price">${nf(item.price)}</span>
        <input type="checkbox" data-idx="${idx}">
      </div>
    `;
    shopDiv.appendChild(card);
  });
  container.appendChild(shopDiv);

  // 결과 출력 박스
  const resultBox = document.createElement('div');
  resultBox.id = 'result-box';
  container.appendChild(resultBox);

  // 복사 버튼 (하나만 유지)
  const copyBtn = document.createElement('button');
  copyBtn.textContent = '결과 복사';
  copyBtn.addEventListener('click', () => {
    const text = resultBox.innerText;
    navigator.clipboard.writeText(text).then(() => {
      alert('결과가 클립보드에 복사되었습니다.');
    });
  });
  container.appendChild(copyBtn);

  // 계산 함수
  function recalc() {
    const floor = parseInt(document.getElementById('floor-input').value, 10);
    const zone = document.getElementById('zone-input').value;

    const hourly = hourlyFor(floor, zone);
    const twoWeeks = hourly * TWO_WEEKS;

    let totalPrice = 0;
    let totalItems = 0;

    const selected = [];
    document.querySelectorAll('.shop-card input[type=checkbox]').forEach(cb => {
      if (cb.checked) {
        const item = items[cb.dataset.idx];
        const subtotal = item.price * item.times;
        totalPrice += subtotal;
        totalItems += item.times;
        selected.push(`- ${item.cat} ${item.name} ×${item.times} → ${nf(subtotal)}`);
      }
    });

    let result = `현재 층 ${floor}${zone} 기준\n`;
    result += `시간당: ${nf1(hourly)} / 2주간: ${nf(twoWeeks)}\n\n`;

    if (selected.length > 0) {
      result += `[선택한 아이템]\n${selected.join('\n')}\n\n`;
      result += `총 아이템 수: ${totalItems}\n총 금액: ${nf(totalPrice)}\n\n`;

      if (twoWeeks >= totalPrice) {
        result += `✅ 구매 가능`;
      } else {
        const needHours = Math.ceil(totalPrice / hourly);
        const needFloors = Math.ceil(needHours / TWO_WEEKS * (twoWeeks / hourly));
        result += `❌ 부족 → 최소 ${nf(totalPrice - twoWeeks)} 더 필요`;
      }
    } else {
      result += `아이템을 선택하세요.`;
    }

    resultBox.innerText = result;
  }

  // 이벤트 바인딩
  container.addEventListener('input', recalc);
  container.addEventListener('change', recalc);

  recalc();
}
