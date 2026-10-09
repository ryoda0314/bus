import React from 'react';
import TT from '../timetable.json';
import { C, EASE_IN, EASE_IN_OUT, alpha, appNow, ease, hm, mix, sp } from '../theme.js';

// 0–4秒：掲示の時刻表（3つの乗り場を1枚に並べた掲示物。時刻は index.html と同じ）に
// 「いま 12:35」と吹き出しが出て、「次のバス、あと何分？」。ドロップの直前に分のセルが中央へ吸い込まれる。
const PW = 1560;
const PH = 900;
const HEAD_H = 118;
const PAD_X = 40;
const GAP = 30;
const COL_W = (PW - PAD_X * 2 - GAP * 2) / 3;
const COLHEAD_Y = 142;
const COLHEAD_H = 56;
const ROW_Y0 = 212;
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i);
const ROW_H = (PH - ROW_Y0 - 54) / HOURS.length;
const HOUR_W = 62;
const ENTRY_W = 78;
const NOW_ROW = 12 - 7;

const COLS = [
  { id: 'toyonaka', title: '豊中 → 吹田' },
  { id: 'kougaku', title: '工学部前 → 豊中' },
  { id: 'ningen', title: '人間科学部前 → 豊中' },
];

// 「分」のセル（ポスター内の座標）
const CELLS = [];
COLS.forEach((col, ci) => {
  const x0 = PAD_X + ci * (COL_W + GAP);
  const byHour = {};
  for (const s of TT[col.id].times) {
    const [t, flags = ''] = s.split(' ');
    const [h, m] = t.split(':').map(Number);
    (byHour[h] = byHour[h] || []).push({ m, flags });
  }
  for (const [h, list] of Object.entries(byHour)) {
    list.forEach((e, k) => {
      CELLS.push({
        x: x0 + HOUR_W + 12 + k * ENTRY_W, y: ROW_Y0 + (Number(h) - 7) * ROW_H,
        mm: String(e.m).padStart(2, '0'), exp: e.flags.includes('x'),
      });
    });
  }
});

// ポスターの置き方（ゆっくり寄っていく）
const FLY = 100; // ここで問いかけと吹き出しがしぼみ、続いて分のセルが飛ぶ
export const COUNT_AT = [960, 470]; // ドロップで現れるカウントダウンの中心
const posterAt = (f) => {
  const k = ease(f, [0, 112], [0, 1], EASE_IN_OUT);
  return { s: mix(0.955, 1.06, k), r: mix(-1.8, -0.5, k), cx: 960, cy: 552 };
};
const toFrame = (x, y, P) => {
  const dx = (x - PW / 2) * P.s;
  const dy = (y - PH / 2) * P.s;
  const a = (P.r * Math.PI) / 180;
  return [P.cx + dx * Math.cos(a) - dy * Math.sin(a), P.cy + dx * Math.sin(a) + dy * Math.cos(a)];
};
// 遠いセルほど先に飛び出し、ほぼ同時に中心へ着く
const DIST = CELLS.map((c) => {
  const [x, y] = toFrame(c.x + 36, c.y + ROW_H / 2, posterAt(FLY));
  return Math.hypot(x - COUNT_AT[0], y - COUNT_AT[1]);
});
const MAX_D = Math.max(...DIST);
const START = DIST.map((d) => FLY + 3 + (1 - d / MAX_D) * 8); // セルごとの飛び出すフレーム

const Badge = () => (
  <span style={{
    display: 'inline-block', width: 22, height: 22, lineHeight: '22px', textAlign: 'center',
    fontSize: 14, fontWeight: 800, color: '#fff', background: C.red, marginRight: 4, verticalAlign: '3px',
  }}>直</span>
);

const Cell = ({ c, style }) => (
  <div style={{ position: 'absolute', height: ROW_H, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>
    {c.exp ? <Badge /> : <span style={{ display: 'inline-block', width: 26 }} />}
    <span style={{ fontSize: 27, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.mm}</span>
  </div>
);

const Poster = ({ f }) => {
  const P = posterAt(f);
  const fade = ease(f, [FLY + 2, FLY + 16], [0, 1], EASE_IN);
  const mark = ease(f, [4, 20], [0, 1]);
  const now = appNow(f);
  return (
    <div style={{
      position: 'absolute', left: P.cx - PW / 2, top: P.cy - PH / 2, width: PW, height: PH,
      transform: `rotate(${P.r}deg) scale(${P.s})`, opacity: 1 - fade,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', boxShadow: '0 40px 80px -30px rgba(22,20,74,0.35), 0 0 0 1px rgba(22,20,74,0.06)' }} />
      {/* 紺帯 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: HEAD_H, background: C.navy, color: '#fff' }}>
        <div style={{ position: 'absolute', left: 44, top: 18, fontSize: 48, fontWeight: 900, letterSpacing: '0.06em' }}>学内連絡バス 時刻表</div>
        <div style={{ position: 'absolute', left: 46, top: 80, fontSize: 18, fontWeight: 500, opacity: 0.75, letterSpacing: '0.04em' }}>Inter Campus Shuttle Bus</div>
        <div style={{ position: 'absolute', right: 44, top: 38, fontSize: 24, fontWeight: 700, border: '2px solid rgba(255,255,255,0.6)', padding: '6px 16px' }}>
          2026.4.1 改正　平日のみ
        </div>
      </div>
      {COLS.map((col, ci) => {
        const x0 = PAD_X + ci * (COL_W + GAP);
        return (
          <React.Fragment key={col.id}>
            <div style={{
              position: 'absolute', left: x0, top: COLHEAD_Y, width: COL_W, height: COLHEAD_H, background: C.row,
              color: C.navy, fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', paddingLeft: 18, letterSpacing: '0.04em',
            }}>{col.title}</div>
            {HOURS.map((h, i) => (
              <div key={h} style={{
                position: 'absolute', left: x0, top: ROW_Y0 + i * ROW_H, width: COL_W, height: ROW_H,
                background: i % 2 ? '#f5f6fb' : '#fff', borderBottom: `1px solid ${C.line}`,
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: HOUR_W, height: ROW_H, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 27, fontWeight: 900, color: '#fff', background: alpha(C.navy, 0.88),
                  fontVariantNumeric: 'tabular-nums',
                }}>{h}</div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
      {/* いまの行（蛍光ペン） */}
      <div style={{
        position: 'absolute', left: PAD_X, top: ROW_Y0 + NOW_ROW * ROW_H - 2, height: ROW_H + 4,
        width: (PW - PAD_X * 2) * mark, background: 'rgba(255,214,0,0.42)',
      }} />
      {CELLS.map((c, i) => (f < START[i] ? <Cell key={i} c={c} style={{ left: c.x, top: c.y, color: C.ink }} /> : null))}
      {/* いま 12:35 の札（ポスターの左にはみ出す） */}
      <div style={{
        position: 'absolute', right: PW - PAD_X + 10, top: ROW_Y0 + NOW_ROW * ROW_H + ROW_H / 2 - 26, height: 52,
        background: C.red, color: '#fff', fontSize: 28, fontWeight: 900, padding: '0 20px', display: 'flex', alignItems: 'center',
        whiteSpace: 'nowrap', opacity: mark, transform: `translateX(${(1 - mark) * -30}px)`, fontVariantNumeric: 'tabular-nums',
        boxShadow: '0 12px 24px -12px rgba(196,22,28,0.6)',
      }}>いま {hm(now)}</div>
      <div style={{
        position: 'absolute', left: PAD_X, bottom: 14, fontSize: 21, color: C.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Badge /> 直行　　無印は箕面経由　　土日祝・休業期間は運休
      </div>
    </div>
  );
};

// 分のセルが中心へ吸い込まれる（FLY 以降。ポスターから外して画面の座標で描く）
export const FlyingCells = ({ f }) => {
  if (f < FLY || f > FLY + 30) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {CELLS.map((c, i) => {
        const start = START[i];
        if (f < start) return null;
        const p = ease(f, [start, start + 12], [0, 1], EASE_IN);
        const [x0, y0] = toFrame(c.x + 36, c.y + ROW_H / 2, posterAt(start));
        const x = mix(x0, COUNT_AT[0], p);
        const y = mix(y0, COUNT_AT[1], p);
        const s = posterAt(f).s * mix(1, 0.3, p);
        if (p >= 1) return null;
        return (
          <Cell key={i} c={c} style={{
            left: x - 36, top: y - ROW_H / 2, color: C.ink,
            transform: `scale(${s})`, opacity: 1 - ease(p, [0.75, 1], [0, 1]),
          }} />
        );
      })}
    </div>
  );
};

const Bubble = ({ f, at, x, y, rot, children }) => {
  const p = sp(f, at, { damping: 13, stiffness: 190, mass: 0.7 });
  const suck = ease(f, [FLY - 2, FLY + 9], [0, 1], EASE_IN);
  const bx = mix(x, COUNT_AT[0], suck);
  const by = mix(y, COUNT_AT[1], suck);
  return (
    <div style={{
      position: 'absolute', left: bx, top: by, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${p * (1 - suck)})`,
      opacity: Math.min(1, p * 2) * (1 - suck),
    }}>
      <div style={{
        position: 'relative', background: '#fff', border: `4px solid ${C.navy}`, borderRadius: 28, padding: '16px 30px 18px',
        fontSize: 44, fontWeight: 900, color: C.navy, whiteSpace: 'nowrap', boxShadow: '0 22px 40px -20px rgba(22,20,74,0.45)',
      }}>
        {children}
        <div style={{
          position: 'absolute', left: 46, bottom: -19, width: 30, height: 30, background: '#fff',
          borderRight: `4px solid ${C.navy}`, borderBottom: `4px solid ${C.navy}`, transform: 'rotate(45deg)',
        }} />
      </div>
    </div>
  );
};

export const Hook = ({ f }) => {
  const q = sp(f, 58, { damping: 13, stiffness: 160, mass: 0.8 });
  const suck = ease(f, [FLY, FLY + 10], [0, 1], EASE_IN);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 40%, #f1f2f8 0%, #dfe2ee 100%)' }}>
      <Poster f={f} />
      <Bubble f={f} at={12} x={360} y={250} rot={-4}>直行は、どれ？</Bubble>
      <Bubble f={f} at={24} x={1560} y={330} rot={3}>箕面経由って？</Bubble>
      <Bubble f={f} at={36} x={440} y={850} rot={-2}>今日は運行日？</Bubble>
      {/* 問いかけ */}
      <div style={{
        position: 'absolute', left: COUNT_AT[0], top: 560,
        transform: `translate(-50%, -50%) rotate(${(1 - q) * -6}deg) scale(${(0.6 + 0.4 * q) * (1 - suck)})`,
        opacity: Math.min(1, q * 2) * (1 - suck),
      }}>
        <div style={{
          background: C.navy, color: '#fff', padding: '30px 64px 40px', textAlign: 'center',
          boxShadow: '0 40px 80px -30px rgba(22,20,74,0.7)', whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '0.04em' }}>次のバス、</div>
          <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.05, letterSpacing: '0.02em' }}>あと何分？</div>
        </div>
      </div>
    </div>
  );
};

