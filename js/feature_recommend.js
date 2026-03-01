// js/feature_recommend.js  v20260301-2
// isMounted 버그 수정: 모듈 레벨 변수 제거 → 매번 새로 초기화

let characters = {};
let tiers = {};
let currentMode = 'adventure';
let currentAttribute = 'all';

export async function mountRecommend(container) {
  // ← isMounted 제거: app.js가 항상 innerHTML='' 후 호출하므로 중복 없음
  currentMode = 'adventure';
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
          <p class="muted">characters.json / tiers.json 경로 확인</p>
          <button class="hero-btn" id="rec-home">← 홈으로</button>
        </div>
      </div>`;
    document.getElementById('rec-home')?.addEventListener('click', () => { location.hash = ''; });
    console.error(err);
    return;
  }

  container.innerHTML = `
    <div class="container">
      <div class="recommend-header">
        <button class="hero-btn" id="home-btn">← 홈으로</button>
      </div>
      <div class="mode-toggle" id="mode-toggle"></div>
      <div class="attribute-filter" id="attribute-filter"></div>
      <div id="tier-container"></div>
    </div>

    <div id="recommend-modal" class="modal modal-hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>추천 시동무기</h3>
          <button class="hero-btn" id="modal-close">닫기</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>`;

  document.getElementById('home-btn').addEventListener('click', () => { location.hash = ''; });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('recommend-modal').addEventListener('click', e => {
    if (e.target.id === 'recommend-modal') closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  renderModeToggle();
  renderAttributeFilter();
  renderTierTable();
}

/* ─── 모드 토글 ─── */
function renderModeToggle() {
  const el = document.getElementById('mode-toggle');
  el.innerHTML = `
    <button class="mode-btn ${currentMode === 'adventure' ? 'active' : ''}" data-mode="adventure">모험</button>
    <button class="mode-btn ${currentMode === 'pvp'       ? 'active' : ''}" data-mode="pvp">PvP</button>`;
  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;
      renderModeToggle();
      renderTierTable();
    });
  });
}

/* ─── 속성 필터 ─── */
function renderAttributeFilter() {
  const el = document.getElementById('attribute-filter');
  const attrs = ['all', '황', '자', '적', '청', '녹'];
  el.innerHTML = attrs.map(a => `
    <button class="attr-btn ${currentAttribute === a ? 'active' : ''}" data-attr="${a}">
      ${a === 'all' ? '전체' : a}
    </button>`).join('');
  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAttribute = btn.dataset.attr;
      renderAttributeFilter();
      renderTierTable();
    });
  });
}

/* ─── 티어 테이블 ─── */
function renderTierTable() {
  const cont = document.getElementById('tier-container');
  cont.innerHTML = '';
  const modeData = tiers.modes?.[currentMode];
  if (!modeData) return;

  Object.keys(modeData).forEach(tier => {
    const row      = document.createElement('div');
    row.className  = `tier-row tier-${tier}`;
    const label    = document.createElement('div');
    label.className = 'tier-label';
    label.innerText = tier;

    const charWrap = document.createElement('div');
    charWrap.className = 'tier-characters';

    modeData[tier].forEach(id => {
      const char = characters[id];
      if (!char) return;
      if (currentAttribute !== 'all' && char.attribute !== currentAttribute) return;

      const card = document.createElement('div');
      card.className = 'character-card';
      card.innerHTML = `
        <img src="./assets/img/characters/${char.image}.png" alt="${char.name}" loading="lazy">
        <span>${char.name}</span>`;
      card.addEventListener('click', () => openModal(id));
      charWrap.appendChild(card);
    });

    if (charWrap.children.length > 0) {
      row.appendChild(label);
      row.appendChild(charWrap);
      cont.appendChild(row);
    }
  });
}

/* ─── 모달 ─── */
function openModal(id) {
  const char = characters[id];
  if (!char) return;
  document.getElementById('modal-body').innerHTML = `
    <img src="./assets/img/characters/${char.image}.png" alt="${char.name}" loading="lazy">
    <div>
      <h2>${char.name}</h2>
      <p><strong>속성:</strong> ${char.attribute}</p>
      <pre>${char.recommend || '추천 시동무기 정보 없음'}</pre>
    </div>`;
  document.getElementById('recommend-modal').classList.remove('modal-hidden');
}

function closeModal() {
  document.getElementById('recommend-modal')?.classList.add('modal-hidden');
}
