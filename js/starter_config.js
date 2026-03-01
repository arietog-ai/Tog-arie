// js/starter_config.js
// 시동무기 강화 관련 공통 상수/유틸
// feature_starter, feature_starter_estimator, feature_starter_reforge 에서 공유

import { rand, choice, unique } from './utils.js';

/* ── 옵션 그룹 ── */
export const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"];
export const GROUP_B = ["회피","명중","효과적중","효과저항"];
export const GROUP_C = ["공격력","방어력","체력"];
export const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"];

export const PERCENT_SET = new Set([...GROUP_A, ...GROUP_C, ...GROUP_D]);

/* ── 초기값 테이블 ── */
export const INIT_VALUES = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5, 2.5, 3.5, 4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3, 6, 9, 12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1, 1.5, 2, 2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5, 2.5, 3.5, 4.5]])),
};
export const INCS = INIT_VALUES;   // alias (강화 증가치 = 초기값과 동일 풀)

export const OPTION_NAMES = Object.keys(INIT_VALUES);

/* ── 강화 상수 ── */
export const STEPS = 5;
export const MC_TOTAL = 100_000_000;
export const MC_BATCH = 200_000;
export const SCALE    = 2;
export const HIGH_STONES_PER_RUN = 27;

/* ── 포맷 헬퍼 ── */
export const fmt   = (opt, v) => PERCENT_SET.has(opt) ? `${v}%` : `${v}`;
export const scale = x => Math.round(x * SCALE);
export const roundDisplayValue = (opt, v) => {
  if (PERCENT_SET.has(opt)) {
    const r = Math.round(v * 2) / 2;
    return { num: r, txt: `${r.toFixed(1)}%` };
  }
  const r = Math.round(v);
  return { num: r, txt: String(r) };
};
export const roundP = (opt, v) => PERCENT_SET.has(opt) ? Math.round(v * 2) / 2 : Math.round(v);

/* ── 0강 생성 ── */
export function randomDistinctOptions(n = 4) {
  const pool = OPTION_NAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
export function makeInitialStartCfg() {
  const names = randomDistinctOptions(4);
  const cfg = {};
  for (const n of names) cfg[n] = choice(INIT_VALUES[n]);
  return cfg;
}
export function checkStartCfg(cfg) {
  const keys = Object.keys(cfg);
  if (keys.length !== 4)           throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if (unique(keys).length !== 4)   throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k => {
    if (!INIT_VALUES[k])           throw new Error(`알 수 없는 옵션: ${k}`);
    if (!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]}`);
  });
}
