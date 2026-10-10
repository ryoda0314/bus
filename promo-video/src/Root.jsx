import React from 'react';
import { Composition } from 'remotion';
import { BusPromo } from './BusPromo.jsx';
import { PhoneCheck } from './dev/PhoneCheck.jsx';
import { FPS, H, T, W } from './theme.js';

export const RemotionRoot = () => (
  <>
    {/* 「次のバス」紹介動画（1920x1080・41秒） */}
    <Composition id="BusPromo" component={BusPromo} durationInFrames={T.total} fps={FPS} width={W} height={H} defaultProps={{ variant: 'flat' }} />
    {/* 別の版：端末を傾けて立体的に置き、画面が切り替わるところで回す */}
    <Composition id="BusPromo3D" component={BusPromo} durationInFrames={T.total} fps={FPS} width={W} height={H} defaultProps={{ variant: '3d' }} />
    {/* Web 版だけの動画：Safari で開く・ホーム画面に追加・オフライン・PC でも。ウィジェットは出さない */}
    <Composition id="BusPromoWeb" component={BusPromo} durationInFrames={T.total} fps={FPS} width={W} height={H} defaultProps={{ variant: 'web' }} />
    {/* 開発用：端末の中のアプリの確認 */}
    <Composition id="PhoneCheck" component={PhoneCheck} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
