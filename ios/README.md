# 次のバス（iOS ネイティブ版）

PWA（`../index.html`）と同じ時刻表アプリを SwiftUI で作ったもの。
「乗る」を押した便が、Scriptable なしでロック画面に出る。

- **アプリ**: 時刻表・カウントダウン・「乗る」・乗るバスの画面（日本語 / 한국어）
- **ウィジェット**: ロック画面（長方形・丸・時計の上の1行）とホーム画面（小・中）。選んだ便の発車時刻とカウントダウン。発車1分後に消える
- **ライブアクティビティ**: 「乗る」を押すと、ウィジェットを置かなくてもロック画面と Dynamic Island にカウントダウンが出る（8時間以内の便のみ）

## ビルド

```sh
brew install xcodegen   # 初回のみ
cd ios
xcodegen                # NextBus.xcodeproj を作る（project.yml を変えたら再実行）
open NextBus.xcodeproj
```

### 実機に入れるとき

1. `project.yml` の `BUNDLE_ID` と `APP_GROUP` を自分のもの（例: `com.<名前>.NextBus` / `group.com.<名前>.NextBus`）に変える
2. `Shared/SharedStore.swift` の `appGroup` も `APP_GROUP` と同じ値にする
3. `xcodegen` を再実行し、Xcode の Signing & Capabilities で両ターゲット（NextBus / NextBusWidget）に自分の Team を選ぶ
4. iPhone を繋いで実行

無料の Apple ID でも入れられる（7日ごとに入れ直しが必要）。

## ロック画面に置く

ロック画面を長押し →「カスタマイズ」→ ロック画面 → ウィジェットを追加 →「次のバス」。

## 構成

| フォルダ | 中身 |
| --- | --- |
| `Shared/` | 時刻表データ・運休日（`Timetable.swift`）、文言（`Strings.swift`）、App Group の保存（`SharedStore.swift`）、色、ライブアクティビティの型。アプリとウィジェットの両方に入る |
| `App/` | アプリ本体の画面 |
| `Widget/` | ウィジェットとライブアクティビティ |

**時刻表を改正したら** `Shared/Timetable.swift` と `../index.html` の両方を直す。
