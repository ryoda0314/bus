// npm run model -- "<ダウンロードした Iphone_18_.blend のパス>"
// Blender（4.5）で model/export_iphone.py を動かし、public/model/iphone.glb と src/model.json を作る。
// .blend に埋め込まれたスクリプトは動かさない（--disable-autoexec）。
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const blend = process.argv[2];
const BLENDER = process.env.BLENDER || 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe';
if (!blend || !existsSync(blend)) {
  console.error('usage: npm run model -- "<Iphone_18_.blend のパス>"');
  process.exit(1);
}
mkdirSync(path.resolve('public/model'), { recursive: true });
execFileSync(BLENDER, [
  '--background', '--disable-autoexec', path.resolve(blend),
  '--python', path.resolve('model/export_iphone.py'), '--',
  path.resolve('public/model/iphone.glb'), path.resolve('src/model.json'),
], { stdio: ['ignore', 'pipe', 'inherit'] }).toString().split('\n').filter((l) => /^(model:|wrote)/.test(l)).forEach((l) => console.log(l));
