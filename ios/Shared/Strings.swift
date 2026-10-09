import Foundation

// ===== 表示文言（日本語 / 한국어） =====
// index.html の I18N と同じ内容

enum Lang: String, Codable {
    case ja, ko
    var other: Lang { self == .ja ? .ko : .ja }
    static var system: Lang {
        (Locale.preferredLanguages.first ?? "").lowercased().hasPrefix("ko") ? .ko : .ja
    }
}

struct L10n {
    let title: String
    let other: String
    let stops: [StopID: (String, String)]
    let place: [Place: String]
    let dirs: [DirID: String]
    let tagExp, tagVia, tagOrig, tagEv: String
    let viaNote: String
    let destExp: (String) -> String
    let destVia: (String) -> String
    let destLine: (String) -> String
    let next: String          // 「次」
    let nextDayPrefix: String // 「次は」
    let pre, post, h, m, s, soon: String
    let arr: (String, String) -> String
    let arrEnd: String
    let ended, closed, none: String
    let later, laterNone: String
    let more: (Int) -> String
    let less: String
    let rideBtn, rideLabel, unride, rideShort, toTable, dep: String
    let lockHint: String
    let widgetNone, widgetHint: String
    let ridePlan: (String, String, String) -> String
    let inMin: (Int, Int) -> String
    let tomorrow: String
    let wd: [String]
    let foot: String
    let link: String

    static func of(_ lang: Lang) -> L10n { lang == .ko ? ko : ja }

    static let ja = L10n(
        title: "学内連絡バス", other: "한국어",
        stops: [.toyonaka: ("豊中", "→ 吹田"), .kougaku: ("工学部前", "→ 豊中"), .ningen: ("人科前", "→ 豊中")],
        place: [.suita: "吹田", .toyonaka: "豊中", .minoh: "箕面"],
        dirs: [.all: "すべて", .express: "直行", .via: "箕面経由"],
        tagExp: "直", tagVia: "箕面経由", tagOrig: "当駅始発", tagEv: "電気バス",
        viaNote: "箕面行の列に並んでください",
        destExp: { "\($0)（直行）" }, destVia: { "箕面経由 \($0)" }, destLine: { "\($0)行" },
        next: "次", nextDayPrefix: "次は",
        pre: "あと", post: "", h: "時間", m: "分", s: "秒", soon: "まもなく発車",
        arr: { "\($0) \($1) 着" }, arrEnd: "予定",
        ended: "本日の運行は終了しました", closed: "本日は運休です", none: "しばらく運行予定がありません",
        later: "このあと", laterNone: "このあとの便はありません",
        more: { "すべて表示（あと\($0)便）" }, less: "閉じる",
        rideBtn: "これに乗る", rideLabel: "乗るバス", unride: "このバスをやめる", rideShort: "乗る",
        toTable: "時刻表", dep: "発",
        lockHint: "ロック画面のウィジェットにも表示されます",
        widgetNone: "乗るバスは未選択", widgetHint: "アプリで「乗る」を選択",
        ridePlan: { "乗るバス：\($0) \($1) 発（\($2)）　開く" },
        inMin: { $0 > 0 ? "\($0)時間\($1)分後" : "\($1)分後" },
        tomorrow: "明日", wd: ["日","月","火","水","木","金","土"],
        foot: "2026.04.01 改正ダイヤ。土日祝・運休日は運休。\n道路の混雑で遅れることがあります。",
        link: "公式時刻表（再履バス同好会）")

    static let ko = L10n(
        title: "학내 연락버스", other: "日本語",
        stops: [.toyonaka: ("도요나카", "→ 스이타"), .kougaku: ("공학부", "→ 도요나카"), .ningen: ("인간과학부", "→ 도요나카")],
        place: [.suita: "스이타", .toyonaka: "도요나카", .minoh: "미노오"],
        dirs: [.all: "전체", .express: "직행", .via: "미노오 경유"],
        tagExp: "직행", tagVia: "미노오 경유", tagOrig: "시발", tagEv: "전기버스",
        viaNote: "미노오행 줄에 서 주세요",
        destExp: { "\($0) (직행)" }, destVia: { "미노오 경유 \($0)" }, destLine: { "\($0)행" },
        next: "다음", nextDayPrefix: "다음",
        pre: "", post: "남음", h: "시간", m: "분", s: "초", soon: "곧 출발",
        arr: { "\($0) \($1) 도착" }, arrEnd: " 예정",
        ended: "오늘 운행은 종료되었습니다", closed: "오늘은 운행하지 않습니다", none: "당분간 운행 예정이 없습니다",
        later: "이후 버스", laterNone: "이후 버스가 없습니다",
        more: { "전체 보기 (\($0)대 더)" }, less: "접기",
        rideBtn: "이 버스 타기", rideLabel: "탈 버스", unride: "이 버스 취소", rideShort: "타기",
        toTable: "시간표", dep: "출발",
        lockHint: "잠금 화면 위젯에도 표시됩니다",
        widgetNone: "선택한 버스 없음", widgetHint: "앱에서 「타기」 선택",
        ridePlan: { "탈 버스: \($0) \($1) 출발 (\($2))  열기" },
        inMin: { $0 > 0 ? "\($0)시간 \($1)분 후" : "\($1)분 후" },
        tomorrow: "내일", wd: ["일","월","화","수","목","금","토"],
        foot: "2026.04.01 개정 시간표. 주말·공휴일·운휴일에는 운행하지 않습니다.\n도로 혼잡으로 늦어질 수 있습니다.",
        link: "공식 시간표 (再履バス同好会)")
}

// ===== 便ごとの表示文 =====
extension L10n {
    func stopName(_ stop: StopID) -> String { "\(stops[stop]!.0) \(stops[stop]!.1)" }

    func dest(_ t: Trip) -> String {
        t.isExpress ? destExp(place[t.to]!) : destVia(place[t.to]!)
    }

    /// 到着予定の文
    func arrival(_ t: Trip) -> String {
        let hm = Timetable.hm
        if let viaMin = t.viaMin {
            let minoh = arr(place[.minoh]!, hm(t.dep.addingTimeInterval(TimeInterval(viaMin * 60))))
            return "\(minoh) → \(arr(place[t.to]!, hm(t.arrival)))\(arrEnd)"
        }
        return arr(dest(t), hm(t.arrival)) + arrEnd
    }

    /// 「直行 電気バス」のような種別
    func kind(_ t: Trip) -> String {
        [t.isExpress ? dirs[.express]! : nil, t.isVia ? dirs[.via]! : nil, t.isElectric ? tagEv : nil]
            .compactMap { $0 }.joined(separator: " ")
    }

    func note(_ t: Trip) -> String? { t.showsViaNote ? viaNote : nil }

    /// 今日なら空、明日なら「明日 」、それ以降は「10/7(水) 」
    func dayLabel(_ day: Date, now: Date) -> String {
        let cal = Timetable.calendar
        let diff = cal.dateComponents([.day], from: Timetable.dayStart(now), to: day).day ?? 0
        if diff == 0 { return "" }
        if diff == 1 { return tomorrow + " " }
        let c = cal.dateComponents([.month, .day, .weekday], from: day)
        return "\(c.month!)/\(c.day!)(\(wd[c.weekday! - 1])) "
    }

    /// 一覧や乗るバスバーの「◯分後」「明日」
    func relative(_ t: Trip, now: Date) -> String {
        if t.day != Timetable.dayStart(now) { return dayLabel(t.day, now: now).trimmingCharacters(in: .whitespaces) }
        let mins = max(0, Int((t.dep.timeIntervalSince(now) / 60).rounded()))
        return inMin(mins / 60, mins % 60)
    }
}
