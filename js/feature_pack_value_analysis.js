// js/feature_pack_value_analysis.js

export async function mountPackValueAnalysis(app){

  const res = await fetch('./data/pack_value_table.json');
  const valueTable = await res.json();

  app.innerHTML = `
    <section class="container">
      <div class="card">
        <h2>Pack Value Analysis</h2>

        <label>상품 가격 (원)</label>
        <input type="number" id="price" />

        <label>부유석 개수</label>
        <input type="number" id="stone" value="0"/>

        <label>증폭 개수</label>
        <input type="number" id="boost" value="0"/>

        <button id="calcBtn">계산하기</button>

        <div id="result" style="margin-top:16px;"></div>

        <button id="backHome" style="margin-top:12px;">← 홈으로</button>
      </div>
    </section>
  `;

  document.getElementById('calcBtn').addEventListener('click', ()=>{

    const price = Number(document.getElementById('price').value);
    const stone = Number(document.getElementById('stone').value);
    const boost = Number(document.getElementById('boost').value);

    const totalValue =
      stone +
      (boost * valueTable.items.boost);

    if(totalValue <= 0){
      document.getElementById('result').innerHTML = '입력값을 확인하세요.';
      return;
    }

    const unitPrice = price / totalValue;
    const efficiency =
      (valueTable.base_unit_price / unitPrice) * 100;

    document.getElementById('result').innerHTML = `
      실질 단가: ${unitPrice.toFixed(2)} 원<br>
      기준 대비 효율: ${efficiency.toFixed(1)} %
    `;
  });

  document.getElementById('backHome')
    .addEventListener('click', ()=> location.hash='');
}
