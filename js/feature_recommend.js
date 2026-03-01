// js/feature_recommend.js

import { byId } from './utils.js';

let characters = {};
let tiers      = {};
let currentMode      = 'adventure';
let currentAttribute = 'all';

export async function mountRecommend(container) {
  // 매 마운트 시 상태 초기화 (isMounted 변수 제거)
  currentMode      = 'adventure';
  currentAttribute = 'all';

  try {
    const [charRes, tierRes] = await Promise.all([
      fetch('./data/characters.json'),
      fetch('./data/tiers.json'),
    ]);
    if (!charRes.ok || !tierRes.ok) throw new Error('JSON load failed');
    characters = await charRes.json();
    tiers      = await tierRes.json();
  } catch (err) {
    container.innerHTML = `
      <div class="container">
        <div class="card">
          <h2>데이터 로딩 실패</h2>
          <p>characters.json / tiers.json 경로 확인</p>
        </div>
      </div>`;
    console.error(err);
    return;
  }

  container.innerHTML = `
    <div class="container">
      <div class="recommend-header">
        <button id="home-btn" class="hero-btn">← 홈으로</button>
      </div>
      <div class="mode-toggle"     id="mode-toggle"></div>
      <div class="attribute-filter" id="attribute-filter"></div>
      <div id="tier-container"></div>
    </div>

    <div id="recommend-modal" class="modal modal-hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>추천 시동무기</h3>
          <button id="modal-close" class="hero-btn">닫기</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>
  `;

  byId('home-btn').addEventListener('click', () => { location.hash = ''; });
  byId('modal-close').addEventListener('click', closeModal);
  byId('recommend-modal').addEventListener('click', e => {
    if (e.target.id === 'recommend-modal') closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  renderModeToggle();
  renderAttributeFilter();
  renderTierTable();
}

/* ── 모드 ── */
function renderModeToggle() {
  const el = byId('mode-toggle');
  el.innerHTML = ['adventure', 'pvp'].map(m => `
    <button class="mode-btn ${currentMode === m ? 'active' : ''}" data-mode="${m}">
      ${m === 'adventure' ? '모험' : 'PvP'}
    </button>`).join('');
  el.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('click', () => { currentMode = btn.dataset.mode; renderModeToggle(); renderTierTable(); })
  );
}

/* ── 속성 필터 ── */
function renderAttributeFilter() {
  const el    = byId('attribute-filter');
  const attrs = ['all', '황', '자', '적', '청', '녹'];
  el.innerHTML = attrs.map(a => `
    <button class="attr-btn ${currentAttribute === a ? 'active' : ''}" data-attr="${a}">
      ${a === 'all' ? '전체' : a}
    </button>`).join('');
  el.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('click', () => { currentAttribute = btn.dataset.attr; renderAttributeFilter(); renderTierTable(); })
  );
}

/* ── 티어 테이블 ── */
function renderTierTable() {
  const container = byId('tier-container');
  container.innerHTML = '';
  const modeData = tiers.modes?.[currentMode];
  if (!modeData) return;

  Object.keys(modeData).forEach(tier => {
    const chars = modeData[tier]
      .map(id => ({ id, char: characters[id] }))
      .filter(({ char }) => char && (currentAttribute === 'all' || char.attribute === currentAttribute));
    if (!chars.length) return;

    const row      = document.createElement('div');   row.className = `tier-row tier-${tier}`;
    const label    = document.createElement('div');   label.className = 'tier-label'; label.textContent = tier;
    const charWrap = document.createElement('div');   charWrap.className = 'tier-characters';

    chars.forEach(({ id, char }) => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.innerHTML = `<img src="./assets/img/characters/${char.image}.png" alt="${char.name}" loading="lazy"><span>${char.name}</span>`;
      card.addEventListener('click', () => openModal(id));
      charWrap.appendChild(card);
    });

    row.appendChild(label); row.appendChild(charWrap);
    container.appendChild(row);
  });
}

/* ── 모달 ── */
function openModal(id) {
  const char = characters[id]; if (!char) return;
  byId('modal-body').innerHTML = `
    <img src="./assets/img/characters/${char.image}.png" alt="${char.name}" loading="lazy">
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <pre>${char.recommend || '추천 시동무기 정보 없음'}</pre>
    </div>`;
  byId('recommend-modal').classList.remove('modal-hidden');
}
function closeModal() {
  byId('recommend-modal')?.classList.add('modal-hidden');
}
