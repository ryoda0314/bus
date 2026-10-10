import React from 'react';
import { AppScreen, SAFARI, TapDot, ringFx, tapFx } from '../AppScreen.jsx';
import { AppIcon, BusSide } from '../icons.jsx';
import { ModelPhone, poseOf, projectPoints } from '../ModelPhone.jsx';
import { ChapterLabel, Headline, SubCopy } from '../text.jsx';
import { BEAT, C, EASE_IN, EASE_IN_OUT, EASE_OUT, FPS, RIDE_DEP, T, alpha, appNow, ease, mix, sp } from '../theme.js';
import { APP_ICON_CENTER, HomeScreen } from './Home.jsx';
import { IslandCard, LiveActivityCard, LockScreen } from './LockScreen.jsx';
import { RouteMap } from './RouteMap.jsx';
import { AddDialog, OfflineCard, ShareSheet, WEB_TAPS } from './WebHome.jsx';

// 8–34秒：端末1台で機能を4つ。左に章の見出し、右に端末（中は実アプリ。見た目は iPhone のネイティブ版に合わせてある）。
//   01 カウントダウン（T.count）  02 乗り場・経路（T.stops）  03 これに乗る（T.ride〜T.red）
//   04 ロック画面（T.lock：サイドボタンで画面を消す → ライブアクティビティ、T.island：ロック解除 → Dynamic Island）
// タップは拍の頭に置き、アプリの state はタップしたフレームで切り替わる。
// ネイティブ版は「乗る」を押した時点でライブアクティビティが始まるので、ロック画面へはボタンを押さずに進む。
// variant = 'flat'（BusPromo）は端末をほぼ正面に置いた版、'3d'（BusPromo3D）は端末を傾けて、画面が切り替わるところで回す版。
// 'web'（BusPromoWeb）は Web 版だけの動画：端末の中は Safari で開いた index.html のまま（ネイティブ版に合わせた手直しなし）。
//   04 はウィジェットの代わりに、共有メニューから「ホーム画面に追加」→ アイコンから全画面で開く → 機内モードでも動く。

// タップ（フレーム, 押すところ）。BEAT = 15 フレーム
const S2 = T.stops;
const TAPS = [
  [S2 + BEAT, '[data-stop="kougaku"]'],
  [S2 + BEAT * 3, '[data-stop="ningen"]'],
  [S2 + BEAT * 5, '[data-stop="toyonaka"]'],
  [S2 + BEAT * 7, '[data-dir="express"]'],
  [S2 + BEAT * 9, '[data-dir="via"]'],
  [S2 + BEAT * 11, '[data-dir="all"]'],
  [T.ride + BEAT * 2, `.rb[data-ride="${RIDE_DEP}"]`],
];
export const TAP_FRAMES = TAPS.map(([at]) => at);
const tapAt = (i) => TAPS[i][0];
const RIDE_AT = tapAt(6); // 「乗る」を押す

// 3d 版で端末が回る区間（フレーム）
//   RIDE_SPIN   「乗る」を押したあと1回転。裏を向いているあいだ（真ん中）に乗るバスの画面へ
//   SIDE_TURN   横を向いてサイドボタンを押すところを見せる → 正面に戻るとロック画面
//   UNLOCK_SPIN ロック解除で1回転。裏を向いているあいだにホーム画面へ
export const RIDE_SPIN = [RIDE_AT + 4, RIDE_AT + 34];
export const SIDE_TURN = [T.lock, T.lock + 16, T.lock + 26, T.lock + 46]; // 横を向く [0→1]、正面に戻る [2→3]
export const UNLOCK_SPIN = [T.island - 9, T.island + 21];
const mid = ([a, b]) => Math.round((a + b) / 2);

// 画面が切り替わるフレーム（版ごと）
const NEVER = 1e6; // その版では起きない
export const timing = (variant) => (variant === 'web' ? {
  rideShow: RIDE_AT, rideZoom: RIDE_AT + 16,
  // 04：共有ボタン → 「ホーム画面に追加」→「追加」→ アイコンが入る → タップして全画面で開く → 機内モード
  share: T.lock + 15, row: T.lock + 30, add: T.lock + 60, pop: T.lock + 75, open: T.island, air: T.island + 15,
  side: NEVER, dark: NEVER, lock: NEVER, la: NEVER, unlock: NEVER, home: NEVER, slide: true, island: NEVER,
} : variant === '3d' ? {
  rideShow: mid(RIDE_SPIN), rideZoom: RIDE_SPIN[1] + 4,
  side: SIDE_TURN[1] + 2, dark: SIDE_TURN[1] + 4, lock: SIDE_TURN[2] + 6, la: SIDE_TURN[3] + 2,
  unlock: UNLOCK_SPIN[0], home: mid(UNLOCK_SPIN), slide: false, island: UNLOCK_SPIN[1] + 3,
  share: NEVER, row: NEVER, add: NEVER, pop: NEVER, open: NEVER, air: NEVER, // Web 版の場面は無い
} : {
  rideShow: RIDE_AT, rideZoom: RIDE_AT + 16,
  side: T.lock + 6, dark: T.lock + 10, lock: T.lock + 18, la: T.lock + 26, // サイドボタン → 画面が消える → ロック画面 → ライブアクティビティ
  unlock: T.island, home: T.island - 2, slide: true, island: T.island + 8, // 上にスワイプしてロック解除 → Dynamic Island
  share: NEVER, row: NEVER, add: NEVER, pop: NEVER, open: NEVER, air: NEVER, // Web 版の場面は無い
});
export const lockFrames = (variant) => {
  const m = timing(variant);
  return { side: m.side, la: m.la, unlock: m.unlock, island: m.island };
};

// 端末の中のアプリの state（タップした瞬間に切り替わる。3d 版の乗るバスの画面は回転の真ん中で）
export const mainState = (f, variant = 'flat') => {
  const m = timing(variant);
  let stop = 'toyonaka';
  if (f >= tapAt(0) && f < tapAt(1)) stop = 'kougaku';
  else if (f >= tapAt(1) && f < tapAt(2)) stop = 'ningen';
  let dir = 'all';
  if (f >= tapAt(3) && f < tapAt(4)) dir = 'express';
  else if (f >= tapAt(4) && f < tapAt(5)) dir = 'via';
  const ride = f >= m.rideShow ? { stop: 'toyonaka', dep: RIDE_DEP } : null;
  return { stop, dir, lang: 'ja', ride, rideOpen: f >= m.rideShow };
};

// 3d 版の章ごとの傾き [章の頭, ry, rx, rz]。章の頭で 24 フレームかけて移る（止まっているあいだは動かさない）
const TILT = [
  [T.count, -18, 6, -2],
  [T.stops, -24, 8, -3],
  [T.ride, -15, 5, -1.5],
  [T.lock, -20, 6, -2],
];
const tiltAt = (f) => {
  let cur = TILT[0].slice(1);
  for (let i = 1; i < TILT.length; i++) {
    const k = ease(f, [TILT[i][0] - 10, TILT[i][0] + 14], [0, 1], EASE_IN_OUT);
    cur = cur.map((v, j) => mix(v, TILT[i][j + 1], k));
  }
  return cur;
};
// 1回転（0 → 360 度）と、回っているあいだの山（0 → 1 → 0）。
// 回り終えたら 0 に戻す（360 のまま残ると、あとで別の向きへ補間するときに遠回りして裏を向く）
const spin = (f, [a, b]) => (f <= a || f >= b ? 0 : ease(f, [a, b], [0, 360], EASE_IN_OUT));
const spinHump = (f, [a, b]) => (f > a && f < b ? Math.sin((Math.PI * (f - a)) / (b - a)) : 0);

const PX = 1390;
const PY = 545;
const HERO_ORIGIN = [0, -110]; // 01 で寄るところ（カウントダウン。表示部分の中心からのずれ）
const RIDE_ORIGIN = [0, -60]; // 03 で寄るところ（乗るバスの残り時間）
const ISLAND_ORIGIN = [0, -397]; // 04 で寄るところ（Dynamic Island）

// 「まもなく」の点滅の位相。赤くなった瞬間（T.red）は明るい側から始める
const blink = (f) => (f >= T.red ? (((f - T.red) / FPS) * 1000 + 500) % 1000 : 0);

const BrandMark = ({ f }) => {
  const p = ease(f, [T.count, T.count + 14], [0, 1]);
  const out = ease(f, [T.more, T.more + 10], [0, 1], EASE_IN);
  return (
    <div style={{
      position: 'absolute', left: 72, top: 44, display: 'flex', alignItems: 'center', gap: 14,
      opacity: p * (1 - out), transform: `translateY(${(1 - p) * -16}px)`,
    }}>
      <AppIcon size={50} style={{ borderRadius: 11, boxShadow: '0 6px 14px -6px rgba(22,20,74,0.5)' }} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.navy, letterSpacing: '0.02em' }}>次のバス</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, letterSpacing: '0.06em' }}>学内連絡バス カウントダウン</div>
      </div>
    </div>
  );
};

// 下の「路線図」：章を停留所に見立て、小さいバスが章ごとに次の停留所へ進む
const STRIP = { x0: 150, x1: 930, y: 1000, labels: ['カウントダウン', '乗り場・経路', 'これに乗る', 'ロック画面'] };
const RouteStrip = ({ f, variant }) => {
  const labels = variant === 'web' ? [...STRIP.labels.slice(0, 3), 'ホーム画面に'] : STRIP.labels;
  const starts = [T.count, T.stops, T.ride, T.lock];
  const step = (STRIP.x1 - STRIP.x0) / 3;
  let x = STRIP.x0;
  let moving = 0;
  starts.forEach((s, i) => {
    if (i === 0) return;
    const k = ease(f, [s - 6, s + 14], [0, 1], EASE_IN_OUT);
    x += step * k;
    if (k > 0 && k < 1) moving = 1;
  });
  const cur = starts.filter((s) => f >= s - 6).length - 1;
  const show = ease(f, [T.count + 10, T.count + 24], [0, 1]) * (1 - ease(f, [T.more, T.more + 10], [0, 1]));
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, opacity: show }}>
      <div style={{ position: 'absolute', left: STRIP.x0, top: STRIP.y - 3, width: STRIP.x1 - STRIP.x0, height: 6, background: C.line }} />
      <div style={{ position: 'absolute', left: STRIP.x0, top: STRIP.y - 3, width: x - STRIP.x0, height: 6, background: C.navy }} />
      {labels.map((label, i) => {
        const sx = STRIP.x0 + step * i;
        const on = i <= cur;
        return (
          <React.Fragment key={i}>
            <div style={{
              position: 'absolute', left: sx - 11, top: STRIP.y - 11, width: 22, height: 22, borderRadius: '50%',
              background: '#fff', border: `5px solid ${on ? C.navy : C.line}`, boxSizing: 'border-box',
            }} />
            <div style={{
              position: 'absolute', left: sx - 100, top: STRIP.y + 20, width: 200, textAlign: 'center', fontSize: 19,
              fontWeight: i === cur ? 900 : 600, color: i === cur ? C.navy : C.muted, letterSpacing: '0.06em',
            }}>{label}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', left: x - 38, top: STRIP.y - 46 - moving * Math.abs(Math.sin(f * 0.9)) * 3 }}>
        <BusSide width={76} wheel={(x - STRIP.x0) * 2.2} />
      </div>
    </div>
  );
};

// 01 の箇条書き（端末の囲みの番号と対応）
const POINTS = [
  { at: T.count + 60, text: '発車まで、あと何分何秒', color: C.red },
  { at: T.count + 85, text: '到着の予定時刻', color: C.navy },
  { at: T.count + 110, text: '並ぶ列の案内（箕面経由）', color: C.navy },
];
const Points = ({ f, exitAt }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {POINTS.map((pt, i) => {
      const p = sp(f, pt.at, { damping: 18, stiffness: 160 });
      const out = ease(f, [exitAt + i * 2, exitAt + i * 2 + 8], [0, 1], EASE_IN);
      return (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, p * 2) * (1 - out),
          transform: `translateX(${(1 - p) * -30}px)`,
        }}>
          <span style={{
            width: 46, height: 46, borderRadius: '50%', background: pt.color, color: '#fff', fontSize: 24, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          }}>{i + 1}</span>
          <span style={{ fontSize: 38, fontWeight: 800, color: C.ink }}>{pt.text}</span>
        </div>
      );
    })}
  </div>
);

const FastForward = ({ f }) => {
  const p = ease(f, [T.ff - 4, T.ff + 6], [0, 1]) * (1 - ease(f, [T.red - 2, T.red + 6], [0, 1]));
  const arrows = Math.floor((f - T.ff) / 4) % 3;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12, background: C.navy, color: '#fff', padding: '10px 22px 12px',
      fontSize: 32, fontWeight: 900, opacity: p, transform: `scale(${0.9 + 0.1 * p})`, transformOrigin: 'left center',
    }}>
      <span style={{ letterSpacing: '-0.18em', fontSize: 30 }}>
        {[0, 1, 2].map((k) => <span key={k} style={{ opacity: k <= arrows ? 1 : 0.3 }}>▶</span>)}
      </span>
      <span style={{ marginLeft: 8 }}>早送り</span>
    </div>
  );
};

// 04 の見出し（ネイティブ版はロック画面、Web 版はホーム画面に追加）
const CH4 = {
  native: {
    label: 'ロック画面', a: ['ロック画面でも、', 'あと何分。'], subA: '「乗る」を押すだけで、\nライブアクティビティに表示。',
    b: ['ほかのアプリ中も、', 'Dynamic Island に。'], subB: '発車すると、自動で消えます。',
  },
  web: {
    label: 'ホーム画面に', a: ['ホーム画面に置けば、', 'アプリのように。'], subA: 'インストールは不要。\n共有メニューから追加するだけ。',
    b: ['電波がなくても、', 'そのまま使える。'], subB: '一度開けば、オフラインでも動きます。',
  },
};

const Texts = ({ f, variant }) => {
  const c4 = CH4[variant === 'web' ? 'web' : 'native'];
  const box = { position: 'absolute', left: 150, top: 226, width: 1000 };
  const sub = { position: 'absolute', left: 150, top: 538, width: 1000 };
  return (
    <>
      {/* 01 */}
      {f < T.stops + 12 && (
        <>
          <div style={box}>
            <ChapterLabel num="01" label="カウントダウン" f={f} d={T.count + 6} exitAt={T.stops - 6} />
            <div style={{ height: 22 }} />
            <Headline lines={['開いた瞬間、', 'あと何分か、わかる。']} f={f} d={T.count + 10} exitAt={T.stops - 6} size={88} />
          </div>
          <div style={sub}><Points f={f} exitAt={T.stops - 8} /></div>
        </>
      )}
      {/* 02 */}
      {f >= T.stops - 4 && f < T.ride + 12 && (
        <>
          <div style={box}>
            <ChapterLabel num="02" label="乗り場・経路" f={f} d={T.stops + 4} exitAt={T.ride - 6} />
            <div style={{ height: 22 }} />
            <Headline lines={['乗り場も、経路も、', 'ワンタップで。']} f={f} d={T.stops + 8} exitAt={T.ride - 6} size={88} />
          </div>
          <div style={{ position: 'absolute', left: 160, top: 506, transform: 'scale(0.9)', transformOrigin: 'left top' }}>
            <RouteMap f={f} stOf={(g) => mainState(g, 'flat')} at={T.stops + 14} exitAt={T.ride - 8} />
          </div>
        </>
      )}
      {/* 03 */}
      {f >= T.ride - 4 && f < T.lock + 12 && (
        <>
          <div style={box}>
            <ChapterLabel num="03" label="これに乗る" f={f} d={T.ride + 4} exitAt={T.lock - 6} />
            <div style={{ height: 22 }} />
            {f < T.red + 12 && (
              <Headline lines={['乗るバスを決めたら、', '「これに乗る」。']} f={f} d={T.ride + 8} exitAt={T.red - 8} size={88} />
            )}
            {f >= T.red - 6 && (
              <div style={{ position: 'absolute', left: 0, top: 70 }}>
                <Headline lines={['発車2分前は、', [{ t: '赤く点滅', color: C.red }, { t: '。' }]]} f={f} d={T.red} exitAt={T.lock - 6} size={88} />
              </div>
            )}
          </div>
          <div style={sub}>
            {f < T.red + 10 && <SubCopy text={'その便だけを、大きくカウントダウン。'} f={f} d={T.ride + 40} exitAt={T.red - 8} size={34} />}
            {f >= T.red && <SubCopy text={'走るかどうか、ひと目でわかる。'} f={f} d={T.red + 10} exitAt={T.lock - 8} size={34} />}
          </div>
          <div style={{ position: 'absolute', left: 150, top: 640 }}>
            {f >= T.ff - 6 && f < T.red + 8 && <FastForward f={f} />}
          </div>
        </>
      )}
      {/* 04 */}
      {f >= T.lock - 4 && (
        <>
          <div style={box}>
            <ChapterLabel num="04" label={c4.label} f={f} d={T.lock + 4} exitAt={T.more - 4} />
            <div style={{ height: 22 }} />
            {f < T.island + 12 && (
              <Headline lines={c4.a} f={f} d={T.lock + 8} exitAt={T.island - 8} size={88} />
            )}
            {f >= T.island - 6 && (
              <div style={{ position: 'absolute', left: 0, top: 70 }}>
                <Headline lines={c4.b} f={f} d={T.island + 2} exitAt={T.more - 4} size={88} />
              </div>
            )}
          </div>
          <div style={sub}>
            {f < T.island + 10 && <SubCopy text={c4.subA} f={f} d={T.lock + 24} exitAt={T.island - 8} size={32} />}
            {f >= T.island && <SubCopy text={c4.subB} f={f} d={T.island + 14} exitAt={T.more - 6} size={32} />}
          </div>
        </>
      )}
    </>
  );
};

export const Features = ({ f, variant = 'flat' }) => {
  const m = timing(variant);
  const is3d = variant === '3d';
  const isWeb = variant === 'web';
  const st = mainState(f, variant);
  const now = appNow(f);
  const RIDE_SHOW = m.rideShow;
  const SIDE_AT = m.side;
  const DARK_AT = m.dark;
  const LOCK_AT = m.lock;
  const LA_AT = m.la;
  const UNLOCK_AT = m.unlock;
  const ISLAND_AT = m.island;

  // 端末の動き
  const enter = sp(f, T.count - 4, { damping: 17, stiffness: 95, mass: 1 });
  const exit = ease(f, [T.more, T.more + 12], [0, 1], EASE_IN);
  const z1 = ease(f, [T.count + 50, T.count + 72], [0, 1], EASE_IN_OUT) * (1 - ease(f, [T.stops - 26, T.stops - 6], [0, 1], EASE_IN_OUT));
  const z3 = ease(f, [m.rideZoom, m.rideZoom + 20], [0, 1], EASE_IN_OUT) * (1 - ease(f, [T.lock - 22, T.lock - 4], [0, 1], EASE_IN_OUT));
  const z4 = ease(f, [ISLAND_AT + 8, ISLAND_AT + 28], [0, 1], EASE_IN_OUT) * (1 - ease(f, [T.more - 14, T.more], [0, 1], EASE_IN_OUT));
  const bump = f >= T.red ? 0.05 * Math.exp(-(f - T.red) / 5) : 0;
  const origin = f < T.ride ? HERO_ORIGIN : f < T.lock ? RIDE_ORIGIN : ISLAND_ORIGIN;
  const x = PX + exit * 900;
  const y = mix(1500, PY, enter);
  let scale = (1 + 0.3 * z1 + 0.15 * z3 + 0.3 * z4 + bump) * (1 - 0.12 * exit);
  // 端末は止めておく（ゆっくり揺らすと、中の小さな文字が毎コマ少しずつ動いて震えて見える）
  let ry = mix(-30, -7, enter) + exit * 10;
  let rx = 0;
  let rz = (1 - enter) * 10;
  if (is3d) {
    // 章ごとに傾けて置く。寄るときは正面に近づけて読みやすく
    const zoom = Math.max(z1, z3, z4);
    const [ty, tx, tz] = tiltAt(f);
    // 登場は裏向きから回って入る。退場は回りながら右へ
    const enterR = ease(f, [T.count - 8, T.count + 34], [0, 1], EASE_OUT);
    ry = ty * (1 - 0.55 * zoom) - (1 - enterR) * 200 + exit * 200;
    rx = tx * (1 - 0.55 * zoom) + (1 - enterR) * 12;
    rz = tz * (1 - 0.55 * zoom) + (1 - enter) * 10;
    // 画面が切り替わるところで1回転（回っているあいだは少し小さく）
    ry += spin(f, RIDE_SPIN) + spin(f, UNLOCK_SPIN);
    scale *= 1 - 0.1 * Math.max(spinHump(f, RIDE_SPIN), spinHump(f, UNLOCK_SPIN));
    // 横を向いてサイドボタンを見せる
    const turn = ease(f, [SIDE_TURN[0], SIDE_TURN[1]], [0, 1], EASE_IN_OUT) * (1 - ease(f, [SIDE_TURN[2], SIDE_TURN[3]], [0, 1], EASE_IN_OUT));
    ry = mix(ry, -78, turn);
    rx = mix(rx, 3, turn);
  }

  // 端末の中のタップと囲み
  const taps = TAPS.map(([at, sel]) => tapFx(f, at, sel));
  const pose = poseOf({ x, y, scale, rx, ry, rz, origin });
  const rings = [
    // ① は文字の範囲を枠で、②③ は1行ずつ蛍光ペンで（行が近いので枠だと重なる）。番号は右端
    ringFx(f, POINTS[0].at, T.stops - 24, '.hero .count', C.red, { tag: '1', fit: true, padX: 8, padY: 2 }),
    ringFx(f, POINTS[1].at, T.stops - 24, '.hero .sub', C.navy, { tag: '2', fit: true, mark: true, fill: alpha(C.navy, 0.12), padX: 4, padY: 0 }),
    ringFx(f, POINTS[2].at, T.stops - 24, '.hero .note', C.navy, { tag: '3', fit: true, mark: true, fill: alpha(C.navy, 0.12), padX: 4, padY: 0 }),
    ringFx(f, m.rideZoom + 14, T.red - 4, '.rv-count', '#fff', { pad: 8, radius: 10 }),
    ringFx(f, T.red, T.lock - 10, '.rv-count', C.redSoft, { pad: 8, radius: 10, w: 4 }),
  ];

  // 赤くなったときの光（点滅に合わせる）
  const glowOn = f >= T.red && f < T.lock ? (blink(f) >= 500 ? 1 : 0.45) * (1 - ease(f, [T.lock - 16, T.lock - 4], [0, 1])) : 0;
  const dark = ease(f, [DARK_AT, DARK_AT + 4], [0, 1]);
  const lockOn = ease(f, [LOCK_AT, LOCK_AT + 10], [0, 1]);
  const unlock = ease(f, [UNLOCK_AT, UNLOCK_AT + 12], [0, 1], EASE_IN_OUT);
  const islandP = sp(f, ISLAND_AT, { damping: 15, stiffness: 170, mass: 0.8 });
  // サイドボタンを押す印（端末の右の側面。ボタンはモデルの y = 93〜190）
  const side = f >= SIDE_AT - 8 && f < SIDE_AT + 14 ? projectPoints(pose, [[214, 141, -36]])[0] : null;
  const sideP = ease(f, [SIDE_AT - 8, SIDE_AT], [0, 1]);
  const sideOut = ease(f, [SIDE_AT + 2, SIDE_AT + 14], [0, 1]);
  // 端末の外に出すカード：ロック画面のライブアクティビティ → Dynamic Island
  const laCard = sp(f, LA_AT + 14, { damping: 16, stiffness: 140 });
  const laOut = ease(f, [UNLOCK_AT - 4, UNLOCK_AT + 6], [0, 1], EASE_IN);
  const isCard = sp(f, ISLAND_AT + 14, { damping: 16, stiffness: 140 });
  const isOut = ease(f, [T.more - 4, T.more + 8], [0, 1], EASE_IN);
  // Web 版：機内モードのカード
  const offCard = sp(f, m.air + 6, { damping: 16, stiffness: 140 });
  const offOut = ease(f, [T.more - 4, T.more + 8], [0, 1], EASE_IN);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.paper, overflow: 'hidden' }}>
      {/* 端末の後ろの丸（タイムテーブルの紺をうすく） */}
      <div style={{
        position: 'absolute', left: x - 470, top: PY - 470, width: 940, height: 940, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(C.navy, 0.1)} 0%, ${alpha(C.navy, 0.05)} 55%, ${alpha(C.navy, 0)} 72%)`,
        opacity: enter * (1 - exit),
      }} />
      <div style={{
        position: 'absolute', left: x - 520, top: PY - 520, width: 1040, height: 1040, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,90,100,${0.45 * glowOn}) 0%, rgba(255,90,100,0) 62%)`,
      }} />
      <BrandMark f={f} />
      <RouteStrip f={f} variant={variant} />
      <Texts f={f} variant={variant} />
      {/* ガラスの映り込みは 0.6 倍（そのままだと紺の画面が白っぽくかすむ） */}
      <ModelPhone pose={pose} glare={0.6}>
        <AppScreen
          now={now} st={st} fx={{ taps, rings }} anim={blink(f)} native={!isWeb}
          browser={isWeb && f < m.open + 8} airplane={isWeb && f >= m.air}
          urlTyped={isWeb ? ease(f, [T.count + 2, T.count + 22], [0, 1]) : 1}
          loading={isWeb ? 1 - ease(f, [T.count + 24, T.count + 32], [0, 1]) : 0}
        />
        {isWeb && <WebLayers f={f} m={m} now={now} />}
        {f >= DARK_AT && f < (m.slide ? UNLOCK_AT + 14 : m.home) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 260, background: '#000', opacity: dark }} />
        )}
        {f >= m.home && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 265 }}>
            <HomeScreen now={now} island={f >= ISLAND_AT ? islandP : 0} />
          </div>
        )}
        {f >= LOCK_AT && f < (m.slide ? UNLOCK_AT + 14 : m.home) && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 270, opacity: lockOn,
            transform: m.slide ? `translateY(${-unlock * 900}px)` : undefined,
          }}>
            <LockScreen f={f} now={now} laAt={LA_AT} />
          </div>
        )}
      </ModelPhone>
      {side && (
        <div style={{
          position: 'absolute', left: side[0] - 26, top: side[1] - 26, width: 52, height: 52, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.95)', boxShadow: `0 0 0 3px ${alpha(C.navy, 0.35)}`,
          opacity: sideP * (1 - sideOut), transform: `scale(${f < SIDE_AT ? mix(1.5, 1, sideP) : mix(1, 1.8, sideOut)})`,
        }} />
      )}
      {/* 端末から引き出す拡大カード */}
      {f >= LA_AT + 10 && f < UNLOCK_AT + 8 && (
        <div style={{
          position: 'absolute', left: mix(PX - 182, 150, laCard), top: mix(PY + 180, 668, laCard),
          transform: `scale(${mix(0.6, 1, laCard)})`, transformOrigin: 'left top', opacity: Math.min(1, laCard * 2) * (1 - laOut),
        }}>
          <LiveActivityCard now={now} />
        </div>
      )}
      {f >= ISLAND_AT + 10 && (
        <div style={{
          position: 'absolute', left: mix(PX - 118, 150, isCard), top: mix(PY - 420, 640, isCard),
          transform: `scale(${mix(0.5, 1, isCard)})`, transformOrigin: 'left top', opacity: Math.min(1, isCard * 2) * (1 - isOut),
        }}>
          <IslandCard now={now} />
        </div>
      )}
      {isWeb && f >= m.air + 2 && (
        <div style={{
          position: 'absolute', left: mix(PX - 40, 150, offCard), top: mix(PY - 430, 640, offCard),
          transform: `scale(${mix(0.4, 1, offCard)})`, transformOrigin: 'left top', opacity: Math.min(1, offCard * 2) * (1 - offOut),
        }}>
          <OfflineCard />
        </div>
      )}
    </div>
  );
};

// Web 版の 04：共有シート → 「ホーム画面に追加」→「追加」→ ホーム画面にアイコンが入る → タップして全画面で開く
const WebLayers = ({ f, m, now }) => {
  const sheetIn = sp(f, m.share + 2, { damping: 22, stiffness: 160 });
  const sheetOut = ease(f, [m.row + 4, m.row + 14], [0, 1], EASE_IN_OUT);
  const dlgIn = sp(f, m.row + 4, { damping: 22, stiffness: 160 });
  const dlgOut = ease(f, [m.add + 4, m.add + 14], [0, 1], EASE_IN_OUT);
  const home = ease(f, [m.add + 6, m.add + 16], [0, 1], EASE_OUT);
  const openP = ease(f, [m.open + 2, m.open + 14], [0, 1], EASE_IN_OUT);
  const press = (at) => (f >= at && f < at + 8 ? 1 - (f - at) / 8 : 0);
  const [ix, iy] = APP_ICON_CENTER;
  return (
    <>
      {f >= m.share && f < m.row + 16 && <ShareSheet p={sheetIn * (1 - sheetOut)} press={press(m.row)} />}
      {f >= m.row && f < m.add + 16 && <AddDialog p={dlgIn * (1 - dlgOut)} press={press(m.add)} />}
      {f >= m.add + 6 && f < m.open + 16 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 290, opacity: home * (1 - openP),
          transform: `scale(${mix(1.08, 1, home) * mix(1, 1.35, openP)})`, transformOrigin: `${ix}px ${iy}px`,
        }}>
          <HomeScreen now={now} appScale={f >= m.pop ? sp(f, m.pop, { damping: 10, stiffness: 170, mass: 0.7 }) : 0} />
        </div>
      )}
      <TapDot t={tapFx(f, m.share)} x={SAFARI.share[0]} y={SAFARI.share[1]} />
      <TapDot t={tapFx(f, m.row)} x={WEB_TAPS.row[0]} y={WEB_TAPS.row[1]} />
      <TapDot t={tapFx(f, m.add)} x={WEB_TAPS.add[0]} y={WEB_TAPS.add[1]} />
      <TapDot t={tapFx(f, m.open)} x={ix} y={iy} />
    </>
  );
};
