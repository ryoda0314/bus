import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

// Noto Sans JP（可変フォント・OFL）を同梱して読み込む（前作の promo-video と同じ）。
// システムフォント頼みだと環境によって字形やウェイトが変わるため。
// 9.6MB あるので、並列レンダリングで CPU が混むと時間がかかる。fetch に時間制限を付けて取り直す。
// 端末の中のアプリ（iframe）は AppScreen.jsx が同じファイルを別に読み込む。
export const FONT_URL = staticFile('fonts/NotoSansJP-VF.ttf');
const ATTEMPTS = 4;
const FETCH_TIMEOUT = 30000;

const fetchFont = async () => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(FONT_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${FONT_URL}: HTTP ${res.status}`);
    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
};

const load = async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      const face = new FontFace('Noto Sans JP', await fetchFont(), { weight: '100 900' });
      await face.load();
      document.fonts.add(face);
      return;
    } catch (err) {
      if (attempt >= ATTEMPTS) throw err;
    }
  }
};

const handle = delayRender('Noto Sans JP を読み込み中', { timeoutInMilliseconds: 180000, retries: 2 });
load()
  .then(() => continueRender(handle))
  .catch((err) => cancelRender(err));
