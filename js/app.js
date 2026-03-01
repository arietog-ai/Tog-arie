// js/app.js

import { mountShop }                   from './hardmode_shop.js';
import { mountStarter }                from './feature_starter.js';
import { mountStarterEstimator }       from './feature_starter_estimator.js';
import { mountStarterReforge }         from './feature_starter_reforge.js';
import { mountDraw, resetDrawSession } from './feature_draw.js';
import { mountGacha }                  from './feature_gacha.js';
import { mountRecommend }              from './feature_recommend.js';
import { mountPackValueAnalysis }      from './feature_pack_value_analysis.js';
import { mountEelDamage }              from './feature_eel_damage.js';

const app = document.getElementById('app');

/* ── 스크롤 최상단 ── */
function scrollTop() {
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (_) {}
}

/* ── 홈 ── */
function renderHome() {
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
  app.querySelectorAll('[data-route]').forEach(btn =>
    btn.addEventListener('click', () => navigate(btn.dataset.route))
  );
}

/* ── 시동무기 허브 ── */
function renderGearHub() {
  app.innerHTML = `
    <section class="hero container">
      <div class="card" style="max-width:720px;width:100%;margin:0 auto">
        <h2 style="margin-top:0">시동무기</h2>
        <div class="btn-wrap">
          <button class="hero-btn" data-route="draw">시동무기 뽑기</button>
          <button class="hero-btn" data-route="starter">시동무기 강화</button>
          <button class="hero-btn" data-route="home" style="margin-left:auto">← 홈으로</button>
        </div>
      </div>
    </section>
  `;
  app.querySelector('[data-route="draw"]').addEventListener('click', () => {
    resetDrawSession();
    navigate('draw');
  });
  app.querySelector('[data-route="starter"]').addEventListener('click', () => navigate('starter'));
  app.querySelector('[data-route="home"]').addEventListener('click', () => navigate('home'));
}

/* ── 라우팅 맵 ── */
const MOUNT_MAP = {
  '#shop':              () => mountShop(app),
  '#gear':              renderGearHub,
  '#draw':              () => mountDraw(app),
  '#starter':           () => mountStarter(app),
  '#starter/estimator': () => mountStarterEstimator(app),
  '#starter/reforge':   () => mountStarterReforge(app),
  '#gacha':             () => mountGacha(app),
  '#recommend':         () => mountRecommend(app),
  '#pack':              () => mountPackValueAnalysis(app),
  '#eel':               () => mountEelDamage(app),
};

export function navigate(route) {
  const hashMap = {
    shop:               '#shop',
    gear:               '#gear',
    draw:               '#draw',
    starter:            '#starter',
    'starter/estimator':'#starter/estimator',
    'starter/reforge':  '#starter/reforge',
    gacha:              '#gacha',
    recommend:          '#recommend',
    pack:               '#pack',
    eel:                '#eel',
    home:               '',
  };
  location.hash = hashMap[route] ?? '';
}

function renderFromHash() {
  const mount = MOUNT_MAP[location.hash];
  app.innerHTML = '';
  if (mount) mount();
  else renderHome();
  scrollTop();
}

window.addEventListener('hashchange', renderFromHash, { passive: true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive: true });
