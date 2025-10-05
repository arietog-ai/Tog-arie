// js/app.js  (v=20251005-9)
// — 기존 기능: 개척상점, 시동무기(뽑기/강화/세공), 홈 허브
// — 신규: 가챠(#gacha) 라우트 — 동적 import로 안전 로드

import { mountShop } from './hardmode_shop.js?v=20251005-3';
import { mountStarter } from './feature_starter.js?v=20251005-6';
import { mountStarterEstimator } from './feature_starter_estimator.js?v=20251005-6';
import { mountStarterReforge } from './feature_starter_reforge.js?v=20251005-6';
import { mountDraw, resetDrawSession } from './feature_draw.js?v=20251005-3';

// ✅ 가챠는 동적 import (파일 누락/경로 오류여도 홈은 정상 작동)
let _mountGacha = null;
async function ensureGacha(){
  if(_mountGacha) return _mountGacha;

  // 현재 파일(js/app.js)을 기준으로 한 상대경로 후보들
  const candidates = [
    './feature_gacha.js?v=20251005-3',
    './feature_gacha.js',                  // 쿼리 제거
    './Feature_gacha.js',                  // 대소문자 업로드 실수 대비
    '../js/feature_gacha.js?v=20251005-3', // 상대경로 꼬임 대비
    '../js/feature_gacha.js'
  ];

  let lastErr = null, tried = [];
  for(const url of candidates){
    try{
      const mod = await import(url);
      _mountGacha = mod.mountGacha;
      return _mountGacha;
    }catch(e){
      lastErr = e; tried.push(url);
    }
  }
  const detail = new Error(
    `Tried:\n${tried.map(u=>'- '+new URL(u, import.meta.url).href).join('\n')}\n\nLast error: ${lastErr}`
  );
  detail.name = 'GachaDynamicImportError';
  throw detail;
}

const app = document.getElementById('app');

function scrollTop(){
  try{ window.scrollTo({top:0, behavior:'instant'}); }catch(_){}
}

function renderHome(){
  app.innerHTML = `
    <section class="hero container">
      <img src="./assets/img/blur_guild.png" alt="블러 연합" class="hero-img" />
      <div class="btn-wrap">
        <button class="hero-btn" data-route="shop">개척상점계산기</button>
        <button class="hero-btn" data-route="gear">시동무기</button>
        <button class="hero-btn" data-route="gacha">가챠 뽑기</button>
        <button class="hero-btn" disabled>기능생성예정1</button>
        <button class="hero-btn" disabled>기능생성예정2</button>
        <button class="hero-btn" disabled>기능생성예정3</button>
        <button class="hero-btn" disabled>기능생성예정4</button>
        <button class="hero-btn" disabled>기능생성예정5</button>
        <button class="hero-btn" disabled>기능생성예정6</button>
        <button class="hero-btn" disabled>기능생성예정7</button>
      </div>
    </section>
  `;
  app.querySelector('[data-route="shop"]').addEventListener('click', ()=> navigate('shop'));
  app.querySelector('[data-route="gear"]').addEventListener('click', ()=> navigate('gear'));
  app.querySelector('[data-route="gacha"]').addEventListener('click', ()=> navigate('gacha'));
}

function renderGearHub(){
  app.innerHTML = `
    <section class="hero container">
      <div class="card" style="max-width:720px; width:100%; margin:0 auto">
        <h2 style="margin-top:0">시동무기</h2>
        <p class="muted" style="margin:6px 0 14px">원하는 기능을 선택하세요.</p>
        <div class="btn-wrap">
          <button class="hero-btn" data-route="draw">시동무기 뽑기</button>
          <button class="hero-btn" data-route="starter">시동무기 강화</button>
          <button class="hero-btn" data-route="home" style="margin-left:auto">← 홈으로</button>
        </div>
      </div>
    </section>
  `;
  app.querySelector('[data-route="draw"]').addEventListener('click', ()=> {
    resetDrawSession();
    navigate('draw');
  });
  app.querySelector('[data-route="starter"]').addEventListener('click', ()=> navigate('starter'));
  app.querySelector('[data-route="home"]').addEventListener('click', ()=> navigate('home'));
}

export function navigate(route){
  if(route==='shop')                  location.hash = '#shop';
  else if(route==='gear')             location.hash = '#gear';
  else if(route==='draw')             location.hash = '#draw';
  else if(route==='starter')          location.hash = '#starter';
  else if(route==='starter/estimator')location.hash = '#starter/estimator';
  else if(route==='starter/reforge')  location.hash = '#starter/reforge';
  else if(route==='gacha')            location.hash = '#gacha';
  else                                location.hash = ''; // home
}

function renderFromHash(){
  switch(location.hash){
    case '#shop':              app.innerHTML=''; mountShop(app); break;
    case '#gear':              renderGearHub(); break;
    case '#draw':              app.innerHTML=''; mountDraw(app); break;
    case '#starter':           app.innerHTML=''; mountStarter(app); break;
    case '#starter/estimator': app.innerHTML=''; mountStarterEstimator(app); break;
    case '#starter/reforge':   app.innerHTML=''; mountStarterReforge(app); break;
    case '#gacha':
      app.innerHTML='';
      ensureGacha()
        .then(fn => fn(app))
        .catch(err => {
          app.innerHTML = `<section class="container"><div class="card">
            <div class="big">블러연합용 도우미 v2.6.0</div>
            <h3 style="margin:8px 0 6px">가챠 모듈 로드 실패</h3>
            <p class="muted">feature_gacha.js 또는 하위 파일 경로/이름을 확인하세요.</p>
            <pre style="white-space:pre-wrap;font-size:12px;color:#9fb0c6;max-width:100%;overflow:auto">${String(err)}</pre>
            <button class="hero-btn" onclick="location.hash=''">← 홈으로</button>
          </div></section>`;
        });
      break;
    case '':
    case '#':                  renderHome(); break;
    default:                   location.hash=''; return;
  }
  scrollTop();
}

window.addEventListener('hashchange', renderFromHash, { passive:true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive:true });