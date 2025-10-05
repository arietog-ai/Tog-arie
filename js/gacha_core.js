// js/gacha_core.js  (v=20251005-8)

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
  return m;
}

/** "암시장 티켓 10개" → 베이스 단위 합산 */
export function sumByBaseQuantity(orderedPairs) {
  const merged = new Map();
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

export function buildCopyText(title, total, lines, extra = '') {
  const now = new Date().toLocaleString('ko-KR', { hour12: false });
  const out = [];
  out.push(`[${title}] 뽑기 결과`);
  out.push(`총 ${total}회${extra ? ` | ${extra}` : ''}`);
  for (const ln of lines) out.push(`- ${ln}`);
  out.push(`(생성: ${now})`);
  return out.join('\n');
}