// js/hardmode_data.js
export const TWO_WEEKS = 336;

export const nf  = (n)=> new Intl.NumberFormat('ko-KR').format(Number(n||0));
export const nf1 = (n)=> new Intl.NumberFormat('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(n||0));

function baseA171(){ return 982.5; }
export function hourlyFor(floor, zone){
  floor = Number(floor);
  const dz = zone==='A'?0: zone==='B'?1.5: 3.0;
  const df = (floor - 171)*4.5;
  return +(baseA171() + df + dz).toFixed(1);
}

// 🔧 검증 완화: ./ 접두 허용 + 확장자 아무거나(대소문자 구분 없음)
//   → 예: assets/img/foo.jpg, ./assets/img/foo.JPG, assets/img/bar.PnG 등 모두 허용
const IMG_WHITELIST_REGEX = /^(\.\/)?assets\/img\/[A-Za-z0-9_\-]+\.[A-Za-z0-9]+$/i;

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
    const res = await fetch('./data/hardmode_shop_items.json?v=' + Date.now(), { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : [];
    const filtered = arr.filter(validateItem);
    return { rawCount: arr.length, okCount: filtered.length, items: filtered };
  }catch(e){
    console.error('기본 JSON 로드 실패:', e);
    return { rawCount: 0, okCount: 0, items: [] };
  }
}