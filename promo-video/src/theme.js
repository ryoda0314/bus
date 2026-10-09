import { Easing, interpolate, spring } from 'remotion';

// ── 尺とリズム ──────────────────────────────────────
// BGM（make_audio.py で合成）は 120 BPM。30fps なら 1拍 = 15フレーム、1小節 = 60フレームで、
// 全カットをこの格子に乗せている（曲の構成は make_audio.py の冒頭）。
export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const BEAT = 15;
export const BAR = 60;

export const T = {
  hook: 0, //      0.0s 掲示の時刻表「次のバス、あと何分？」（イントロ・時計の音）
  drop: 120, //    4.0s 数字が集まってカウントダウンに（ドロップ）
  logo: 180, //    6.0s アイコンと名前（ピンポーン）
  count: 240, //   8.0s 01 開いた瞬間、あと何分
  stops: 420, //  14.0s 02 乗り場・経路
  ride: 600, //   20.0s 03 これに乗る
  ff: 720, //     24.0s    早送り（スネアのロール）
  red: 780, //    26.0s    発車2分前で赤く点滅（一撃）
  lock: 840, //   28.0s 04 ロック画面のウィジェット（ブレイク）
  more: 960, //   32.0s ほかにも（日本語/한국어・運休日・ホーム画面）
  end: 1080, //   36.0s エンドカード
  final: 1140, // 38.0s 曲の最後の一打
  total: 1230, // 41.0s
};

// エンドカードに出す URL（公開先が決まったら書く。空なら出さない）
export const APP_URL = '';

// ── 色（アプリの CSS 変数と同じ）──────────────────────
export const C = {
  navy: '#2d2a7e', // --navy
  navyDeep: '#22205e', // ダークの --navy
  navyNight: '#16144a',
  red: '#c4161c', // --red（直行の印）
  redSoft: '#ff8a8f', // 乗るバス画面の「まもなく」
  paper: '#f3f4f9',
  card: '#ffffff',
  ink: '#111122', // --text
  muted: '#5c5c6e', // --muted
  line: '#c9c9d6', // --line
  row: '#e4e8f4', // --row
  sel: '#9c99f2', // ダークの --sel
};

export const FONT = '"Noto Sans JP", "Malgun Gothic", sans-serif';

// ── アプリの時計 ─────────────────────────────────────
// 動画の中の「いま」は 2026-10-08（木・運行日）12:35:20 から1秒ずつ進む（アプリと同じく秒単位で更新）。
// 早送り（T.ff〜T.red）だけは 12:35:44 → 12:43:00 まで一気に進め、
// 12:45 発の便が「あと2分」で赤くなるのがちょうど T.red（曲の一打）になるようにしてある。
export const jst = (y, mo, d, h, mi, s = 0) => Date.UTC(y, mo - 1, d, h - 9, mi, s);
export const APP_T0 = jst(2026, 10, 8, 12, 35, 20);
export const NEXT_DEP = jst(2026, 10, 8, 12, 40); // 豊中の次の便（箕面経由・電気バス）
export const RIDE_DEP = jst(2026, 10, 8, 12, 45); // 「これに乗る」で選ぶ 12:45 直行
const FF_FROM = APP_T0 + Math.floor(T.ff / FPS) * 1000; // 12:35:44
const FF_TO = jst(2026, 10, 8, 12, 43, 0);
export const FF_SECONDS = (FF_TO - FF_FROM) / 1000; // 436（make_audio.py の早送りの音と同じ）
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

export const appNow = (f) => {
  if (f < T.ff) return APP_T0 + Math.floor(f / FPS) * 1000;
  if (f < T.red) return FF_FROM + Math.floor(FF_SECONDS * easeInOutCubic((f - T.ff) / (T.red - T.ff))) * 1000;
  return FF_TO + Math.floor((f - T.red) / FPS) * 1000;
};

// 「ほかにも」の場面の端末はそれぞれの時刻で動かす
export const KR_T0 = jst(2026, 10, 8, 12, 35, 28); // 日本語 → 한국어
export const CLOSED_T0 = jst(2026, 10, 10, 10, 0, 0); // 土曜（10/12 は祝日なので次は 10/13(火)）

const pad2 = (n) => String(n).padStart(2, '0');
// JST の「12:35」
export const hm = (ms) => {
  const d = new Date(ms + 9 * 3600 * 1000);
  return `${d.getUTCHours()}:${pad2(d.getUTCMinutes())}`;
};
// 発車までの [分, 秒]（アプリの countHtml と同じ丸め）
export const left = (dep, now) => {
  const sec = Math.max(0, Math.round((dep - now) / 1000));
  return [Math.floor(sec / 60), sec % 60, sec];
};

// ── アニメーション補助（前作の promo-video と同じ）──────
export const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);

// 区間 [a,b] で from→to（範囲外はクランプ）
export const ease = (f, [a, b], [from, to], easing = EASE_OUT) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return f < a ? from : to;
  return interpolate(f, [a, b], [from, to], { ...CLAMP, easing });
};

// delay フレーム後に 0→1 へ弾むばね
export const sp = (f, delay = 0, config = {}) =>
  spring({ frame: f - delay, fps: FPS, config: { damping: 16, stiffness: 170, mass: 0.85, ...config } });

// 落ち着いた（ほぼオーバーシュートしない）ばね
export const spSoft = (f, delay = 0) => sp(f, delay, { damping: 26, stiffness: 120, mass: 1 });

export const mix = (a, b, t) => a + (b - a) * t;
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

// '#rrggbb' → 'rgba(r,g,b,a)'
export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
