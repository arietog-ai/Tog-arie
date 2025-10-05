/* js/feature_gacha.js
   부유선 랜덤상자 → (1단계) 제작도 뽑기 → (2단계) 제작도별 확률로 부유선 뽑기
   - 제작도 개수와 부유선 결과가 1:1로 항상 일치하도록 고정
   - 확률표는 너가 제공한 스샷 기준(전설/희귀/고급/일반)으로 반영
*/

(function () {
  // -------------------- 메타/리소스 --------------------
  const BLUEPRINT_META = {
    legendary: { name: "전설 제작도", icon: "assets/img/fleet_blueprint_legendary.jpg" },
    rare:      { name: "희귀 제작도", icon: "assets/img/fleet_blueprint_rare.jpg" },
    advanced:  { name: "고급 제작도", icon: "assets/img/fleet_blueprint_advanced.jpg" },
    common:    { name: "일반 제작도", icon: "assets/img/fleet_blueprint_common.jpg" },
  };

  // 표시명 & 아이콘(아이콘 경로는 네가 쓰던 경로 유지해도 됨)
  const FLEET_META = {
    vigilantia:  { name: "비질란티아", icon: "assets/fleet/vigilantia.jpg" },
    aquila_nova: { name: "아퀼라 노바", icon: "assets/fleet/aquila_nova.jpg" },
    albatross:   { name: "알바트로스", icon: "assets/fleet/albatross.jpg" },
    epervier:    { name: "에페르비에", icon: "assets/fleet/epervier.jpg" },
    libellula:   { name: "리벨룰라", icon: "assets/fleet/libellula.jpg" },
    pathfinder:  { name: "패스파인더", icon: "assets/fleet/pathfinder.jpg" },
    glider:      { name: "글라이더", icon: "assets/fleet/glider.jpg" },
    oculus:      { name: "오큘루스", icon: "assets/fleet/oculus.jpg" },
  };

  // -------------------- 확률표 --------------------
  // 1) 박스에서 제작도 희귀도 나올 확률(필요 시 네가 쓰는 값 유지 가능)
  const BP_RATE = { legendary: 5, rare: 20, advanced: 50, common: 25 }; // (%)

  // 2) 제작도별 부유선 확률 — 스샷 기준 최종 정정본
  const FLEET_POOL_BY_BLUEPRINT = {
    legendary: { // 전설 제작도
      vigilantia: 50.0,
      aquila_nova: 50.0,
    },
    rare: { // 희귀(레어)
      vigilantia: 5.0,
      aquila_nova: 5.0,
      albatross: 10.0,
      epervier: 10.0,
      libellula: 15.0,
      pathfinder: 15.0,
      glider: 20.0,
      oculus: 20.0,
    },
    advanced: { // 고급(어드밴스드)
      vigilantia: 1.0,
      aquila_nova: 1.0,
      albatross: 9.0,
      epervier: 9.0,
      libellula: 15.0,
      pathfinder: 15.0,
      glider: 25.0,
      oculus: 25.0,
    },
    common: { // 일반
      vigilantia: 0.05,
      aquila_nova: 0.05,
      albatross: 5.0,
      epervier: 5.0,
      libellula: 10.0,
      pathfinder: 10.0,
      glider: 34.95,
      oculus: 34.95,
    },
  };

  // -------------------- 유틸 --------------------
  function weightedPick(table) {
    // table: {key: weight, ...}  (weight 합이 100이 아니어도 됨)
    const entries = Object.entries(table);
    const total = entries.reduce((s, [, w]) => s + Number(w || 0), 0);
    let r = Math.random() * total;
    for (const [k, w] of entries) {
      r -= Number(w || 0);
      if (r < 0) return k;
    }
    return entries[entries.length - 1][0]; // 안전장치
  }

  function plus(map, key, n = 1) {
    map[key] = (map[key] || 0) + n;
  }

  // -------------------- 핵심 로직 --------------------
  // 1단계: 박스 → 제작도 희귀도 카운트
  function rollBlueprintBuckets(times) {
    const buckets = { legendary: 0, rare: 0, advanced: 0, common: 0 };
    for (let i = 0; i < times; i++) {
      const bp = weightedPick(BP_RATE);
      buckets[bp] += 1;
    }
    return buckets;
  }

  // 2단계: 제작도별로, 해당 확률표로 부유선 뽑기 (제작도 개수만큼 정확히 뽑음)
  function rollFleetsFromBlueprints(bpCounts) {
    const fleetTotal = {};                       // 전체 합계 (아이콘 리스트용)
    const fleetByBP = {                          // 제작도별 상세
      legendary: {}, rare: {}, advanced: {}, common: {},
    };

    for (const bp of ["legendary", "rare", "advanced", "common"]) {
      const count = Number(bpCounts[bp] || 0);
      if (!count) continue;

      const table = FLEET_POOL_BY_BLUEPRINT[bp];
      for (let i = 0; i < count; i++) {
        const key = weightedPick(table);         // ← 제작도 1장당 1회!
        plus(fleetTotal, key, 1);
        plus(fleetByBP[bp], key, 1);
      }
    }
    return { fleetTotal, fleetByBP };
  }

  // -------------------- 결과 구성(텍스트/아이템 리스트) --------------------
  function buildCopyText(total, bpCounts, fleetTotal) {
    const lines = [];
    lines.push("부유선 랜덤상자 결과");
    lines.push("“복사”를 눌러 카톡에 붙여넣기 하세요.\n");

    const bpLine = (k, label) => `${label} ${Number(bpCounts[k] || 0)}개`;
    lines.push(`총 ${total}회`);
    lines.push(bpLine("legendary", "전설"));
    lines.push(bpLine("rare", "희귀"));
    lines.push(bpLine("advanced", "고급"));
    lines.push(bpLine("common", "일반"));
    lines.push("");

    // 부유선 합계(이름 가나다 유지)
    const order = [
      "vigilantia","aquila_nova","albatross","epervier",
      "libellula","pathfinder","glider","oculus"
    ];
    order.forEach(k => {
      const cnt = fleetTotal[k] || 0;
      if (cnt > 0) lines.push(`${FLEET_META[k].name} ${cnt}개`);
    });

    return lines.join("\n");
  }

  // -------------------- 외부에서 호출하는 메인 함수 --------------------
  // (A) times만 주면 1→2단계 모두 수행
  // (B) 이미 만들어둔 제작도 카운트를 넘기면 2단계만 수행
  function runFleetRandomBox({ times = 0, blueprintCounts = null } = {}) {
    const total = Number(times || 0);
    const bpCounts = blueprintCounts || rollBlueprintBuckets(total);
    const { fleetTotal, fleetByBP } = rollFleetsFromBlueprints(bpCounts);

    // 검증: 제작도 합계 == 부유선 총합
    const bpSum = Object.values(bpCounts).reduce((s, n) => s + Number(n || 0), 0);
    const fleetSum = Object.values(fleetTotal).reduce((s, n) => s + Number(n || 0), 0);

    return {
      total: total || bpSum,
      blueprintCounts: bpCounts,
      fleetTotal,
      fleetByBP,
      copyText: buildCopyText(total || bpSum, bpCounts, fleetTotal),
      sanityCheck: { blueprintSum: bpSum, fleetSum }, // 둘이 항상 같아야 함
    };
  }

  // -------------------- UI 바인딩 예시 --------------------
  // 기존 앱에서 사용 중인 전역 훅에 연결(필요한 곳에서 FeatureGacha.runFleetRandomBox 호출)
  window.FeatureGacha = {
    runFleetRandomBox,
    META: { BLUEPRINT_META, FLEET_META },
  };
})();