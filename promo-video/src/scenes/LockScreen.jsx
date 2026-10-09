import React from 'react';
import { HomeIndicator, SCREEN_W, StatusBar } from '../Phone.jsx';
import { C, FONT, RIDE_DEP, hm, left, sp } from '../theme.js';

// iPhone のロック画面と、Scriptable のウィジェット（../widget/BusRide.js の accessoryRectangular と同じ並び）。
// 文言は、アプリの「ロック画面のウィジェットに表示」が 12:45 直行の便で渡す値と同じ：
//   s = 乗り場、time = 発車時刻、k = 直行/箕面経由/電気バス、a = 到着予定（arrText）
export const WIDGET = { s: '豊中 → 吹田', time: '12:45', k: '直行', a: '吹田（直行） 13:15 着予定' };
const pad2 = (n) => String(n).padStart(2, '0');
const timer = (now) => {
  const [m, s] = left(RIDE_DEP, now);
  return `${m}:${pad2(s)}`;
};

const WALL = `radial-gradient(90% 55% at 20% 18%, rgba(140,120,255,0.55) 0%, rgba(140,120,255,0) 70%),
  radial-gradient(80% 50% at 90% 85%, rgba(255,120,160,0.35) 0%, rgba(255,120,160,0) 70%),
  linear-gradient(170deg, #2d2a7e 0%, #1c1a5a 55%, #120f3d 100%)`;

const Widget = ({ now, scale = 1 }) => (
  <div style={{ width: 172 * scale, color: '#fff', lineHeight: 1.18, textAlign: 'left' }}>
    <div style={{ fontSize: 12 * scale, fontWeight: 800, whiteSpace: 'pre', letterSpacing: '-0.01em' }}>
      {WIDGET.s}  {WIDGET.time}発 {WIDGET.k}
    </div>
    <div style={{ fontSize: 26 * scale, fontWeight: 800, fontVariantNumeric: 'tabular-nums', margin: `${1 * scale}px 0` }}>{timer(now)}</div>
    <div style={{ fontSize: 11 * scale, fontWeight: 500, whiteSpace: 'nowrap', opacity: 0.92 }}>{WIDGET.a}</div>
  </div>
);

export const LockScreen = ({ f, now, widgetAt }) => {
  const w = sp(f, widgetAt, { damping: 14, stiffness: 170, mass: 0.8 });
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: FONT, color: '#fff', background: WALL }}>
      <StatusBar time="" color="#fff" />
      <div style={{ position: 'absolute', top: 92, width: '100%', textAlign: 'center', fontSize: 21, fontWeight: 700, opacity: 0.92 }}>
        10月8日 木曜日
      </div>
      <div style={{
        position: 'absolute', top: 108, width: '100%', textAlign: 'center', fontSize: 108, fontWeight: 700,
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
      }}>{hm(now)}</div>
      <div style={{
        position: 'absolute', top: 248, left: (SCREEN_W - 172) / 2, transform: `scale(${0.6 + 0.4 * w})`,
        opacity: Math.min(1, w * 1.8), transformOrigin: '50% 40%',
      }}>
        <Widget now={now} />
      </div>
      {/* 懐中電灯とカメラ */}
      {[46, SCREEN_W - 46 - 50].map((x, i) => (
        <div key={i} style={{
          position: 'absolute', left: x, bottom: 62, width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {i === 0 ? (
            <svg width="16" height="24" viewBox="0 0 16 24"><path d="M2 1h12v5l-3 4v12H5V10L2 6z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="24" height="20" viewBox="0 0 24 20"><path d="M2 5h5l2-3h6l2 3h5v13H2z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="11" r="4" fill="none" stroke="#fff" strokeWidth="1.8" /></svg>
          )}
        </div>
      ))}
      <HomeIndicator color="#fff" opacity={0.9} />
    </div>
  );
};

// ウィジェットを大きくして端末の外に出したカード（読める大きさで見せる）
export const WidgetCard = ({ now }) => (
  <div style={{
    display: 'inline-block', padding: '26px 34px 28px', background: '#1d1a5c', borderRadius: 28,
    boxShadow: '0 30px 60px -24px rgba(22,20,74,0.6)', fontFamily: FONT,
  }}>
    <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.18em', color: C.sel, marginBottom: 10 }}>ロック画面のウィジェット</div>
    <Widget now={now} scale={2.3} />
  </div>
);
