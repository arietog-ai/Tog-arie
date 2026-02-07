// js/hardmode_data.js

export const TWO_WEEKS = 336;

export const nf  = (n)=> new Intl.NumberFormat('ko-KR').format(Number(n||0));
export const nf1 = (n)=> new Intl.NumberFormat('ko-KR',{
  minimumFractionDigits:2,
  maximumFractionDigits:2
}).format(Number(n||0));

/*
  hourlyFor 산술 규칙 (확정본)

  기준 anchor
  - 100-A = 710.25

  슬롯 증가 규칙 (슬롯 = A→B→C)
  - ~100-A                : +0.75
  - 100-A → 100-B부터     : +1.2
  - 151-A → 151-B부터     : +1.5
  - 200-A → 200-B부터     : +1.68

  보정 없음
  전환은 항상 슬롯 경계에서만 발생
*/

export function hourlyFor(floor = 201, zone = 'A') {
  const f = Number(floor);
  if (!Number.isFinite(f)) return 0;

  const z =
    zone === 'A' ? 0 :
    zone === 'B' ? 1 :
    zone === 'C' ? 2 : 0;

  // 기준: 100-A
  const BASE_FLOOR = 100;
  const BASE_SLOT = 0;
  const BASE_VALUE = 710.25;

  // 목표 슬롯 (100-A 기준)
  const targetSlot = (f - BASE_FLOOR) * 3 + z;

  let value = BASE_VALUE;

  // 같은 위치
  if (targetSlot === BASE_SLOT) {
    return value;
  }

  // 증가량 결정 함수 (슬롯 기준)
  const slotInc = (slot) => {
    // slot은 "다음으로 넘어가는 슬롯 번호"
    if (slot >= (200 - 100) * 3 + 1) return 1.68; // 200-B
    if (slot >= (151 - 100) * 3 + 1) return 1.5;  // 151-B
    if (slot >= (101 - 100) * 3 + 1) return 1.2;  // 101-B
    return 0.75;
  };

  // 위로 이동
  if (targetSlot > BASE_SLOT) {
    for (let s = BASE_SLOT; s < targetSlot; s++) {
      value += slotInc(s + 1);
    }
  }
  // 아래로 이동 (100층 미만)
  else {
    for (let s = BASE_SLOT; s > targetSlot; s--) {
      value -= slotInc(s);
    }
  }

  return Number(value.toFixed(2));
}


// 🔧 이미지 경로 검증 (기존 그대로)
const IMG_WHITELIST_REGEX =
  /^(\.\/)?assets\/img\/[A-Za-z0-9_\-]+\.[A-Za-z0-9]+$/i;

function validateItem(i){
  if(typeof i !== 'object' || i === null) return false;
  if(typeof i.cat !== 'string' || !i.cat.trim()) return false;
  if(typeof i.name !== 'string' || !i.name.trim()) return false;
  if(!Number.isFinite(i.price) || i.price < 0) return false;
  if(!Number.isInteger(i.times) || i.times < 0) return false;
  if(typeof i.img !== 'string' || !IMG_WHITELIST_REGEX.test(i.img)) return false;
  return true;
}

// 기본 JSON만 로드. 진단 목적의 원시/검증 개수도 함께 반환
export async function loadShopItems(){
  try{
    const res = await fetch(
      './data/hardmode_shop_items.json?v=' + Date.now(),
      { cache:'no-store' }
    );
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : [];
    const filtered = arr.filter(validateItem);
    return {
      rawCount: arr.length,
      okCount: filtered.length,
      items: filtered
    };
  }catch(e){
    console.error('기본 JSON 로드 실패:', e);
    return { rawCount: 0, okCount: 0, items: [] };
  }
}
