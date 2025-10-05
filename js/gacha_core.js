// js/gacha_core.js
// 공통 유틸: 누적분포, 추첨, 리스트 렌더 도우미, 복사 텍스트

export function buildCDF(pool) {
  const out = []; let acc = 0;
  for (const [name, p] of pool) { acc += p; out.push([name, acc]); }
  if (out.length) out[out.length - 1][1] = 100;
  return out;
}

export function drawOnce(cdf) {
  const r = Math.random() * 100;
  for (const [name, acc] of cdf) if (r < acc) return name;
  return cdf[cdf.length - 1][0];
}

export function simulate(pool, n) {
  const cdf = buildCDF(pool);
  const m = new Map();
  for (let i = 0; i < n; i++) {
    const it = drawOnce(cdf);
    m.set(it, (m.get(it) || 0) + 1);
  }
  return m; // Map<아이템명, 횟수>
}

/** "암시장 티켓 10개"처럼 끝에 수량이 붙은 항목을 베이스로 합산 */
export function sumByBaseQuantity(orderedPairs) {
  const merged = new Map(); // Map<base, totalQty>
  const order = [];
  for (const [name, count] of orderedPairs) {
    const m = name.match(/^(.*?)(\d[\d,]*)개$/);
    if (!m) {
      const base = name.trim();
      if (!merged.has(base)) order.push(base);
      merged.set(base, (merged.get(base) || 0) + count);
      continue;
    }
    const base = m[1].trim();
    const unit = parseInt(m[2].replace(/,/g, ''), 10) || 0;
    const add = unit * count;
    if (!merged.has(base)) order.push(base);
    merged.set(base, (merged.get(base) || 0) + add);
  }
  return { merged, order };
}

/** 복사 텍스트 생성 */
export function buildCopyText(title, total, lines, extra = '') {
  const now = new Date().toLocaleString('ko-KR', { hour12: false });
  const out = [];
  out.push(`[${title}] 뽑기 결과`);
  out.push(`총 ${total}회${extra ? ` | ${extra}` : ''}`);
  for (const ln of lines) out.push(`- ${ln}`);
  out.push(`(생성: ${now})`);
  return out.join('\n');
}
