// 부유선 랜덤상자 (제작도 → 부유선 2단계)
// - 1단계: 제작도 N회 추첨 (전설/희귀/고급/일반)
// - 2단계: 각 제작도 버튼으로 실제 부유선 뽑기 (한 번만 동작)
// - 각 제작도 배치 결과는 모달로, 전체 합계는 인라인 리스트(페이지 스크롤)

import { buildCDF, drawOnce, buildCopyText } from './gacha_core.js';

// 라벨/이미지
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
  ['전설', 10.000],
  ['희귀', 20.000],
  ['고급', 40.000],
  ['일반', 30.000],
];

// 2단계: 제작도별 부유선 풀 (전설=SSR+ 2종만 등장)
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

  run(n, ctx){
    // 1) 제작도 N회
    const tierCDF = buildCDF(BLUEPRINT_TIER);
    const picked = { 전설:0, 희귀:0, 고급:0, 일반:0 };
    for(let i=0;i<n;i++){ picked[drawOnce(tierCDF)]++; }

    // 2) 컨테이너 생성(인라인 UI)
    const host = ensureHost();
    host.innerHTML = '';
    host.append(summaryPills(n, picked));

    // 섹션: 획득한 제작도 카운트
    host.append(blueprintPanel(picked));

    // 섹션: 이번 뽑기 결과(인라인 박스)
    const inlineBox = document.createElement('div');
    inlineBox.className = 'card';
    const title = document.createElement('div');
    title.className='big'; title.textContent='이번 뽑기 결과';
    const list = document.createElement('div');
    list.className='gacha-list is-inline'; // ← 페이지 스크롤
    inlineBox.append(title, list);
    host.append(inlineBox);

    // 제작도별 버튼 + 전체 뽑기
    const actions = document.createElement('div');
    actions.className = 'card';
    actions.append(makeTierBtn('전설', picked, list, ctx),
                   makeTierBtn('희귀', picked, list, ctx),
                   makeTierBtn('고급', picked, list, ctx),
                   makeTierBtn('일반', picked, list, ctx),
                   makeAllBtn(picked, list));
    host.append(actions);

    // 결과 보기(복사/닫기)
    const resultCard = document.createElement('div');
    resultCard.className='card';
    const resultBtn = document.createElement('button');
    resultBtn.className='gacha-btn gacha-btn-primary'; resultBtn.textContent='결과 보기';
    const copyBtn = document.createElement('button');
    copyBtn.className='gacha-btn'; copyBtn.textContent='복사';
    const backBtn = document.createElement('button');
    backBtn.className='gacha-btn'; backBtn.textContent='닫기';
    resultCard.append(resultBtn, copyBtn, backBtn);
    host.append(resultCard);

    let lastCopy = '';

    resultBtn.addEventListener('click', ()=>{
      // 인라인 list 의 내용을 요약한 복사 텍스트 생성
      const rows = Array.from(list.querySelectorAll('.gacha-row'));
      const lines = rows.map(r=>{
        const name = r.querySelector('.gacha-item span')?.textContent?.trim()||'';
        const qty  = r.lastChild?.textContent?.replace('개','').trim()||'0';
        return `${name} ${qty}개`;
      });
      lastCopy = buildCopyText(this.title, n, lines, `종류 ${rows.length}개 | 제작도 사용 ${usedBpTotal(picked)}회`);
      // 모달 표시는 ctx.showModalList 사용
      ctx.showModalList('전체 결과', [
        `총 ${n}회`, `제작도 사용 ${usedBpTotal(picked)}회`, `종류 ${rows.length}개`
      ], rows.map(rowToData), lastCopy);
    });
    copyBtn.addEventListener('click', ()=> {
      if(!lastCopy) resultBtn.click();
      navigator.clipboard.writeText(lastCopy);
      alert('복사 완료!');
    });
    backBtn.addEventListener('click', ()=> { host.innerHTML=''; });

    // helpers
    function summaryPills(total, bp){
      const wrap = document.createElement('div'); wrap.className='gacha-pills';
      const pills = [
        `총 ${total}회`,
        `전설 ${bp['전설']}개`,
        `희귀 ${bp['희귀']}개`,
        `고급 ${bp['고급']}개`,
        `일반 ${bp['일반']}개`,
      ];
      pills.forEach(t=>wrap.append(pill(t)));
      return wrap;
    }

    function blueprintPanel(bp){
      const c = document.createElement('div'); c.className='card';
      c.innerHTML = `<div class="big" style="margin-bottom:10px">획득한 제작도</div>`;
      const inner = document.createElement('div');
      inner.className = 'gacha-list is-inline';
      inner.append(kv('전설', `${bp['전설']}개`),
                   kv('희귀', `${bp['희귀']}개`),
                   kv('고급', `${bp['고급']}개`),
                   kv('일반', `${bp['일반']}개`));
      c.append(inner);
      return c;
    }

    function makeTierBtn(tier, bp, listEl, ctxRef){
      const btn = document.createElement('button');
      btn.className='gacha-btn'; btn.style.width='100%';
      btn.textContent=`「${tier}」 뽑기`;
      if(bp[tier]===0) btn.disabled = true;

      let used = false;
      btn.addEventListener('click', ()=>{
        if(used || bp[tier]<=0) return;
        used = true; btn.disabled = true;
        const rows = drawFleetTier(tier, bp[tier]);
        // inline 합산 반영
        rows.forEach(r => upsertRow(listEl, r));
        // 배치 결과를 작은 모달로도 보여주기
        const copy = buildCopyText(`부유선(${tier})`, bp[tier], rows.map(r=>`${r.name} ${r.qty}개`), `종류 ${rows.length}개`);
        ctxRef.showModalList(`(${tier}) 결과`, [`${tier} ${bp[tier]}회`, `종류 ${rows.length}개`], rows, copy);
      });
      return btn;
    }

    function makeAllBtn(bp, listEl){
      const btn = document.createElement('button');
      btn.className='gacha-btn'; btn.style.width='100%';
      btn.textContent='전체 뽑기';
      let used=false;
      btn.addEventListener('click', ()=>{
        if(used) return; used=true; btn.disabled=true;
        ['전설','희귀','고급','일반'].forEach(t=>{
          if(bp[t]>0){
            const rows = drawFleetTier(t, bp[t]);
            rows.forEach(r=> upsertRow(listEl, r));
          }
        });
      });
      return btn;
    }

    function drawFleetTier(tier, count){
      const pool = (tier==='전설')? POOL_LEGEND
                 : (tier==='희귀')? POOL_RARE
                 : (tier==='고급')? POOL_ADV
                 : POOL_NORM;
      const cdf = buildCDF(pool);
      const m = new Map();
      for(let i=0;i<count;i++){
        const key = drawOnce(cdf);
        m.set(key, (m.get(key) || 0) + 1);
      }
      // 정렬: SSR+ 상단, 그 외 라벨순
      const keys = Array.from(m.keys()).sort((a,b)=>{
        const pa = (a==='vigilantia'||a==='aquila_nova')?0:1;
        const pb = (b==='vigilantia'||b==='aquila_nova')?0:1;
        if(pa!==pb) return pa-pb;
        return SHIP_LABEL[a].localeCompare(SHIP_LABEL[b], 'ko');
      });
      return keys.map(k=>({ key:k, name: SHIP_LABEL[k], qty: m.get(k), img: SHIP_IMG[k] }));
    }

    function upsertRow(listEl, row){
      // 이미 존재하면 수량 +, 없으면 행 생성
      const ex = Array.from(listEl.querySelectorAll('.gacha-row'))
        .find(r => (r.dataset.key === row.key));
      if(ex){
        const n = parseInt(ex.dataset.qty || '0', 10) + row.qty;
        ex.dataset.qty = String(n);
        ex.lastChild.textContent = `${n.toLocaleString()}개`;
      }else{
        listEl.append(rowEl(row));
      }
    }

    function rowEl(r){
      const el=document.createElement('div'); el.className='gacha-row'; el.dataset.key=r.key; el.dataset.qty=String(r.qty);
      const left=document.createElement('div'); left.className='gacha-item';
      const img=document.createElement('img'); img.className='gacha-icon'; img.src=r.img; img.alt=r.name;
      const span=document.createElement('span'); span.textContent=r.name;
      left.append(img,span);
      const right=document.createElement('div'); right.textContent=`${Number(r.qty).toLocaleString()}개`;
      el.append(left,right);
      return el;
    }

    function kv(k, v){
      const el=document.createElement('div'); el.className='gacha-row';
      const left=document.createElement('div'); left.className='gacha-item';
      const span=document.createElement('span'); span.textContent=k;
      left.append(span);
      const right=document.createElement('div'); right.textContent=v;
      el.append(left,right);
      return el;
    }

    function pill(text){ const el=document.createElement('div'); el.className='gacha-pill'; el.textContent=text; return el; }
    function rowToData(node){
      const name = node.querySelector('.gacha-item span')?.textContent || '';
      const qty  = (node.dataset?.qty? Number(node.dataset.qty): Number((node.lastChild?.textContent||'0').replace('개',''))) || 0;
      const key  = node.dataset.key || '';
      return { name, qty, img: SHIP_IMG[key] || '' };
    }
    function usedBpTotal(bp){ return bp['전설']+bp['희귀']+bp['고급']+bp['일반']; }

    function ensureHost(){
      let el = document.getElementById('fleet-inline-host');
      if(!el){
        el = document.createElement('div');
        el.id = 'fleet-inline-host';
        const container = document.querySelector('.gacha-card');
        container.append(el);
      }
      return el;
    }
  }
};