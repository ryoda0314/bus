import React from 'react';
import { C, EASE_IN, ease, sp } from './theme.js';

// segs: 'テキスト' または [{ t: 'テキスト', color: '#…' }, ...]
const Segs = ({ segs }) => (typeof segs === 'string' ? segs : segs.map((s, i) => (
  <span key={i} style={s.color ? { color: s.color } : undefined}>{s.t}</span>
)));

// 行ごとにマスクの下からせり上がる見出し。exitAt からは上へ抜けていく（前作の Headline と同じ動き）
export const Headline = ({ lines, f, d = 0, exitAt = Infinity, size = 92, align = 'left', color = C.navy, stagger = 4 }) => (
  <div style={{ textAlign: align }}>
    {lines.map((segs, i) => {
      const pin = sp(f, d + i * stagger, { damping: 20, stiffness: 140, mass: 0.9 });
      const pout = ease(f, [exitAt + i * 2, exitAt + i * 2 + 9], [0, 1], EASE_IN);
      const y = (1 - pin) * 112 - pout * 112;
      return (
        <div key={i} style={{ overflow: 'hidden', padding: '0.06em 0 0.14em', marginBottom: -size * 0.16 }}>
          <div style={{
            fontSize: size, fontWeight: 900, lineHeight: 1.14, letterSpacing: '-0.01em', color,
            transform: `translateY(${y}%)`, whiteSpace: 'nowrap',
          }}>
            <Segs segs={segs} />
          </div>
        </div>
      );
    })}
  </div>
);

export const SubCopy = ({ text, f, d = 0, exitAt = Infinity, size = 32, align = 'left', color = C.muted, weight = 600 }) => {
  const pin = sp(f, d, { damping: 22, stiffness: 120 });
  const out = ease(f, [exitAt, exitAt + 8], [0, 1], EASE_IN);
  return (
    <div style={{
      fontSize: size, fontWeight: weight, lineHeight: 1.6, color, textAlign: align, whiteSpace: 'pre-line',
      opacity: ease(f, [d, d + 10], [0, 1]) * (1 - out), transform: `translateY(${(1 - pin) * 24 - out * 20}px)`,
    }}>{text}</div>
  );
};

// 「01  カウントダウン」の章ラベル（番号は乗り場タブのような紺の札）
export const ChapterLabel = ({ num, label, f, d = 0, exitAt = Infinity }) => {
  const p = sp(f, d, { damping: 20, stiffness: 150 });
  const out = ease(f, [exitAt, exitAt + 8], [0, 1], EASE_IN);
  const lineW = 46 * ease(f, [d + 2, d + 14], [0, 1]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: ease(f, [d, d + 6], [0, 1]) * (1 - out), transform: `translateX(${(1 - p) * -24}px)`,
    }}>
      <span style={{
        fontSize: 24, fontWeight: 900, color: '#fff', background: C.navy, padding: '5px 12px 6px',
        letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
      }}>{num}</span>
      <span style={{ width: lineW, height: 3, background: C.navy, opacity: 0.35 }} />
      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.22em', color: C.navy }}>{label}</span>
    </div>
  );
};

// 1文字ずつ弾んで出るタイポ（フック・ロゴ・エンドカード用）
export const CharPop = ({ segs, f, d = 0, stagger = 1.4, size = 96, exitAt = Infinity, color = C.navy, weight = 900, spacing = '-0.01em' }) => {
  const flat = [];
  (typeof segs === 'string' ? [{ t: segs }] : segs).forEach((s) => [...s.t].forEach((ch) => flat.push({ ch, s })));
  return (
    <div style={{ fontSize: size, fontWeight: weight, letterSpacing: spacing, lineHeight: 1.15, whiteSpace: 'nowrap', color }}>
      {flat.map(({ ch, s }, i) => {
        const p = sp(f, d + i * stagger, { damping: 12, stiffness: 200, mass: 0.7 });
        const out = ease(f, [exitAt + i * 0.6, exitAt + i * 0.6 + 7], [0, 1], EASE_IN);
        return (
          <span key={i} style={{
            display: 'inline-block', color: s.color || undefined,
            opacity: Math.min(1, p * 1.6) * (1 - out),
            transform: `translateY(${(1 - p) * 0.55 * size - out * 0.4 * size}px) scale(${0.5 + 0.5 * p})`,
          }}>{ch}</span>
        );
      })}
    </div>
  );
};
