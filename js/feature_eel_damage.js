// js/feature_eel_damage.js  v20260301-2
// 🐟 장어 데미지-기여도 계산기
// 환산 비율: 서버 전용 (/api/eel 호출)

import { byId, nf, nf4, copyToClipboard } from './utils.js?v=20260301-2';

const UNIT_FACTORS = {
  '':  1,
  'M': 1_000_000,
  'G': 1_000_000_000,
  'T': 1_000_000_000_000,
};

function parseDmg(str, unit) {
  const n = parseFloat((str || '').replace(/,/g, '').replace(/\s/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n * (UNIT_FACTORS[unit] ?? 1);
}

function formatWithUnit(rawDmg, unit, floor = false) {
  const factor = UNIT_FACTORS[unit] ?? 1;
  const val = floor ? Math.floor(rawDmg) : rawDmg;
  if (factor === 1) return nf(Math.floor(val));
  const divided = floor ? Math.floor(val / factor) : val / factor;
  return nf4(divided) + ' ' + unit;
}

/* ─── 서버 API 호출 ─── */
async function callEelApi(payload) {
  const res = await fetch('/api/eel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
  return res.json();
}

/* ─── 버튼 로딩 상태 ─── */
function setLoading(btnId, loading) {
  const btn = byId(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '⏳ 계산 중...' : '⚡ 계산하기';
}

/* ─── 회차 행 HTML (1~6회) ─── */
function attemptRowsHTML() {
  return [1, 2, 3, 4, 5, 6].map(i => {
    const day  = Math.ceil(i / 2);
    const turn = i % 2 === 1 ? 1 : 2;
    return `
      <div style="display:grid;grid-template-columns:90px 1fr 110px;
                  gap:8px;align-items:center;margin-bottom:8px;">
        <span class="pill" style="text-align:center;font-size:12px;">${day}일차 ${turn}회</span>
        <input type="text" id="eel-dmg-${i}" placeholder="데미지 입력" inputmode="numeric" style="font-size:15px;" />
        <select id="eel-unit-${i}">
          <option value="">단위없음</option>
          <option value="M">M (×백만)</option>
          <option value="G">G (×십억)</option>
          <option value="T">T (×조)</option>
        </select>
      </div>`;
  }).join('');
}

/* ─── 회차 선택 칩 HTML ─── */
function attemptChipsHTML() {
  return [1, 2, 3, 4, 5, 6].map(n => {
    const day  = Math.ceil(n / 2);
    const turn = n % 2 === 1 ? 1 : 2;
    return `
      <button class="filter-chip eel-att-btn${n === 6 ? ' active' : ''}" data-n="${n}">
        ${n}회 <span class="muted" style="font-size:11px;margin-left:2px;">(${day}일 ${turn}회차)</span>
      </button>`;
  }).join('');
}

/* ─── 마운트 ─── */
export function mountEelDamage(app) {
  app.innerHTML = `
<section class="container" style="padding-bottom:60px;">

  <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
    <button class="hero-btn" id="eel-home">← 홈으로</button>
    <span class="pill">🐟 장어 데미지-기여도 계산</span>
  </div>

  <div class="card" style="margin-bottom:12px;font-size:13px;line-height:1.8;">
    <b>장어 컨텐츠 안내</b><br/>
    참여 횟수: <b class="ok">1일 2회 × 3일 = 총 6회</b><br/>
    단위: <b>M</b>(×백만) &nbsp;·&nbsp; <b>G</b>(×십억) &nbsp;·&nbsp; <b>T</b>(×조) &nbsp;·&nbsp; 단위없음(원본)
  </div>

  <div class="mode-toggle" id="eel-mode-toggle" style="margin-bottom:12px;">
    <button class="mode-btn active" data-mode="d2c">📊 데미지 → 기여도</button>
    <button class="mode-btn"        data-mode="c2d">🎯 기여도 → 데미지</button>
  </div>

  <!-- 패널 A: 데미지 → 기여도 -->
  <div id="eel-panel-d2c">
    <div class="card">
      <h2 style="margin-top:0;font-size:16px;">데미지 입력 (최대 6회차)</h2>
      <p class="muted" style="margin:0 0 10px;font-size:13px;">빈 칸은 0으로 처리됩니다.</p>
      ${attemptRowsHTML()}
      <div style="text-align:right;margin-top:6px;">
        <button class="hero-btn" id="eel-calc-d2c">⚡ 계산하기</button>
      </div>
    </div>
    <div class="card" id="eel-res-d2c" style="margin-top:12px;display:none;">
      <h2 style="margin-top:0;font-size:16px;">📈 결과</h2>
      <div id="eel-res-d2c-body"></div>
      <button class="hero-btn" id="eel-copy-d2c" style="margin-top:10px;">📋 결과 복사</button>
    </div>
  </div>

  <!-- 패널 B: 기여도 → 데미지 역산 -->
  <div id="eel-panel-c2d" style="display:none;">
    <div class="card">
      <h2 style="margin-top:0;font-size:16px;">기여도 → 필요 데미지 역산</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div>
          <label>목표 기여도</label>
          <input type="text" id="eel-con" placeholder="예: 335,679,783" inputmode="numeric" />
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
      <div style="margin-bottom:14px;">
        <label>참여 회차 수 선택</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;" id="eel-attempt-sel">
          ${attemptChipsHTML()}
        </div>
        <div class="muted" style="font-size:12px;margin-top:6px;">선택한 회차 수로 데미지를 균등 분배합니다.</div>
      </div>
      <div style="text-align:right;">
        <button class="hero-btn" id="eel-calc-c2d">⚡ 계산하기</button>
      </div>
    </div>
    <div class="card" id="eel-res-c2d" style="margin-top:12px;display:none;">
      <h2 style="margin-top:0;font-size:16px;">📈 역산 결과</h2>
      <div id="eel-res-c2d-body"></div>
      <button class="hero-btn" id="eel-copy-c2d" style="margin-top:10px;">📋 결과 복사</button>
    </div>
  </div>

</section>`;

  /* 홈 */
  byId('eel-home').addEventListener('click', () => { location.hash = ''; });

  /* 모드 전환 */
  byId('eel-mode-toggle').addEventListener('click', e => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    const mode = btn.dataset.mode;
    byId('eel-mode-toggle').querySelectorAll('.mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode));
    byId('eel-panel-d2c').style.display = mode === 'd2c' ? '' : 'none';
    byId('eel-panel-c2d').style.display = mode === 'c2d' ? '' : 'none';
  });

  /* 회차 선택 */
  let selectedAttempts = 6;
  byId('eel-attempt-sel').addEventListener('click', e => {
    const btn = e.target.closest('.eel-att-btn');
    if (!btn) return;
    selectedAttempts = parseInt(btn.dataset.n, 10);
    byId('eel-attempt-sel').querySelectorAll('.eel-att-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.n === String(selectedAttempts)));
  });

  /* ── A. 데미지 → 기여도 ── */
  byId('eel-calc-d2c').addEventListener('click', async () => {
    const meta = [];
    const dmgList = [];
    for (let i = 1; i <= 6; i++) {
      const unit = byId(`eel-unit-${i}`).value;
      const dmg  = parseDmg(byId(`eel-dmg-${i}`).value, unit);
      dmgList.push(dmg);
      meta.push({ day: Math.ceil(i / 2), turn: i % 2 === 1 ? 1 : 2, dmg, unit });
    }

    setLoading('eel-calc-d2c', true);
    try {
      const { contributions, totalDmg, totalCon } = await callEelApi({ mode: 'd2c', damages: dmgList });

      const tbody = meta.map((r, idx) => `
        <tr style="border-bottom:1px solid var(--line);${r.dmg === 0 ? 'opacity:.32' : ''}">
          <td style="padding:8px 6px;text-align:center;">${r.day}일차 ${r.turn}회</td>
          <td style="padding:8px 6px;text-align:right;font-weight:700;">
            ${r.dmg > 0 ? formatWithUnit(r.dmg, r.unit) : '—'}
          </td>
          <td style="padding:8px 6px;text-align:right;color:var(--ok);font-weight:800;">
            ${contributions[idx] > 0 ? nf(contributions[idx]) : '—'}
          </td>
        </tr>`).join('');

      byId('eel-res-d2c-body').innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px;">
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
              <td style="padding:8px 6px;text-align:right;color:var(--ok);">${nf(totalCon)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="padding:12px;background:#0f1420;border-radius:12px;border:1px solid var(--line);">
            <div style="font-size:12px;color:var(--muted);">총 데미지</div>
            <div style="font-size:20px;font-weight:800;margin-top:4px;">${nf(totalDmg)}</div>
          </div>
          <div style="padding:12px;background:#0f1420;border-radius:12px;border:2px solid var(--ok);">
            <div style="font-size:12px;color:var(--muted);">총 기여도</div>
            <div style="font-size:20px;font-weight:800;color:var(--ok);margin-top:4px;">${nf(totalCon)}</div>
          </div>
        </div>`;
      byId('eel-res-d2c').style.display = '';

      const copyText = [
        '[🐟 장어 데미지→기여도 계산]', '',
        ...meta
          .filter((r, idx) => r.dmg > 0)
          .map((r, idx) =>
            `${r.day}일차 ${r.turn}회  데미지 ${formatWithUnit(r.dmg, r.unit)}  →  기여도 ${nf(contributions[meta.indexOf(r)])}`),
        '', `총 데미지: ${nf(totalDmg)}`, `총 기여도: ${nf(totalCon)}`,
      ].join('\n');

      byId('eel-copy-d2c').onclick = () => copyToClipboard(copyText);

    } catch (err) {
      alert(`계산 실패: ${err.message}`);
    } finally {
      setLoading('eel-calc-d2c', false);
    }
  });

  /* ── B. 기여도 → 데미지 역산 ── */
  byId('eel-calc-c2d').addEventListener('click', async () => {
    const conVal = parseFloat((byId('eel-con').value || '').replace(/,/g, ''));
    if (!Number.isFinite(conVal) || conVal <= 0) {
      alert('올바른 기여도를 입력하세요.');
      return;
    }
    const resUnit = byId('eel-res-unit').value;
    setLoading('eel-calc-c2d', true);
    try {
      const { totalDmg, perAttempt } = await callEelApi({
        mode: 'c2d', contribution: conVal, attempts: selectedAttempts,
      });

      const tbody = Array.from({ length: selectedAttempts }, (_, idx) => {
        const i = idx + 1;
        const day  = Math.ceil(i / 2);
        const turn = i % 2 === 1 ? 1 : 2;
        return `
          <tr style="border-bottom:1px solid var(--line);">
            <td style="padding:8px 6px;text-align:center;">${day}일차 ${turn}회</td>
            <td style="padding:8px 6px;text-align:right;color:var(--ok);font-weight:700;">
              ${formatWithUnit(perAttempt, resUnit, true)}
            </td>
          </tr>`;
      }).join('');

      byId('eel-res-c2d-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div style="padding:12px;background:#0f1420;border-radius:12px;border:1px solid var(--line);">
            <div style="font-size:12px;color:var(--muted);">목표 기여도</div>
            <div style="font-size:20px;font-weight:800;margin-top:4px;">${nf(conVal)}</div>
          </div>
          <div style="padding:12px;background:#0f1420;border-radius:12px;border:2px solid var(--ok);">
            <div style="font-size:12px;color:var(--muted);">필요 총 데미지</div>
            <div style="font-size:20px;font-weight:800;color:var(--ok);margin-top:4px;">
              ${formatWithUnit(totalDmg, resUnit, true)}
            </div>
          </div>
        </div>
        <div style="margin-bottom:10px;"><span class="pill">참여 회차: ${selectedAttempts}회 기준</span></div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px;">
          <thead>
            <tr style="background:#1b2230;">
              <th style="padding:8px 6px;text-align:center;">회차</th>
              <th style="padding:8px 6px;text-align:right;">필요 데미지 (균등)</th>
            </tr>
          </thead>
          <tbody>${tbody}</tbody>
          <tfoot>
            <tr style="background:#1b2230;font-weight:800;">
              <td style="padding:8px 6px;text-align:center;">합계</td>
              <td style="padding:8px 6px;text-align:right;">${formatWithUnit(totalDmg, resUnit, true)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="font-size:12px;color:var(--muted);">※ 소수점 이하 버림</div>`;

      byId('eel-res-c2d').style.display = '';

      const copyText = [
        '[🐟 장어 기여도→데미지 역산]',
        `목표 기여도: ${nf(conVal)}`,
        `참여 회차: ${selectedAttempts}회`,
        `필요 총 데미지: ${formatWithUnit(totalDmg, resUnit, true)}`,
        `회차당 (균등): ${formatWithUnit(perAttempt, resUnit, true)} / 회`,
      ].join('\n');

      byId('eel-copy-c2d').onclick = () => copyToClipboard(copyText);

    } catch (err) {
      alert(`계산 실패: ${err.message}`);
    } finally {
      setLoading('eel-calc-c2d', false);
    }
  });
}
