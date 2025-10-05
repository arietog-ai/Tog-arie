// js/gachas/full_moon_box.js  (v=20251005-2)
import { simulate, sumByBaseQuantity, buildCopyText } from '../gacha_core.js?v=20251005-2';

const IMG = {
  "SSR+ 동료 선택 상자": "./assets/img/ssr_plus_box_sel.jpg",
  "특별 시동무기 세트 선택 상자": "./assets/img/special_weapon_set_box_sel.jpg",
  "암시장 티켓": "./assets/img/black_market_ticket.jpg",
  "일반 소환 티켓": "./assets/img/normal_ticket.jpg",
  "빛나는 레볼루션 조각": "./assets/img/revol_red.jpg",
  "레볼루션 조각": "./assets/img/revol_green.jpg",
  "레볼루션 원석": "./assets/img/revol_core.jpg",
  "SSR+ 영혼석": "./assets/img/ssr_plus_stone.jpg",
  "SSR 영혼석": "./assets/img/ssr_stone.jpg",
  "시동 주사위": "./assets/img/dice_red.jpg",
  "영혼 주사위": "./assets/img/dice_blue.jpg",
  "고급 신해의 숫돌": "./assets/img/whetstone.jpg",
  "마스터키": "./assets/img/key.jpg",
  "성장 재화 선택 상자(24h)": "./assets/img/potion_sel.jpg",
  "A등급 시동무기 선택상자": "./assets/img/weapon_box_sel.jpg",
};

const POOL = [
  ["SSR+ 동료 선택 상자 1개", 0.25], ["특별 시동무기 세트 선택 상자 1개", 3.00],
  ["암시장 티켓 30개", 0.25], ["암시장 티켓 20개", 0.50], ["암시장 티켓 15개", 3.00], ["암시장 티켓 10개", 5.00],
  ["일반 소환 티켓 100개", 0.25], ["일반 소환 티켓 50개", 0.50], ["일반 소환 티켓 30개", 3.00], ["일반 소환 티켓 20개", 5.00],
  ["빛나는 레볼루션 조각 10,000개", 0.25], ["빛나는 레볼루션 조각 5,000개", 0.50], ["빛나는 레볼루션 조각 3,000개", 3.00], ["빛나는 레볼루션 조각 1,000개", 5.00],
  ["레볼루션 조각 1,200개", 0.75], ["레볼루션 조각 500개", 5.00],
  ["레볼루션 원석 100개", 0.50], ["레볼루션 원석 20개", 3.00],
  ["SSR+ 영혼석 60개", 1.00], ["SSR+ 영혼석 30개", 5.00], ["SSR 영혼석 60개", 5.00],
  ["시동 주사위 10개", 0.75], ["시동 주사위 3개", 5.00],
  ["영혼 주사위 10개", 3.00], ["영혼 주사위 5개", 5.00],
  ["고급 신해의 숫돌 30개", 6.00], ["고급 신해의 숫돌 20개", 6.00], ["고급 신해의 숫돌 10개", 6.00],
  ["마스터키 250개", 6.00], ["마스터키 200개", 6.00],
  ["성장 재화 선택 상자(24h) 20개", 0.50], ["성장 재화 선택 상자(24h) 10개", 3.00],
  ["A등급 시동무기 선택상자 10개", 3.00],
];

export const FullMoonBox = {
  id: 'full_moon_box',
  title: '2025 보름달 상자',
  thumb: './assets/img/full_moon_box.jpg',
  description: '이미지 설명: 2025 보름달상자 뽑기',
  run(n) {
    const raw = simulate(POOL, n);

    const ordered = [];
    for (const [name] of POOL) {
      const c = raw.get(name) || 0;
      if (c > 0) ordered.push([name, c]);
    }

    const { merged, order } = sumByBaseQuantity(ordered);

    const rareSet = new Set(["SSR+ 동료 선택 상자","암시장 티켓","일반 소환 티켓","빛나는 레볼루션 조각","SSR+ 영혼석"]);
    let rareKinds = 0; for (const base of order) if (rareSet.has(base)) rareKinds++;

    const items = order.map(base => ({ name: base, qty: merged.get(base), img: IMG[base] || '' }));

    const pills = [`총 ${n}회`, `종류 ${order.length}개`];
    if (rareKinds > 0) pills.push(`희귀 ${rareKinds}종`);

    const copyLines = order.map(b => `${b} ${merged.get(b).toLocaleString()}개`);
    const copy = buildCopyText(this.title, n, copyLines, `종류 ${order.length}개${rareKinds>0?` | 희귀 ${rareKinds}종`:''}`);

    return { items, pills, copy };
  }
};