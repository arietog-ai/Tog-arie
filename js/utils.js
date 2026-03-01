// js/utils.js  v20260301-2
// 공통 유틸리티 — 여러 파일에서 공유

/** DOM 요소 빠른 접근 */
export const byId = id => document.getElementById(id);

/** 0 이상 n 미만 정수 난수 */
export const rand = n => (Math.random() * n) | 0;

/** 배열에서 랜덤 선택 */
export const choice = arr => arr[rand(arr.length)];

/** 배열 중복 제거 */
export const unique = arr => Array.from(new Set(arr));

/** 정수 포맷 (한국어 천단위) */
export const nf = n => new Intl.NumberFormat('ko-KR').format(Math.floor(n));

/** 소수점 최대 4자리 포맷 */
export const nf4 = n => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
}).format(n);

/** 홈으로 이동 */
export const goHome = () => { location.hash = ''; };

/** 클립보드 복사 */
export async function copyToClipboard(text, msg = '복사되었습니다!') {
  try {
    await navigator.clipboard.writeText(text);
    alert(msg);
  } catch {
    alert('클립보드 복사 실패: 브라우저 권한을 확인하세요.');
  }
}
