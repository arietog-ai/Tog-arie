// js/app.js
import { mountShop } from './hardmode_shop.js';
import { mountStarter } from './feature_starter.js'; // ✅ 신규 import

const app = document.getElementById('app');

function renderHome(){
  app.innerHTML = `
    <section class="hero container">
      <img src="./assets/img/blur_guild.png" alt="블러 연합" class="hero-img" />
      <div class="btn-wrap">
        <button class="hero-btn" data-route="shop">개척상점계산기</button>
        <button class="hero-btn" data-route="starter">시동무기 시뮬레이터</button> <!-- ✅ 신규 버튼 -->
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
  app.querySelector('[data-route="starter"]').addEventListener('click', ()=> navigate('starter')); // ✅ 신규
}

export function navigate(route){
  if(route === 'shop'){
    location.hash = '#shop';
  }else if(route === 'starter'){           // ✅ 신규
    location.hash = '#starter';
  }else{
    location.hash = '';
  }
}

function renderFromHash(){
  if(location.hash === '#shop'){
    app.innerHTML = '';
    mountShop(app);
  }else if(location.hash === '#starter'){  // ✅ 신규
    app.innerHTML = '';
    mountStarter(app);
  }else{
    renderHome();
  }
}

window.addEventListener('hashchange', renderFromHash);
document.addEventListener('DOMContentLoaded', renderFromHash);
