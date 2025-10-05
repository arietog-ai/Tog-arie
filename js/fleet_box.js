// js/fleet_box.js  (v=20251005-5)
// 2단계형: ① 제작도 뽑기 → ② 제작도별 부유선 뽑기(사용자가 버튼으로 실행)

import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js?v=20251005-4';

const SHIP_LABEL = {
  vigilantia: '비질란티아',
  aquila_nova: '아퀼라 노바',
  albatross: '알바트로스',
  epervier: '에페르비에',
  libellula: '리벨룰라',
  pathfinder: '패스파인더',
  glider: '글라이더',
  oculus: '오큘루스',
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

// 제작도(1단계) 확률
const BLUEPRINT_TIER = [
  ['일반', 30.000],
  ['고급', 40.000],
  ['희귀', 20.000],
  ['전설', 10.000],
];
const TIER_ORDER = ['전설','희귀','고급','일반']; // UI 표시 순서(상위→하위)

// 2단계: 제작도별 부유선 확률
// A=희귀~전설 / B=고급 / C=일반
const FLEET_POOL_A = [
  ['vigilantia', 5.000], ['aquila_nova', 5.000],
  ['albatross', 10.000], ['epervier', 10.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 20.000], ['oculus', 20.000],
];
const FLEET_POOL_B = [
  ['vigilantia', 1.000], ['aquila_nova', 1.000],
  ['albatross', 9.000],  ['epervier', 9.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 25.000],    ['oculus', 25.000],
];
const FLEET_POOL_C = [
  ['vigilantia', 0.050], ['aquila_nova', 0.050],
  ['albatross', 5.000],  ['epervier', 5.000],
  ['libellula', 10.000], ['pathfinder', 10.000],
  ['glider', 34.950],    ['oculus', 34.950],
];

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도 확률(일반/고급/희귀/전설) → 제작도별 부유선 뽑기(사용자 진행)',

  run(n) {
    // -------- 1단계: 제작도 시뮬 --------
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const blueprintCounts = { 일반:0, 고급:0, 희귀:0, 전설:0 };
    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);
      blueprintCounts[tier] += 1;
    }

    // 내부 상태(사용자가 2단계 클릭할 때 갱신)
    const remaining = { ...blueprintCounts };      // 남은 제작도 수
    const totalShipCounts = new Map();             // 최종 누적: key→개수
    const totalDraws = { 일반:0, 고급:0, 희귀:0, 전설:0 }; // 실제 2단계 뽑은 횟수

    // 공통 순서(출력 정렬)
    const ORDER_KEYS = [
      ...FLEET_POOL_A.map(([k])=>k),
      ...FLEET_POOL_B.map(([k])=>k),
      ...FLEET_POOL_C.map(([k])=>k),
    ];

    function poolForTier(tier){
      // 전설/희귀 → A, 고급 → B, 일반 → C
      if(tier==='전설' || tier==='희귀') return buildCDF(FLEET_POOL_A);
      if(tier==='고급') return buildCDF(FLEET_POOL_B);
      return buildCDF(FLEET_POOL_C);
    }

    function drawShipTimes(tier, times){
      const cdf = poolForTier(tier);
      const batchCount = new Map(); // 이번 배치 결과
      for(let i=0;i<times;i++){
        const key = drawOnce(cdf);
        batchCount.set(key, (batchCount.get(key)||0)+1);
        totalShipCounts.set(key, (totalShipCounts.get(key)||0)+1);
      }
      totalDraws[tier] += times;
      return batchCount;
    }

    function toItemsFromMap(m){
      const items = [];
      const seen = new Set();
      for(const k of ORDER_KEYS){
        const qty = m.get(k)||0;
        if(qty>0 && !seen.has(k)){ seen.add(k); items.push({ name: SHIP_LABEL[k], qty, img: SHIP_IMG[k] }); }
      }
      return items;
    }

    // 사용자 액션용 API
    const blueprint = {
      counts: remaining, // 남은 제작도 (UI에서 실시간 갱신)
      /** 특정 제작도 전부 소진하여 뽑기 */
      drawTier(tier){
        const cnt = remaining[tier]||0;
        if(cnt<=0) return { items:[], count:0 };
        remaining[tier] = 0;
        const batch = drawShipTimes(tier, cnt);
        return { items: toItemsFromMap(batch), count: cnt };
      },
      /** 남은 제작도 전체 소진 */
      drawAll(){
        const batches = [];
        TIER_ORDER.forEach(tier=>{
          const c = remaining[tier]||0;
          if(c>0){
            remaining[tier] = 0;
            const batch = drawShipTimes(tier, c);
            batches.push({ tier, items: toItemsFromMap(batch), count: c });
          }
        });
        return batches;
      },
      /** 지금까지의 총 합(2단계 진행분) */
      getSummary(){
        const items = toItemsFromMap(totalShipCounts);
        const kinds = items.length;
        const total2 = TIER_ORDER.reduce((s,t)=>s+totalDraws[t],0);
        const pills = [
          `총 ${n}회`, // 1단계 입력 횟수
          `제작도 사용 ${total2}회`,
          `종류 ${kinds}개`
        ];
        const copyLines = items.map(it => `${it.name} ${it.qty}개`);
        const copy = buildCopyText('부유선 랜덤상자', n, copyLines, `제작도 사용 ${total2}회 | 종류 ${kinds}개`);
        return { items, pills, copy };
      }
    };

    // 1단계 화면용 요약 뱃지
    const pills = [
      `총 ${n}회`,
      ...TIER_ORDER.map(t => `${t} ${blueprintCounts[t]}개`)
    ];

    // 컨트롤러 반환(2단계형)
    return {
      type: 'staged',
      title: '부유선 랜덤상자',
      pills,
      tierOrder: TIER_ORDER,
      blueprint
    };
  }
};