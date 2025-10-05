// js/fleet_box.js  (v=20251005-8)
import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js';

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

// 제작도 확률
const BLUEPRINT_TIER = [
  ['일반', 30.000],
  ['고급', 40.000],
  ['희귀', 20.000],
  ['전설', 10.000],
];

// A=희귀~전설 / B=고급 / C=일반 (게임 스샷 기반 확률)
const FLEET_POOL_A = [
  ['vigilantia', 5.000], ['aquila_nova', 5.000],
  ['albatross', 10.000], ['epervier', 10.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 20.000], ['oculus', 20.000],
];
const FLEET_POOL_B = [
  ['vigilantia', 1.000], ['aquila_nova', 1.000],
  ['albatross', 9.000], ['epervier', 9.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 25.000], ['oculus', 25.000],
];
const FLEET_POOL_C = [
  ['vigilantia', 0.050], ['aquila_nova', 0.050],
  ['albatross', 5.000], ['epervier', 5.000],
  ['libellula', 10.000], ['pathfinder', 10.000],
  ['glider', 34.950], ['oculus', 34.950],
];

// (선택) 제작도 이미지 — 파일명이 다르면 그냥 흐리게 표시됨
const BLUEPRINT_IMG = {
  '전설': './assets/img/fleet/bp_legend.jpg',
  '희귀': './assets/img/fleet/bp_rare.jpg',
  '고급': './assets/img/fleet/bp_advanced.jpg',
  '일반': './assets/img/fleet/bp_common.jpg',
};

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도 → 부유선 2단계 추첨',
  run(n) {
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const cdfA = buildCDF(FLEET_POOL_A);
    const cdfB = buildCDF(FLEET_POOL_B);
    const cdfC = buildCDF(FLEET_POOL_C);

    const shipCounts = new Map(); // shipKey -> count
    const bpCounts = { '전설':0, '희귀':0, '고급':0, '일반':0 };

    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);      // 제작도
      bpCounts[tier] = (bpCounts[tier]||0) + 1;

      const pool = (tier === '일반') ? cdfC : (tier === '고급') ? cdfB : cdfA;
      const key = drawOnce(pool);          // 부유선
      shipCounts.set(key, (shipCounts.get(key) || 0) + 1);
    }

    // 부유선 출력(고정 순서)
    const orderKeys = [
      ...FLEET_POOL_A.map(([k]) => k),
      ...FLEET_POOL_B.map(([k]) => k),
      ...FLEET_POOL_C.map(([k]) => k),
    ];
    const seen = new Set();
    const items = [];
    for (const k of orderKeys) {
      const c = shipCounts.get(k) || 0;
      if (c>0 && !seen.has(k)) {
        seen.add(k);
        items.push({ name: SHIP_LABEL[k], qty: c, img: SHIP_IMG[k] });
      }
    }

    // pills: 총회수 + 제작도별 수량 (요청: "종류 N개"는 제거)
    const pills = [
      `총 ${n}회`,
      `전설 ${bpCounts['전설']}개`,
      `희귀 ${bpCounts['희귀']}개`,
      `고급 ${bpCounts['고급']}개`,
      `일반 ${bpCounts['일반']}개`,
    ];

    // 복사 텍스트
    const lines = items.map(it => `${it.name} ${it.qty}개`);
    const extra = `전설 ${bpCounts['전설']}개 | 희귀 ${bpCounts['희귀']}개 | 고급 ${bpCounts['고급']}개 | 일반 ${bpCounts['일반']}개`;
    const copy = buildCopyText(this.title, n, lines, extra);

    // 제작도 섹션용 메타
    const blueprints = {
      '전설': { count: bpCounts['전설'], img: BLUEPRINT_IMG['전설'] },
      '희귀': { count: bpCounts['희귀'], img: BLUEPRINT_IMG['희귀'] },
      '고급': { count: bpCounts['고급'], img: BLUEPRINT_IMG['고급'] },
      '일반': { count: bpCounts['일반'], img: BLUEPRINT_IMG['일반'] },
    };

    return { items, pills, copy, blueprints };
  }
};