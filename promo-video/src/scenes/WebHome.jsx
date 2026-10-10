import React from 'react';
import { AppIcon } from '../icons.jsx';
import { SCREEN_H, SCREEN_W } from '../Phone.jsx';
import { C, FONT, WEB_HOST } from '../theme.js';

// Web 版の動画（BusPromoWeb）の 04：Safari の共有メニューから「ホーム画面に追加」する画面。
// iOS の画面の並びに似せた簡単な絵（共有先のアプリは名前のない仮の丸にして、実在のアプリに似せない）。
const BLUE = '#3478f6';
export const SHEET_TOP = SCREEN_H - 520;
const ROW_H = 46;
const GROUP_TOP = 190;
const ROWS = ['コピー', 'リーディングリストに追加', 'ブックマークを追加', 'ホーム画面に追加', 'ページを検索'];
export const ADD_ROW = 3;
// タップする位置（画面の中の座標）
export const WEB_TAPS = {
  row: [SCREEN_W / 2, SHEET_TOP + GROUP_TOP + ADD_ROW * ROW_H + ROW_H / 2],
  add: [SCREEN_W - 38, 60 + 28],
};

const RowIcon = ({ i }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#111" strokeWidth="1.6" strokeLinejoin="round">
    {i === 0 && <><rect x="6" y="6" width="12" height="13" rx="2" /><path d="M4 15V4.5A1.5 1.5 0 015.5 3H14" /></>}
    {i === 1 && <><circle cx="6" cy="13" r="3.5" /><circle cx="16" cy="13" r="3.5" /><path d="M9.5 13h3" /></>}
    {i === 2 && <path d="M4 4c2.5-1 5-1 7 .8 2-1.8 4.5-1.8 7-.8v14c-2.5-1-5-1-7 .8-2-1.8-4.5-1.8-7-.8zM11 5v14" />}
    {i === 3 && <><rect x="3" y="3" width="16" height="16" rx="3.5" /><path d="M11 7v8M7 11h8" /></>}
    {i === 4 && <><circle cx="9.5" cy="9.5" r="5.5" /><path d="M13.5 13.5L19 19" /></>}
  </svg>
);

// 共有シート。p = 0〜1（下からせり上がる）、press = 「ホーム画面に追加」を押した濃さ
export const ShareSheet = ({ p, press = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 280, fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.3 * p})` }} />
    <div style={{
      position: 'absolute', left: 0, right: 0, top: SHEET_TOP, height: 520, background: '#f2f2f7', borderRadius: '14px 14px 0 0',
      transform: `translateY(${(1 - p) * 540}px)`, boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
    }}>
      <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AppIcon size={44} style={{ borderRadius: 10 }} />
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>次のバス</div>
          <div style={{ fontSize: 13, color: '#8a8a8e' }}>{WEB_HOST}</div>
        </div>
      </div>
      <div style={{
        position: 'absolute', right: 16, top: 20, width: 30, height: 30, borderRadius: '50%', background: '#e3e3e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c7c82', fontSize: 15, fontWeight: 700,
      }}>✕</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 76, height: 0.5, background: 'rgba(0,0,0,0.15)' }} />
      {/* 共有先（名前のない仮の丸） */}
      {['#7ad3a8', '#6fb6ff', '#f6c453', '#c69cff', '#ff8f70'].map((col, i) => (
        <div key={i} style={{ position: 'absolute', left: 20 + i * 76, top: 94, width: 58, textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: col }} />
          <div style={{ margin: '8px auto 0', width: 36 + (i % 2) * 8, height: 7, borderRadius: 4, background: '#d1d1d6' }} />
        </div>
      ))}
      <div style={{ position: 'absolute', left: 16, right: 16, top: GROUP_TOP, background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        {ROWS.map((label, i) => (
          <div key={label} style={{
            height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
            fontSize: 16, color: '#111', borderTop: i ? '0.5px solid rgba(0,0,0,0.12)' : 'none',
            background: i === ADD_ROW ? `rgba(52,120,246,${0.1 + 0.14 * press})` : '#fff', fontWeight: i === ADD_ROW ? 700 : 400,
          }}>
            <span>{label}</span>
            <RowIcon i={i} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 「ホーム画面に追加」の画面。p = 0〜1（下からせり上がる）、press = 「追加」を押した濃さ
export const AddDialog = ({ p, press = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 285, fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.35 * p})` }} />
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 60, bottom: 0, background: '#f2f2f7', borderRadius: '14px 14px 0 0',
      transform: `translateY(${(1 - p) * 820}px)`,
    }}>
      <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
        <span style={{ position: 'absolute', left: 16, color: BLUE }}>キャンセル</span>
        <span style={{ fontWeight: 700, color: '#111' }}>ホーム画面に追加</span>
        <span style={{ position: 'absolute', right: 16, color: BLUE, fontWeight: 700, opacity: 1 - 0.45 * press }}>追加</span>
      </div>
      <div style={{ margin: '16px 16px 0', background: '#fff', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <AppIcon size={60} style={{ borderRadius: 13 }} />
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
          <div style={{ fontSize: 17, color: '#111', borderBottom: '0.5px solid rgba(0,0,0,0.15)', paddingBottom: 6 }}>次のバス</div>
          <div style={{ fontSize: 13, color: '#8a8a8e', paddingTop: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>https://{WEB_HOST}/</div>
        </div>
      </div>
      <div style={{ margin: '10px 32px 0', fontSize: 13, color: '#6c6c70', lineHeight: 1.5 }}>
        ホーム画面にアイコンを追加します。
      </div>
    </div>
  </div>
);

// 機内モードのカード（端末の外に出す）
export const OfflineCard = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 14, background: C.navy, color: '#fff', padding: '14px 24px 16px',
    borderRadius: 18, fontFamily: FONT, boxShadow: '0 24px 50px -24px rgba(22,20,74,0.6)',
  }}>
    <svg width="30" height="23" viewBox="0 0 24 18">
      <path d="M23 9c0-1-1-1.6-2.2-1.6H15L10 0H7.4l2.8 7.4H4.6L2.6 4.6H.6L2 9 .6 13.4h2l2-2.8h5.6L7.4 18H10l5-7.4h5.8C22 10.6 23 10 23 9z" fill="#fff" />
    </svg>
    <span style={{ fontSize: 30, fontWeight: 900 }}>機内モードでも</span>
  </div>
);
