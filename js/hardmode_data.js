// js/hardmode_data.js

export function hourlyFor(floor, zone){
  floor = Number(floor);

  // zone → slot index
  const zoneIdx =
    zone === 'A' ? 0 :
    zone === 'B' ? 1 : 2;

  // 기준 anchor: 100-A
  const BASE_FLOOR = 100;
  const BASE_ZONE_IDX = 0; // A
  const BASE_VALUE = 710.25;

  // 현재 슬롯의 "절대 슬롯 인덱스"
  // (100-A를 0번 슬롯으로 둔다)
  const slotIndex =
    (floor - BASE_FLOOR) * 3 +
    (zoneIdx - BASE_ZONE_IDX);

  let value = BASE_VALUE;

  // 슬롯 하나씩 누적
  for(let i = 0; i < slotIndex; i++){
    const currentSlotFloor = BASE_FLOOR + Math.floor(i / 3);
    const currentSlotZone  = i % 3;

    // 슬롯 기준 증가량 결정
    let inc = 0.75;

    // 100-A → 100-B부터
    if(
      currentSlotFloor > 100 ||
      (currentSlotFloor === 100 && currentSlotZone >= 0)
    ){
      inc = 1.2;
    }

    // 151-A → 151-B부터
    if(
      currentSlotFloor > 151 ||
      (currentSlotFloor === 151 && currentSlotZone >= 0)
    ){
      inc = 1.5;
    }

    // 200-A → 200-B부터
    if(
      currentSlotFloor > 200 ||
      (currentSlotFloor === 200 && currentSlotZone >= 0)
    ){
      inc = 1.68;
    }

    value += inc;
  }

  return Number(value.toFixed(2));
}
