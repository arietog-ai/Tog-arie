// js/fleet_box.js  (v20251005-9)
// 부유선 랜덤상자 — 제작도(일반/고급/희귀/전설) 추첨 → 해당 등급 풀에서 부유선 추첨
// 전설 제작도는 SSR+ 2척만 50/50로 뽑히도록 수정

import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js';

/* ===== 한글 라벨 & 아이콘 ===== */
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
// 제작도 아이콘
const BLUEPRINT_IMG = {
  '일반': './assets/img/fleet_blueprint_common.jpg',
  '고급': './assets/img/fleet_blueprint_advanced.jpg',
  '희귀': './assets/img/fleet_blueprint_rare.jpg',
  '전설': './assets/img/fleet_blueprint_legendary.jpg',
};

/* ===== 확률 ===== */
// 제작도 등급 확률(원래 쓰던 분포 유지 가능)
const BLUEPRINT_TIER = [
  ['일반', 30.000],
  ['고급', 40.000],
  ['희귀', 20.000],
  ['전설', 10.000],
];

// ★ 전설(legendary) — SSR+ 2척만 50/50
const LEGEND_POOL = [
  ['vigilantia', 50.000],
  ['aquila_nova', 50.000],
];

// 희귀(rare)
const RARE_POOL = [
  ['vigilantia', 5.000], ['aquila_nova', 5.000],
  ['albatross', 10.000], ['epervier', 10.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 20.000], ['oculus', 20.000],
];

// 고급(advanced)
const ADV_POOL = [
  ['vigilantia', 1.000], ['aquila_nova', 1.000],
  ['albatross', 9.000], ['epervier', 9.000],
  ['libellula', 15.000], ['pathfinder', 15.000],
  ['glider', 25.000], ['oculus', 25.000],
];

// 일반(common)
const COM_POOL = [
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

  run(n) {
    // 등급 CDF
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    // 등급별 풀 CDF
    const poolCDF = {
      '전설':   buildCDF(LEGEND_POOL),
      '희귀':   buildCDF(RARE_POOL),
      '고급':   buildCDF(ADV_POOL),
      '일반':   buildCDF(COM_POOL),
    };

    const byTier = new Map([['전설',0],['희귀',0],['고급',0],['일반',0]]);
    const byShip = new Map();

    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);
      byTier.set(tier, byTier.get(tier) + 1);

      const shipKey = drawOnce(poolCDF[tier]);   // ← 전설은 50/50 풀에서만 추첨!
      byShip.set(shipKey, (byShip.get(shipKey) || 0) + 1);
    }

    // ===== 표시용 아이템 구성 (섹션 분리) =====
    const items = [];

    // 섹션 1: 제작도 요약
    items.push({ type:'section', text:'획득한 제작도' });
    const TIER_ORDER = ['전설','희귀','고급','일반'];
    for (const t of TIER_ORDER) {
      const c = byTier.get(t) || 0;
      if (c > 0) items.push({ name:`${t} 제작도`, qty:c, img:BLUEPRINT_IMG[t] });
    }

    // 섹션 2: 부유선 합계
    items.push({ type:'section', text:'부유선 합계' });
    // 표기 순서: 전설 풀 → 희귀 → 고급 → 일반
    const orderKeys = [
      ...LEGEND_POOL.map(([k]) => k),
      ...RARE_POOL.map(([k]) => k),
      ...ADV_POOL.map(([k]) => k),
      ...COM_POOL.map(([k]) => k),
    ];
    const seen = new Set();
    for (const k of orderKeys) {
      const c = byShip.get(k) || 0;
      if (c > 0 && !seen.has(k)) {
        seen.add(k);
        items.push({ name: SHIP_LABEL[k], qty:c, img: SHIP_IMG[k] });
      }
    }

    // 상단 뱃지
    const pills = [
      `총 ${n}회`,
      `전설 ${byTier.get('전설')}개`,
      `희귀 ${byTier.get('희귀')}개`,
      `고급 ${byTier.get('고급')}개`,
      `일반 ${byTier.get('일반')}개`,
    ];

    // 복사용 텍스트
    const lines = [];
    lines.push('— 제작도 —');
    for (const t of TIER_ORDER) lines.push(`${t} ${byTier.get(t)}개`);
    lines.push('— 부유선 —');
    for (const k of orderKeys) {
      const c = byShip.get(k) || 0;
      if (c > 0) lines.push(`${SHIP_LABEL[k]} ${c}개`);
    }
    const copy = buildCopyText(this.title, n, lines);

    return { items, pills, copy };
  }
};