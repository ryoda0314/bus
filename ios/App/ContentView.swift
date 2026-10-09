import SwiftUI

struct ContentView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { ctx in
            let now = ctx.date
            ZStack {
                TimetableScreen(now: now)
                if model.rideOpen, let trip = model.rideTrip(now: now) {
                    RideScreen(trip: trip, now: now)
                        .transition(.move(edge: .bottom))
                }
            }
            .animation(.easeOut(duration: 0.25), value: model.rideOpen)
        }
    }
}

// MARK: - 時刻表の画面

struct TimetableScreen: View {
    @Environment(AppModel.self) private var model
    let now: Date

    /// 普段表示する便数（先頭の「次」を含む）
    private let short = 7

    var body: some View {
        let T = model.T
        VStack(spacing: 0) {
            header(T)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    dirChips(T)
                    content(T)
                }
                .frame(maxWidth: 480)
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 16)
                .frame(maxWidth: .infinity)
            }
            .background(Palette.bg)
        }
        .background(Palette.bg)
        .foregroundStyle(Palette.text)
    }

    // 掲示時刻表の紺帯
    private func header(_ T: L10n) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(T.title).font(.system(size: 17, weight: .bold)).tracking(0.7)
                    Text("Inter Campus Shuttle Bus").font(.system(size: 11)).opacity(0.75)
                }
                Spacer()
                Button(T.other) { model.lang = model.lang.other }
                    .font(.system(size: 12))
                    .buttonStyle(OutlineButtonStyle(color: .white.opacity(0.5), h: 8, v: 3))
                Text(clock).font(.system(size: 15)).monospacedDigit().opacity(0.85)
                    .padding(.leading, 6)
            }
            HStack(spacing: 0) {
                ForEach(StopID.allCases) { id in
                    let on = model.stop == id
                    Button { model.stop = id } label: {
                        VStack(spacing: 1) {
                            Text(T.stops[id]!.0).font(.system(size: 15, weight: .bold))
                            Text(T.stops[id]!.1).font(.system(size: 12))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 8).padding(.bottom, 7)
                        .overlay(alignment: .bottom) {
                            Rectangle().frame(height: 3).opacity(on ? 1 : 0)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .opacity(on ? 1 : 0.65)
                    .accessibilityAddTraits(on ? .isSelected : [])
                }
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: 480)
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .frame(maxWidth: .infinity)
        .foregroundStyle(.white)
        .background(Palette.navy.ignoresSafeArea(edges: .top))
    }

    private var clock: String {
        let c = Timetable.calendar.dateComponents([.hour, .minute, .second], from: now)
        return String(format: "%d:%02d:%02d", c.hour!, c.minute!, c.second!)
    }

    private func dirChips(_ T: L10n) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(DirID.allCases.enumerated()), id: \.element) { i, d in
                let on = model.dir == d
                if i > 0 { Palette.line.frame(width: 1) }
                Button { model.dir = d } label: {
                    Text(T.dirs[d]!)
                        .font(.system(size: 14, weight: on ? .bold : .regular))
                        .foregroundStyle(on ? Palette.bg : Palette.muted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(on ? Palette.sel : .clear)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .fixedSize(horizontal: false, vertical: true)
        .overlay(Rectangle().stroke(Palette.line))
    }

    @ViewBuilder
    private func content(_ T: L10n) -> some View {
        let all = Timetable.upcoming(200, stop: model.stop, dir: model.dir, now: now)
        let sameDay = all.filter { $0.day == all.first?.day }
        let list = model.expanded ? sameDay : Array(all.prefix(short))
        let today = Timetable.dayStart(now)
        let ride = model.rideTrip(now: now)

        // 乗るバスのバー（専用画面を閉じているとき）
        if let ride, !model.rideOpen {
            Button { model.rideOpen = true } label: {
                Text(T.ridePlan(T.stopName(ride.stop), Timetable.hm(ride.dep), T.relative(ride, now: now)))
                    .font(.system(size: 14))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(Palette.navy)
            }
            .buttonStyle(.plain)
            .padding(.top, 14)
        }

        hero(T, next: list.first, today: today)

        Text(T.later).font(.system(size: 13)).foregroundStyle(Palette.muted)
            .padding(.top, 18).padding(.bottom, 6)

        let rest = list.dropFirst()
        VStack(spacing: 0) {
            Palette.line.frame(height: 1)
            if rest.isEmpty {
                Text(T.laterNone).foregroundStyle(Palette.muted)
                    .frame(maxWidth: .infinity).padding(.vertical, 11)
                Palette.line.frame(height: 1)
            }
            ForEach(Array(rest.enumerated()), id: \.element.id) { i, b in
                row(T, b, odd: i % 2 == 0, riding: ride?.stop == model.stop && ride?.dep == b.dep)
                Palette.line.frame(height: 1)
            }
        }

        let hiddenCount = sameDay.count - min(short, sameDay.count)
        if model.expanded || hiddenCount > 0 {
            Button { model.expanded.toggle() } label: {
                Text(model.expanded ? T.less : T.more(hiddenCount))
                    .font(.system(size: 14))
                    .frame(maxWidth: .infinity).padding(10)
            }
            .buttonStyle(OutlineButtonStyle())
            .padding(.top, 10)
        }

        VStack(alignment: .leading, spacing: 4) {
            Text(T.foot)
            Link(T.link, destination: URL(string: "https://sairibus.com/bus/timetable/")!).underline()
        }
        .font(.system(size: 12))
        .foregroundStyle(Palette.muted)
        .lineSpacing(4)
        .padding(.top, 20)
    }

    // 時刻表の上の大きいカウントダウン
    @ViewBuilder
    private func hero(_ T: L10n, next: Trip?, today: Date) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            if let next {
                if next.day != today {
                    // 今日はもう無い（運休日 or 最終便後）
                    Text(Timetable.isServiceDay(today) ? T.ended : T.closed)
                        .font(.system(size: 20, weight: .bold)).padding(.bottom, 10)
                    depLine(T, prefix: T.nextDayPrefix, day: T.dayLabel(next.day, now: now), trip: next)
                    Text(T.destLine(T.dest(next))).font(.system(size: 14)).foregroundStyle(Palette.muted)
                        .padding(.top, 2)
                } else {
                    let sec = max(0, Int(next.dep.timeIntervalSince(now).rounded()))
                    depLine(T, prefix: T.next, day: "", trip: next)
                    CountdownText(sec: sec, T: T, big: 60, small: 20)
                        .foregroundStyle(sec <= 120 ? Palette.red : Palette.text)
                        .modifier(Blink(on: sec <= 120, now: now))
                        .padding(.top, 6).padding(.bottom, 8)
                    Text(T.arrival(next)).font(.system(size: 14)).foregroundStyle(Palette.muted)
                    if let note = T.note(next) {
                        Text(note).font(.system(size: 14, weight: .bold)).padding(.top, 4)
                    }
                    Button(T.rideBtn) { model.choose(next) }
                        .font(.system(size: 14))
                        .buttonStyle(OutlineButtonStyle(h: 16, v: 8))
                        .padding(.top, 12)
                }
            } else {
                Text(T.none).font(.system(size: 20, weight: .bold)).padding(.bottom, 10)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 22).padding(.bottom, 18)
        .overlay(alignment: .bottom) { Palette.line.frame(height: 1) }
    }

    /// 「次 8:30 発 [直]」
    private func depLine(_ T: L10n, prefix: String, day: String, trip: Trip) -> some View {
        HStack(alignment: .center, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(prefix) \(day)").font(.system(size: 15)).foregroundStyle(Palette.muted)
                Text(Timetable.hm(trip.dep)).font(.system(size: 22, weight: .bold)).monospacedDigit()
                Text(T.dep).font(.system(size: 15)).foregroundStyle(Palette.muted)
            }
            TagsView(trip: trip, T: T)
        }
    }

    private func row(_ T: L10n, _ b: Trip, odd: Bool, riding: Bool) -> some View {
        HStack(spacing: 8) {
            Text(Timetable.hm(b.dep)).font(.system(size: 21, weight: .bold)).monospacedDigit()
                .frame(minWidth: 62, alignment: .leading)
            TagsView(trip: b, T: T)
            Spacer(minLength: 0)
            Text(T.relative(b, now: now)).font(.system(size: 14)).monospacedDigit()
                .foregroundStyle(Palette.muted).lineLimit(1)
            Button {
                riding ? model.cancelRide() : model.choose(b)
            } label: {
                Text(T.rideShort)
                    .font(.system(size: 12, weight: riding ? .bold : .regular))
                    .foregroundStyle(riding ? Palette.bg : Palette.muted)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(riding ? Palette.sel : .clear)
            }
            .buttonStyle(OutlineButtonStyle(color: riding ? Palette.sel : Palette.line))
        }
        .padding(.horizontal, 4).padding(.vertical, 11)
        .background(odd ? Palette.row : .clear)
        .overlay(alignment: .leading) {
            if riding { Palette.sel.frame(width: 4) }
        }
    }
}
