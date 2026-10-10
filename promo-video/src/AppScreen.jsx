import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import { FONT_URL } from './fonts.js';
import { APP_H, HomeIndicator, SCREEN_H, SCREEN_W, STATUS_H, StatusBar } from './Phone.jsx';
import { C, EASE_OUT, FONT, WEB_HOST, ease, hm, mix } from './theme.js';

// アプリ本体（public/app/index.html = ../index.html のコピー）を iframe で開き、
// 時計・乗り場・方面・言語・「乗るバス」を、動画のフレームから毎回決めて描き直す。
// native = true のときは、iPhone のネイティブ版（../ios/。画面は index.html と同じ作り）に見た目を合わせるため、次の2つだけ足す：
//   - 乗るバスの画面に「ロック画面のウィジェットにも表示されます」（RideScreen.swift の lockHint）
//   - カウントダウンの数字の大きさ（ContentView.swift は 60pt、RideScreen.swift は 92pt。どちらも Heavy）
// native = false（Web 版の動画）は index.html のまま。どちらも ?ios=1 は付けない（Scriptable 用の「ウィジェットに表示」ボタンは出ない）。
// アプリのコードは変えない。読み込んだあとにページの外から次のことだけをする：
//   - Date.now を動画の時刻に差し替え、1秒ごとの setInterval(tick) を止める（描き直しは毎フレームこちらから）
//   - 「まもなく」の点滅（CSS アニメーション）を止め、位相を動画の時刻で決める
//   - Noto Sans JP を読み込む（アプリの font-family に入っている名前）
//   - タップの印と囲みを、アプリの画面の上に重ねて描く（#__fx）
const SETUP = (fontUrl, native) => `(() => {
  window.__now = Date.now();
  Date.now = () => window.__now;
  for (let i = 1; i < 500; i++) clearInterval(i);
  const st = document.createElement('style');
  st.textContent = '@font-face{font-family:"Noto Sans JP";src:url("${fontUrl}") format("truetype");font-weight:100 900;font-display:block}'
    + '#__fx{position:fixed;inset:0;pointer-events:none;z-index:1000}#__fx div{position:absolute;box-sizing:border-box}'
    + 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'
    + (${native} ? '.hero .count{font-size:60px!important;font-weight:900}.rv-count{font-size:92px!important;font-weight:900}'
      + '.__hint{font-size:12px;opacity:.7;text-align:center;margin-bottom:10px}' : '');
  document.head.appendChild(st);
  const fx = document.createElement('div');
  fx.id = '__fx';
  document.body.appendChild(fx);
  const rectOf = (sel) => { const el = document.querySelector(sel); return el && el.offsetParent !== null ? el.getBoundingClientRect() : null; };
  // 要素の中の文字だけの範囲（行いっぱいの箱ではなく）
  const textOf = (sel) => {
    const el = document.querySelector(sel);
    if (!el || el.offsetParent === null) return null;
    const r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect();
  };
  const box = (b, px, css, py = px) => '<div style="left:' + (b.left - px) + 'px;top:' + (b.top - py) + 'px;width:' + (b.width + px * 2) + 'px;height:' + (b.height + py * 2) + 'px;' + css + '"></div>';
  window.__apply = (s) => {
    window.__now = s.now;
    state.stop = s.stop; state.dir = s.dir; state.lang = s.lang;
    state.ride = s.ride ? { ...s.ride } : null; state.rideOpen = !!s.rideOpen;
    expanded = !!s.expanded;
    renderTabs(); tick();
    // ネイティブ版の乗るバスの画面（RideScreen.swift）と同じ一文
    const cancel = ${native} && document.querySelector('#rideView:not([hidden]) .rv-cancel');
    if (cancel) cancel.insertAdjacentHTML('beforebegin', '<div class="__hint">' + (state.lang === 'ko' ? '잠금 화면 위젯에도 표시됩니다' : 'ロック画面のウィジェットにも表示されます') + '</div>');
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = s.anim || 0; }
    let html = '';
    for (const r of s.rings || []) {
      const b = r.fit ? textOf(r.sel) : rectOf(r.sel); if (!b || r.o <= 0) continue;
      const px = r.padX ?? r.pad ?? 6;
      const py = r.padY ?? r.pad ?? 6;
      // mark：蛍光ペン（うすい塗りと下線）。そうでなければ枠
      html += r.mark
        ? box(b, px, 'background:' + r.fill + ';border-bottom:3px solid ' + r.color + ';border-radius:3px;opacity:' + r.o, py)
        : box(b, px, 'border:' + (r.w ?? 3) + 'px solid ' + r.color + ';border-radius:' + (r.radius ?? 6) + 'px;opacity:' + r.o
          + ';transform:scale(' + (r.s ?? 1) + ');background:' + (r.fill || 'transparent'), py);
      // 番号の札（左の箇条書きと対応させる）。囲みの右の外、行の高さの真ん中に置く（上下の行の札が重ならない）
      if (r.tag) html += '<div style="left:' + (b.right + px + 6) + 'px;top:' + (b.top + b.height / 2 - 13) + 'px;width:26px;height:26px;border-radius:50%;background:' + r.color
        + ';color:#fff;font:900 15px/26px Noto Sans JP,sans-serif;text-align:center;opacity:' + r.o + '">' + r.tag + '</div>';
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

// アプリの外（Safari のバー・共有シート・ホーム画面）をタップする印。t は tapFx(f, at) の値、x, y は画面の中の位置
export const TapDot = ({ t, x, y }) => (t ? (
  <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 400, pointerEvents: 'none' }}>
    {t.ring > 0 && (
      <div style={{
        position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: '50%', boxSizing: 'border-box',
        border: `2.5px solid rgba(255,255,255,${t.ring})`, boxShadow: `0 0 0 1.5px rgba(17,17,34,${t.ring * 0.3})`, transform: `scale(${t.ringS})`,
      }} />
    )}
    {t.dot > 0 && (
      <div style={{
        position: 'absolute', left: x - 21, top: y - 21, width: 42, height: 42, borderRadius: '50%', boxSizing: 'border-box',
        background: `rgba(255,255,255,${0.5 * t.dot})`, border: `2px solid rgba(17,17,34,${0.3 * t.dot})`,
        boxShadow: `0 4px 14px rgba(0,0,0,${0.22 * t.dot})`, transform: `scale(${t.dotS})`,
      }} />
    )}
  </div>
) : null);

// iframe とページの外からの操作だけ（端末の枠やステータスバーは持たない）。width x height はページの表示域（CSS px）
// st = { stop, dir, lang, ride, rideOpen, expanded }、fx = { taps: [], rings: [] }、anim は「まもなく」の点滅の位相（ms）
export const AppFrame = ({ now, st, fx, anim = 0, native = true, width, height, style }) => {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('アプリの画面を読み込み中', { timeoutInMilliseconds: 120000 }));
  const nativeAtLoad = useRef(native);
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
      w.eval(SETUP(new URL(FONT_URL, window.location.href).href, nativeAtLoad.current));
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

  return (
    <iframe
      ref={ref}
      title="app"
      src={staticFile('app/index.html')}
      onLoad={onLoad}
      style={{ position: 'absolute', border: 0, display: 'block', background: C.navy, width, height, ...style }}
    />
  );
};

// Safari の下のバー（アドレスとツールバー）。Web 版の動画で使う。共有ボタンの位置は SAFARI.share
const BAR_H = 118;
export const SAFARI = { h: BAR_H, share: [SCREEN_W / 2, SCREEN_H - BAR_H + 78] };
const ICON = '#3478f6';
// typed = 0〜1：アドレス欄に URL を打ち込んでいるところ（1 で全部）
const SafariBar = ({ typed = 1 }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR_H, zIndex: 240, fontFamily: FONT,
    background: 'rgba(249,249,251,0.97)', borderTop: '0.5px solid rgba(0,0,0,0.18)',
  }}>
    <div style={{
      position: 'absolute', left: 12, right: 12, top: 8, height: 44, borderRadius: 12, background: 'rgba(118,118,128,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontSize: 15,
    }}>
      <span style={{ position: 'absolute', left: 14, fontSize: 15, fontWeight: 600 }}>ぁあ</span>
      <svg width="11" height="14" viewBox="0 0 11 14" style={{ marginRight: 5 }}>
        <rect x="1" y="6" width="9" height="7" rx="1.5" fill="#6b6b73" />
        <path d="M3 6V4.2a2.5 2.5 0 015 0V6" fill="none" stroke="#6b6b73" strokeWidth="1.6" />
      </svg>
      <span>{WEB_HOST.slice(0, Math.round(typed * WEB_HOST.length))}{typed < 1 && <span style={{ color: ICON, fontWeight: 300 }}>|</span>}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: 'absolute', right: 14 }}>
        <path d="M13 8a5 5 0 11-1.5-3.6M13 2.5v3h-3" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {/* ツールバー：戻る・進む・共有・ブックマーク・タブ */}
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width="26" height="26" viewBox="0 0 26 26" style={{ position: 'absolute', left: SCREEN_W / 2 + (i - 2) * 76 - 13, top: 65 }}>
        {i === 0 && <path d="M16 4l-9 9 9 9" fill="none" stroke={ICON} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
        {i === 1 && <path d="M10 4l9 9-9 9" fill="none" stroke="#c4c4c8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
        {i === 2 && (
          <g fill="none" stroke={ICON} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 9H6.5v14h13V9H17" />
            <path d="M13 16V2M8.5 6.5L13 2l4.5 4.5" />
          </g>
        )}
        {i === 3 && <path d="M3 5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v16c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z M13 6v16" fill="none" stroke={ICON} strokeWidth="1.9" strokeLinejoin="round" />}
        {i === 4 && (
          <g fill="none" stroke={ICON} strokeWidth="1.9">
            <rect x="3" y="7" width="15" height="15" rx="2.5" />
            <path d="M8 3.5h12.5a2 2 0 012 2V18" />
          </g>
        )}
      </svg>
    ))}
  </div>
);

// 端末の画面（ステータスバー＋アプリ＋ホームインジケータ）。
// browser = true で Safari の下のバーを出し、ページの表示域をその上までにする。airplane = true で機内モードのステータスバー。
// urlTyped（0〜1）はアドレス欄の打ち込み、loading（0〜1）はページを開く前の白い覆い（Web 版の 01 の出だし）
export const AppScreen = ({ now, st, fx, anim = 0, native = true, browser = false, airplane = false, urlTyped = 1, loading = 0 }) => {
  const pageH = APP_H + 1 - (browser ? BAR_H : 0);
  const rideView = !!(st.ride && st.rideOpen);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.navy }}>
      <StatusBar time={hm(now)} color="#fff" bg={C.navy} airplane={airplane} />
      {/* 下地は紺にして、ステータスバーに 1px 重ねる（端末を傾けると、境目に下地の色が細い線になってにじむため） */}
      <AppFrame
        now={now} st={st} fx={fx} anim={anim} native={native}
        width={SCREEN_W} height={pageH} style={{ left: 0, top: STATUS_H - 1 }}
      />
      {loading > 0 && <div style={{ position: 'absolute', left: 0, top: STATUS_H - 1, width: SCREEN_W, height: pageH, background: '#fff', opacity: loading }} />}
      {browser && <SafariBar typed={urlTyped} />}
      <HomeIndicator color={rideView && !browser ? '#fff' : C.ink} opacity={rideView && !browser ? 0.85 : 0.75} />
    </div>
  );
};
