import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import { FONT_URL } from './fonts.js';
import { APP_H, HomeIndicator, SCREEN_W, STATUS_H, StatusBar } from './Phone.jsx';
import { C, EASE_OUT, ease, hm, mix } from './theme.js';

// アプリ本体（public/app/index.html = ../index.html のコピー）を iframe で開き、
// 時計・乗り場・方面・言語・「乗るバス」を、動画のフレームから毎回決めて描き直す。
// アプリのコードは変えない。読み込んだあとにページの外から次のことだけをする：
//   - Date.now を動画の時刻に差し替え、1秒ごとの setInterval(tick) を止める（描き直しは毎フレームこちらから）
//   - 「まもなく」の点滅（CSS アニメーション）を止め、位相を動画の時刻で決める
//   - Noto Sans JP を読み込む（アプリの font-family に入っている名前）
//   - タップの印と囲みを、アプリの画面の上に重ねて描く（#__fx）
const SETUP = (fontUrl) => `(() => {
  window.__now = Date.now();
  Date.now = () => window.__now;
  for (let i = 1; i < 500; i++) clearInterval(i);
  const st = document.createElement('style');
  st.textContent = '@font-face{font-family:"Noto Sans JP";src:url("${fontUrl}") format("truetype");font-weight:100 900;font-display:block}'
    + '#__fx{position:fixed;inset:0;pointer-events:none;z-index:1000}#__fx div{position:absolute;box-sizing:border-box}'
    + 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}';
  document.head.appendChild(st);
  const fx = document.createElement('div');
  fx.id = '__fx';
  document.body.appendChild(fx);
  const rectOf = (sel) => { const el = document.querySelector(sel); return el && el.offsetParent !== null ? el.getBoundingClientRect() : null; };
  const box = (b, p, css) => '<div style="left:' + (b.left - p) + 'px;top:' + (b.top - p) + 'px;width:' + (b.width + p * 2) + 'px;height:' + (b.height + p * 2) + 'px;' + css + '"></div>';
  window.__apply = (s) => {
    window.__now = s.now;
    state.stop = s.stop; state.dir = s.dir; state.lang = s.lang;
    state.ride = s.ride ? { ...s.ride } : null; state.rideOpen = !!s.rideOpen;
    expanded = !!s.expanded;
    renderTabs(); tick();
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = s.anim || 0; }
    let html = '';
    for (const r of s.rings || []) {
      const b = rectOf(r.sel); if (!b || r.o <= 0) continue;
      const p = r.pad ?? 6;
      html += box(b, p, 'border:' + (r.w ?? 3) + 'px solid ' + r.color + ';border-radius:' + (r.radius ?? 6) + 'px;opacity:' + r.o
        + ';transform:scale(' + (r.s ?? 1) + ');background:' + (r.fill || 'transparent'));
      // 番号の札（左の箇条書きと対応させる）
      if (r.tag) html += '<div style="left:' + (b.left - p - 12) + 'px;top:' + (b.top - p - 12) + 'px;width:28px;height:28px;border-radius:50%;background:' + r.color
        + ';color:#fff;font:900 16px/28px Noto Sans JP,sans-serif;text-align:center;opacity:' + r.o + '">' + r.tag + '</div>';
    }
    for (const t of s.taps || []) {
      const b = rectOf(t.sel); if (!b) continue;
      const x = b.left + b.width * (t.ax ?? 0.5), y = b.top + b.height * (t.ay ?? 0.5);
      if (t.press > 0) html += box(b, 0, 'background:rgba(17,17,34,' + (0.14 * t.press) + ')');
      if (t.ring > 0) html += '<div style="left:' + (x - 22) + 'px;top:' + (y - 22) + 'px;width:44px;height:44px;border-radius:50%;border:2.5px solid rgba(255,255,255,' + t.ring + ');box-shadow:0 0 0 1.5px rgba(17,17,34,' + (t.ring * 0.3) + ');transform:scale(' + t.ringS + ')"></div>';
      if (t.dot > 0) html += '<div style="left:' + (x - 21) + 'px;top:' + (y - 21) + 'px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,' + (0.5 * t.dot) + ');border:2px solid rgba(17,17,34,' + (0.3 * t.dot) + ');box-shadow:0 4px 14px rgba(0,0,0,' + (0.22 * t.dot) + ');transform:scale(' + t.dotS + ')"></div>';
    }
    fx.innerHTML = html;
  };
})();`;

// タップの印：at の9フレーム前から指が近づき（丸が縮みながら現れる）、at で押す（波紋が広がる）
export const tapFx = (f, at, sel, opts = {}) => {
  const d = f - at;
  if (d < -9 || d > 16) return null;
  const appear = ease(d, [-9, -1], [0, 1]);
  const gone = ease(d, [4, 12], [0, 1]);
  return {
    sel,
    ...opts,
    dot: appear * (1 - gone),
    dotS: d < 0 ? mix(1.5, 1, appear) : d < 4 ? 0.86 : mix(0.86, 1.08, gone),
    press: d >= 0 && d < 6 ? 1 - d / 6 : 0,
    ring: d >= 0 ? (1 - ease(d, [0, 14], [0, 1])) * 0.9 : 0,
    ringS: d >= 0 ? mix(1, 2.4, ease(d, [0, 14], [0, 1])) : 1,
  };
};

// 要素の囲み：at からふわっと現れ、until で消える
export const ringFx = (f, at, until, sel, color, opts = {}) => {
  if (f < at || f > until + 8) return null;
  const pin = ease(f, [at, at + 8], [0, 1], EASE_OUT);
  const out = ease(f, [until, until + 8], [0, 1]);
  return { sel, color, o: pin * (1 - out), s: mix(1.12, 1, pin), ...opts };
};

// アプリの画面（ステータスバーとホームインジケータ込み）。
// st = { stop, dir, lang, ride, rideOpen, expanded }、fx = { taps: [], rings: [] }
// anim は「まもなく」の点滅の位相（ms）。query は index.html に付けるクエリ（ios=1 で iPhone 向けの表示）
export const AppScreen = ({ now, st, fx, anim = 0, query = 'ios=1' }) => {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('アプリの画面を読み込み中', { timeoutInMilliseconds: 120000 }));
  const payload = {
    now, ...st, anim,
    taps: (fx?.taps || []).filter(Boolean),
    rings: (fx?.rings || []).filter(Boolean),
  };
  const latest = useRef(payload);
  latest.current = payload;

  const onLoad = useCallback(async () => {
    try {
      const w = ref.current.contentWindow;
      if (w.__apply) return;
      w.eval(SETUP(new URL(FONT_URL, window.location.href).href));
      await Promise.all([
        w.document.fonts.load('400 16px "Noto Sans JP"'),
        w.document.fonts.load('700 16px "Noto Sans JP"'),
        w.document.fonts.load('800 16px "Noto Sans JP"'),
      ]);
      w.__apply(latest.current);
      setReady(true);
      continueRender(handle);
    } catch (err) {
      cancelRender(err);
    }
  }, [handle]);

  useLayoutEffect(() => {
    if (ready) ref.current.contentWindow.__apply(payload);
  });

  const rideView = !!(st.ride && st.rideOpen);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.navy }}>
      <StatusBar time={hm(now)} color="#fff" bg={C.navy} />
      <iframe
        ref={ref}
        title="app"
        src={`${staticFile('app/index.html')}?${query}`}
        onLoad={onLoad}
        style={{ position: 'absolute', left: 0, top: STATUS_H, width: SCREEN_W, height: APP_H, border: 0, display: 'block', background: '#fff' }}
      />
      <HomeIndicator color={rideView ? '#fff' : C.ink} opacity={rideView ? 0.85 : 0.75} />
    </div>
  );
};
