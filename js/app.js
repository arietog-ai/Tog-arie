// js/app.js
import { mountShop } from './feature.shop.js';

const app = document.getElementById('app');
const navBtns = document.querySelectorAll('.nav-btn');

function setActive(route){
  navBtns.forEach(b=> b.classList.toggle('active', b.dataset.route===route));
}

function router(route){
  setActive(route);
  if(route==='shop'){ mountShop(app); return; }
  // 앞으로 route 추가 시 분기
  app.innerHTML = `<div class="container"><div class="card">준비 중입니다.</div></div>`;
}

navBtns.forEach(btn=>{
  btn.addEventListener('click', ()=> router(btn.dataset.route));
});

router('shop'); // default
