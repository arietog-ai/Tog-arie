// js/gachas/fleet_box.js  (v=20251005-2)
import { buildCDF, drawOnce, buildCopyText } from '../gacha_core.js?v=20251005-2';

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

const BLUEPRINT_TIER = [
  ['일반', 30.000],
  ['고급', 40.000],
  ['희귀', 20.000],
  ['전설', 10.000],
];

// A=희귀~전설 / B=고급 / C=일반
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

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg', // 없으면 onerror로 흐릿 처리됨
  description: '제작도 확률(일반/고급/희귀/전설) → 부유선 풀(A/B/C) 2단계 추첨',
  run(n) {
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const cdfA = buildCDF(FLEET_POOL_A);
    const cdfB = buildCDF(FLEET_POOL_B);
    const cdfC = buildCDF(FLEET_POOL_C);

    const counts = new Map(); // shipKey -> count
    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);
      const pool = (tier === '일반') ? cdfC : (tier === '고급') ? cdfB : cdfA;
      const key = drawOnce(pool);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const orderKeys = [
      ...FLEET_POOL_A.map(([k]) => k),
      ...FLEET_POOL_B.map(([k]) => k),
      ...FLEET_POOL_C.map(([k]) => k),
    ];
    const items = [];
    const seen = new Set();
    for (const k of orderKeys) {
      const c = counts.get(k) || 0;
      if (c > 0 && !seen.has(k)) {
        seen.add(k);
        items.push({ name: SHIP_LABEL[k], qty: c, img: SHIP_IMG[k] });
      }
    }

    const pills = [`총 ${n}회`, `종류 ${items.length}개`];
    const copyLines = items.map(it => `${it.name} ${it.qty}개`);
    const copy = buildCopyText(this.title, n, copyLines, `종류 ${items.length}개`);

    return { items, pills, copy };
  }
};