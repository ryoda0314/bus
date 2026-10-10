import React from 'react';
import { HomeIndicator, SCREEN_W, StatusBar } from '../Phone.jsx';
import MODEL from '../model.json';
import { C, FONT, RIDE_DEP, hm, left, mix, sp } from '../theme.js';

// ネイティブ版のロック画面まわり（../ios/Widget/RideLiveActivity.swift・RideWidget.swift と同じ並びと文言）。
// 「乗る」を押した便（12:45 直行）でアプリが作る値：
//   label = 乗るバス、stop = 豊中 → 吹田、time = 12:45、depWord = 発、kind = 直行、arrival = 吹田（直行） 13:15 着予定、note = なし
export const RIDE = { label: '乗るバス', stop: '豊中 → 吹田', time: '12:45', dep: '発', kind: '直行', arrival: '吹田（直行） 13:15 着予定' };
const NAVY = C.navy; // Palette.widgetNavy
const pad2 = (n) => String(n).padStart(2, '0');
// Text(timerInterval:) と同じ「m:ss」
export const timer = (now) => {
  const [m, s] = left(RIDE_DEP, now);
  return `${m}:${pad2(s)}`;
};

const WALL = `radial-gradient(90% 55% at 20% 18%, rgba(140,120,255,0.55) 0%, rgba(140,120,255,0) 70%),
  radial-gradient(80% 50% at 90% 85%, rgba(255,120,160,0.35) 0%, rgba(255,120,160,0) 70%),
  linear-gradient(170deg, #2d2a7e 0%, #1c1a5a 55%, #120f3d 100%)`;

// ロック画面のライブアクティビティ（LockScreenView）。k は拡大率
export const LiveActivity = ({ now, k = 1, width = 365 }) => (
  <div style={{
    width: width * k, boxSizing: 'border-box', padding: 16 * k, borderRadius: 24 * k, background: NAVY, color: '#fff',
    display: 'flex', alignItems: 'center', gap: 12 * k, fontFamily: FONT, lineHeight: 1.25,
  }}>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 * k }}>
      <div style={{ fontSize: 12 * k, fontWeight: 700, opacity: 0.75 }}>{RIDE.label}</div>
      <div style={{ fontSize: 14 * k }}>{RIDE.stop}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * k }}>
        <span style={{ fontSize: 22 * k, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{RIDE.time}{RIDE.dep}</span>
        <span style={{ fontSize: 12 * k, fontWeight: 700 }}>{RIDE.kind}</span>
      </div>
      <div style={{ fontSize: 12 * k, opacity: 0.8, whiteSpace: 'nowrap' }}>{RIDE.arrival}</div>
    </div>
    <div style={{ fontSize: 36 * k, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{timer(now)}</div>
  </div>
);

export const LockScreen = ({ f, now, laAt }) => {
  const la = sp(f, laAt, { damping: 17, stiffness: 150, mass: 0.9 });
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
      {/* ライブアクティビティ（画面の下、ボタンの上に出る） */}
      <div style={{
        position: 'absolute', left: (SCREEN_W - 365) / 2, bottom: 128, opacity: Math.min(1, la * 2),
        transform: `translateY(${(1 - la) * 70}px) scale(${0.92 + 0.08 * la})`, transformOrigin: '50% 100%',
      }}>
        <LiveActivity now={now} />
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

// SF Symbols の bus.fill に似せたバス（白。窓とライトは抜き）
export const BusGlyph = ({ size = 16, color = '#fff', hole = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path d="M4.5 4A3 3 0 0 1 7.5 1h9a3 3 0 0 1 3 3v13.2a1.8 1.8 0 0 1-1.2 1.7v1.9a1.2 1.2 0 0 1-1.2 1.2h-1.4a1.2 1.2 0 0 1-1.2-1.2V19H9.5v1.8a1.2 1.2 0 0 1-1.2 1.2H6.9a1.2 1.2 0 0 1-1.2-1.2v-1.9a1.8 1.8 0 0 1-1.2-1.7z" fill={color} />
    <rect x="6.6" y="4.2" width="10.8" height="7" rx="1.2" fill={hole} />
    <circle cx="8.3" cy="15" r="1.25" fill={hole} />
    <circle cx="15.7" cy="15" r="1.25" fill={hole} />
  </svg>
);

// Dynamic Island のライブアクティビティ（コンパクト：左にバスと発車時刻、右にカウントダウン）。
// p = 0 で端末の島の大きさ、1 で広がった大きさ。k は拡大率（カード用）
const ISL = MODEL.island;
export const ISLAND_W = 236;
export const ISLAND_H = 36;
export const IslandPill = ({ now, p = 1, k = 1 }) => {
  const w = mix(ISL.w, ISLAND_W, p) * k;
  const h = mix(ISL.h, ISLAND_H, p) * k;
  const c = Math.max(0, (p - 0.55) / 0.45);
  return (
    <div style={{
      width: w, height: h, borderRadius: h / 2, background: '#000', color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: `0 ${13 * k}px 0 ${12 * k}px`, boxSizing: 'border-box', fontFamily: FONT,
      fontSize: 16 * k, fontWeight: 600, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', whiteSpace: 'nowrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 * k, opacity: c }}>
        <BusGlyph size={17 * k} />
        <span>{RIDE.time}</span>
      </div>
      <span style={{ opacity: c }}>{timer(now)}</span>
    </div>
  );
};

// 画面の中に置く島（端末の島の位置から、画面の中央へ広がる）
export const IslandOnScreen = ({ now, p }) => {
  const w = mix(ISL.w, ISLAND_W, p);
  const cx = mix(ISL.left + ISL.w / 2, SCREEN_W / 2, p);
  const top = mix(ISL.top, 11, p);
  return (
    <div style={{ position: 'absolute', left: cx - w / 2, top, zIndex: 320 }}>
      <IslandPill now={now} p={p} />
    </div>
  );
};

// 端末の外に出す拡大カード
const CardLabel = ({ children }) => (
  <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.18em', color: C.navy, marginBottom: 12, fontFamily: FONT }}>{children}</div>
);
export const LiveActivityCard = ({ now }) => (
  <div>
    <CardLabel>ロック画面</CardLabel>
    <div style={{ borderRadius: 30, boxShadow: '0 30px 60px -24px rgba(22,20,74,0.55)' }}>
      <LiveActivity now={now} k={1.25} />
    </div>
  </div>
);
export const IslandCard = ({ now }) => (
  <div>
    <CardLabel>DYNAMIC ISLAND</CardLabel>
    <div style={{ display: 'inline-block', borderRadius: 40, boxShadow: '0 26px 50px -22px rgba(22,20,74,0.6)' }}>
      <IslandPill now={now} p={1} k={2} />
    </div>
  </div>
);

// ホーム画面のウィジェット（中。RideWidget.swift の systemMedium）
export const WidgetMedium = ({ now, w = 338, h = 158 }) => (
  <div style={{
    width: w, height: h, boxSizing: 'border-box', padding: 16, borderRadius: 22, background: NAVY, color: '#fff',
    display: 'flex', flexDirection: 'column', fontFamily: FONT, lineHeight: 1.22,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{RIDE.label}</div>
    <div style={{ fontSize: 13 }}>{RIDE.stop}</div>
    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, whiteSpace: 'pre' }}>{`${RIDE.time}${RIDE.dep}  ${RIDE.kind}`}</div>
    <div style={{ flex: 1 }} />
    <div style={{ fontSize: 36, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>{timer(now)}</div>
    <div style={{ fontSize: 11, opacity: 0.75 }}>{RIDE.arrival}</div>
  </div>
);
