// js/app.js  v20260301-2

import { mountShop }                   from './hardmode_shop.js?v=20260301-2';
import { mountStarter }                from './feature_starter.js?v=20260301-2';
import { mountStarterEstimator }       from './feature_starter_estimator.js?v=20260301-2';
import { mountStarterReforge }         from './feature_starter_reforge.js?v=20260301-2';
import { mountDraw, resetDrawSession } from './feature_draw.js?v=20260301-2';
import { mountGacha }                  from './feature_gacha.js?v=20260301-2';
import { mountRecommend }              from './feature_recommend.js?v=20260301-2';
import { mountPackValueAnalysis }      from './feature_pack_value_analysis.js?v=20260301-2';
import { mountEelDamage }              from './feature_eel_damage.js?v=20260301-2';

const app = document.getElementById('app');

/* ===== 라우트 테이블 (if-else 체인 → 맵) ===== */
const ROUTES = {
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
};

export function navigate(route) {
  location.hash = ROUTES[route] ?? '';
}

function scrollTop() {
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (_) {}
}

/* ===== 홈 화면 ===== */
function renderHome() {
  const buttons = [
    { route: 'shop',      label: '개척상점계산기'    },
    { route: 'gear',      label: '시동무기'          },
    { route: 'gacha',     label: '가챠 뽑기'         },
    { route: 'recommend', label: '캐릭터 추천정보'   },
    { route: 'pack',      label: '과금효율계산기'    },
    { route: 'eel',       label: '🐟 장어 데미지 계산'},
  ];

  app.innerHTML = `
    <section class="hero container">
      <img src="./assets/img/blur_guild.png" alt="블러 연합" class="hero-img" />
      <div class="btn-wrap">
        ${buttons.map(b => `<button class="hero-btn" data-route="${b.route}">${b.label}</button>`).join('')}
      </div>
    </section>`;

  app.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}

/* ===== 시동무기 허브 ===== */
function renderGearHub() {
  app.innerHTML = `
    <section class="hero container">
      <div class="card" style="max-width:720px;width:100%;margin:0 auto">
        <h2 style="margin-top:0">시동무기</h2>
        <div class="btn-wrap" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="hero-btn" data-route="draw">시동무기 뽑기</button>
          <button class="hero-btn" data-route="starter">시동무기 강화</button>
          <button class="hero-btn" data-route="home" style="margin-left:auto">← 홈으로</button>
        </div>
      </div>
    </section>`;

  app.querySelector('[data-route="draw"]').addEventListener('click', () => {
    resetDrawSession();
    navigate('draw');
  });
  app.querySelector('[data-route="starter"]').addEventListener('click', () => navigate('starter'));
  app.querySelector('[data-route="home"]').addEventListener('click', () => navigate('home'));
}

/* ===== 해시 → 마운트 ===== */
const MOUNT_MAP = {
  '#shop':              ()=> mountShop(app),
  '#gear':              ()=> renderGearHub(),
  '#draw':              ()=> mountDraw(app),
  '#starter':           ()=> mountStarter(app),
  '#starter/estimator': ()=> mountStarterEstimator(app),
  '#starter/reforge':   ()=> mountStarterReforge(app),
  '#gacha':             ()=> mountGacha(app),
  '#recommend':         ()=> mountRecommend(app),
  '#pack':              ()=> mountPackValueAnalysis(app),
  '#eel':               ()=> mountEelDamage(app),
};

function renderFromHash() {
  app.innerHTML = '';
  const mount = MOUNT_MAP[location.hash];
  if (mount) mount();
  else renderHome();
  scrollTop();
}

window.addEventListener('hashchange', renderFromHash, { passive: true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive: true });
