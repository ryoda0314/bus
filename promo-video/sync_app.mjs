// アプリ本体（このフォルダの1つ上）を public/app/ にコピーし、時刻表を src/timetable.json に書き出す。
// 動画の端末の中は、このコピーを iframe でそのまま開いている（アプリのコードは変えない）。
// npm run studio / frames / render の前に自動で走る。
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APP = path.resolve('..');
const OUT = path.resolve('public/app');
mkdirSync(OUT, { recursive: true });
for (const f of ['index.html', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest']) {
  copyFileSync(path.join(APP, f), path.join(OUT, f));
}

// 掲示の時刻表（冒頭の場面）と経路図の所要時間に使う。index.html の STOPS と同じもの
const html = readFileSync(path.join(APP, 'index.html'), 'utf8');
const stops = {};
const re = /(\w+): \{\s*to: "(\w+)", express: (\d+), via: \[(\d+), (\d+)\][^}]*?times: \[([^\]]*)\]/g;
for (const m of html.matchAll(re)) {
  stops[m[1]] = {
    to: m[2],
    express: Number(m[3]),
    via: [Number(m[4]), Number(m[5])],
    times: [...m[6].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
  };
}
for (const id of ['toyonaka', 'kougaku', 'ningen']) {
  if (!stops[id]?.times.length) throw new Error(`index.html から ${id} の時刻表を読めませんでした`);
}
writeFileSync(path.resolve('src/timetable.json'), JSON.stringify(stops, null, 1) + '\n');
console.log(
  'synced app → public/app /',
  Object.entries(stops).map(([k, v]) => `${k} ${v.times.length}便`).join('・'),
);
