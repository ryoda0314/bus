import ActivityKit
import Foundation
import Observation
import WidgetKit

@Observable
final class AppModel {
    var stop: StopID {
        didSet { UserDefaults.standard.set(stop.rawValue, forKey: "stop"); expanded = false }
    }
    var dir: DirID {
        didSet { UserDefaults.standard.set(dir.rawValue, forKey: "dir"); expanded = false }
    }
    var lang: Lang {
        didSet {
            SharedStore.lang = lang
            WidgetCenter.shared.reloadAllTimelines()
            // ライブアクティビティの文言も切り替える
            if let trip = rideTrip(now: Date()), !Activity<RideActivityAttributes>.activities.isEmpty {
                RideActivity.start(trip, T)
            }
        }
    }
    private(set) var ride: Ride?
    /// 乗るバスの専用画面を開いているか
    var rideOpen = false
    /// 「すべて表示」
    var expanded = false

    var T: L10n { .of(lang) }

    init() {
        let d = UserDefaults.standard
        stop = StopID(rawValue: d.string(forKey: "stop") ?? "") ?? .toyonaka
        dir = DirID(rawValue: d.string(forKey: "dir") ?? "") ?? .all
        lang = SharedStore.lang
        ride = SharedStore.ride
    }

    /// 乗るバス（発車1分後を過ぎたら nil）
    func rideTrip(now: Date) -> Trip? {
        guard let r = ride, r.dep.timeIntervalSince(now) > -60 else { return nil }
        return Timetable.trip(stop: r.stop, dep: r.dep)
    }

    func choose(_ trip: Trip) {
        setRide(Ride(stop: trip.stop, dep: trip.dep))
        rideOpen = true
        RideActivity.start(trip, T)
    }

    func cancelRide() {
        setRide(nil)
        rideOpen = false
        RideActivity.endAll()
    }

    /// 時刻表に戻る。乗るバスの乗り場を開く
    func closeRide() {
        rideOpen = false
        if let r = ride { stop = r.stop }
    }

    /// アプリに戻ってきたとき：発車済みの便を片付ける
    func refresh() {
        if ride != nil && rideTrip(now: Date()) == nil {
            cancelRide()
        }
    }

    private func setRide(_ r: Ride?) {
        ride = r
        SharedStore.ride = r
        WidgetCenter.shared.reloadAllTimelines()
    }
}

enum RideActivity {
    /// ライブアクティビティは最長8時間しか出せないので、それより先の便はウィジェットだけ
    static let maxLead: TimeInterval = 8 * 3600

    static func start(_ trip: Trip, _ T: L10n) {
        endAll()
        guard ActivityAuthorizationInfo().areActivitiesEnabled,
              trip.dep.timeIntervalSinceNow < maxLead else { return }
        let attrs = RideActivityAttributes(
            start: Date(), label: T.rideLabel, stop: T.stopName(trip.stop),
            time: Timetable.hm(trip.dep), depWord: T.dep, kind: T.kind(trip),
            arrival: T.arrival(trip), note: T.note(trip))
        let content = ActivityContent(state: RideActivityAttributes.ContentState(dep: trip.dep),
                                      staleDate: trip.dep.addingTimeInterval(60))
        _ = try? Activity.request(attributes: attrs, content: content, pushType: nil)
    }

    static func endAll() {
        // 今あるものだけ終わらせる（この直後に始める新しいものは残す）
        let current = Activity<RideActivityAttributes>.activities
        Task {
            for a in current { await a.end(nil, dismissalPolicy: .immediate) }
        }
    }
}
