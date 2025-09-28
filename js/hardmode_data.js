export const TWO_WEEKS = 336;

export function hourlyFor(floor, zone){
  floor = Number(floor); const z = zone.toUpperCase();
  const a = (floor <= 150)
    ? 856.50 + (floor - 141) * 3.6
    : (floor === 151 ? 892.50 : 892.50 + (floor - 151) * 4.5);
  const offset = (floor >= 151 ? {A:0,B:1.5,C:3.0} : {A:0,B:1.2,C:2.4});
  return +(a + offset[z]).toFixed(1);
}

export const nf  = (n)=> new Intl.NumberFormat('ko-KR').format(n);
export const nf1 = (n)=> new Intl.NumberFormat('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);

export async function loadShopItems(){
  const res = await fetch('./data/hardmode_shop_items.json',{cache:'no-store'});
  return await res.json();
}
