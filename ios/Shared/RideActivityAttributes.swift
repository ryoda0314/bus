import ActivityKit
import Foundation

/// 乗るバスのライブアクティビティ（ロック画面・Dynamic Island）
/// 文言は開始時の言語で作って持たせる
struct RideActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var dep: Date
    }

    /// 選んだ時刻。カウントダウンの起点に使う
    var start: Date
    var label: String   // 乗るバス
    var stop: String    // 豊中 → 吹田
    var time: String    // 8:30
    var depWord: String // 発
    var kind: String    // 直行 電気バス
    var arrival: String
    var note: String?
}
