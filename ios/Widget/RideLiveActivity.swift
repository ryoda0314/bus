import ActivityKit
import SwiftUI
import WidgetKit

/// 乗るバスのライブアクティビティ（ロック画面・Dynamic Island）
struct RideLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RideActivityAttributes.self) { context in
            LockScreenView(a: context.attributes, dep: context.state.dep, stale: context.isStale)
                .activityBackgroundTint(Palette.widgetNavy)
                .activitySystemActionForegroundColor(.white)
                .widgetURL(URL(string: "nextbus://ride"))
        } dynamicIsland: { context in
            let a = context.attributes
            let dep = context.state.dep
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.stop).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        Text("\(a.time)\(a.depWord)").font(.title2.bold()).monospacedDigit()
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    countdown(from: a.start, to: dep)
                        .font(.title2.bold()).monospacedDigit()
                        .multilineTextAlignment(.trailing)
                        .lineLimit(1).minimumScaleFactor(0.6)
                        .frame(maxWidth: 120, alignment: .trailing)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        if !a.kind.isEmpty { Text(a.kind).font(.caption.bold()) }
                        Text(a.arrival).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        if let note = a.note { Text(note).font(.caption.bold()) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                HStack(spacing: 4) {
                    Image(systemName: "bus.fill")
                    Text(a.time).monospacedDigit()
                }
            } compactTrailing: {
                countdown(from: a.start, to: dep)
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .lineLimit(1).minimumScaleFactor(0.6)
                    .frame(maxWidth: 60)
            } minimal: {
                Image(systemName: "bus.fill")
            }
            .widgetURL(URL(string: "nextbus://ride"))
        }
    }
}

private struct LockScreenView: View {
    let a: RideActivityAttributes
    let dep: Date
    let stale: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(a.label).font(.system(size: 12, weight: .bold)).opacity(0.75)
                Text(a.stop).font(.system(size: 14)).lineLimit(1)
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text("\(a.time)\(a.depWord)").font(.system(size: 22, weight: .heavy)).monospacedDigit()
                    if !a.kind.isEmpty { Text(a.kind).font(.system(size: 12, weight: .bold)) }
                }
                Text(a.arrival).font(.system(size: 12)).opacity(0.8).lineLimit(1).minimumScaleFactor(0.7)
                if let note = a.note {
                    Text(note).font(.system(size: 12, weight: .bold))
                }
            }
            Spacer(minLength: 0)
            countdown(from: a.start, to: dep)
                .font(.system(size: 36, weight: .heavy)).monospacedDigit()
                .multilineTextAlignment(.trailing)
                // 1時間を超えると「1:51:26」と長くなるので、折り返さず縮める
                .lineLimit(1).minimumScaleFactor(0.6)
                .frame(maxWidth: 160, alignment: .trailing)
                .opacity(stale ? 0.5 : 1)
        }
        .foregroundStyle(.white)
        .padding(16)
    }
}
