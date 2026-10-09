import React from 'react';
import { AppIcon } from '../icons.jsx';
import { CharPop } from '../text.jsx';
import { C, EASE_IN, EASE_IN_OUT, NEXT_DEP, T, appNow, ease, left, sp } from '../theme.js';
import { COUNT_AT } from './Hook.jsx';

// 4–8秒：紺が中心から広がり、集まった数字がアプリと同じ形のカウントダウン（あと4分36秒…）になる。
// 「時刻表を、カウントダウンに。」→ 6秒（曲の3小節目）でアイコンと名前。8秒で幕が上がって機能紹介へ。
const pad2 = (n) => String(n).padStart(2, '0');

const BigCount = ({ f }) => {
  const [m, s] = left(NEXT_DEP, appNow(f));
  const pin = sp(f, T.drop + 1, { damping: 11, stiffness: 180, mass: 0.8 });
  // 秒が変わるたびに、秒の数字を小さく弾ませる（アプリの時計は 30 フレームごとに進む）
  const since = f % 30;
  const kick = f > T.drop + 20 ? Math.exp(-since / 4) : 0;
  const out = ease(f, [T.logo - 8, T.logo + 4], [0, 1], EASE_IN);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: COUNT_AT[1] - 175, textAlign: 'center', color: '#fff',
      fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1,
      transform: `scale(${(0.45 + 0.55 * pin) * (1 - 0.08 * out)})`, opacity: Math.min(1, pin * 3) * (1 - out),
      filter: out > 0 ? `blur(${out * 10}px)` : undefined,
    }}>
      <span style={{ fontSize: 92, marginRight: 18 }}>あと</span>
      <span style={{ fontSize: 290 }}>{m}</span>
      <span style={{ fontSize: 92, margin: '0 14px 0 8px' }}>分</span>
      <span style={{ fontSize: 290, display: 'inline-block', transform: `translateY(${-kick * 16}px)` }}>{pad2(s)}</span>
      <span style={{ fontSize: 92, marginLeft: 8 }}>秒</span>
    </div>
  );
};

const Logo = ({ f }) => {
  const p = sp(f, T.logo, { damping: 12, stiffness: 150, mass: 0.9 });
  const sub = sp(f, T.logo + 20, { damping: 22, stiffness: 120 });
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 46 }}>
        <div style={{
          transform: `scale(${p}) rotate(${(1 - p) * -16}deg)`, opacity: Math.min(1, p * 2), borderRadius: 46,
          boxShadow: '0 0 0 6px rgba(255,255,255,0.16), 0 30px 60px -20px rgba(0,0,0,0.5)',
        }}>
          <AppIcon size={206} />
        </div>
        <CharPop segs="次のバス" f={f} d={T.logo + 5} stagger={2.5} size={156} color="#fff" spacing="0.02em" />
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', color: 'rgba(255,255,255,0.88)',
        fontSize: 46, fontWeight: 700, letterSpacing: '0.04em',
        opacity: ease(f, [T.logo + 20, T.logo + 30], [0, 1]), transform: `translateY(${(1 - sub) * 26}px)`,
      }}>
        学内連絡バスの「次の便」が、すぐわかる。
      </div>
    </>
  );
};

export const Drop = ({ f }) => {
  const r = ease(f, [T.drop - 8, T.drop + 8], [0, 1250], EASE_IN_OUT);
  // 8秒で幕が上がる
  const lift = ease(f, [T.count - 12, T.count + 4], [0, 1], EASE_IN_OUT);
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      clipPath: `circle(${r}px at ${COUNT_AT[0]}px ${COUNT_AT[1]}px)`, transform: `translateY(${-lift * 1120}px)`,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(110% 90% at 50% 42%, #3a37a0 0%, ${C.navy} 45%, ${C.navyNight} 100%)` }} />
      {f < T.logo + 6 && <BigCount f={f} />}
      {f < T.logo + 6 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 650, display: 'flex', justifyContent: 'center' }}>
          <CharPop segs="時刻表を、カウントダウンに。" f={f} d={T.drop + 16} stagger={1.6} size={70} color="#fff" weight={800} exitAt={T.logo - 8} />
        </div>
      )}
      {f >= T.logo - 2 && <Logo f={f} />}
      {/* 幕の下端（紺の帯の影） */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: 'linear-gradient(transparent, rgba(0,0,0,0.25))', opacity: lift }} />
    </div>
  );
};
