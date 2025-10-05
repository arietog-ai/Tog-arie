// /js/fleet_box.js
// 부유선 랜덤상자 (제작도 → 부유선 2단계), 총합만 모달로 출력

import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js';

// 한글 라벨 / 이미지 경로
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

// 1단계: 제작도 확률
const BLUEPRINT_TIER = [
  ['전설', 10.000],
  ['희귀', 20.000],
  ['고급', 40.000],
  ['일반', 30.000],
];

// 2단계: 제작도별 부유선 확률
// 전설: SSR+ 2종만 (50:50)
const POOL_LEGEND = [
  ['vigilantia', 50.000], ['aquila_nova', 50.000],
];
const POOL_RARE = [
  ['albatross', 10.000], ['epervier', 10.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 20.000], ['oculus', 20.000],
  ['vigilantia', 5.000], ['aquila_nova', 5.000],
];
const POOL_ADV = [
  ['albatross', 9.000], ['epervier', 9.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 25.000], ['oculus', 25.000],
  ['vigilantia', 1.000], ['aquila_nova', 1.000],
];
const POOL_NORM = [
  ['vigilantia', 0.050], ['aquila_nova', 0.050],
  ['albatross', 5.000], ['epervier', 5.000],
  ['libellula', 10.000], ['pathfinder', 10.000],
  ['glider', 34.950], ['oculus', 34.950],
];

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도 → 부유선 2단계 추첨',

  run(n){
    // 1) 제작도 N회
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const bp = { 전설:0, 희귀:0, 고급:0, 일반:0 };

    // 2) 제작도별 확률표
    const cdfLegend = buildCDF(POOL_LEGEND);
    const cdfRare   = buildCDF(POOL_RARE);
    const cdfAdv    = buildCDF(POOL_ADV);
    const cdfNorm   = buildCDF(POOL_NORM);

    // 3) 실제 부유선 누적
    const counts = new Map(); // shipKey -> qty

    for(let i=0;i<n;i++){
      const tier = drawOnce(tierCDF);
      bp[tier]++;
      const pool = tier==='전설' ? cdfLegend
                 : tier==='희귀' ? cdfRare
                 : tier==='고급' ? cdfAdv
                 : cdfNorm;
      const key = drawOnce(pool);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    // 4) 출력 정렬: SSR+ 두 종 → 나머지 라벨순
    const keys = Array.from(counts.keys()).sort((a,b)=>{
      const ra = (a==='vigilantia'||a==='aquila_nova')?0:1;
      const rb = (b==='vigilantia'||b==='aquila_nova')?0:1;
      if(ra!==rb) return ra-rb;
      return SHIP_LABEL[a].localeCompare(SHIP_LABEL[b], 'ko');
    });

    const items = keys.map(k => ({ name: SHIP_LABEL[k], qty: counts.get(k), img: SHIP_IMG[k] }));

    // 5) 요약 pill + 복사문
    const pills = [
      `총 ${n}회`,
      `전설 ${bp['전설']}개`,
      `희귀 ${bp['희귀']}개`,
      `고급 ${bp['고급']}개`,
      `일반 ${bp['일반']}개`,
      `종류 ${items.length}개`,
    ];
    const copyLines = items.map(it => `${it.name} ${it.qty}개`);
    const copy = buildCopyText(this.title, n, copyLines, `전설 ${bp['전설']} · 희귀 ${bp['희귀']} · 고급 ${bp['고급']} · 일반 ${bp['일반']} | 종류 ${items.length}개`);

    return { items, pills, copy };
  }
};