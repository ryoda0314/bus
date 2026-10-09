import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import '../fonts.js';
import { AppScreen, ringFx, tapFx } from '../AppScreen.jsx';
import { ModelPhone } from '../ModelPhone.jsx';
import { C, RIDE_DEP, T, appNow } from '../theme.js';

// 開発用：端末の中のアプリが動画の時刻と state で描けているかの確認
export const PhoneCheck = () => {
  const f = useCurrentFrame();
  const ride = { stop: 'toyonaka', dep: RIDE_DEP, sent: false };
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <ModelPhone pose={{ x: 520, y: 540, s: 1, rx: 0, ry: -7, rz: 0 }}>
        <AppScreen now={appNow(T.count)} st={{ stop: 'toyonaka', dir: 'all', lang: 'ja' }}
          fx={{ rings: [ringFx(20, 0, 99, '.hero .count', C.red)], taps: [tapFx(3, 0, `[data-stop="kougaku"]`)] }} />
      </ModelPhone>
      <ModelPhone pose={{ x: 1400, y: 540, s: 1, rx: 4, ry: 18, rz: 0 }}>
        <AppScreen now={appNow(T.red)} st={{ stop: 'toyonaka', dir: 'all', lang: 'ja', ride, rideOpen: true }} anim={600} />
      </ModelPhone>
    </AbsoluteFill>
  );
};
