import React from 'react';
import { FONT } from './theme.js';

// 端末の画面（DOM）の論理サイズ。3Dモデルの表示部分（約 393.7x852）に貼る（ModelPhone.jsx）
export const SCREEN_W = 393;
export const SCREEN_H = 852;
export const STATUS_H = 54;
export const APP_H = SCREEN_H - STATUS_H; // アプリの表示域（ステータスバーの下から）

// iPhone のステータスバー。time を空にすると時刻は出さない（ロック画面）
export const StatusBar = ({ time, color = '#fff', bg = 'transparent' }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STATUS_H, zIndex: 250, color, background: bg, fontFamily: FONT }}>
    {time && (
      <div style={{
        position: 'absolute', left: 0, width: 140, top: 17, textAlign: 'center', fontSize: 17, fontWeight: 650,
        letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
      }}>{time}</div>
    )}
    <div style={{ position: 'absolute', right: 32, top: 21, display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill={color} />)}
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.2l2.3-2.6a3.3 3.3 0 00-4.6 0z" fill={color} />
        <path d="M3.4 6.2a6.6 6.6 0 019.2 0l-1.4 1.6a4.4 4.4 0 00-6.4 0z" fill={color} />
        <path d="M1 3.6a10 10 0 0114 0l-1.3 1.5a8 8 0 00-11.4 0z" fill={color} />
      </svg>
      <div style={{ position: 'relative', width: 25, height: 12, borderRadius: 4, border: `1.2px solid ${color}`, opacity: 0.95, boxSizing: 'border-box', padding: 1.5 }}>
        <div style={{ width: '78%', height: '100%', borderRadius: 2, background: color }} />
        <div style={{ position: 'absolute', right: -3.5, top: 3, width: 2, height: 4, borderRadius: 1, background: color }} />
      </div>
    </div>
  </div>
);

export const HomeIndicator = ({ color = '#111122', opacity = 0.9 }) => (
  <div style={{
    position: 'absolute', bottom: 8, left: SCREEN_W / 2 - 67, width: 134, height: 5, borderRadius: 3,
    background: color, opacity, zIndex: 250,
  }} />
);
