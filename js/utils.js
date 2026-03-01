// js/utils.js
// 공통 유틸리티 — 모든 feature 모듈에서 import해 사용

/* ── DOM ── */
export const byId = id => document.getElementById(id);

/* ── 랜덤 ── */
export const rand   = n   => (Math.random() * n) | 0;
export const choice = arr => arr[rand(arr.length)];

/* ── 배열 ── */
export const unique = arr => Array.from(new Set(arr));

/* ── 숫자 포맷 ── */
export const nf  = n => new Intl.NumberFormat('ko-KR').format(Math.floor(Number(n) || 0));
export const nf1 = n => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(n) || 0);
export const nf4 = n => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
}).format(n);

/* ── 클립보드 ── */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('복사되었습니다!');
  } catch {
    alert('복사 실패: 브라우저 권한을 확인하세요.');
  }
}
