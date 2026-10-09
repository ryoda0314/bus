import React from 'react';
import { AppIcon, BusSide } from '../icons.jsx';
import { CharPop } from '../text.jsx';
import { APP_URL, C, EASE_IN_OUT, EASE_OUT, T, ease, mix, sp } from '../theme.js';

// 36–41秒：エンドカード。紺がせり上がり、アイコン・名前・ひと言。
// バスが走ってきて、曲の最後の一打（T.final）でちょうど真ん中に止まる（ピンポーン）。
const CHIPS = ['日本語 / 한국어', 'インストール不要の Web アプリ', '2026.4.1 改正ダイヤ'];
const ROAD_Y = 990;
const BUS_W = 236;

export const EndCard = ({ f }) => {
  const up = ease(f, [T.end - 6, T.end + 10], [0, 1], EASE_IN_OUT);
  const icon = sp(f, T.end + 8, { damping: 12, stiffness: 150, mass: 0.9 });
  const tag = sp(f, T.end + 28, { damping: 20, stiffness: 120 });
  // バス：左から走ってきて T.final に止まる（止まる瞬間に車体が少し沈む）
  const run = ease(f, [T.end + 14, T.final], [0, 1], EASE_OUT);
  const busX = mix(-BUS_W - 40, 960 - BUS_W / 2, run);
  const stopBob = f >= T.final ? Math.sin((f - T.final) * 0.9) * 5 * Math.exp(-(f - T.final) / 6) : 0;
  return (
    <div style={{
      position: 'absolute', inset: 0, transform: `translateY(${(1 - up) * 1120}px)`, overflow: 'hidden',
      background: `radial-gradient(100% 90% at 50% 38%, #3a37a0 0%, ${C.navy} 48%, ${C.navyNight} 100%)`, color: '#fff',
    }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          transform: `scale(${icon}) rotate(${(1 - icon) * -14}deg)`, opacity: Math.min(1, icon * 2), borderRadius: 40,
          boxShadow: '0 0 0 6px rgba(255,255,255,0.16), 0 30px 60px -20px rgba(0,0,0,0.5)',
        }}>
          <AppIcon size={180} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 368, display: 'flex', justifyContent: 'center' }}>
        <CharPop segs="次のバス" f={f} d={T.end + 14} stagger={2.5} size={146} color="#fff" spacing="0.03em" />
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 562, textAlign: 'center', fontSize: 54, fontWeight: 800, letterSpacing: '0.04em',
        opacity: ease(f, [T.end + 28, T.end + 38], [0, 1]), transform: `translateY(${(1 - tag) * 24}px)`,
      }}>
        時刻表を、カウントダウンに。
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 650, textAlign: 'center', fontSize: 30, fontWeight: 600,
        color: 'rgba(255,255,255,0.78)', letterSpacing: '0.04em', opacity: ease(f, [T.end + 36, T.end + 46], [0, 1]),
      }}>
        阪大の学内連絡バス（豊中・吹田・箕面）に対応
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 724, display: 'flex', justifyContent: 'center', gap: 18 }}>
        {CHIPS.map((c, i) => {
          const p = sp(f, T.end + 42 + i * 4, { damping: 16, stiffness: 170 });
          return (
            <div key={c} style={{
              border: '2px solid rgba(255,255,255,0.55)', padding: '8px 20px 10px', fontSize: 26, fontWeight: 700,
              opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 20}px)`,
            }}>{c}</div>
          );
        })}
      </div>
      {APP_URL && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 806, textAlign: 'center', fontSize: 40, fontWeight: 800, letterSpacing: '0.02em',
          opacity: ease(f, [T.final, T.final + 10], [0, 1]),
        }}>{APP_URL}</div>
      )}
      {/* 道とバス */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: ROAD_Y, height: 4, background: 'rgba(255,255,255,0.22)' }} />
      <div style={{
        position: 'absolute', left: 960 - 70, top: ROAD_Y + 18, width: 140, textAlign: 'center', fontSize: 20, fontWeight: 800,
        letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)', opacity: ease(f, [T.final - 4, T.final + 8], [0, 1]),
      }}>のりば</div>
      <div style={{ position: 'absolute', left: busX, top: ROAD_Y - BUS_W * 0.42 + 6 + stopBob }}>
        <BusSide width={BUS_W} wheel={busX * 1.6} />
      </div>
    </div>
  );
};
