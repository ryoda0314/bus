import Foundation

/// 「これに乗る」で選んだ便。発車時刻と乗り場だけ持ち、中身は時刻表から引き直す
struct Ride: Codable, Equatable {
    var stop: StopID
    var dep: Date
}

/// アプリとウィジェットで共有する設定（App Group の UserDefaults）
enum SharedStore {
    /// project.yml の APP_GROUP と揃える
    static let appGroup = "group.com.ryoda.NextBus"
    static let defaults = UserDefaults(suiteName: appGroup) ?? .standard

    /// 発車1分後を過ぎた便は無かったことにする
    static var ride: Ride? {
        get {
            guard let data = defaults.data(forKey: "ride"),
                  let r = try? JSONDecoder().decode(Ride.self, from: data),
                  r.dep.timeIntervalSinceNow > -60 else { return nil }
            return r
        }
        set {
            if let v = newValue, let data = try? JSONEncoder().encode(v) {
                defaults.set(data, forKey: "ride")
            } else {
                defaults.removeObject(forKey: "ride")
            }
        }
    }

    static var lang: Lang {
        get { Lang(rawValue: defaults.string(forKey: "lang") ?? "") ?? .system }
        set { defaults.set(newValue.rawValue, forKey: "lang") }
    }
}
