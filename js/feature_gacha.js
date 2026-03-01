// js/feature_gacha.js  v20260301-2

import { FleetRandomBox } from './fleet_box.js';
import { FullMoonBox }    from './full_moon_box.js';

function el(tag, props = {}, ...children) {
  const e = Object.assign(document.createElement(tag), props);
  children.forEach(c => typeof c === 'string' ? e.append(c) : e.appendChild(c));
  return e;
}
function pillsHTML(pills) {
  return pills.map(p => `<span class="gacha-pill">${p}</span>`).join('');
}
function itemRowHTML(item) {
  if (item.type === 'section') {
    return `<div class="gacha-section">${item.text}</div>`;
  }
  return `
    <div class="gacha-row">
      <div class="gacha-item">
        ${item.img ? `<img class="gacha-icon" src="${item.img}" alt="${item.name}" loading="lazy">` : ''}
        <span>${item.name}</span>
      </div>
      <span class="pill">${item.qty.toLocaleString()}개</span>
    </div>`;
}

function openInputModal(title, onSubmit) {
  const backdrop = el('div', { className: 'gacha-backdrop' });
  backdrop.style.display = 'flex';
  const modal = el('div', { className: 'gacha-modal' });
  modal.innerHTML = `
    <header>
      <h2>${title}</h2>
    </header>
    <div class="gacha-field" style="margin-bottom:12px;">
      <span>뽑기 횟수 (최대 100회)</span>
      <input class="gacha-input" type="number" min="1" max="100" value="10" id="gacha-n-input" />
    </div>
    <div class="gacha-footer">
      <button class="gacha-btn" id="gacha-modal-cancel">취소</button>
      <button class="gacha-btn gacha-btn-primary" id="gacha-modal-ok">뽑기 시작</button>
    </div>`;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  const cleanup = () => backdrop.remove();
  modal.querySelector('#gacha-modal-cancel').addEventListener('click', cleanup);
  modal.querySelector('#gacha-modal-ok').addEventListener('click', () => {
    const n = parseInt(modal.querySelector('#gacha-n-input').value, 10);
    if (!n || n < 1 || n > 100) { alert('1~100 사이의 숫자를 입력하세요.'); return; }
    cleanup(); onSubmit(n);
  });
  backdrop.addEventListener('click', e => { if (e.target === backdrop) cleanup(); });
}

function openResultModal(title, result) {
  const backdrop = el('div', { className: 'gacha-backdrop' });
  backdrop.style.display = 'flex';
  const modal = el('div', { className: 'gacha-modal' });
  modal.innerHTML = `
    <header>
      <h2>${title}</h2>
      <div class="gacha-pills">${pillsHTML(result.pills)}</div>
    </header>
    <div class="gacha-list">${result.items.map(itemRowHTML).join('')}</div>
    <div class="gacha-footer">
      <button class="gacha-btn gacha-btn-primary" id="gacha-copy">📋 복사</button>
      <button class="gacha-btn" id="gacha-close">닫기</button>
    </div>`;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  const cleanup = () => backdrop.remove();
  modal.querySelector('#gacha-close').addEventListener('click', cleanup);
  modal.querySelector('#gacha-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(result.copy).then(() => alert('복사되었습니다!'));
  });
  backdrop.addEventListener('click', e => { if (e.target === backdrop) cleanup(); });
}

export function mountGacha(root) {
  root.innerHTML = `
    <div class="gacha-card">
      <h1>가챠 뽑기</h1>
      <p class="gacha-muted">상자를 선택해 뽑기를 시작하세요.</p>
      <div class="gacha-tiles" id="gacha-tiles"></div>
      <div style="margin-top:16px;text-align:left;">
        <button class="gacha-btn" id="gacha-home">← 홈으로</button>
      </div>
    </div>`;

  root.querySelector('#gacha-home').addEventListener('click', () => { location.hash = ''; });

  const tilesEl = root.querySelector('#gacha-tiles');
  [FullMoonBox, FleetRandomBox].forEach(box => {
    const tile = el('div', { className: 'gacha-tile' });
    tile.innerHTML = `
      <img src="${box.thumb}" alt="${box.title}" loading="lazy" />
      <div>
        <div style="font-weight:800;font-size:16px;margin-bottom:6px">${box.title}</div>
        <div class="gacha-muted" style="font-size:13px;margin-bottom:10px">${box.description}</div>
        <div class="gacha-actions">
          <button class="gacha-btn gacha-btn-primary gacha-start">뽑기 시작</button>
        </div>
      </div>`;
    tile.querySelector('.gacha-start').addEventListener('click', () => {
      openInputModal(box.title, n => {
        const result = box.run(n);
        openResultModal(box.title, result);
      });
    });
    tilesEl.appendChild(tile);
  });
}
