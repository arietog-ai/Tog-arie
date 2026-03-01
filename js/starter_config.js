// js/starter_config.js  v20260301-2
// 시동무기 강화 공통 상수/함수
// feature_starter.js / feature_starter_estimator.js / feature_starter_reforge.js 가 공유

import { rand, choice, unique } from './utils.js?v=20260301-2';

/* ===== 옵션 그룹 ===== */
export const GROUP_A = ["물리관통력","마법관통력","물리저항력","마법저항력","치명타확률","치명타데미지증가"];
export const GROUP_B = ["회피","명중","효과적중","효과저항"];
export const GROUP_C = ["공격력","방어력","체력"];
export const GROUP_D = ["치명타 저항률","치명타 대미지 감소율"];
export const PERCENT_SET = new Set([...GROUP_A, ...GROUP_C, ...GROUP_D]);

/* ===== 상수 ===== */
export const STEPS               = 5;   // 총 강화 횟수
export const HIGH_STONES_PER_RUN = 27;  // 20강 1회 완주 = 고급숫돌 27개
export const SCALE               = 2;   // 소수점 처리용 스케일

/* ===== 0강 초기값 ===== */
export const INIT_VALUES = {
  ...Object.fromEntries(GROUP_A.map(k => [k, [1.5, 2.5, 3.5, 4.5]])),
  ...Object.fromEntries(GROUP_B.map(k => [k, [3, 6, 9, 12]])),
  ...Object.fromEntries(GROUP_C.map(k => [k, [1, 1.5, 2, 2.5]])),
  ...Object.fromEntries(GROUP_D.map(k => [k, [1.5, 2.5, 3.5, 4.5]])),
};
export const OPTION_NAMES = Object.keys(INIT_VALUES);

/* ===== 유틸 ===== */
export const fmt   = (opt, v) => PERCENT_SET.has(opt) ? `${v}%` : `${v}`;
export const scale = x => Math.round(x * SCALE);

/** 중복 없는 랜덤 옵션 n개 선택 */
export function randomDistinctOptions(n = 4) {
  const pool = OPTION_NAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** 랜덤 0강 설정 생성 */
export function makeInitialStartCfg() {
  const names = randomDistinctOptions(4);
  const cfg = {};
  for (const n of names) cfg[n] = choice(INIT_VALUES[n]);
  return cfg;
}

/** 0강 설정 유효성 검사 (오류 시 throw) */
export function checkStartCfg(cfg) {
  const keys = Object.keys(cfg);
  if (keys.length !== 4) throw new Error('0강 옵션은 정확히 4개여야 합니다.');
  if (unique(keys).length !== 4) throw new Error('0강 옵션이 중복되었습니다.');
  keys.forEach(k => {
    if (!INIT_VALUES[k]) throw new Error(`알 수 없는 옵션: ${k}`);
    if (!INIT_VALUES[k].includes(cfg[k])) throw new Error(`0강 값 불일치: ${k}=${cfg[k]}`);
  });
}

/** sessionStorage의 draw → starter 프리셋 읽기 (있으면 지우고 반환, 없으면 null) */
export function loadPresetFromSession() {
  try {
    const raw = sessionStorage.getItem('starter_preset');
    if (!raw) return null;
    sessionStorage.removeItem('starter_preset');
    const preset = JSON.parse(raw);
    const cfg = {};
    preset.starter4.forEach(o => { cfg[o.stat] = o.value; });
    return cfg;
  } catch { return null; }
}

/* ===== 공유 DOM 헬퍼 ===== */

/** 0강 폼 행 HTML (id=s1~s4) */
export function startRowHTML(id) {
  return `
    <div class="grid cols-2" style="align-items:end;gap:8px;margin-bottom:8px">
      <div>
        <label>항목</label>
        <select class="s-name" id="s${id}-name">
          ${OPTION_NAMES.map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>0강 값</label>
        <select class="s-val" id="s${id}-val"></select>
      </div>
    </div>`;
}

/** 현재 선택된 옵션명 4개 */
export function selectedNames() {
  return [1, 2, 3, 4].map(i => document.getElementById(`s${i}-name`).value);
}

/** 중복 옵션 선택 비활성화 동기화 */
export function syncOptionDisables() {
  const chosen = selectedNames();
  document.querySelectorAll('.s-name').forEach(sel => {
    const cur = sel.value;
    Array.from(sel.options).forEach(opt => {
      opt.disabled = opt.value !== cur && chosen.includes(opt.value);
    });
  });
}

/** 0강값 셀렉트 갱신 */
export function refreshInitVal(id, defaultStart = {}, setRandom = false) {
  const nameSel = document.getElementById(`s${id}-name`);
  const valSel  = document.getElementById(`s${id}-val`);
  const name = nameSel.value;
  const arr  = INIT_VALUES[name];
  valSel.innerHTML = arr.map(v => `<option value="${v}">${fmt(name, v)}</option>`).join('');
  if (setRandom)                       valSel.value = choice(arr);
  else if (defaultStart[name] != null) valSel.value = defaultStart[name];
}

/** DOM에서 0강 설정 읽기 */
export function readStartCfg() {
  const names = selectedNames();
  const vals  = [1, 2, 3, 4].map(i => parseFloat(document.getElementById(`s${i}-val`).value));
  const cfg = Object.fromEntries(names.map((n, i) => [n, vals[i]]));
  checkStartCfg(cfg);
  return cfg;
}
