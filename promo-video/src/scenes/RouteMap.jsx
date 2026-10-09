import React from 'react';
import TT from '../timetable.json';
import { BusFront } from '../icons.jsx';
import { C, EASE_IN_OUT, alpha, ease, mix } from '../theme.js';

// 経路のイメージ図（位置関係は模式的）。豊中・箕面・吹田の3キャンパスと、直行・箕面経由の2本の道。
// 端末で乗り場や方面をタップすると、出発地と強調する道がいっしょに切り替わる。
const P = { T: [96, 300], M: [400, 92], S: [704, 300] };
const EXP = [P.T, [300, 400], [500, 400], P.S];
const VIA1 = [P.T, [120, 170], [260, 92], P.M];
const VIA2 = [P.M, [540, 92], [680, 170], P.S];

const bez = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};
const d = ([p0, p1, p2, p3]) => `M${p0} C${p1} ${p2} ${p3}`;
const viaAt = (t) => (t < 0.5 ? bez(VIA1, t * 2) : bez(VIA2, t * 2 - 1));

const STOP_LABEL = { toyonaka: '豊中', kougaku: '工学部前', ningen: '人科前' };

// stOf(f) で、その時点の端末の state（乗り場・方面）を引く。切り替えは 6 フレームでなじませる
export const RouteMap = ({ f, stOf, at, exitAt }) => {
  const avg = (fn) => {
    let s = 0;
    for (let k = 0; k < 6; k++) s += fn(stOf(f - k));
    return s / 6;
  };
  const st = stOf(f);
  const fromSuita = st.stop !== 'toyonaka';
  const expOn = avg((s) => (s.dir === 'via' ? 0.16 : 1));
  const viaOn = avg((s) => (s.dir === 'express' ? 0.16 : 1));
  const tOn = avg((s) => (s.stop === 'toyonaka' ? 1 : 0));
  const draw = ease(f, [at, at + 20], [0, 1], EASE_IN_OUT);
  const show = ease(f, [at, at + 8], [0, 1]) * (1 - ease(f, [exitAt, exitAt + 8], [0, 1]));
  const times = TT[st.stop];

  // バスは出発地 → 行き先へ、80 フレームで1周
  const phase = ((f - at) % 80) / 80;
  const tt = fromSuita ? 1 - phase : phase;
  const busOp = ease(phase, [0, 0.1], [0, 1]) * (1 - ease(phase, [0.88, 1], [0, 1]));
  const expBus = bez(EXP, tt);
  const viaBus = viaAt(tt);

  const node = (p, label, on, sub) => (
    <g>
      <circle cx={p[0]} cy={p[1]} r={30 + 12 * on} fill={alpha(C.navy, 0.12 * on)} />
      <circle cx={p[0]} cy={p[1]} r={17} fill="#fff" stroke={C.navy} strokeWidth={6} />
      <circle cx={p[0]} cy={p[1]} r={7} fill={on > 0.5 ? C.red : C.navy} />
      <text x={p[0]} y={p[1] + 60} textAnchor="middle" fontSize={34} fontWeight={900} fill={C.navy}>{label}</text>
      {sub}
    </g>
  );

  return (
    <div style={{ position: 'relative', opacity: show, width: 800, height: 470 }}>
      <svg width={800} height={470} viewBox="0 0 800 470" style={{ overflow: 'visible', fontFamily: 'inherit' }}>
        {/* 道（下地） */}
        {[EXP, VIA1, VIA2].map((c, i) => (
          <path key={i} d={d(c)} fill="none" stroke="#dadded" strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        ))}
        {/* 直行（赤） */}
        <path d={d(EXP)} fill="none" stroke={C.red} strokeWidth={8} strokeLinecap="round" opacity={expOn} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        {/* 箕面経由（紺） */}
        {[VIA1, VIA2].map((c, i) => (
          <path key={i} d={d(c)} fill="none" stroke={C.navy} strokeWidth={8} strokeLinecap="round" opacity={viaOn} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        ))}
        {node(P.T, '豊中', tOn)}
        {node(P.S, '吹田', 1 - tOn, (
          <text x={P.S[0]} y={P.S[1] + 98} textAnchor="middle" fontSize={24} fontWeight={700}>
            <tspan fill={st.stop === 'kougaku' ? C.navy : C.muted} fontWeight={st.stop === 'kougaku' ? 900 : 600}>工学部前</tspan>
            <tspan fill={C.muted}>・</tspan>
            <tspan fill={st.stop === 'ningen' ? C.navy : C.muted} fontWeight={st.stop === 'ningen' ? 900 : 600}>人科前</tspan>
          </text>
        ))}
        {node(P.M, '', 0)}
        <text x={P.M[0]} y={P.M[1] + 64} textAnchor="middle" fontSize={32} fontWeight={900} fill={C.navy}>箕面</text>
      </svg>
      {/* 所要時間の札 */}
      <div style={{
        position: 'absolute', left: 400 - 120, top: 404, width: 240, textAlign: 'center', opacity: draw * mix(0.35, 1, expOn),
      }}>
        <span style={{ background: C.red, color: '#fff', fontSize: 27, fontWeight: 900, padding: '6px 16px' }}>直行 約{times.express}分</span>
      </div>
      <div style={{
        position: 'absolute', left: 400 - 150, top: 4, width: 300, textAlign: 'center', opacity: draw * mix(0.35, 1, viaOn),
      }}>
        <span style={{ border: `3px solid ${C.navy}`, background: '#fff', color: C.navy, fontSize: 27, fontWeight: 900, padding: '3px 14px' }}>
          箕面経由 約{times.via[1]}分
        </span>
      </div>
      {/* 走るバス */}
      {[[expBus, expOn], [viaBus, viaOn]].map(([p, on], i) => (
        <div key={i} style={{
          position: 'absolute', left: p[0] - 22, top: p[1] - 26, opacity: busOp * on * draw,
          filter: 'drop-shadow(0 6px 8px rgba(22,20,74,0.3))',
        }}>
          <BusFront size={44} />
        </div>
      ))}
      {/* いまの乗り場 */}
      <div style={{
        position: 'absolute', left: fromSuita ? P.S[0] - 110 : P.T[0] - 60, top: fromSuita ? P.S[1] - 92 : P.T[1] - 92,
        width: 220, textAlign: fromSuita ? 'center' : 'left', opacity: draw,
      }}>
        <span style={{ background: C.navy, color: '#fff', fontSize: 22, fontWeight: 800, padding: '5px 12px', whiteSpace: 'nowrap' }}>
          {STOP_LABEL[st.stop]}から
        </span>
      </div>
    </div>
  );
};
