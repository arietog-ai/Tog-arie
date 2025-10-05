// js/fleet_box.js  (v=20251005-6)
import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js?v=20251005-4';

const SHIP_LABEL = {
  vigilantia: '비질란티아',        // SSR+
  aquila_nova: '아퀼라 노바',      // SSR+
  albatross: '알바트로스',          // SSR
  epervier: '에페르비에',          // SSR
  libellula: '리벨룰라',            // SR
  pathfinder: '패스파인더',         // SR
  glider: '글라이더',               // R
  oculus: '오큘루스',               // R
};
const SHIP_IMG = {
  vigilantia: './assets/img/fleet/vigilantia.jpg',
  aquila_nova: './assets/img/fleet/aquila_nova.jpg',
  albatross: './assets/img/fleet/albatross.jpg',
  epervier: './assets/img/fleet/epervier.jpg',
  libellula: './assets/img/fleet/libellula.jpg',
  pathfinder: './assets/img/fleet/pathfinder.jpg',
  glider: './assets/img/fleet/glider.jpg',
  oculus: './assets/img/fleet/oculus.jpg',
};

// 1단계: 제작도 확률
const BLUEPRINT_TIER = [
  ['일반', 30.000],
  ['고급', 40.000],
  ['희귀', 20.000],
  ['전설', 10.000],
];
const TIER_ORDER = ['전설','희귀','고급','일반'];

// 2단계: 제작도별 부유선 확률
const POOL_LEGEND = [ // 전설: SSR+ 2종만 50/50
  ['vigilantia', 50.000],
  ['aquila_nova', 50.000],
];
const POOL_RARE = [
  ['vigilantia', 5.000], ['aquila_nova', 5.000],
  ['albatross', 10.000], ['epervier', 10.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 20.000],    ['oculus', 20.000],
];
const POOL_ADV = [
  ['vigilantia', 1.000], ['aquila_nova', 1.000],
  ['albatross', 9.000],  ['epervier', 9.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 25.000],    ['oculus', 25.000],
];
const POOL_COMMON = [
  ['vigilantia', 0.050], ['aquila_nova', 0.050],
  ['albatross', 5.000],  ['epervier', 5.000],
  ['libellula', 10.000], ['pathfinder', 10.000],
  ['glider', 34.950],    ['oculus', 34.950],
];

// 출력 순서 고정
const ORDER_KEYS = [
  ...POOL_LEGEND.map(([k])=>k),
  ...POOL_RARE.map(([k])=>k),
  ...POOL_ADV.map(([k])=>k),
  ...POOL_COMMON.map(([k])=>k),
];
const CDF = {
  전설 : buildCDF(POOL_LEGEND),
  희귀 : buildCDF(POOL_RARE),
  고급 : buildCDF(POOL_ADV),
  일반 : buildCDF(POOL_COMMON),
};

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도(일반/고급/희귀/전설) 획득 → 제작도별 부유선 뽑기',

  run(n){
    // 1단계: 제작도 시뮬
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const blueprintCounts = { 일반:0, 고급:0, 희귀:0, 전설:0 };
    for(let i=0;i<n;i++) blueprintCounts[ drawOnce(tierCDF) ]++;

    // 내부 누적 상태
    const remaining = { ...blueprintCounts };
    const totalShipCounts = new Map();
    const totalDraws = { 일반:0, 고급:0, 희귀:0, 전설:0 };

    function drawShipTimes(tier, times){
      const cdf = CDF[tier];
      const batch = new Map();
      for(let i=0;i<times;i++){
        const key = drawOnce(cdf);
        batch.set(key, (batch.get(key)||0)+1);
        totalShipCounts.set(key, (totalShipCounts.get(key)||0)+1);
      }
      totalDraws[tier] += times;
      return batch;
    }
    function toItemsFromMap(map){
      const items=[]; const seen=new Set();
      for(const key of ORDER_KEYS){
        const q = map.get(key)||0;
        if(q>0 && !seen.has(key)){ seen.add(key); items.push({name:SHIP_LABEL[key], qty:q, img:SHIP_IMG[key]}); }
      }
      return items;
    }

    const blueprint = {
      counts: remaining, // {일반,고급,희귀,전설}
      drawTier(tier){
        const cnt = remaining[tier]||0;
        if(cnt<=0) return { items:[], count:0 };
        remaining[tier]=0;
        const batch = drawShipTimes(tier, cnt);
        return { items: toItemsFromMap(batch), count: cnt };
      },
      drawAll(){
        const batches=[];
        TIER_ORDER.forEach(tier=>{
          const c=remaining[tier]||0;
          if(c>0){
            remaining[tier]=0;
            const b = drawShipTimes(tier, c);
            batches.push({ tier, items: toItemsFromMap(b), count: c });
          }
        });
        return batches;
      },
      getSummary(){
        const items = toItemsFromMap(totalShipCounts);
        const kinds = items.length;
        const used  = TIER_ORDER.reduce((s,t)=>s+totalDraws[t],0);
        const pills = [`총 ${n}회`,`제작도 사용 ${used}회`,`종류 ${kinds}개`];
        const copyLines = items.map(it=>`${it.name} ${it.qty}개`);
        const copy = buildCopyText('부유선 랜덤상자', n, copyLines, `제작도 사용 ${used}회 | 종류 ${kinds}개`);
        return { items, pills, copy };
      }
    };

    const pills = [`총 ${n}회`, ...TIER_ORDER.map(t=>`${t} ${blueprintCounts[t]}개`)];
    return { type:'staged', title:'부유선 랜덤상자', pills, tierOrder:TIER_ORDER, blueprint };
  }
};