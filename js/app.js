import { mountShop } from './hardmode_shop.js';

const app = document.getElementById('app');
const navBtns = document.querySelectorAll('.nav-btn');

function setActive(route){
  navBtns.forEach(b=> b.classList.toggle('active', b.dataset.route===route));
}

function router(route){
  setActive(route);
  if(route==='shop'){ mountShop(app); return; }
  app.innerHTML = `<div class="container"><div class="card">준비 중입니다.</div></div>`;
}

navBtns.forEach(btn=>{
  btn.addEventListener('click', ()=> router(btn.dataset.route));
});

router('shop'); // 기본 진입
