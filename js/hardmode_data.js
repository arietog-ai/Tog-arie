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

// 스키마 검증
const IMG_WHITELIST_REGEX = /^assets\/img\/[a-z0-9_\-]+(\.jpe?g|\.png)$/i;
function validateItem(i){
  if(typeof i !== 'object' || i === null) return false;
  if(typeof i.cat !== 'string') return false;
  if(typeof i.name !== 'string') return false;
  if(!Number.isFinite(i.price)) return false;
  if(!Number.isInteger(i.times)) return false;
  if(typeof i.img !== 'string') return false;
  if(!IMG_WHITELIST_REGEX.test(i.img)) return false;
  return true;
}

// 기본 JSON만 사용
export async function loadShopItems(){
  try{
    const res = await fetch('data/hardmode_shop_items.json?v=' + Date.now(), { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.filter(validateItem) : [];
  }catch(e){
    console.error('기본 JSON 로드 실패:', e);
    return [];
  }
}