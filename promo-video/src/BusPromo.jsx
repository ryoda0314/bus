import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import './fonts.js';
import { Drop } from './scenes/Drop.jsx';
import { EndCard } from './scenes/EndCard.jsx';
import { Features, LOCK_FRAMES, TAP_FRAMES } from './scenes/Features.jsx';
import { FlyingCells, Hook } from './scenes/Hook.jsx';
import { MORE_FRAMES, More } from './scenes/More.jsx';
import { C, FONT, T } from './theme.js';

// 「次のバス」紹介動画（1920x1080・30fps・41秒）。場面の区切りは theme.js の T、曲は make_audio.py。
// 効果音（フレーム, public/audio/sfx/ のファイル名, 音量）
const SFX = [
  [12, 'pop', 0.45], [24, 'pop', 0.45], [36, 'pop', 0.45], [58, 'pop', 0.6],
  [T.logo, 'pinpon', 0.5],
  [T.count - 12, 'whoosh', 0.4],
  [T.count + 60, 'pop', 0.3], [T.count + 85, 'pop', 0.3], [T.count + 110, 'pop', 0.3],
  [T.stops - 6, 'swish', 0.3], [T.ride - 6, 'swish', 0.3], [T.lock - 6, 'swish', 0.3],
  ...TAP_FRAMES.map((at) => [at, 'tap', 0.55]),
  [T.ff, 'ff', 0.5],
  [LOCK_FRAMES.dark, 'lock', 0.6], [LOCK_FRAMES.widget, 'sparkle', 0.4],
  [T.more, 'whoosh', 0.35],
  ...MORE_FRAMES.phones.map((at) => [at, 'pop', 0.35]),
  [MORE_FRAMES.lang, 'tap', 0.5], [MORE_FRAMES.add, 'sparkle', 0.3],
  [T.end - 6, 'whoosh', 0.4],
  [T.final, 'pinpon', 0.5],
];

export const BusPromo = () => {
  const f = useCurrentFrame();
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
      {f >= T.logo && f < T.more + 24 && <Features f={f} />}
      {f >= T.more - 4 && f < T.end + 14 && <More f={f} />}
      {f < T.drop + 10 && <Hook f={f} />}
      {f >= T.drop - 10 && f < T.count + 6 && <Drop f={f} />}
      <FlyingCells f={f} />
      {f >= T.end - 6 && <EndCard f={f} />}
    </AbsoluteFill>
  );
};
