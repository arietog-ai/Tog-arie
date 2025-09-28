import { mountShop } from './hardmode_shop.js';

const app = document.getElementById('app');

function renderHome(){
  app.innerHTML = `
    <section class="hero">
      <img src="assets/img/blur_guild.png" alt="블러 연합" class="hero-img" />
      <div class="btn-wrap">
        <button class="hero-btn" data-route="shop">개척상점계산기</button>
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

  app.querySelectorAll('[data-route="shop"]').forEach(btn=>{
    btn.addEventListener('click', ()=> navigate('shop'));
  });
}

function navigate(route){
  if(route === 'shop'){
    app.innerHTML = '';
    mountShop(app);
  }else{
    renderHome();
  }
}

// 첫 진입: 메인 히어로(버튼 클릭 시 진입)
navigate(null);