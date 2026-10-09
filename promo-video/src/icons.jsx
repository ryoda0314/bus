import React from 'react';
import { C } from './theme.js';

// アプリのアイコン（../icon.svg と同じ図形）
export const AppIcon = ({ size = 120, style }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: 'block', ...style }}>
    <rect width="512" height="512" rx="112" fill="#2b2a7a" />
    <rect x="116" y="96" width="280" height="290" rx="44" fill="#ffffff" />
    <rect x="144" y="132" width="224" height="120" rx="16" fill="#2b2a7a" />
    <rect x="196" y="108" width="120" height="14" rx="7" fill="#2b2a7a" />
    <circle cx="178" cy="318" r="22" fill="#c8102e" />
    <circle cx="334" cy="318" r="22" fill="#c8102e" />
    <rect x="140" y="380" width="56" height="48" rx="14" fill="#ffffff" />
    <rect x="316" y="380" width="56" height="48" rx="14" fill="#ffffff" />
  </svg>
);

// アイコンのバスだけ（正面）。経路図の上を走る小さいバス
export const BusFront = ({ size = 40, body = '#fff', glass = C.navy, style }) => (
  <svg width={size} height={size} viewBox="100 90 312 350" style={{ display: 'block', overflow: 'visible', ...style }}>
    <rect x="116" y="96" width="280" height="290" rx="44" fill={body} stroke={glass} strokeWidth="14" />
    <rect x="144" y="132" width="224" height="120" rx="16" fill={glass} />
    <circle cx="178" cy="318" r="22" fill="#c8102e" />
    <circle cx="334" cy="318" r="22" fill="#c8102e" />
    <rect x="140" y="380" width="56" height="48" rx="14" fill={glass} />
    <rect x="316" y="380" width="56" height="48" rx="14" fill={glass} />
  </svg>
);

// 横から見たバス（エンドカードで走ってくる）。右が前。wheel は車輪の回転（度）
export const BusSide = ({ width = 300, wheel = 0, style }) => (
  <svg width={width} height={width * 0.42} viewBox="0 0 300 126" style={{ display: 'block', overflow: 'visible', ...style }}>
    <rect x="6" y="8" width="284" height="92" rx="20" fill="#ffffff" />
    <rect x="6" y="74" width="284" height="10" fill={C.red} />
    {[22, 70, 118, 166].map((x) => <rect key={x} x={x} y="22" width="40" height="34" rx="6" fill={C.navy} />)}
    <rect x="214" y="22" width="36" height="60" rx="6" fill={C.navy} opacity="0.9" />
    <path d="M258 22h12a14 14 0 0114 14v22h-26z" fill={C.navy} />
    <rect x="278" y="64" width="10" height="8" rx="3" fill="#ffd27a" />
    {[70, 232].map((cx) => (
      <g key={cx} transform={`rotate(${wheel} ${cx} 100)`}>
        <circle cx={cx} cy="100" r="22" fill="#1b1b2b" />
        <circle cx={cx} cy="100" r="9" fill="#c9c9d6" />
        <rect x={cx - 2} y="80" width="4" height="12" fill="#c9c9d6" />
      </g>
    ))}
  </svg>
);
