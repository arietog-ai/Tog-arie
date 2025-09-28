import { mountShop } from './hardmode_shop.js';

// 라우터
function navigate(route) {
  const app = document.getElementById('app');
  app.innerHTML = ''; // 초기화

  if (route === 'shop') {
    mountShop(app);  // 개척상점 계산기 mount
  } else {
    app.innerHTML = `<p>환영합니다! 좌측 메뉴에서 기능을 선택하세요.</p>`;
  }
}

// 버튼 클릭 이벤트 연결
document.querySelectorAll('[data-route]').forEach(btn => {
  btn.addEventListener('click', () => {
    const route = btn.getAttribute('data-route');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    navigate(route);
  });
});

// 초기 진입 시는 빈 화면
navigate(null);
