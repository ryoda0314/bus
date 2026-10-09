import React from 'react';
import { Composition } from 'remotion';
import { BusPromo } from './BusPromo.jsx';
import { PhoneCheck } from './dev/PhoneCheck.jsx';
import { FPS, H, T, W } from './theme.js';

export const RemotionRoot = () => (
  <>
    {/* 「次のバス」紹介動画（1920x1080・41秒） */}
    <Composition id="BusPromo" component={BusPromo} durationInFrames={T.total} fps={FPS} width={W} height={H} />
    {/* 開発用：端末の中のアプリの確認 */}
    <Composition id="PhoneCheck" component={PhoneCheck} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
