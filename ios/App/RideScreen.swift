import SwiftUI

/// 乗るバスの専用画面（時刻表とは別画面）
struct RideScreen: View {
    @Environment(AppModel.self) private var model
    let trip: Trip
    let now: Date

    var body: some View {
        let T = model.T
        let sec = max(0, Int(trip.dep.timeIntervalSince(now).rounded()))
        let soon = sec <= 120

        VStack(spacing: 0) {
            HStack {
                Text(T.rideLabel).font(.system(size: 13, weight: .bold)).tracking(1.5).opacity(0.8)
                Spacer()
                Button(T.toTable) { model.closeRide() }
                    .font(.system(size: 13))
                    .buttonStyle(OutlineButtonStyle(color: .white.opacity(0.5), h: 10, v: 6))
            }

            Spacer(minLength: 24)
            VStack(spacing: 0) {
                Text(T.stopName(trip.stop)).font(.system(size: 16)).opacity(0.85)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(T.dayLabel(trip.day, now: now) + Timetable.hm(trip.dep))
                        .font(.system(size: 44, weight: .heavy)).monospacedDigit()
                    Text(T.dep).font(.system(size: 18, weight: .bold))
                }
                .padding(.top, 4)
                TagsView(trip: trip, T: T, onNavy: true)
                    .frame(minHeight: 22)
                    .padding(.top, 6)
                CountdownText(sec: sec, T: T, big: 92, small: 22)
                    .foregroundStyle(soon ? Palette.soonOnNavy : .white)
                    .modifier(Blink(on: soon, now: now))
                    .padding(.top, 28).padding(.bottom, 12)
                Text(T.arrival(trip)).font(.system(size: 15)).opacity(0.85)
                    .multilineTextAlignment(.center)
                if let note = T.note(trip) {
                    Text(note).font(.system(size: 16, weight: .bold))
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .overlay(Rectangle().stroke(.white.opacity(0.6)))
                        .padding(.top, 14)
                }
            }
            .frame(maxWidth: .infinity)
            Spacer(minLength: 24)

            Text(T.lockHint).font(.system(size: 12)).opacity(0.7).padding(.bottom, 10)
            Button { model.cancelRide() } label: {
                Text(T.unride).font(.system(size: 15))
                    .frame(maxWidth: .infinity).padding(14)
            }
            .buttonStyle(OutlineButtonStyle(color: .white.opacity(0.6)))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Palette.navy.ignoresSafeArea())
    }
}
