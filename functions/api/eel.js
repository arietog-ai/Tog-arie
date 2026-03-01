// functions/api/eel.js
// 🔒 서버 전용 — 브라우저에 절대 전달되지 않습니다.
// RATIO 상수가 여기에만 존재합니다.

const RATIO = 1.001e-8;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { mode } = body;

    /* ── A. 데미지 → 기여도 ── */
    if (mode === 'd2c') {
      const damages = body.damages;
      if (!Array.isArray(damages)) {
        return new Response(JSON.stringify({ error: 'damages 배열 필요' }), {
          status: 400, headers: JSON_HEADERS,
        });
      }
      const contributions = damages.map(dmg => Math.floor(dmg * RATIO));
      const totalDmg      = damages.reduce((a, b) => a + b, 0);
      const totalCon      = Math.floor(totalDmg * RATIO);
      return new Response(JSON.stringify({ contributions, totalDmg, totalCon }), {
        headers: JSON_HEADERS,
      });
    }

    /* ── B. 기여도 → 데미지 역산 ── */
    if (mode === 'c2d') {
      const { contribution, attempts } = body;
      if (!contribution || !attempts) {
        return new Response(JSON.stringify({ error: 'contribution, attempts 필요' }), {
          status: 400, headers: JSON_HEADERS,
        });
      }
      const totalDmg   = Math.floor(contribution / RATIO);
      const perAttempt = Math.floor(totalDmg / attempts);
      return new Response(JSON.stringify({ totalDmg, perAttempt }), {
        headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({ error: 'mode 값이 잘못되었습니다' }), {
      status: 400, headers: JSON_HEADERS,
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Bad request' }), {
      status: 400, headers: JSON_HEADERS,
    });
  }
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
