// js/fleet_box.js
// 부유선 랜덤상자 — 제작도(일반/고급/희귀/전설) 추첨 → 해당 풀에서 부유선 추첨
// 결과에는 "제작도 요약(아이콘+개수)" + "부유선 횟수 합계(아이콘+개수)"가 함께 표시됨.

import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js';

/* ===================== 레이블/이미지 ===================== */
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

// 제작도 아이콘 (네가 올린 파일명과 1:1 매칭)
const BLUEPRINT_IMG = {
  '일반': './assets/img/fleet_blueprint_common.jpg',
  '고급': './assets/img/fleet_blueprint_advanced.jpg',
  '희귀': './assets/img/fleet_blueprint_rare.jpg',
  '전설': './assets/img/fleet_blueprint_legendary.jpg',
};

/* ===================== 확률 설정 ===================== */
// 제작도 등급 확률
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

/* ===================== 본체 ===================== */
export const FleetRandomBox = {
  id: 'fleet_random_box',
  title: '부유선 랜덤상자',
  thumb: './assets/img/fleet_random_box.jpg',
  description: '제작도 → 부유선 2단계 추첨',

  run(n) {
    // CDF 준비
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const cdfA = buildCDF(FLEET_POOL_A);
    const cdfB = buildCDF(FLEET_POOL_B);
    const cdfC = buildCDF(FLEET_POOL_C);

    // 집계 맵
    const byTier = new Map([['전설',0],['희귀',0],['고급',0],['일반',0]]);
    const byShip = new Map(); // key -> count

    for (let i = 0; i < n; i++) {
      const tier = drawOnce(tierCDF);
      byTier.set(tier, byTier.get(tier) + 1);

      const pool =
        tier === '일반' ? cdfC :
        tier === '고급' ? cdfB : cdfA;

      const shipKey = drawOnce(pool);
      byShip.set(shipKey, (byShip.get(shipKey) || 0) + 1);
    }

    // ===== 출력용 리스트 =====
    const items = [];

    // 1) 제작도 요약(아이콘 포함)
    //    모달 상단에 보여줄 순서: 전설 → 희귀 → 고급 → 일반
    const TIER_ORDER = ['전설','희귀','고급','일반'];
    for (const t of TIER_ORDER) {
      const c = byTier.get(t) || 0;
      if (c > 0) {
        items.push({
          name: `${t} 제작도`,
          qty: `${c}개`,
          img: BLUEPRINT_IMG[t]
        });
      }
    }

    // 2) 부유선 합계
    //    보여줄 순서: A → B → C 풀 정의 순으로
    const orderKeys = [
      ...FLEET_POOL_A.map(([k]) => k),
      ...FLEET_POOL_B.map(([k]) => k),
      ...FLEET_POOL_C.map(([k]) => k),
    ];
    const seen = new Set();
    for (const k of orderKeys) {
      const c = byShip.get(k) || 0;
      if (c > 0 && !seen.has(k)) {
        seen.add(k);
        items.push({
          name: SHIP_LABEL[k],
          qty: `${c}개`,
          img: SHIP_IMG[k],
        });
      }
    }

    // pills (상단 뱃지)
    const pills = [
      `총 ${n}회`,
      `전설 ${byTier.get('전설')}개`,
      `희귀 ${byTier.get('희귀')}개`,
      `고급 ${byTier.get('고급')}개`,
      `일반 ${byTier.get('일반')}개`,
    ];

    // 카톡 복사용 텍스트
    const lines = [];
    lines.push('— 제작도 합계 —');
    for (const t of TIER_ORDER) lines.push(`${t} ${byTier.get(t)}개`);
    lines.push('— 부유선 합계 —');
    for (const k of orderKeys) {
      const c = byShip.get(k) || 0;
      if (c > 0) lines.push(`${SHIP_LABEL[k]} ${c}개`);
    }
    const copy = buildCopyText(this.title, n, lines);

    return { items, pills, copy };
  }
};