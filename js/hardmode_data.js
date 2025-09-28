export const TWO_WEEKS = 336;

// 숫자 포맷
export const nf  = (n)=> new Intl.NumberFormat('ko-KR').format(Number(n||0));
export const nf1 = (n)=> new Intl.NumberFormat('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(n||0));

/*
  시급 규칙(확정치 기반):
  - 171층 A = 982.5
  - 151층↑: 층당 A→A +4.5/h
  - A/B/C 차등: +0 / +1.5 / +3.0
*/
function baseA171(){ return 982.5; }
export function hourlyFor(floor, zone){
  floor = Number(floor);
  const dz = zone==='A'?0: zone==='B'?1.5: 3.0;
  const df = (floor - 171)*4.5;
  return +(baseA171() + df + dz).toFixed(1);
}

export async function loadShopItems(){
  // 기본 JSON만 사용 (수동 오버라이드는 이번 버전 제외)
  const url = 'data/hardmode_shop_items.json';
  try{
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('shop items JSON은 배열이어야 합니다.');
    return data;
  }catch(e){
    console.error('loadShopItems error:', e);
    return [];
  }
}