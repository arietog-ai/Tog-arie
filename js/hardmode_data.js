// js/hardmode_data.js

export function hourlyFor(floor = 200, zone = 'A'){
  floor = Number(floor);

  // zone → slot index
  const zoneIdx =
    zone === 'A' ? 0 :
    zone === 'B' ? 1 : 2;

  // 기준 anchor: 100-A
  const BASE_FLOOR = 100;
  const BASE_ZONE_IDX = 0; // A
  const BASE_VALUE = 710.25;

  // 현재 슬롯의 상대 슬롯 인덱스
  const slotIndex =
    (floor - BASE_FLOOR) * 3 +
    (zoneIdx - BASE_ZONE_IDX);

  let value = BASE_VALUE;

  for(let i = 0; i < slotIndex; i++){
    const currentFloor = BASE_FLOOR + Math.floor(i / 3);
    const currentZone  = i % 3; // 0=A,1=B,2=C

    let inc = 0.75;

    // 100-A → 100-B부터
    if(
      currentFloor > 100 ||
      (currentFloor === 100 && currentZone >= 0)
    ){
      inc = 1.2;
    }

    // 151-A → 151-B부터
    if(
      currentFloor > 151 ||
      (currentFloor === 151 && currentZone >= 0)
    ){
      inc = 1.5;
    }

    // 200-A → 200-B부터
    if(
      currentFloor > 200 ||
      (currentFloor === 200 && currentZone >= 0)
    ){
      inc = 1.68;
    }

    value += inc;
  }

  return Number(value.toFixed(2));
}
