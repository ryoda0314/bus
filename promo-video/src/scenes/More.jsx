import React from 'react';
import { AppFrame, AppScreen, ringFx, tapFx } from '../AppScreen.jsx';
import { AppIcon } from '../icons.jsx';
import { BODY_H, ModelPhone } from '../ModelPhone.jsx';
import { Headline } from '../text.jsx';
import { C, CLOSED_T0, EASE_IN, EASE_OUT, FONT, FPS, KR_T0, T, WEB_HOST, ease, mix, sp } from '../theme.js';
import { HomeScreen } from './Home.jsx';

// 34–38秒：ほかにも。3台を拍ごとに並べる
//   左：日本語 → 한국어（言語ボタンを押す）  中：運休日（土曜。祝日をはさんで次は 10/13(火)）
//   右：ホーム画面のウィジェット（中。RideWidget.swift の systemMedium）
export const MORE_FRAMES = { phones: [T.more + 6, T.more + 18, T.more + 30], lang: T.more + 45 };
const SCALE = 0.64;
const Y = 600;

const ITEMS = [
  { x: 520, title: '日本語 / 한국어', sub: 'ボタンひとつで切り替え' },
  { x: 960, title: '運休日もわかる', sub: '土日祝・休業期間は、次の運行日を表示' },
  { x: 1400, title: 'ホーム画面のウィジェット', sub: '乗るバスを、ホーム画面にも' },
];
// Web 版の3つめ
const ITEM_WEB = { x: 1430, title: 'パソコンでも', sub: 'ブラウザがあれば、どの端末でも' };

// PC のブラウザの窓（中は index.html。幅が広いと、アプリは真ん中に 480px の列で出る）
const DESK = { w: 1080, h: 700, bar: 78 };
const DesktopBrowser = ({ now, st }) => (
  <div style={{
    position: 'relative', width: DESK.w, height: DESK.h, borderRadius: 16, overflow: 'hidden', background: '#fff', fontFamily: FONT,
    boxShadow: '0 60px 110px -40px rgba(22,20,74,0.55), 0 0 0 1px rgba(22,20,74,0.12)',
  }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: '#dee1e6' }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', left: 18 + i * 22, top: 14, width: 12, height: 12, borderRadius: '50%', background: '#b9bcc2' }} />)}
      <div style={{
        position: 'absolute', left: 96, top: 6, width: 230, height: 34, borderRadius: '10px 10px 0 0', background: '#fff',
        display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, fontSize: 14, color: '#222',
      }}>
        <AppIcon size={16} style={{ borderRadius: 4 }} /> 次のバス
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, height: DESK.bar - 40, background: '#fff', borderBottom: '1px solid #e3e3e8' }}>
      <div style={{
        position: 'absolute', left: 110, right: 110, top: 5, height: 28, borderRadius: 14, background: '#f1f3f4',
        display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 14, color: '#333', gap: 8,
      }}>
        <svg width="10" height="13" viewBox="0 0 11 14">
          <rect x="1" y="6" width="9" height="7" rx="1.5" fill="#5f6368" />
          <path d="M3 6V4.2a2.5 2.5 0 015 0V6" fill="none" stroke="#5f6368" strokeWidth="1.6" />
        </svg>
        {WEB_HOST}
      </div>
    </div>
    <AppFrame now={now} st={st} native={false} width={DESK.w} height={DESK.h - DESK.bar} style={{ left: 0, top: DESK.bar }} />
  </div>
);

// variant = '3d'（BusPromo3D）では、3台を内向きに傾け、回りながら入れる
export const More = ({ f, variant = 'flat' }) => {
  const sec = Math.floor((f - T.more) / FPS) * 1000;
  const exit = ease(f, [T.end - 4, T.end + 10], [0, 1], EASE_IN);
  const screens = [
    <AppScreen
      key="ko"
      now={KR_T0 + sec}
      st={{ stop: 'toyonaka', dir: 'all', lang: f >= MORE_FRAMES.lang ? 'ko' : 'ja' }}
      fx={{ taps: [tapFx(f, MORE_FRAMES.lang, '#langBtn')] }}
      native={variant !== 'web'}
    />,
    <AppScreen
      key="closed"
      now={CLOSED_T0 + sec}
      st={{ stop: 'toyonaka', dir: 'all', lang: 'ja' }}
      fx={{ rings: [ringFx(f, MORE_FRAMES.lang, T.end, '.hero .dep', C.red, { pad: 5 })] }}
      native={variant !== 'web'}
    />,
    <HomeScreen key="home" now={KR_T0 + sec} widget />,
  ];
  const web = variant === 'web';
  const items = web ? [ITEMS[0], ITEMS[1], ITEM_WEB] : ITEMS;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 92 }}>
        <Headline lines={['かゆいところにも、手が届く。']} f={f} d={T.more + 4} exitAt={T.end - 6} size={74} align="center" />
      </div>
      {items.map((it, i) => {
        const p = sp(f, MORE_FRAMES.phones[i], { damping: 17, stiffness: 120 });
        const y = mix(1500, Y, p) + exit * 900;
        const capTop = y + (BODY_H * SCALE) / 2 + 26;
        if (web && i === 2) {
          // PC のブラウザ（下の端を端末にそろえる）
          const k = 0.5;
          const bottom = y + (BODY_H * SCALE) / 2 - 8;
          return (
            <React.Fragment key={i}>
              <div style={{
                position: 'absolute', left: it.x - (DESK.w * k) / 2, top: bottom - DESK.h * k, width: DESK.w, height: DESK.h,
                transform: `scale(${k}) rotate(${(1 - p) * 6}deg)`, transformOrigin: '0 0',
              }}>
                <DesktopBrowser now={KR_T0 + sec} st={{ stop: 'toyonaka', dir: 'all', lang: 'ja' }} />
              </div>
              <div style={{
                position: 'absolute', left: it.x - 300, width: 600, top: capTop, textAlign: 'center',
                opacity: ease(f, [MORE_FRAMES.phones[i] + 8, MORE_FRAMES.phones[i] + 18], [0, 1]) * (1 - exit),
              }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.navy }}>{it.title}</div>
                <div style={{ fontSize: 23, fontWeight: 600, color: C.muted, marginTop: 4 }}>{it.sub}</div>
              </div>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={i}>
            <ModelPhone pose={variant === '3d' ? {
              x: it.x, y, s: SCALE, rx: 6, rz: (1 - p) * (i - 1) * 8,
              ry: (i - 1) * -18 + (1 - ease(f, [MORE_FRAMES.phones[i], MORE_FRAMES.phones[i] + 28], [0, 1], EASE_OUT)) * 160,
            } : { x: it.x, y, s: SCALE, rx: 0, ry: (i - 1) * -6, rz: (1 - p) * (i - 1) * 8 }} glare={0.5}>{screens[i]}</ModelPhone>
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
