import React from 'react';
import { AppIcon } from '../icons.jsx';
import { HomeIndicator, SCREEN_W } from '../Phone.jsx';
import { FONT, hm } from '../theme.js';
import { ISLAND_W, IslandOnScreen, WidgetMedium } from './LockScreen.jsx';

// iPhone のホーム画面。ほかのアプリは名前のない仮のアイコン（実在のアプリに似せない）。
//   widget = true … 上の2段に「次のバス」のウィジェット（中）を置く
//   island = 0〜1 … Dynamic Island にライブアクティビティ（コンパクト）を広げる
const PALETTE = ['#f6c453', '#7ad3a8', '#ff8f70', '#6fb6ff', '#c69cff', '#5fd0d8', '#ffa8c5', '#a3d36b', '#f0a35e', '#8f9cff'];
const ICON = 62;
const COL_X = (i) => 26 + i * ((SCREEN_W - 52 - ICON) / 3);
const ROW_Y = (r) => 76 + r * 100;
const DOCK_Y = 852 - 22 - 92 + 15;

const Placeholder = ({ i, x, y, dock }) => {
  const col = PALETTE[(i * 7 + (dock ? 3 : 0)) % PALETTE.length];
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: ICON }}>
      <div style={{
        width: ICON, height: ICON, borderRadius: 14, background: `linear-gradient(160deg, ${col}, ${col}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 24, height: 24, borderRadius: i % 3 === 0 ? '50%' : 6, border: '3.5px solid rgba(255,255,255,0.9)', transform: i % 3 === 2 ? 'rotate(45deg)' : undefined }} />
      </div>
      {!dock && <div style={{ margin: '9px auto 0', width: 34 + (i % 3) * 6, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.55)' }} />}
    </div>
  );
};

const OurApp = ({ x, y, s = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: ICON, textAlign: 'center', opacity: Math.min(1, s * 2) }}>
    <div style={{ transform: `scale(${s})` }}>
      <AppIcon size={ICON} style={{ borderRadius: 14, boxShadow: '0 6px 14px -6px rgba(0,0,0,0.35)' }} />
    </div>
    <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>次のバス</div>
  </div>
);
// 「次のバス」のアイコンの中心（ウィジェットなしの並び。2段目の2つめ）
export const APP_ICON_CENTER = [COL_X(1) + ICON / 2, ROW_Y(1) + ICON / 2];

// Dynamic Island が広がっているときのステータスバー（時刻は左の端、右は Wi-Fi と電池だけ）
const NarrowStatus = ({ time }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 250, color: '#fff', fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 0, width: (SCREEN_W - ISLAND_W) / 2, top: 17, textAlign: 'center', fontSize: 16, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{time}</div>
    <div style={{ position: 'absolute', right: 0, width: (SCREEN_W - ISLAND_W) / 2, top: 21, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
      <svg width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.2l2.3-2.6a3.3 3.3 0 00-4.6 0z" fill="#fff" />
        <path d="M3.4 6.2a6.6 6.6 0 019.2 0l-1.4 1.6a4.4 4.4 0 00-6.4 0z" fill="#fff" />
        <path d="M1 3.6a10 10 0 0114 0l-1.3 1.5a8 8 0 00-11.4 0z" fill="#fff" />
      </svg>
      <div style={{ position: 'relative', width: 24, height: 12, borderRadius: 4, border: '1.2px solid #fff', boxSizing: 'border-box', padding: 1.5 }}>
        <div style={{ width: '78%', height: '100%', borderRadius: 2, background: '#fff' }} />
      </div>
    </div>
  </div>
);

const WideStatus = ({ time }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 250, color: '#fff', fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 0, width: 140, top: 17, textAlign: 'center', fontSize: 17, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{time}</div>
    <div style={{ position: 'absolute', right: 32, top: 21, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill="#fff" />)}
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.2l2.3-2.6a3.3 3.3 0 00-4.6 0z" fill="#fff" />
        <path d="M3.4 6.2a6.6 6.6 0 019.2 0l-1.4 1.6a4.4 4.4 0 00-6.4 0z" fill="#fff" />
        <path d="M1 3.6a10 10 0 0114 0l-1.3 1.5a8 8 0 00-11.4 0z" fill="#fff" />
      </svg>
      <div style={{ position: 'relative', width: 25, height: 12, borderRadius: 4, border: '1.2px solid #fff', boxSizing: 'border-box', padding: 1.5 }}>
        <div style={{ width: '78%', height: '100%', borderRadius: 2, background: '#fff' }} />
      </div>
    </div>
  </div>
);

// appScale：「次のバス」のアイコンの大きさ（0 で無し。ホーム画面に追加したときに弾ませる）
export const HomeScreen = ({ now, widget = false, island = null, appScale = 1 }) => {
  const slots = [];
  for (let i = 0; i < 20; i++) {
    const r = Math.floor(i / 4);
    const c = i % 4;
    if (widget && r < 2) continue; // ウィジェットが上の2段を使う
    const appSlot = widget ? 9 : 5; // 次のバス
    slots.push(i === appSlot
      ? <OurApp key={i} x={COL_X(c)} y={ROW_Y(r)} s={appScale} />
      : <Placeholder key={i} i={i} x={COL_X(c)} y={ROW_Y(r)} />);
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(165deg, #7f8fe6 0%, #ab9be3 52%, #efc3d6 100%)' }}>
      {island != null && island > 0.3 ? <NarrowStatus time={hm(now)} /> : <WideStatus time={hm(now)} />}
      {widget && (
        <div style={{ position: 'absolute', left: (SCREEN_W - 338) / 2, top: ROW_Y(0) - 4 }}>
          <WidgetMedium now={now} />
        </div>
      )}
      {slots}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 22, height: 92, borderRadius: 34, background: 'rgba(255,255,255,0.3)' }} />
      {[0, 1, 2, 3].map((i) => <Placeholder key={`d${i}`} i={i} x={COL_X(i)} y={DOCK_Y} dock />)}
      {island != null && <IslandOnScreen now={now} p={island} />}
      <HomeIndicator color="#fff" />
    </div>
  );
};
