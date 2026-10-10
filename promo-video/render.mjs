// 「次のバス」紹介動画（BusPromo）を書き出す → out/bus-promo.mp4
// 映像は音なし、音（曲＋効果音）は WAV で別に書き出し、master_audio.py で大きさを整えてから ffmpeg でつなぐ
// （前作の render_x.mjs と同じ。AAC の先頭の遅れで音が拍より遅れないように）。
//   node render.mjs                   → out/bus-promo.mp4
//   node render.mjs --id=BusPromo3D   → out/bus-promo-3d.mp4（端末を傾けて回す版）
//   node render.mjs --id=BusPromoWeb  → out/bus-promo-web.mp4（Web 版だけの動画）
//   node render.mjs --scale=0.5       → out/bus-promo_half.mp4（確認用）
import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const scaleArg = process.argv.find((a) => a.startsWith('--scale='));
const scale = scaleArg ? Number(scaleArg.split('=')[1]) : 1;
const id = (process.argv.find((a) => a.startsWith('--id=')) || '--id=BusPromo').split('=')[1];
const base = { BusPromo: 'bus-promo', BusPromo3D: 'bus-promo-3d', BusPromoWeb: 'bus-promo-web' }[id];
if (!base) throw new Error(`知らないコンポジション: ${id}`);
const name = scale === 1 ? base : `${base}_half`;
const FFMPEG = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const V = path.resolve(`out/${name}_v.mp4`);
const A = path.resolve(`out/${name}_a.wav`);
const AM = path.resolve(`out/${name}_am.wav`);
const OUT = path.resolve(`out/${name}.mp4`);

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.js') });
const composition = await selectComposition({ serveUrl, id });
const common = {
  composition, serveUrl, scale, timeoutInMilliseconds: 240000, chromiumOptions: { gl: 'angle' }, // 端末の3Dモデルは WebGL
  concurrency: Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2))),
};
let shown = -1;
const onProgress = ({ progress }) => {
  const p = Math.floor(progress * 10);
  if (p !== shown) {
    shown = p;
    console.log(`  映像 ${Math.round(progress * 100)}%`);
  }
};
// 小さい文字がざわつかないよう、コマは PNG で撮り（既定の JPEG 画質80だと文字のまわりのノイズが毎コマ変わって、ちらついて見える）、
// 圧縮も高めの画質にする（crf 15・preset slow）
await renderMedia({ ...common, codec: 'h264', imageFormat: 'png', crf: 15, x264Preset: 'slow', muted: true, colorSpace: 'bt709', outputLocation: V, onProgress });
await renderMedia({ ...common, codec: 'wav', outputLocation: A });
execFileSync('python', ['master_audio.py', A, AM], { stdio: 'inherit' });
execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', V, '-i', AM, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
  '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
  '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', OUT]);
// （Node 24 の rmSync は、パスに日本語があると消さずに成功を返すことがあるので unlinkSync を使う）
for (const p of [V, A, AM]) if (existsSync(p)) unlinkSync(p);
console.log(`wrote ${path.relative(process.cwd(), OUT)}（${((Date.now() - t0) / 60000).toFixed(1)} 分）`);
