// 学内連絡バス「乗るバス」ウィジェット（Scriptable 用）
// Scriptable にスクリプト名「BusRide」で保存して使う。
// PWA の「ウィジェットに表示」から scriptable:///run/BusRide?dep=... で呼ばれ、選んだ便を保存する。
// ウィジェットとして置くと、保存した便の発車時刻とカウントダウンを表示する。

const fm = FileManager.local();
const ridePath = fm.joinPath(fm.documentsDirectory(), "bus-ride.json");
const langPath = fm.joinPath(fm.documentsDirectory(), "bus-lang.txt");
const q = args.queryParameters || {};

// ---- PWA から呼ばれたとき：保存 or 解除 ----
if (q.l) fm.writeString(langPath, q.l);
if (q.clear !== undefined) {
  if (fm.fileExists(ridePath)) fm.remove(ridePath);
} else if (q.dep) {
  fm.writeString(ridePath, JSON.stringify(q));
}

const lang = fm.fileExists(langPath) ? fm.readString(langPath) : "ja";
const TXT = {
  ja: { title: "乗るバス", none: "乗るバスは未選択", hint: "アプリで「これに乗る」を選択", dep: "発", saved: "ウィジェットに表示しました", cleared: "ウィジェットの表示を消しました" },
  ko: { title: "탈 버스", none: "선택한 버스 없음", hint: "앱에서 「이 버스 타기」 선택", dep: "출발", saved: "위젯에 표시했습니다", cleared: "위젯 표시를 지웠습니다" },
}[lang] || null;
const L = TXT || { title: "乗るバス", none: "乗るバスは未選択", hint: "", dep: "発", saved: "", cleared: "" };

// 発車1分後を過ぎた便は消す
function loadRide() {
  if (!fm.fileExists(ridePath)) return null;
  try {
    const r = JSON.parse(fm.readString(ridePath));
    if (Number(r.dep) < Date.now() - 60000) { fm.remove(ridePath); return null; }
    return r;
  } catch (e) {
    return null;
  }
}
const ride = loadRide();

const NAVY = new Color("#2d2a7e");
const RED = new Color("#ff8a8f");
const WHITE = Color.white();
const DIM = new Color("#ffffff", 0.75);

function buildWidget(family) {
  const w = new ListWidget();
  const lock = family && family.startsWith("accessory");
  if (!lock) {
    w.backgroundColor = NAVY;
    w.setPadding(14, 14, 14, 14);
  }
  // 発車1分後に次の表示へ。未選択なら30分ごと
  w.refreshAfterDate = ride ? new Date(Number(ride.dep) + 60000) : new Date(Date.now() + 30 * 60000);

  if (!ride) {
    if (family === "accessoryInline") {
      w.addText(L.none);
    } else {
      const t = w.addText(L.title); t.font = Font.boldSystemFont(lock ? 12 : 13); if (!lock) t.textColor = DIM;
      const n = w.addText(L.none); n.font = Font.systemFont(lock ? 13 : 15); if (!lock) n.textColor = WHITE;
      if (!lock && L.hint) { w.addSpacer(4); const h = w.addText(L.hint); h.font = Font.systemFont(11); h.textColor = DIM; }
    }
    return w;
  }

  const depDate = new Date(Number(ride.dep));
  const soon = Number(ride.dep) - Date.now() <= 120000;

  if (family === "accessoryInline") {
    w.addText(`${ride.time}${L.dep} ${ride.k || ""}`.trim());
    return w;
  }
  if (family === "accessoryCircular") {
    w.addSpacer();
    const t = w.addText(ride.time); t.font = Font.boldSystemFont(14); t.centerAlignText(); t.minimumScaleFactor = 0.6;
    const d = w.addDate(depDate); d.applyTimerStyle(); d.font = Font.systemFont(11); d.centerAlignText();
    w.addSpacer();
    return w;
  }
  if (family === "accessoryRectangular") {
    const head = w.addText(`${ride.s}  ${ride.time}${L.dep} ${ride.k || ""}`.trim());
    head.font = Font.boldSystemFont(12); head.lineLimit = 1; head.minimumScaleFactor = 0.7;
    const d = w.addDate(depDate); d.applyTimerStyle(); d.font = Font.boldSystemFont(24); d.minimumScaleFactor = 0.6;
    if (ride.a) { const a = w.addText(ride.a); a.font = Font.systemFont(11); a.lineLimit = 1; a.minimumScaleFactor = 0.6; }
    return w;
  }

  // ホーム画面（小・中）
  const label = w.addText(L.title); label.font = Font.boldSystemFont(11); label.textColor = DIM;
  const stop = w.addText(ride.s); stop.font = Font.systemFont(13); stop.textColor = WHITE; stop.lineLimit = 1; stop.minimumScaleFactor = 0.7;
  w.addSpacer(2);
  const time = w.addText(`${ride.time}${L.dep}  ${ride.k || ""}`.trim());
  time.font = Font.boldSystemFont(20); time.textColor = WHITE; time.lineLimit = 1; time.minimumScaleFactor = 0.6;
  w.addSpacer();
  const d = w.addDate(depDate); d.applyTimerStyle();
  d.font = Font.boldSystemFont(family === "medium" ? 36 : 30); d.textColor = soon ? RED : WHITE; d.minimumScaleFactor = 0.6;
  if (ride.a) { const a = w.addText(ride.a); a.font = Font.systemFont(11); a.textColor = DIM; a.lineLimit = 2; a.minimumScaleFactor = 0.7; }
  if (family === "medium" && ride.n) { const n = w.addText(ride.n); n.font = Font.boldSystemFont(11); n.textColor = WHITE; }
  return w;
}

if (config.runsInWidget) {
  Script.setWidget(buildWidget(config.widgetFamily));
} else if (q.dep || q.clear !== undefined) {
  // PWA から呼ばれた：結果を短く知らせて終わる（左上の「◀」でアプリに戻れる）
  const a = new Alert();
  a.title = q.clear !== undefined ? L.cleared : L.saved;
  if (ride) a.message = `${ride.s}  ${ride.time}${L.dep}`;
  a.addAction("OK");
  await a.presentAlert();
} else {
  // Scriptable で直接実行したときはプレビュー
  await buildWidget("accessoryRectangular").presentAccessoryRectangular();
}
Script.complete();
