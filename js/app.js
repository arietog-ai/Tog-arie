// js/app.js
import { mountShop } from './hardmode_shop.js';
import { mountStarter } from './feature_starter.js';
import { mountDraw } from './feature_draw.js';

const app = document.getElementById('app');

function scrollTop(){ try{ window.scrollTo({top:0, behavior:'instant'}); }catch(_){} }

function renderHome(){
  const usedKeys = sessionStorage.getItem('used_keys') || 0;
  app.innerHTML = `
    <section class="hero container">
      <img src="./assets/img/blur_guild.png" alt="블러 연합" class="hero-img" />
      <div class="btn-wrap">
        <button class="hero-btn" data-route="shop">개척상점계산기</button>
        <button class="hero-btn" data-route="gear">시동무기 (🔑 <span id="key-count">${usedKeys}</span>)</button>
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
  app.querySelector('[data-route="draw"]').addEventListener('click', ()=> navigate('draw'));
  app.querySelector('[data-route="starter"]').addEventListener('click', ()=> navigate('starter'));
  app.querySelector('[data-route="home"]').addEventListener('click', ()=> navigate('home'));
}

export function navigate(route){
  if(route==='shop')        location.hash = '#shop';
  else if(route==='gear')   location.hash = '#gear';
  else if(route==='draw')   location.hash = '#draw';
  else if(route==='starter')location.hash = '#starter';
  else                      location.hash = ''; // home
}

function renderFromHash(){
  switch(location.hash){
    case '#shop':
      app.innerHTML = '';
      mountShop(app);
      break;
    case '#gear':
      renderGearHub();
      break;
    case '#draw':
      app.innerHTML = '';
      mountDraw(app);
      break;
    case '#starter':
      app.innerHTML = '';
      mountStarter(app);
      break;
    case '':
    case '#':
      renderHome();
      break;
    default:
      location.hash = '';
      return;
  }
  scrollTop();
}

window.addEventListener('hashchange', renderFromHash, { passive:true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive:true });