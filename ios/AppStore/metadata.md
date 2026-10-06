# App Store Connect に入力する内容

`［］` は自分で決めて埋める。

## アプリ情報

| 項目 | 内容 |
| --- | --- |
| 名前（30字） | 次のバス - 学内連絡バス |
| サブタイトル（30字） | 発車までをカウントダウン |
| バンドル ID | com.ryoda.NextBus |
| SKU | nextbus-ios |
| プライマリ言語 | 日本語 |
| カテゴリ | ナビゲーション（サブ: 旅行） |
| 価格 | 無料 |
| 年齢制限 | 4+（質問はすべて「なし」） |
| 著作権 | 2026 Ryo Tsukamoto |
| プライバシーポリシー URL | https://bus-gamma-two.vercel.app/privacy.html |
| サポート URL | https://bus-gamma-two.vercel.app/ |
| App のプライバシー | 「データを収集していません」 |
| 暗号化 | Info.plist で申告済み（質問は出ない） |

名前がもう使われていると言われたら、「次のバス - 学内シャトル」などに変える。
アプリの名前やキーワードに「阪大」「大阪大学」を入れると、他者の名称の無断使用（審査ガイドライン 5.2）で止められることがあるので入れない。説明文の中で「非公式」と書いた上で触れるのはよい。

## プロモーションテキスト（170字・審査なしでいつでも変えられる）

```
2026年4月1日改正ダイヤに対応。「乗る」を押すだけで、ロック画面と Dynamic Island に発車までのカウントダウンが出ます。
```

## 説明（日本語）

```
豊中⇄吹田の学内連絡バスの「次の便」を、発車までの秒単位カウントダウンで表示する非公式アプリです。

■ 次のバスがひと目でわかる
・乗り場（豊中 → 吹田 / 工学部前 → 豊中 / 人科前 → 豊中）を選ぶだけ
・直行 / 箕面経由で絞り込み
・到着予定時刻、箕面経由便の並ぶ列の案内も表示
・土日祝・運休日を自動で判定し、次の運行日の便を表示

■ 乗るバスをロック画面に
・「乗る」を押した便を、ロック画面のウィジェットとライブアクティビティ（Dynamic Island）にカウントダウン表示
・ホーム画面のウィジェット（小・中）にも対応
・発車すると自動で消えます

■ その他
・日本語 / 한국어
・時刻表はアプリ内蔵。通信なしで使えます
・アカウント登録不要。個人情報は一切収集しません

※ 本アプリは大阪大学および再履バス同好会とは関係のない、個人が作成した非公式アプリです。時刻は公式時刻表をもとにしていますが、道路状況などで遅れることがあります。最新の情報は公式の案内をご確認ください。
```

## 説明（한국어・任意で韓国語のローカライズを追加する場合）

```
도요나카⇄스이타 학내 연락버스의 「다음 버스」를 출발까지 초 단위 카운트다운으로 보여 주는 비공식 앱입니다.

■ 다음 버스를 한눈에
・승차장(도요나카 → 스이타 / 공학부 → 도요나카 / 인간과학부 → 도요나카) 선택
・직행 / 미노오 경유로 필터
・도착 예정 시각, 미노오 경유 버스의 줄 안내 표시
・주말·공휴일·운휴일을 자동으로 판단해 다음 운행일의 버스를 표시

■ 탈 버스를 잠금 화면에
・「타기」를 누른 버스를 잠금 화면 위젯과 라이브 액티비티(Dynamic Island)에 카운트다운 표시
・홈 화면 위젯(소·중)도 지원
・출발하면 자동으로 사라집니다

■ 기타
・日本語 / 한국어
・시간표가 앱에 내장되어 있어 인터넷 없이 사용 가능
・회원 가입 불필요. 개인정보를 일절 수집하지 않습니다

※ 이 앱은 오사카대학 및 再履バス同好会와 관계없는 개인이 만든 비공식 앱입니다. 도로 사정 등으로 늦어질 수 있습니다.
```

## キーワード（100字・カンマ区切り・空白なし）

```
バス,時刻表,シャトルバス,連絡バス,豊中,吹田,箕面,キャンパス,大学,通学,カウントダウン,ウィジェット,学バス
```

## App Review への メモ（審査メモ）

```
This app shows a countdown to the next inter-campus shuttle bus (Toyonaka ⇄ Suita). No login is required and no data is collected.

How to test:
1. Pick a stop at the top (e.g. 豊中 → 吹田). The next departure and a live countdown are shown.
2. Tap "これに乗る" (Ride this bus) or "乗る" on any row. A dedicated screen opens, and a Live Activity starts on the Lock Screen / Dynamic Island.
3. Add the "次のバス" widget to the Lock Screen or Home Screen to see the same bus.
4. The language button (한국어 / 日本語) at the top right switches between Japanese and Korean.

Note: The shuttle does not run on weekends, Japanese public holidays, or university closure periods. On those days the app correctly shows "本日は運休です" (No service today) together with the first bus on the next service day, and the "乗る" buttons in the list still work.

This is an unofficial app made by a student and is not affiliated with the university.
```

## スクリーンショット（6.9インチ枠・1290×2796）

`screenshots/` の3枚をこの順で。

1. `1-timetable-ja.png` 時刻表とカウントダウン
2. `2-ride-ja.png` 乗るバスの画面
3. `3-timetable-ko.png` 韓国語

ロック画面のウィジェットやライブアクティビティの画面を足すと伝わりやすい。実機のスクリーンショットはサイズが違うので、6.9インチの枠には入らない。入れるなら別途 1290×2796 に作る。
