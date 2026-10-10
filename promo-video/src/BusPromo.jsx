import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import './fonts.js';
import { Drop } from './scenes/Drop.jsx';
import { EndCard } from './scenes/EndCard.jsx';
import { Features, RIDE_SPIN, SIDE_TURN, TAP_FRAMES, lockFrames, timing } from './scenes/Features.jsx';
import { FlyingCells, Hook } from './scenes/Hook.jsx';
import { MORE_FRAMES, More } from './scenes/More.jsx';
import { C, FONT, T } from './theme.js';

// 「次のバス」紹介動画（1920x1080・30fps・43秒）。場面の区切りは theme.js の T、曲は make_audio.py。
// variant = 'flat'（BusPromo）／'3d'（BusPromo3D：端末を傾けて、画面が切り替わるところで回す）
// 効果音（フレーム, public/audio/sfx/ のファイル名, 音量）
const sfxFor = (variant) => {
  const LOCK_FRAMES = lockFrames(variant);
  const m = timing(variant);
  // 04：ネイティブ版はロック画面、Web 版はホーム画面に追加
  const ch4 = variant === 'web' ? [
    [m.share, 'tap', 0.5], [m.row, 'tap', 0.5], [m.add, 'tap', 0.5], [m.add + 6, 'whoosh', 0.3],
    [m.pop, 'sparkle', 0.35], [m.open, 'tap', 0.5], [m.open + 2, 'whoosh', 0.35], [m.air + 6, 'pop', 0.35],
  ] : [
    [LOCK_FRAMES.side, 'lock', 0.6], [LOCK_FRAMES.la, 'sparkle', 0.4],
    [LOCK_FRAMES.unlock, 'swish', 0.3], [LOCK_FRAMES.island, 'pop', 0.4],
  ];
  return [
  [12, 'pop', 0.45], [24, 'pop', 0.45], [36, 'pop', 0.45], [58, 'pop', 0.6],
  [T.logo, 'pinpon', 0.5],
  [T.count - 12, 'whoosh', 0.4],
  [T.count + 60, 'pop', 0.3], [T.count + 85, 'pop', 0.3], [T.count + 110, 'pop', 0.3],
  [T.stops - 6, 'swish', 0.3], [T.ride - 6, 'swish', 0.3], [T.lock - 6, 'swish', 0.3],
  ...TAP_FRAMES.map((at) => [at, 'tap', 0.55]),
  [T.ff, 'ff', 0.5],
  ...ch4,
  ...(variant === 'web' ? [[T.count + 26, 'pop', 0.3]] : []), // Web 版：ページが開く
  [T.more, 'whoosh', 0.35],
  ...MORE_FRAMES.phones.map((at) => [at, 'pop', 0.35]),
  [MORE_FRAMES.lang, 'tap', 0.5],
  [T.end - 6, 'whoosh', 0.4],
  [T.final, 'pinpon', 0.5],
  // 3d 版：端末が回る・横を向く
  ...(variant === '3d' ? [[RIDE_SPIN[0], 'swish', 0.35], [SIDE_TURN[0], 'swish', 0.22], [SIDE_TURN[2], 'swish', 0.22]] : []),
  ];
};

export const BusPromo = ({ variant = 'flat' }) => {
  const f = useCurrentFrame();
  const SFX = sfxFor(variant);
  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: FONT, overflow: 'hidden' }}>
      {/* 書き出しは 16bit なので、効果音と重なっても割れないよう曲は 0.8 倍（大きさは master_audio.py で整える） */}
      <Audio src={staticFile('audio/bgm.wav')} volume={0.8} />
      {SFX.map(([at, name, volume], i) => (
        <Sequence key={i} from={at} durationInFrames={75} layout="none">
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
      {/* 機能紹介は幕が上がる前（ロゴの下）で読み込んでおく */}
      {f >= T.logo && f < T.more + 24 && <Features f={f} variant={variant} />}
      {f >= T.more - 4 && f < T.end + 14 && <More f={f} variant={variant} />}
      {f < T.drop + 10 && <Hook f={f} />}
      {f >= T.drop - 10 && f < T.count + 6 && <Drop f={f} />}
      <FlyingCells f={f} />
      {f >= T.end - 6 && <EndCard f={f} variant={variant} />}
    </AbsoluteFill>
  );
};
