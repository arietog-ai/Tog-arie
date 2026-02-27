// js/feature_eel_damage.js  v20260227-1
// 🐟 장어 데미지-기여도 계산기
// 1일 2회 × 3일 = 총 6회
// 환산 기본값: 1억당 1.001 기여도

const UNIT_FACTORS = {
  '':  1,
  'M': 1_000_000,
  'G': 1_000_000_000,
  'T': 1_000_000_000_000,
};

const byId = id => document.getElementById(id);
const nf   = n  => new Intl.NumberFormat('ko-KR').format(Math.round(n));
const nf4  = n  => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
}).format(n);

function parseDmg(str, unit) {
  const n = parseFloat((str || '').replace(/,/g, '').replace(/\s/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n * (UNIT_FACTORS[unit] ?? 1);
}

function formatWithUnit(rawDmg, unit) {
  const factor = UNIT_FACTORS[unit] ?? 1;
  if (factor === 1) return nf(rawDmg);
  return nf4(rawDmg / factor) + ' ' + unit;
}

function getRatio() {
  const v = parseFloat(byId('eel-ratio').value);
  return (Number.isFinite(v) && v > 0) ? v / 100_000_000 : 1.001e-8;
}

/* ─── 회차 행 HTML ─── */
function attemptRowsHTML() {
  return [1,2,3,4,5,6].map(i => {
    const day  = Math.ceil(i / 2);
    const turn = (i % 2 === 1) ? 1 : 2;
    return `
      <div style="display:grid;grid-template-columns:90px 1fr 110px;
                  gap:8px;align-items:center;margin-bottom:8px;">
        <span class="pill" style="text-align:center;font-size:12px;">
          ${day}일차 ${turn}회
        </span>
        <input  type="text" id="eel-dmg-${i}"
                placeholder="데미지 입력" inputmode="numeric"
                style="font-size:15px;" />
        <select id="eel-unit-${i}">
          <option value="">단위없음</option>
          <option value="M">M (×백만)</option>
          <option value="G">G (×십억)</option>
          <option value="T">T (×조)</option>
        </select>
      </div>`;
  }).join('');
}

/* ─── 마운트 ─── */
export function mountEelDamage(app) {
  app.innerHTML = `
<section class="container" style="padding-bottom:60px;">

  <!-- 헤더 -->
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
    <button class="hero-btn" id="eel-home">← 홈으로</button>
    <span class="pill">🐟 장어 데미지-기여도 계산</span>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px;font-size:13px;line-height:1.8;">
    <b>장어 컨텐츠 안내</b><br/>
    참여 횟수: <b class="ok">1일 2회 × 3일 = 총 6회</b><br/>
    단위: <b>M</b>(×백만) &nbsp;·&nbsp; <b>G</b>(×십억) &nbsp;·&nbsp;
          <b>T</b>(×조) &nbsp;·&nbsp; 단위없음(원본 숫자 그대로)<br/>
    기본 환산: <b class="ok">1억 데미지 → 기여도 1.001</b>
    <span class="muted">(수정 가능)</span>
  </div>

  <!-- 환산 비율 -->
  <div class="card" style="margin-bottom:12px;">
    <div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;">
      <div style="flex:0 0 auto;">
        <label>1억당 기여도</label>
        <input type="number" id="eel-ratio" value="1.001"
               step="0.001" min="0.001"
               style="width:130px;" />
      </div>
      <div class="muted" style="font-size:12px;padding-bottom:14px;">
        기여도 = 데미지 × (입력값 ÷ 100,000,000)
      </div>
    </div>
  </div>

  <!-- 모드 토글 -->
  <div class="mode-toggle" id="eel-mode-toggle" style="margin-bottom:12px;">
    <button class="mode-btn active" data-mode="d2c">📊 데미지 → 기여도</button>
    <button class="mode-btn"        data-mode="c2d">🎯 기여도 → 데미지</button>
  </div>

  <!-- ══════ 패널 A: 데미지 → 기여도 ══════ -->
  <div id="eel-panel-d2c">
    <div class="card">
      <h2 style="margin-top:0;font-size:16px;">데미지 입력 (최대 6회차)</h2>
      <p class="muted" style="margin:0 0 10px;font-size:13px;">
        빈 칸은 0으로 처리됩니다.
      </p>
      ${attemptRowsHTML()}
      <div style="text-align:right;margin-top:6px;">
        <button class="hero-btn" id="eel-calc-d2c"
                style="width:auto;padding:10px 22px;">⚡ 계산하기</button>
      </div>
    </div>

    <!-- 결과 -->
    <div class="card" id="eel-res-d2c" style="margin-top:12px;display:none;">
      <h2 style="margin-top:0;font-size:16px;">📈 결과</h2>
      <div id="eel-res-d2c-body"></div>
      <button class="hero-btn" id="eel-copy-d2c"
              style="margin-top:10px;width:auto;padding:10px 18px;">
        📋 결과 복사
      </button>
    </div>
  </div>

  <!-- ══════ 패널 B: 기여도 → 데미지 ══════ -->
  <div id="eel-panel-c2d" style="display:none;">
    <div class="card">
      <h2 style="margin-top:0;font-size:16px;">기여도 → 필요 데미지 역산</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">
        <div>
          <label>목표 기여도</label>
          <input type="text" id="eel-con"
                 placeholder="예: 335,979,673" inputmode="numeric" />
        </div>
        <div>
          <label>결과 표시 단위</label>
          <select id="eel-res-unit">
            <option value="">단위없음 (원본)</option>
            <option value="M">M (×백만)</option>
            <option value="G">G (×십억)</option>
            <option value="T">T (×조)</option>
          </select>
        </div>
      </div>
      <div style="text-align:right;">
        <button class="hero-btn" id="eel-calc-c2d"
                style="width:auto;padding:10px 22px;">⚡ 계산하기</button>
      </div>
    </div>

    <!-- 결과 -->
    <div class="card" id="eel-res-c2d" style="margin-top:12px;display:none;">
      <h2 style="margin-top:0;font-size:16px;">📈 역산 결과</h2>
      <div id="eel-res-c2d-body"></div>
      <button class="hero-btn" id="eel-copy-c2d"
              style="margin-top:10px;width:auto;padding:10px 18px;">
        📋 결과 복사
      </button>
    </div>
  </div>

</section>`;

  /* ── 홈 ── */
  byId('eel-home').addEventListener('click', () => { location.hash = ''; });

  /* ── 모드 전환 ── */
  byId('eel-mode-toggle').addEventListener('click', e => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    const mode = btn.dataset.mode;
    byId('eel-mode-toggle').querySelectorAll('.mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode)
    );
    byId('eel-panel-d2c').style.display = mode === 'd2c' ? '' : 'none';
    byId('eel-panel-c2d').style.display = mode === 'c2d' ? '' : 'none';
  });

  /* ════════════════════════════════════════
     A. 데미지 → 기여도
  ════════════════════════════════════════ */
  byId('eel-calc-d2c').addEventListener('click', () => {
    const ratio = getRatio();
    let totalDmg = 0;
    const rows = [];

    for (let i = 1; i <= 6; i++) {
      const rawStr = byId(`eel-dmg-${i}`).value;
      const unit   = byId(`eel-unit-${i}`).value;
      const dmg    = parseDmg(rawStr, unit);
      const con    = dmg * ratio;
      rows.push({
        day:  Math.ceil(i / 2),
        turn: i % 2 === 1 ? 1 : 2,
        dmg, unit, con,
      });
      totalDmg += dmg;
    }
    const totalCon = totalDmg * ratio;

    /* 테이블 */
    const tbody = rows.map(r => `
      <tr style="border-bottom:1px solid var(--line);
                 ${r.dmg === 0 ? 'opacity:.32' : ''}">
        <td style="padding:8px 6px;text-align:center;">
          ${r.day}일차 ${r.turn}회
        </td>
        <td style="padding:8px 6px;text-align:right;font-weight:700;">
          ${r.dmg > 0 ? formatWithUnit(r.dmg, r.unit) : '—'}
        </td>
        <td style="padding:8px 6px;text-align:right;
                   color:var(--ok);font-weight:800;">
          ${r.con > 0 ? nf4(r.con) : '—'}
        </td>
      </tr>`).join('');

    byId('eel-res-d2c-body').innerHTML = `
      <table style="width:100%;border-collapse:collapse;
                    font-size:14px;margin-bottom:12px;">
        <thead>
          <tr style="background:#1b2230;">
            <th style="padding:8px 6px;text-align:center;">회차</th>
            <th style="padding:8px 6px;text-align:right;">데미지</th>
            <th style="padding:8px 6px;text-align:right;">기여도</th>
          </tr>
        </thead>
        <tbody>${tbody}</tbody>
        <tfoot>
          <tr style="background:#1b2230;font-weight:800;">
            <td style="padding:8px 6px;text-align:center;">합계</td>
            <td style="padding:8px 6px;text-align:right;">${nf(totalDmg)}</td>
            <td style="padding:8px 6px;text-align:right;color:var(--ok);">
              ${nf4(totalCon)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="padding:12px;background:#0f1420;
                    border-radius:12px;border:1px solid var(--line);">
          <div style="font-size:12px;color:var(--muted);">총 데미지</div>
          <div style="font-size:20px;font-weight:800;margin-top:4px;">
            ${nf(totalDmg)}
          </div>
        </div>
        <div style="padding:12px;background:#0f1420;
                    border-radius:12px;border:2px solid var(--ok);">
          <div style="font-size:12px;color:var(--muted);">총 기여도</div>
          <div style="font-size:20px;font-weight:800;
                      color:var(--ok);margin-top:4px;">
            ${nf4(totalCon)}
          </div>
        </div>
      </div>

      <div style="margin-top:8px;font-size:12px;color:var(--muted);">
        환산 비율: 1억당 ${byId('eel-ratio').value} 기여도
      </div>`;

    byId('eel-res-d2c').style.display = '';

    /* 복사 텍스트 */
    const copyText = [
      '[🐟 장어 데미지→기여도 계산]',
      `환산: 1억당 ${byId('eel-ratio').value} 기여도`,
      '',
      ...rows
        .filter(r => r.dmg > 0)
        .map(r =>
          `${r.day}일차 ${r.turn}회  ` +
          `데미지 ${formatWithUnit(r.dmg, r.unit)}  →  기여도 ${nf4(r.con)}`
        ),
      '',
      `총 데미지: ${nf(totalDmg)}`,
      `총 기여도: ${nf4(totalCon)}`,
    ].join('\n');

    byId('eel-copy-d2c').onclick = () =>
      navigator.clipboard.writeText(copyText)
        .then(() => alert('복사되었습니다!'));
  });

  /* ════════════════════════════════════════
     B. 기여도 → 데미지 역산
  ════════════════════════════════════════ */
  byId('eel-calc-c2d').addEventListener('click', () => {
    const ratio  = getRatio();
    const conVal = parseFloat(
      (byId('eel-con').value || '').replace(/,/g, '')
    );
    if (!Number.isFinite(conVal) || conVal <= 0) {
      alert('올바른 기여도를 입력하세요.');
      return;
    }

    const resUnit    = byId('eel-res-unit').value;
    const totalDmg   = conVal / ratio;
    const perAttempt = totalDmg / 6;

    const tbody = [1,2,3,4,5,6].map(i => {
      const day = Math.ceil(i/2), turn = i%2===1?1:2;
      return `
        <tr style="border-bottom:1px solid var(--line);">
          <td style="padding:8px 6px;text-align:center;">
            ${day}일차 ${turn}회
          </td>
          <td style="padding:8px 6px;text-align:right;
                     color:var(--ok);font-weight:700;">
            ${formatWithUnit(perAttempt, resUnit)}
          </td>
        </tr>`;
    }).join('');

    byId('eel-res-c2d-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;
                  gap:10px;margin-bottom:12px;">
        <div style="padding:12px;background:#0f1420;
                    border-radius:12px;border:1px solid var(--line);">
          <div style="font-size:12px;color:var(--muted);">목표 기여도</div>
          <div style="font-size:20px;font-weight:800;margin-top:4px;">
            ${nf(conVal)}
          </div>
        </div>
        <div style="padding:12px;background:#0f1420;
                    border-radius:12px;border:2px solid var(--ok);">
          <div style="font-size:12px;color:var(--muted);">필요 총 데미지</div>
          <div style="font-size:20px;font-weight:800;
                      color:var(--ok);margin-top:4px;">
            ${formatWithUnit(totalDmg, resUnit)}
          </div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;
                    font-size:14px;margin-bottom:12px;">
        <thead>
          <tr style="background:#1b2230;">
            <th style="padding:8px 6px;text-align:center;">회차</th>
            <th style="padding:8px 6px;text-align:right;">
              회차당 필요 데미지 (6회 균등)
            </th>
          </tr>
        </thead>
        <tbody>${tbody}</tbody>
        <tfoot>
          <tr style="background:#1b2230;font-weight:800;">
            <td style="padding:8px 6px;text-align:center;">합계</td>
            <td style="padding:8px 6px;text-align:right;">
              ${formatWithUnit(totalDmg, resUnit)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="font-size:12px;color:var(--muted);">
        환산 비율: 1억당 ${byId('eel-ratio').value} 기여도 · 6회 균등 분배 기준
      </div>`;

    byId('eel-res-c2d').style.display = '';

    const copyText = [
      '[🐟 장어 기여도→데미지 역산]',
      `목표 기여도: ${nf(conVal)}`,
      `필요 총 데미지: ${formatWithUnit(totalDmg, resUnit)}`,
      `회차당 (6회 균등): ${formatWithUnit(perAttempt, resUnit)} / 회`,
      `환산 비율: 1억당 ${byId('eel-ratio').value} 기여도`,
    ].join('\n');

    byId('eel-copy-c2d').onclick = () =>
      navigator.clipboard.writeText(copyText)
        .then(() => alert('복사되었습니다!'));
  });
}
