// js/gachas/fleet_box.js
import { buildCDF, drawOnce, buildCopyText } from '../gacha_core.js';

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

/* 제작도 아이콘 (업로드해둔 파일명에 맞춰 경로만 수정)
   - 없으면 onerror로 자연스럽게 흐리게 표시됨 */
const BP_IMG = {
  전설: './assets/img/fleet/bp_legendary.jpg',
  희귀: './assets/img/fleet/bp_rare.jpg',
  고급: './assets/img/fleet/bp_advanced.jpg',
  일반: './assets/img/fleet/bp_common.jpg',
};

// 제작도 확률
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

const TIER_ORDER = ['전설', '희귀', '고급', '일반'];

export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도 확률(일반/고급/희귀/전설) → 부유선 풀(A/B/C) 2단계 추첨',
  run(n) {
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const cdfA = buildCDF(FLEET_POOL_A);
    const cdfB = buildCDF(FLEET_POOL_B);
    const cdfC = buildCDF(FLEET_POOL_C);

    // 총합
    const totalShip = new Map(); // 전체 부유선 합계
    // 제작도별
    const tierCounts = { 전설: 0, 희귀: 0, 고급: 0, 일반: 0 };               // 제작도 개수
    const perTierShip = { 전설: new Map(), 희귀: new Map(), 고급: new Map(), 일반: new Map() }; // 제작도별 부유선

    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);           // 제작도 추첨
      tierCounts[tier]++;

      const pool = (tier === '일반') ? cdfC : (tier === '고급') ? cdfB : cdfA;
      const key = drawOnce(pool);               // 부유선 추첨

      // 전체
      totalShip.set(key, (totalShip.get(key) || 0) + 1);
      // 제작도별
      const m = perTierShip[tier];
      m.set(key, (m.get(key) || 0) + 1);
    }

    // ===== 렌더 데이터 =====
    const items = [];

    // 섹션: 제작도 요약
    items.push({ name: '획득한 제작도', qty: 0, img: '__section__' });
    for (const t of TIER_ORDER) {
      items.push({ name: `${t} 제작도`, qty: tierCounts[t], img: BP_IMG[t] || '' });
    }

    // 제작도별 상세 (전설→희귀→고급→일반)
    const poolsByTier = {
      전설: FLEET_POOL_A, 희귀: FLEET_POOL_A, // A풀
      고급: FLEET_POOL_B, 일반: FLEET_POOL_C
    };
    for (const t of TIER_ORDER) {
      // 해당 제작도에서 1개 이상 뽑혔을 때만 섹션 노출
      if (tierCounts[t] > 0) {
        items.push({ name: `(${t}) 결과`, qty: 0, img: '__section__' });
        const orderKeys = poolsByTier[t].map(([k]) => k);
        const m = perTierShip[t];
        for (const k of orderKeys) {
          const c = m.get(k) || 0;
          if (c > 0) items.push({ name: SHIP_LABEL[k], qty: c, img: SHIP_IMG[k] });
        }
      }
    }

    // 상단 알약(종류 N개 제거)
    const pills = [
      `총 ${n}회`,
      `전설 ${tierCounts['전설']}개`,
      `희귀 ${tierCounts['희귀']}개`,
      `고급 ${tierCounts['고급']}개`,
      `일반 ${tierCounts['일반']}개`,
    ];

    // 복사 텍스트: 제작도 요약 + 제작도별 상세
    const lines = [];
    lines.push('[제작도 요약]');
    for (const t of TIER_ORDER) lines.push(`- ${t} 제작도 ${tierCounts[t]}개`);
    for (const t of TIER_ORDER) {
      if (tierCounts[t] === 0) continue;
      lines.push('');
      lines.push(`[${t}]`);
      const poolOrder = poolsByTier[t].map(([k]) => k);
      const m = perTierShip[t];
      for (const k of poolOrder) {
        const c = m.get(k) || 0;
        if (c > 0) lines.push(`- ${SHIP_LABEL[k]} ${c}개`);
      }
    }
    const copy = buildCopyText(this.title, n, lines);

    return { items, pills, copy };
  }
};