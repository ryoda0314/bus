import React from 'react';
import { AppScreen, ringFx, tapFx } from '../AppScreen.jsx';
import { AppIcon, BusSide } from '../icons.jsx';
import { ModelPhone, poseOf } from '../ModelPhone.jsx';
import { ChapterLabel, Headline, SubCopy } from '../text.jsx';
import { BEAT, C, EASE_IN, EASE_IN_OUT, FPS, RIDE_DEP, T, alpha, appNow, ease, mix, sp } from '../theme.js';
import { LockScreen, WidgetCard } from './LockScreen.jsx';
import { RouteMap } from './RouteMap.jsx';

// 8–32秒：端末1台で機能を4つ。左に章の見出し、右に端末（中は実アプリ）。
//   01 カウントダウン（T.count）  02 乗り場・経路（T.stops）  03 これに乗る（T.ride〜T.red）  04 ウィジェット（T.lock）
// タップは拍の頭に置き、アプリの state はタップしたフレームで切り替わる。

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
  [T.lock + 6, '[data-widget]'],
];
export const TAP_FRAMES = TAPS.map(([at]) => at);
const tapAt = (i) => TAPS[i][0];
const RIDE_AT = tapAt(6);
const WIDGET_AT = tapAt(7);
const DARK_AT = WIDGET_AT + 10; // 画面が消える
const LOCK_AT = DARK_AT + 6; // ロック画面が点く
export const LOCK_FRAMES = { dark: DARK_AT, widget: LOCK_AT + 8 };

// 端末の中のアプリの state（タップした瞬間に切り替わる）
export const mainState = (f) => {
  let stop = 'toyonaka';
  if (f >= tapAt(0) && f < tapAt(1)) stop = 'kougaku';
  else if (f >= tapAt(1) && f < tapAt(2)) stop = 'ningen';
  let dir = 'all';
  if (f >= tapAt(3) && f < tapAt(4)) dir = 'express';
  else if (f >= tapAt(4) && f < tapAt(5)) dir = 'via';
  const ride = f >= RIDE_AT ? { stop: 'toyonaka', dep: RIDE_DEP, sent: f >= WIDGET_AT + 6 } : null;
  return { stop, dir, lang: 'ja', ride, rideOpen: f >= RIDE_AT };
};

const PX = 1390;
const PY = 545;
const HERO_ORIGIN = [0, -110]; // 01 で寄るところ（カウントダウン。表示部分の中心からのずれ）
const RIDE_ORIGIN = [0, -60]; // 03 で寄るところ（乗るバスの残り時間）

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
const STRIP = { x0: 150, x1: 930, y: 1000, labels: ['カウントダウン', '乗り場・経路', 'これに乗る', 'ウィジェット'] };
const RouteStrip = ({ f }) => {
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
      {STRIP.labels.map((label, i) => {
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

const Texts = ({ f }) => {
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
            <RouteMap f={f} stOf={mainState} at={T.stops + 14} exitAt={T.ride - 8} />
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
            <ChapterLabel num="04" label="ウィジェット" f={f} d={T.lock + 4} exitAt={T.more - 4} />
            <div style={{ height: 22 }} />
            <Headline lines={['ロック画面でも、', 'あと何分。']} f={f} d={T.lock + 8} exitAt={T.more - 4} size={88} />
          </div>
          <div style={sub}>
            <SubCopy text={'iPhone は Scriptable のウィジェットで、\n選んだ便をロック画面に。'} f={f} d={T.lock + 24} exitAt={T.more - 6} size={32} />
          </div>
        </>
      )}
    </>
  );
};

export const Features = ({ f }) => {
  const st = mainState(f);
  const now = appNow(f);

  // 端末の動き
  const enter = sp(f, T.count - 4, { damping: 17, stiffness: 95, mass: 1 });
  const exit = ease(f, [T.more, T.more + 12], [0, 1], EASE_IN);
  const z1 = ease(f, [T.count + 50, T.count + 72], [0, 1], EASE_IN_OUT) * (1 - ease(f, [T.stops - 26, T.stops - 6], [0, 1], EASE_IN_OUT));
  const z3 = ease(f, [RIDE_AT + 16, RIDE_AT + 36], [0, 1], EASE_IN_OUT) * (1 - ease(f, [T.lock - 22, T.lock - 4], [0, 1], EASE_IN_OUT));
  const bump = f >= T.red ? 0.05 * Math.exp(-(f - T.red) / 5) : 0;
  const scale = (1 + 0.3 * z1 + 0.15 * z3 + bump) * (1 - 0.12 * exit);
  const origin = f < T.ride ? HERO_ORIGIN : RIDE_ORIGIN;
  const x = PX + exit * 900;
  const y = mix(1500, PY, enter);
  // 3Dの端末なので、ごくゆっくり揺らして厚みを見せる
  const ry = mix(-30, -7, enter) + exit * 10 + 1.4 * Math.sin(f / 70);
  const rx = 0.8 * Math.sin(f / 95 + 1);
  const rz = (1 - enter) * 10;

  // 端末の中のタップと囲み
  const taps = TAPS.map(([at, sel]) => tapFx(f, at, sel));
  const rings = [
    ringFx(f, POINTS[0].at, T.stops - 24, '.hero .count', C.red, { tag: '1', pad: 4 }),
    ringFx(f, POINTS[1].at, T.stops - 24, '.hero .sub', C.navy, { tag: '2', pad: 3 }),
    ringFx(f, POINTS[2].at, T.stops - 24, '.hero .note', C.navy, { tag: '3', pad: 3 }),
    ringFx(f, RIDE_AT + 30, T.red - 4, '.rv-count', '#fff', { pad: 8, radius: 10 }),
    ringFx(f, T.red, T.lock - 10, '.rv-count', C.redSoft, { pad: 8, radius: 10, w: 4 }),
  ];

  // 赤くなったときの光（点滅に合わせる）
  const glowOn = f >= T.red && f < T.lock ? (blink(f) >= 500 ? 1 : 0.45) * (1 - ease(f, [T.lock - 16, T.lock - 4], [0, 1])) : 0;
  const dark = ease(f, [DARK_AT, DARK_AT + 5], [0, 1]);
  const lockOn = ease(f, [LOCK_AT, LOCK_AT + 10], [0, 1]);
  const card = sp(f, LOCK_FRAMES.widget + 14, { damping: 16, stiffness: 140 });
  const cardOut = ease(f, [T.more - 4, T.more + 8], [0, 1], EASE_IN);

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
      <RouteStrip f={f} />
      <Texts f={f} />
      {/* ガラスの映り込みは 0.6 倍（そのままだと紺の画面が白っぽくかすむ） */}
      <ModelPhone pose={poseOf({ x, y, scale, rx, ry, rz, origin })} glare={0.6}>
        <AppScreen now={now} st={st} fx={{ taps, rings }} anim={blink(f)} />
        {f >= DARK_AT && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 260, background: '#000', opacity: dark * (1 - lockOn * 0) }} />
        )}
        {f >= LOCK_AT && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 270, opacity: lockOn }}>
            <LockScreen f={f} now={now} widgetAt={LOCK_FRAMES.widget} />
          </div>
        )}
      </ModelPhone>
      {/* ウィジェットを大きくしたカード（端末のウィジェットから引き出す） */}
      {f >= LOCK_FRAMES.widget + 10 && (
        <div style={{
          position: 'absolute', left: mix(PX - 200, 150, card), top: mix(PY - 160, 650, card),
          transform: `scale(${mix(0.35, 1, card)})`, transformOrigin: 'left top', opacity: Math.min(1, card * 2) * (1 - cardOut),
        }}>
          <WidgetCard now={now} />
        </div>
      )}
    </div>
  );
};
