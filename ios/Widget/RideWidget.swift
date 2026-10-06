import SwiftUI
import WidgetKit

@main
struct NextBusWidgets: WidgetBundle {
    var body: some Widget {
        RideWidget()
        RideLiveActivity()
    }
}

// MARK: - タイムライン

struct RideEntry: TimelineEntry {
    let date: Date
    let trip: Trip?
    let lang: Lang
}

struct RideProvider: TimelineProvider {
    func placeholder(in context: Context) -> RideEntry {
        RideEntry(date: Date(), trip: sampleTrip(), lang: SharedStore.lang)
    }

    func getSnapshot(in context: Context, completion: @escaping (RideEntry) -> Void) {
        let entry = current()
        // ウィジェットギャラリーでは、未選択でも見本の便を見せる
        completion(context.isPreview && entry.trip == nil
                   ? RideEntry(date: Date(), trip: sampleTrip(), lang: entry.lang) : entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RideEntry>) -> Void) {
        let now = Date()
        let entry = current()
        guard let trip = entry.trip else {
            // 次に変わるのはアプリで便を選んだとき（アプリから再読み込みする）
            completion(Timeline(entries: [entry], policy: .never))
            return
        }
        var entries = [entry]
        // 発車2分前から赤く
        let soon = trip.dep.addingTimeInterval(-120)
        if soon > now { entries.append(RideEntry(date: soon, trip: trip, lang: entry.lang)) }
        // 発車1分後に消す
        entries.append(RideEntry(date: trip.dep.addingTimeInterval(60), trip: nil, lang: entry.lang))
        completion(Timeline(entries: entries, policy: .never))
    }

    private func current() -> RideEntry {
        let trip = SharedStore.ride.flatMap { Timetable.trip(stop: $0.stop, dep: $0.dep) }
        return RideEntry(date: Date(), trip: trip, lang: SharedStore.lang)
    }

    private func sampleTrip() -> Trip? {
        Timetable.upcoming(1, stop: .toyonaka).first
    }
}

// MARK: - ウィジェット

struct RideWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RideWidget", provider: RideProvider()) { entry in
            RideWidgetView(entry: entry)
        }
        .configurationDisplayName("乗るバス / 탈 버스")
        .description("アプリで「乗る」を選んだ便の発車時刻とカウントダウン")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline,
                            .systemSmall, .systemMedium])
    }
}

/// 発車までのカウントダウン（0:00 で止まる）
func countdown(from: Date, to dep: Date) -> Text {
    Text(timerInterval: min(from, dep)...dep, countsDown: true)
}

struct RideWidgetView: View {
    let entry: RideEntry
    @Environment(\.widgetFamily) private var family

    private var T: L10n { .of(entry.lang) }
    private var isLock: Bool {
        [.accessoryRectangular, .accessoryCircular, .accessoryInline].contains(family)
    }

    var body: some View {
        Group {
            if let trip = entry.trip { rideView(trip) } else { emptyView }
        }
        .widgetURL(URL(string: "nextbus://ride"))
        .containerBackground(for: .widget) {
            if isLock { Color.clear } else { Palette.widgetNavy }
        }
    }

    // 未選択
    @ViewBuilder
    private var emptyView: some View {
        switch family {
        case .accessoryInline:
            Text(T.widgetNone)
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "bus.fill").font(.system(size: 20))
            }
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(T.rideLabel).font(.system(size: 12, weight: .bold))
                Text(T.widgetNone).font(.system(size: 13))
                Text(T.widgetHint).font(.system(size: 11)).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        default:
            VStack(alignment: .leading, spacing: 4) {
                Text(T.rideLabel).font(.system(size: 13, weight: .bold)).opacity(0.75)
                Text(T.widgetNone).font(.system(size: 15))
                Spacer(minLength: 0)
                Text(T.widgetHint).font(.system(size: 11)).opacity(0.75)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func rideView(_ trip: Trip) -> some View {
        let time = Timetable.hm(trip.dep)
        let kind = T.kind(trip)
        let soon = trip.dep.timeIntervalSince(entry.date) <= 120

        switch family {
        case .accessoryInline:
            Text("\(Image(systemName: "bus.fill")) \(time)\(T.dep) \(kind)")

        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) {
                    Text(time).font(.system(size: 14, weight: .bold)).minimumScaleFactor(0.6)
                    countdown(from: entry.date, to: trip.dep)
                        .font(.system(size: 11)).monospacedDigit()
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.6)
                }
                .padding(.horizontal, 4)
            }

        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 0) {
                Text("\(T.stops[trip.stop]!.0)  \(time)\(T.dep) \(kind)")
                    .font(.system(size: 12, weight: .bold)).lineLimit(1).minimumScaleFactor(0.7)
                countdown(from: entry.date, to: trip.dep)
                    .font(.system(size: 24, weight: .bold)).monospacedDigit()
                    .lineLimit(1).minimumScaleFactor(0.6)
                    .widgetAccentable()
                Text(T.arrival(trip)).font(.system(size: 11)).lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        default:
            // ホーム画面（小・中）
            VStack(alignment: .leading, spacing: 0) {
                Text(T.rideLabel).font(.system(size: 11, weight: .bold)).opacity(0.75)
                Text(T.stopName(trip.stop)).font(.system(size: 13)).lineLimit(1).minimumScaleFactor(0.7)
                Text("\(T.dayLabel(trip.day, now: entry.date))\(time)\(T.dep)  \(kind)")
                    .font(.system(size: 20, weight: .bold)).lineLimit(1).minimumScaleFactor(0.6)
                    .padding(.top, 2)
                Spacer(minLength: 0)
                countdown(from: entry.date, to: trip.dep)
                    .font(.system(size: family == .systemMedium ? 36 : 30, weight: .bold)).monospacedDigit()
                    .foregroundStyle(soon ? Palette.soonOnNavy : .white)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Text(T.arrival(trip)).font(.system(size: 11)).opacity(0.75)
                    .lineLimit(2).minimumScaleFactor(0.7)
                if family == .systemMedium, let note = T.note(trip) {
                    Text(note).font(.system(size: 11, weight: .bold))
                }
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
