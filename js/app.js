// js/app.js  — Option C: 사이드바 대시보드 레이아웃

import { mountShop }                   from './hardmode_shop.js';
import { mountStarter }                from './feature_starter.js';
import { mountStarterEstimator }       from './feature_starter_estimator.js';
import { mountStarterReforge }         from './feature_starter_reforge.js';
import { mountDraw, resetDrawSession } from './feature_draw.js';
import { mountGacha }                  from './feature_gacha.js';
import { mountRecommend }              from './feature_recommend.js';
import { mountPackValueAnalysis }      from './feature_pack_value_analysis.js';
import { mountEelDamage }              from './feature_eel_damage.js';

/* ─────────────────────────────────────────────
   0. 전체 레이아웃 삽입 (최초 1회)
   ───────────────────────────────────────────── */
const root = document.getElementById('app');

root.innerHTML = `
  <div class="layout">

    <!-- ① 사이드바 -->
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="./assets/img/dogjuk.png" alt="블러연합" class="sidebar-guild-img" />
        <span class="sidebar-title">블러연합용 Info</span>
        <span class="sidebar-ver">v2.8.1</span>
      </div>

      <ul class="sidebar-nav" id="sidebar-nav">
        <li data-route="home"      class="nav-item active"><span class="nav-icon">🏠</span><span class="nav-label">홈</span></li>
        <li data-route="shop"      class="nav-item"><span class="nav-icon">🛒</span><span class="nav-label">개척상점 계산기</span></li>
        <li data-route="gear"      class="nav-item"><span class="nav-icon">⚔️</span><span class="nav-label">시동무기</span></li>
        <li data-route="gacha"     class="nav-item"><span class="nav-icon">🎲</span><span class="nav-label">가챠 뽑기</span></li>
        <li data-route="recommend" class="nav-item"><span class="nav-icon">⭐</span><span class="nav-label">캐릭터 추천정보</span></li>
        <li data-route="pack"      class="nav-item"><span class="nav-icon">💎</span><span class="nav-label">과금효율 계산기</span></li>
        <li data-route="eel"       class="nav-item"><span class="nav-icon">🐟</span><span class="nav-label">장어 데미지 계산</span></li>
      </ul>

      <div class="sidebar-footer">
        <div class="online-badge">
          <span class="online-dot"></span>
          <span>블러 연합 온라인: 활성</span>
        </div>
        <div class="kakao-links">
          <a class="kakao-btn" href="https://open.kakao.com/o/g0u6l69h" target="_blank" rel="noopener noreferrer">
            💬 가입·접속 문의방
          </a>
          <a class="kakao-btn" href="https://open.kakao.com/o/sNNSi9mg" target="_blank" rel="noopener noreferrer">
            🛠️ 개발기능 요청방
          </a>
        </div>
      </div>
    </nav>

    <!-- ② 모바일 오버레이 -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- ③ 메인 콘텐츠 영역 -->
    <div class="main-wrap">

      <!-- 모바일 상단 툴바 -->
      <div class="mobile-topbar">
        <button class="hamburger" id="hamburger" aria-label="메뉴 열기">
          <span></span><span></span><span></span>
        </button>
        <span class="mobile-title">블러연합용 Info</span>
      </div>

      <main id="main-content" class="main-content"></main>
    </div>

  </div>
`;

/* ─────────────────────────────────────────────
   1. DOM 참조
   ───────────────────────────────────────────── */
const content   = document.getElementById('main-content');
const navItems  = document.querySelectorAll('.nav-item');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebar-overlay');
const hamburger = document.getElementById('hamburger');

/* ─────────────────────────────────────────────
   2. 사이드바 토글 (모바일)
   ───────────────────────────────────────────── */
function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
hamburger.addEventListener('click', () =>
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
);
overlay.addEventListener('click', closeSidebar);

/* ─────────────────────────────────────────────
   3. 네비 강조
   ───────────────────────────────────────────── */
function setActive(route) {
  navItems.forEach(el => el.classList.toggle('active', el.dataset.route === route));
}

/* ─────────────────────────────────────────────
   4. 홈 렌더
   ───────────────────────────────────────────── */
function renderHome() {
  content.innerHTML = `
    <div class="home-wrap">
      <!-- 히어로 배너 (blur_guild.png 배경) -->
      <div class="home-hero">
        <div class="home-hero-overlay">
          <h2 class="home-hero-title">블러연합용 통합정보 허브</h2>
          <p class="home-hero-sub">신의탑: 새로운세계 | 블러 연합 전용</p>
        </div>
      </div>

      <!-- 기능 카드 그리드 -->
      <div class="feature-grid">
        <button class="feature-card" data-route="shop">
          <span class="fc-icon">🛒</span>
          <span class="fc-title">개척상점 계산기</span>
          <span class="fc-desc">구매 목록 관리 & 효율 계산</span>
        </button>
        <button class="feature-card" data-route="gear">
          <span class="fc-icon">⚔️</span>
          <span class="fc-title">시동무기</span>
          <span class="fc-desc">뽑기 & 강화 시뮬레이터</span>
        </button>
        <button class="feature-card" data-route="gacha">
          <span class="fc-icon">🎲</span>
          <span class="fc-title">가챠 뽑기</span>
          <span class="fc-desc">천장 & 확률 계산</span>
        </button>
        <button class="feature-card" data-route="recommend">
          <span class="fc-icon">⭐</span>
          <span class="fc-title">캐릭터 추천정보</span>
          <span class="fc-desc">모험 / PvP 티어 정보</span>
        </button>
        <button class="feature-card" data-route="pack">
          <span class="fc-icon">💎</span>
          <span class="fc-title">과금효율 계산기</span>
          <span class="fc-desc">패키지 가성비 분석</span>
        </button>
        <button class="feature-card" data-route="eel">
          <span class="fc-icon">🐟</span>
          <span class="fc-title">장어 데미지 계산</span>
          <span class="fc-desc">기여도 ↔ 데미지 환산</span>
        </button>
      </div>

      <!-- 하단 카톡 링크 (모바일 전용) -->
      <div class="home-kakao-mobile">
        <a class="kakao-btn" href="https://open.kakao.com/o/g0u6l69h" target="_blank" rel="noopener noreferrer">
          💬 가입·접속 문의방
        </a>
        <a class="kakao-btn" href="https://open.kakao.com/o/sNNSi9mg" target="_blank" rel="noopener noreferrer">
          🛠️ 개발기능 요청방
        </a>
      </div>
    </div>
  `;

  content.querySelectorAll('[data-route]').forEach(btn =>
    btn.addEventListener('click', () => navigate(btn.dataset.route))
  );
}

/* ─────────────────────────────────────────────
   5. 시동무기 허브
   ───────────────────────────────────────────── */
function renderGearHub() {
  content.innerHTML = `
    <div class="container">
      <div class="card" style="max-width:720px;margin:0 auto">
        <h2 style="margin-top:0">⚔️ 시동무기</h2>
        <div class="btn-wrap" style="gap:12px;display:flex;flex-wrap:wrap">
          <button class="hero-btn" data-route="draw">🎯 시동무기 뽑기</button>
          <button class="hero-btn" data-route="starter">🔨 시동무기 강화</button>
          <button class="hero-btn" data-route="home" style="opacity:.7">← 홈으로</button>
        </div>
      </div>
    </div>
  `;
  content.querySelector('[data-route="draw"]').addEventListener('click', () => {
    resetDrawSession();
    navigate('draw');
  });
  content.querySelector('[data-route="starter"]').addEventListener('click', () => navigate('starter'));
  content.querySelector('[data-route="home"]').addEventListener('click',   () => navigate('home'));
}

/* ─────────────────────────────────────────────
   6. 라우팅 맵
   ───────────────────────────────────────────── */
const MOUNT_MAP = {
  '#shop':              () => mountShop(content),
  '#gear':              renderGearHub,
  '#draw':              () => mountDraw(content),
  '#starter':           () => mountStarter(content),
  '#starter/estimator': () => mountStarterEstimator(content),
  '#starter/reforge':   () => mountStarterReforge(content),
  '#gacha':             () => mountGacha(content),
  '#recommend':         () => mountRecommend(content),
  '#pack':              () => mountPackValueAnalysis(content),
  '#eel':               () => mountEelDamage(content),
};

const HASH_TO_ROUTE = {
  '#shop': 'shop', '#gear': 'gear', '#draw': 'gear',
  '#starter': 'gear', '#starter/estimator': 'gear', '#starter/reforge': 'gear',
  '#gacha': 'gacha', '#recommend': 'recommend', '#pack': 'pack', '#eel': 'eel',
};

export function navigate(route) {
  const hashMap = {
    shop:                '#shop',
    gear:                '#gear',
    draw:                '#draw',
    starter:             '#starter',
    'starter/estimator': '#starter/estimator',
    'starter/reforge':   '#starter/reforge',
    gacha:               '#gacha',
    recommend:           '#recommend',
    pack:                '#pack',
    eel:                 '#eel',
    home:                '',
  };
  location.hash = hashMap[route] ?? '';
  closeSidebar();
}

function renderFromHash() {
  const hash  = location.hash;
  const mount = MOUNT_MAP[hash];
  const route = HASH_TO_ROUTE[hash] ?? 'home';

  content.innerHTML = '';
  if (mount) mount();
  else renderHome();

  setActive(route);

  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (_) {}
}

/* ─────────────────────────────────────────────
   7. 사이드바 네비 클릭
   ───────────────────────────────────────────── */
document.getElementById('sidebar-nav').addEventListener('click', e => {
  const item = e.target.closest('.nav-item');
  if (!item) return;
  navigate(item.dataset.route);
});

/* ─────────────────────────────────────────────
   8. 초기화
   ───────────────────────────────────────────── */
window.addEventListener('hashchange', renderFromHash, { passive: true });
document.addEventListener('DOMContentLoaded', renderFromHash, { passive: true });
