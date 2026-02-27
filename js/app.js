// js/app.js  (v=20260227-1)

import { mountShop }              from './hardmode_shop.js?v=20251005-3';
import { mountStarter }           from './feature_starter.js?v=20251005-6';
import { mountStarterEstimator }  from './feature_starter_estimator.js?v=20251005-6';
import { mountStarterReforge }    from './feature_starter_reforge.js?v=20251005-6';
import { mountDraw, resetDrawSession } from './feature_draw.js?v=20251005-3';
import { mountGacha }             from './feature_gacha.js?v=20251005-8';
import { mountRecommend }         from './feature_recommend.js?v=20251005-1';
import { mountPackValueAnalysis } from './feature_pack_value_analysis.js?v=20260201-1';

// 🔥 신규 기능
import { mountEelDamage }         from './feature_eel_damage.js?v=20260227-1';

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
        <button class="hero-btn" data-route="recommend">캐릭터 추천정보</button>
        <button class="hero-btn" data-route="pack">과금효율계산기</button>
        <button class="hero-btn" data-route="eel">🐟 장어 데미지 계산</button>
      </div>
    </section>
  `;

  app.querySelector('[data-route="shop"]').addEventListener('click', ()=> navigate('shop'));
  app.querySelector('[data-route="gear"]').addEventListener('click', ()=> navigate('gear'));
  app.querySelector('[data-route="gacha"]').addEventListener('click', ()=> navigate('gacha'));
  app.querySelector('[data-route="recommend"]').addEventListener('click', ()=> navigate('recommend'));
  app.querySelector('[data-route="pack"]').addEventListener('click', ()=> navigate('pack'));
  app.querySelector('[data-route="eel"]').addEventListener('click', ()=> navigate('eel'));
}

// ... renderGearHub() 는 그대로 유지 ...

export function navigate(route){
  if(route==='shop')               location.hash = '#shop';
  else if(route==='gear')          location.hash = '#gear';
  else if(route==='draw')          location.hash = '#draw';
  else if(route==='starter')       location.hash = '#starter';
  else if(route==='starter/estimator') location.hash = '#starter/estimator';
  else if(route==='starter/reforge')   location.hash = '#starter/reforge';
  else if(route==='gacha')         location.hash = '#gacha';
  else if(route==='recommend')     location.hash = '#recommend';
  else if(route==='pack')          location.hash = '#pack';
  else if(route==='eel')           location.hash = '#eel';   // 🔥 추가
  else                             location.hash = '';
}

function renderFromHash(){
  switch(location.hash){
    case '#shop':             app.innerHTML=''; mountShop(app);              break;
    case '#gear':             renderGearHub();                               break;
    case '#draw':             app.innerHTML=''; mountDraw(app);              break;
    case '#starter':          app.innerHTML=''; mountStarter(app);           break;
    case '#starter/estimator':app.innerHTML=''; mountStarterEstimator(app);  break;
    case '#starter/reforge':  app.innerHTML=''; mountStarterReforge(app);    break;
    case '#gacha':            app.innerHTML=''; mountGacha(app);             break;
    case '#recommend':        app.innerHTML=''; mountRecommend(app);         break;
    case '#pack':             app.innerHTML=''; mountPackValueAnalysis(app); break;
    case '#eel':              app.innerHTML=''; mountEelDamage(app);         break; // 🔥
    default:                  renderHome();                                  break;
  }
  scrollTop();
}

window.addEventListener('hashchange', renderFromHash, { passive:true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive:true });
