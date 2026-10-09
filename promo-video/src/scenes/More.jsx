import React from 'react';
import { AppScreen, ringFx, tapFx } from '../AppScreen.jsx';
import { AppIcon } from '../icons.jsx';
import { BODY_H, ModelPhone } from '../ModelPhone.jsx';
import { HomeIndicator, SCREEN_W, StatusBar } from '../Phone.jsx';
import { Headline } from '../text.jsx';
import { C, CLOSED_T0, EASE_IN, FPS, KR_T0, T, ease, hm, mix, sp } from '../theme.js';

// 32–36秒：ほかにも。3台を拍ごとに並べる
//   左：日本語 → 한국어（言語ボタンを押す）  中：運休日（土曜。祝日をはさんで次は 10/13(火)）  右：ホーム画面に追加
export const MORE_FRAMES = { phones: [T.more + 6, T.more + 18, T.more + 30], lang: T.more + 45, add: T.more + 60 };
const SCALE = 0.64;
const Y = 600;

const PALETTE = ['#f6c453', '#7ad3a8', '#ff8f70', '#6fb6ff', '#c69cff', '#5fd0d8', '#ffa8c5', '#a3d36b', '#f0a35e', '#8f9cff'];
const ICON = 62;
const COL_X = (i) => 26 + i * ((SCREEN_W - 52 - ICON) / 3);
const APP_SLOT = 5; // 2段目の2つめ
const DOCK_Y = 852 - 22 - 92 + 15;

// ホーム画面（ほかのアプリは名前のない仮のアイコン）
const HomeScreen = ({ f, now }) => {
  const add = sp(f, MORE_FRAMES.add, { damping: 10, stiffness: 170, mass: 0.7 });
  const slot = (i, x, y, inDock) => {
    if (i === APP_SLOT && !inDock) {
      return (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: ICON, textAlign: 'center' }}>
          <div style={{ transform: `scale(${add})`, opacity: Math.min(1, add * 2) }}>
            <AppIcon size={ICON} style={{ borderRadius: 14, boxShadow: '0 6px 14px -6px rgba(0,0,0,0.35)' }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', opacity: add, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>次のバス</div>
        </div>
      );
    }
    const col = PALETTE[(i * 7 + (inDock ? 3 : 0)) % PALETTE.length];
    return (
      <div key={`${inDock}${i}`} style={{ position: 'absolute', left: x, top: y, width: ICON }}>
        <div style={{
          width: ICON, height: ICON, borderRadius: 14, background: `linear-gradient(160deg, ${col}, ${col}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 24, height: 24, borderRadius: i % 3 === 0 ? '50%' : 6, border: '3.5px solid rgba(255,255,255,0.9)', transform: i % 3 === 2 ? 'rotate(45deg)' : undefined }} />
        </div>
        {!inDock && <div style={{ margin: '9px auto 0', width: 34 + (i % 3) * 6, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.55)' }} />}
      </div>
    );
  };
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg, #7f8fe6 0%, #ab9be3 52%, #efc3d6 100%)' }}>
      <StatusBar time={hm(now)} color="#fff" />
      {Array.from({ length: 20 }, (_, i) => slot(i, COL_X(i % 4), 76 + Math.floor(i / 4) * 100, false))}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 22, height: 92, borderRadius: 34, background: 'rgba(255,255,255,0.3)' }} />
      {[0, 1, 2, 3].map((i) => slot(i, COL_X(i), DOCK_Y, true))}
      <HomeIndicator color="#fff" />
    </div>
  );
};

const ITEMS = [
  { x: 520, title: '日本語 / 한국어', sub: 'ボタンひとつで切り替え' },
  { x: 960, title: '運休日もわかる', sub: '土日祝・休業期間は、次の運行日を表示' },
  { x: 1400, title: 'ホーム画面に追加', sub: 'アプリのように開けて、オフラインでも' },
];

export const More = ({ f }) => {
  const sec = Math.floor((f - T.more) / FPS) * 1000;
  const exit = ease(f, [T.end - 4, T.end + 10], [0, 1], EASE_IN);
  const screens = [
    <AppScreen
      key="ko"
      now={KR_T0 + sec}
      st={{ stop: 'toyonaka', dir: 'all', lang: f >= MORE_FRAMES.lang ? 'ko' : 'ja' }}
      fx={{ taps: [tapFx(f, MORE_FRAMES.lang, '#langBtn')] }}
    />,
    <AppScreen
      key="closed"
      now={CLOSED_T0 + sec}
      st={{ stop: 'toyonaka', dir: 'all', lang: 'ja' }}
      fx={{ rings: [ringFx(f, MORE_FRAMES.lang, T.end, '.hero .dep', C.red, { pad: 5 })] }}
    />,
    <HomeScreen key="home" f={f} now={KR_T0 + sec} />,
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 92 }}>
        <Headline lines={['かゆいところにも、手が届く。']} f={f} d={T.more + 4} exitAt={T.end - 6} size={74} align="center" />
      </div>
      {ITEMS.map((it, i) => {
        const p = sp(f, MORE_FRAMES.phones[i], { damping: 17, stiffness: 120 });
        const y = mix(1500, Y, p) + exit * 900;
        const capTop = y + (BODY_H * SCALE) / 2 + 26;
        return (
          <React.Fragment key={i}>
            <ModelPhone pose={{ x: it.x, y, s: SCALE, rx: 0, ry: (i - 1) * -6, rz: (1 - p) * (i - 1) * 8 }} glare={0.5}>{screens[i]}</ModelPhone>
            <div style={{
              position: 'absolute', left: it.x - 260, width: 520, top: capTop, textAlign: 'center',
              opacity: ease(f, [MORE_FRAMES.phones[i] + 8, MORE_FRAMES.phones[i] + 18], [0, 1]) * (1 - exit),
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.navy }}>{it.title}</div>
              <div style={{ fontSize: 23, fontWeight: 600, color: C.muted, marginTop: 4 }}>{it.sub}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
