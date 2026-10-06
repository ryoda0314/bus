import Foundation

// ===== 時刻表データ（2026/4/1改正） =====
// index.html の STOPS / CLOSED_RANGES / HOLIDAYS と同じ内容。時刻表を更新したら両方直す。
// flags: x=直行, v=箕面経由, e=電気バス, o=当駅始発

enum StopID: String, CaseIterable, Codable, Identifiable {
    case toyonaka, kougaku, ningen
    var id: String { rawValue }
}

enum DirID: String, CaseIterable, Codable, Identifiable {
    case all, express, via
    var id: String { rawValue }
    var filter: Character? {
        switch self {
        case .all: return nil
        case .express: return "x"
        case .via: return "v"
        }
    }
}

enum Place: Hashable { case suita, toyonaka, minoh }

struct StopInfo {
    let to: Place
    /// 直行の所要分
    let express: Int
    /// 箕面経由の [箕面まで, 終点まで] の所要分
    let via: (toMinoh: Int, total: Int)
    let viaNote: Bool
    let times: [String]
}

struct Trip: Identifiable, Hashable {
    let stop: StopID
    let dep: Date
    /// JST のその日の0時
    let day: Date
    let flags: String

    var id: Date { dep }
    var isExpress: Bool { flags.contains("x") }
    var isVia: Bool { flags.contains("v") }
    var isOrigin: Bool { flags.contains("o") }
    var isElectric: Bool { flags.contains("e") }

    private var info: StopInfo { Timetable.stops[stop]! }
    var to: Place { info.to }
    var rideMin: Int { isExpress ? info.express : info.via.total }
    var viaMin: Int? { isExpress ? nil : info.via.toMinoh }
    var arrival: Date { dep.addingTimeInterval(TimeInterval(rideMin * 60)) }
    var showsViaNote: Bool { !isExpress && info.viaNote }
}

enum Timetable {
    static let tz = TimeZone(identifier: "Asia/Tokyo")!
    static let calendar: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = tz
        return c
    }()

    static let stops: [StopID: StopInfo] = [
        .toyonaka: StopInfo(
            to: .suita, express: 30, via: (20, 40), viaNote: true,
            times: [
                "8:00 x","8:05 x","8:10 x","8:45 x","9:00 xe","9:20 v","9:45 x","9:50 x","10:40 x",
                "10:50 x","11:30 v","12:05 x","12:10 x","12:40 ve","12:45 x","12:55 x","13:35 v",
                "14:25 ve","15:10 v","15:30 x","16:00 v","16:30 x","16:55 x","17:20 ve","17:25 x",
                "17:40 v","18:00 x","18:30 v","18:55 x","19:25 v","20:10 v"]),
        .kougaku: StopInfo(
            to: .toyonaka, express: 30, via: (25, 45), viaNote: false,
            times: [
                "7:55 v","8:30 v","8:55 v","9:20 x","9:30 xe","10:00 v","10:40 v","11:15 v","11:20 x",
                "12:10 xe","12:15 x","12:35 x","12:40 v","13:35 ve","14:15 v","15:10 xe","15:15 x",
                "16:00 x","16:05 v","16:50 x","17:00 x","17:25 v","17:55 x","18:10 ve","18:30 x",
                "18:40 x","19:10 v","19:45 v","20:10 v","20:20 x"]),
        .ningen: StopInfo(
            to: .toyonaka, express: 25, via: (20, 40), viaNote: false,
            times: [
                "8:00 v","8:35 v","9:00 v","9:25 x","9:35 xe","10:05 v","10:45 v","11:20 v","11:25 x",
                "12:15 xe","12:20 x","12:40 x","12:45 v","13:40 ve","14:20 v","15:15 xe","15:20 x",
                "16:05 x","16:10 v","16:55 x","17:05 x","17:30 v","18:00 x","18:15 ve","18:35 x",
                "18:45 x","19:15 v","19:50 v","20:15 v","20:25 x"]),
    ]

    // ===== 運休日（公式Googleカレンダーより、終了日を含む） =====
    static let closedRanges: [(String, String)] = [
        ("2026-04-01","2026-04-09"), ("2026-04-29","2026-04-29"), ("2026-05-04","2026-05-06"),
        ("2026-08-11","2026-09-30"), ("2026-11-02","2026-11-04"), ("2026-12-26","2027-01-03"),
        ("2027-02-04","2027-02-04"), ("2027-02-09","2027-03-31"),
    ]
    // ===== 祝日（土日祝は記載が無くても運休） =====
    static let holidays: Set<String> = [
        "2026-01-01","2026-01-12","2026-02-11","2026-02-23","2026-03-20","2026-04-29","2026-05-03",
        "2026-05-04","2026-05-05","2026-05-06","2026-07-20","2026-08-11","2026-09-21","2026-09-22",
        "2026-09-23","2026-10-12","2026-11-03","2026-11-23",
        "2027-01-01","2027-01-11","2027-02-11","2027-02-23","2027-03-21","2027-03-22",
    ]

    private static let parsed: [StopID: [(min: Int, flags: String)]] = stops.mapValues { info in
        info.times.map { s in
            let parts = s.split(separator: " ")
            let hm = parts[0].split(separator: ":").compactMap { Int($0) }
            return (hm[0] * 60 + hm[1], parts.count > 1 ? String(parts[1]) : "")
        }
    }

    private static let ymdFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = calendar
        f.timeZone = tz
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let hmFormatter: DateFormatter = {
        let f = DateFormatter()
        f.timeZone = tz
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "H:mm"
        return f
    }()

    static func ymd(_ d: Date) -> String { ymdFormatter.string(from: d) }
    static func hm(_ d: Date) -> String { hmFormatter.string(from: d) }
    static func dayStart(_ d: Date) -> Date { calendar.startOfDay(for: d) }

    static func isServiceDay(_ day: Date) -> Bool {
        let wd = calendar.component(.weekday, from: day)
        if wd == 1 || wd == 7 { return false }
        let key = ymd(day)
        if holidays.contains(key) { return false }
        return !closedRanges.contains { key >= $0.0 && key <= $0.1 }
    }

    /// 今以降の便を、運行日をまたいで最大 n 件
    static func upcoming(_ n: Int, stop: StopID, dir: DirID = .all, now: Date = Date()) -> [Trip] {
        var out: [Trip] = []
        var day = dayStart(now)
        let cutoff = now.addingTimeInterval(-30)
        for _ in 0..<60 {
            if isServiceDay(day) {
                for b in parsed[stop]! where dir.filter.map({ b.flags.contains($0) }) ?? true {
                    let dep = day.addingTimeInterval(TimeInterval(b.min * 60))
                    if dep >= cutoff {
                        out.append(Trip(stop: stop, dep: dep, day: day, flags: b.flags))
                        if out.count >= n { return out }
                    }
                }
            }
            day = calendar.date(byAdding: .day, value: 1, to: day)!
        }
        return out
    }

    /// 保存してある便（乗り場＋発車時刻）を時刻表から引き直す
    static func trip(stop: StopID, dep: Date) -> Trip? {
        let day = dayStart(dep)
        guard isServiceDay(day) else { return nil }
        let min = Int(dep.timeIntervalSince(day) / 60)
        guard let b = parsed[stop]!.first(where: { $0.min == min }) else { return nil }
        return Trip(stop: stop, dep: dep, day: day, flags: b.flags)
    }
}
