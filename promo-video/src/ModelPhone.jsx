import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import MODEL from './model.json';
import { SCREEN_H, SCREEN_W } from './Phone.jsx';

// iPhone 18 Pro Max の3Dモデル（public/model/iphone.glb）を three.js で描く端末。
// 前作（作成したもの/isct/promo-video の src/film/ModelPhone.jsx）と同じ作り：
//   本体（金属のフレーム・厚み・ボタン・カメラ）は WebGL で描いて 2D のキャンバスへ写し、
//   画面の中身は DOM（実アプリの iframe）のまま、表示部分の4隅を画面に投影した位置へ matrix3d で貼る。
//   本体の傾きと1コマずつ一致する。ガラスの映り込みはガラスだけを別に描いて、画面の上に重ねる。
// iphone.glb は model/export_iphone.py が .blend から書き出したもの：表示部分の中心が原点、1単位 = 画面の 1px、
// 正面が +Z、上が +Y。表示部分の大きさ・角の丸み・ダイナミックアイランドの位置は src/model.json（同じスクリプトが測ったもの）。
// 書き出しと静止画では、ブラウザの GL を ANGLE にする（render.mjs・preview_frames.mjs の chromiumOptions）。

const PERSP = 2400; // カメラの距離（z = 0 の面で 1単位 = 1px になる画角）
const MW = MODEL.screen.w; // 表示部分の幅（約 393.7。DOM の画面 393 をここへ貼る）
const MH = MODEL.screen.h; // 852
const FRAME = 0x2b2c68; // 本体の色（アプリの紺に寄せた、深い藍のチタン）

// ── 1つのタブで1つの WebGL を使い回す（端末ごとに 2D のキャンバスへ写す）──────
let shared = null;
const load = () => {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  const body = new THREE.Scene();
  body.environment = env;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-0.6, 1, 1.2);
  body.add(key, new THREE.AmbientLight(0xffffff, 0.35));
  const glass = new THREE.Scene();
  glass.environment = env;
  const camera = new THREE.PerspectiveCamera((2 * Math.atan(540 / PERSP) * 180) / Math.PI, 1920 / 1080, 10, 20000);
  const handle = delayRender('iPhone の3Dモデルを読み込み中', { timeoutInMilliseconds: 120000 });
  let resolveReady;
  shared = { renderer, body, glass, camera, ready: false, bodyRoot: null, glassRoot: null, readyPromise: new Promise((r) => { resolveReady = r; }) };
  new GLTFLoader().load(staticFile('model/iphone.glb'), (gltf) => {
    const root = gltf.scene;
    const glassRoot = new THREE.Group();
    const toGlass = [];
    const metal = (color, roughness, extra = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, envMapIntensity: 1.25, ...extra });
    root.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material?.name || '';
      if (name === '17ProMax_glass') {
        // ガラス：映り込みだけ。色 c をそのまま、不透明度を max(c) にして書く（前作と同じ。重ねると screen 合成とほぼ同じ見え方）
        const m = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.4 });
        m.blending = THREE.NoBlending;
        m.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace(/}\s*$/, '\tgl_FragColor.a = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);\n}');
        };
        o.material = m;
        toGlass.push(o);
      } else if (name === 'Material.001') {
        o.material = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 表示部分（DOM の画面が上に乗る）
      } else if (/Black2\.001|2112\.001|Lens2\.001/.test(name)) {
        o.visible = false; // ダイナミックアイランドは DOM の画面の上に描く（同じ位置・大きさ）
      } else if (name === '17ProMax_color') {
        o.material = metal(FRAME, 0.28);
      } else if (name === '17ProMax_color2') {
        o.material = new THREE.MeshPhysicalMaterial({ color: FRAME, metalness: 0.35, roughness: 0.55, envMapIntensity: 1.0 }); // 背面のすりガラス
      } else if (name === '17ProMax_color3') {
        o.material = metal(0x1d1e48, 0.4);
      } else if (name === '17ProMax_Black2') {
        o.material = new THREE.MeshPhysicalMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.25, envMapIntensity: 1.0 }); // 画面のふち
      } else if (/Lens/.test(name)) {
        o.material = new THREE.MeshPhysicalMaterial({ color: 0x05070d, metalness: 0.6, roughness: 0.08, clearcoat: 1, envMapIntensity: 2 });
      } else if (name === '17ProMax_Logo') {
        // 背面のロゴは見せない（他社の商標を映さない）。背面の板にはロゴの形の穴があるので、
        // 消すと奥の金属が見えてしまう。背面と同じすりガラスで塗ってなじませる
        o.material = new THREE.MeshPhysicalMaterial({ color: FRAME, metalness: 0.35, roughness: 0.55, envMapIntensity: 1.0 });
      } else if (o.material) {
        o.material.envMapIntensity = 1.2;
      }
    });
    toGlass.forEach((o) => { o.removeFromParent(); glassRoot.add(o); o.renderOrder = 1; });
    // ガラスは本体とは別に描いて上に重ねるので、そのままだと本体の奥にあるガラス（背面のレンズのカバーなど）まで
    // 描かれて、横から見たときに透けて見える。本体の写しを「奥行きだけ」先に描いて、隠れるガラスは描かないようにする
    const occluder = root.clone(true);
    occluder.traverse((o) => {
      if (!o.isMesh) return;
      o.material = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      o.renderOrder = 0;
    });
    glassRoot.add(occluder);
    shared.bodyRoot = root;
    shared.glassRoot = glassRoot;
    body.add(root);
    glass.add(glassRoot);
    shared.ready = true;
    resolveReady();
    continueRender(handle);
  }, undefined, (err) => cancelRender(new Error(`public/model/iphone.glb を読めませんでした（npm run model で作る）: ${err?.message || err}`)));
  return shared;
};

// 端末の置き方（x, y は表示部分の中心の画面上の位置、s は大きさ、rx/ry/rz は CSS と同じ向きの角度）→ 3D の行列
const DEG = Math.PI / 180;
const placeObject = (o, pose) => {
  o.position.set(0, 0, 0);
  o.rotation.set(-(pose.rx || 0) * DEG, (pose.ry || 0) * DEG, -(pose.rz || 0) * DEG, 'XYZ');
  o.scale.setScalar(pose.s);
  o.updateMatrixWorld(true);
};
// カメラは端末の中心の正面（CSS の perspective-origin を端末の中心にしたのと同じ見え方）
const placeCamera = (cam, pose, region) => {
  cam.position.set(0, 0, PERSP);
  cam.lookAt(0, 0, 0);
  if (region) cam.setViewOffset(1920, 1080, region.x - (pose.x - 960), region.y - (pose.y - 540), region.w, region.h);
  else cam.clearViewOffset();
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
};

// 端末の座標（px、表示部分の中心が原点、y は上向き）の点 → 画面上の位置
const tmpObj = new THREE.Object3D();
const tmpCam = new THREE.PerspectiveCamera((2 * Math.atan(540 / PERSP) * 180) / Math.PI, 1920 / 1080, 10, 20000);
export const projectPoints = (pose, pts) => {
  placeObject(tmpObj, pose);
  placeCamera(tmpCam, pose, null);
  return pts.map(([x, y, z]) => {
    const v = new THREE.Vector3(x, y, z).applyMatrix4(tmpObj.matrixWorld).project(tmpCam);
    return [((v.x + 1) / 2) * 1920 + (pose.x - 960), ((1 - v.y) / 2) * 1080 + (pose.y - 540)];
  });
};

// 長方形 (0,0)-(w,h) を4点 [左上, 右上, 右下, 左下] へ写す CSS の matrix3d（前作と同じ）
export const quadMatrix = (w, h, q) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2; const dx2 = x3 - x2; const sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2; const dy2 = y3 - y2; const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const hh = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1; const b = x3 - x0 + hh * x3; const c = x0;
  const d = y1 - y0 + g * y1; const e = y3 - y0 + hh * y3; const f = y0;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((x) => +x.toFixed(9)).join(',')})`;
};

// 表示部分の4隅（左上・右上・右下・左下）を画面に投影した位置
const screenQuad = (pose, z = 0) => projectPoints(pose, [[-MW / 2, MH / 2, z], [MW / 2, MH / 2, z], [MW / 2, -MH / 2, z], [-MW / 2, -MH / 2, z]]);
// 投影した4隅の面積（正なら表、負なら裏を向いている）
const quadArea = (q) => q.reduce((a, [x, y], i) => { const [x2, y2] = q[(i + 1) % 4]; return a + x * y2 - x2 * y; }, 0) / 2;

// DOM の画面（SCREEN_W x SCREEN_H）を、モデルの表示部分の上（高さ z）に貼る matrix3d
export const screenMatrix = (pose, z = 0) => quadMatrix(SCREEN_W, SCREEN_H, screenQuad(pose, z));

// 本体（またはガラス）を 2D のキャンバスに描く
const draw = (ctx, which, pose, region) => {
  const S = load();
  if (!S.ready) return;
  const { renderer, camera } = S;
  const pr = 1.5; // 少し大きく描いて縮める（輪郭をなめらかに）
  renderer.setPixelRatio(pr);
  renderer.setSize(region.w, region.h, false);
  const root = which === 'glass' ? S.glassRoot : S.bodyRoot;
  placeObject(root, pose);
  placeCamera(camera, pose, region);
  renderer.setClearColor(0x000000, 0);
  renderer.render(which === 'glass' ? S.glass : S.body, camera);
  ctx.canvas.width = region.w * pr;
  ctx.canvas.height = region.h * pr;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(renderer.domElement, 0, 0);
};

const Layer = ({ which, pose, region, style }) => {
  const ref = useRef(null);
  // モデルの読み込みが終わったら描き直す（最初の描画のときはまだ無いことがある）
  const [ready, setReady] = useState(() => load().ready);
  useEffect(() => {
    if (ready) return undefined;
    const handle = delayRender('iPhone の3Dモデルを待っています');
    load().readyPromise.then(() => { setReady(true); continueRender(handle); });
    return undefined;
  }, [ready]);
  useLayoutEffect(() => {
    draw(ref.current.getContext('2d'), which, pose, region);
  });
  return <canvas ref={ref} style={{ position: 'absolute', left: region.x, top: region.y, width: region.w, height: region.h, ...style }} />;
};

// ダイナミックアイランド（モデルと同じ位置・大きさ。DOM の画面の上に描く）
const Island = () => {
  const { left, top, w, h } = MODEL.island;
  return <div style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: h / 2, background: '#000', zIndex: 300 }} />;
};

// 端末1台。pose = { x, y, s, rx, ry, rz, o }（x, y は表示部分の中心の画面上の位置）。
// children は SCREEN_W x SCREEN_H の画面の中（角丸で切る）
export const ModelPhone = ({ pose, children, shadow = 1, glare = 1 }) => {
  load();
  if ((pose.o ?? 1) <= 0.001) return null;
  const s = pose.s;
  // 描く範囲（端末の回りに余白）
  const w = Math.ceil(560 * s + 260);
  const h = Math.ceil(1000 * s + 260);
  const region = { x: Math.round(pose.x - w / 2), y: Math.round(pose.y - h / 2), w, h };
  // 端末が回って画面が裏や真横を向いているあいだは、DOM の画面を見えなくする
  // （外すと iframe が読み込み直しになるので、visibility で隠すだけ）
  const q = screenQuad(pose);
  const facing = quadArea(q) > 0.02 * MW * MH * s * s;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: pose.o ?? 1, pointerEvents: 'none' }}>
      <Layer
        which="body"
        pose={pose}
        region={region}
        style={{ filter: shadow > 0 ? `drop-shadow(0 ${46 * s}px ${60 * s}px rgba(22,20,74,${0.42 * shadow})) drop-shadow(0 ${12 * s}px ${16 * s}px rgba(22,20,74,${0.22 * shadow}))` : undefined }}
      />
      <div style={{
        position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, transformOrigin: '0 0',
        transform: facing ? quadMatrix(SCREEN_W, SCREEN_H, q) : 'scale(0)', visibility: facing ? 'visible' : 'hidden',
        borderRadius: MODEL.screen.radius, overflow: 'hidden', background: '#000',
      }}>
        {children}
        <Island />
      </div>
      {glare > 0 && <Layer which="glass" pose={pose} region={region} style={{ opacity: glare }} />}
    </div>
  );
};

// CSS の Phone と同じ考え方の置き方 → pose。origin（表示部分の中心からのずれ、px、y は下向き）を中心に拡大する
export const poseOf = ({ x, y, scale = 1, rx = 0, ry = 0, rz = 0, origin = [0, 0], o = 1 }) => ({
  x: x + (1 - scale) * origin[0], y: y + (1 - scale) * origin[1], s: scale, rx, ry, rz, o,
});

// 本体の大きさ（px）。キャプションなどを端末の下に置くときに使う
export const BODY_H = MODEL.body.y[1] - MODEL.body.y[0];
