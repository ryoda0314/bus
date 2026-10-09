import SwiftUI

/// 掲示物と同じ記号（直 / 箕面経由 / 当駅始発 / 電気バス）
struct TagsView: View {
    let trip: Trip
    let T: L10n
    var onNavy = false

    var body: some View {
        HStack(spacing: 6) {
            if trip.isExpress {
                Text(T.tagExp).font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 5).padding(.vertical, 4).background(Palette.red)
            }
            if trip.isVia {
                Text(T.tagVia).font(.system(size: 12)).foregroundStyle(onNavy ? .white : Palette.muted)
                    .padding(.horizontal, 5).padding(.vertical, 3)
                    .overlay(Rectangle().stroke(onNavy ? Color.white.opacity(0.5) : Palette.line))
            }
            if trip.isOrigin {
                Text(T.tagOrig).font(.system(size: 12, weight: .bold)).foregroundStyle(Palette.bg)
                    .padding(.horizontal, 5).padding(.vertical, 4).background(Palette.text)
            }
            if trip.isElectric {
                Text(T.tagEv).font(.system(size: 12)).foregroundStyle(onNavy ? .white : Palette.muted)
            }
        }
        // 記号は省略させない（「箕面…」にならないように）
        .fixedSize()
    }
}

/// 「あと12分34秒」。数字は大きく、単位は小さく
struct CountdownText: View {
    let sec: Int
    let T: L10n
    let big: CGFloat
    let small: CGFloat

    var body: some View {
        if sec == 0 {
            Text(T.soon).font(.system(size: big * 0.6, weight: .heavy))
        } else {
            let h = sec / 3600, m = sec % 3600 / 60, s = sec % 60
            let parts: [(String, String)] = h > 0
                ? [("\(h)", T.h), (pad(m), T.m)]
                : [("\(m)", T.m), (pad(s), T.s)]
            HStack(alignment: .firstTextBaseline, spacing: 0) {
                if !T.pre.isEmpty { unit(T.pre).padding(.trailing, 6) }
                ForEach(parts.indices, id: \.self) { i in
                    Text(parts[i].0).font(.system(size: big, weight: .heavy))
                    unit(parts[i].1).padding(.leading, 2).padding(.trailing, i == parts.count - 1 ? 0 : 6)
                }
                if !T.post.isEmpty { unit(T.post).padding(.leading, 6) }
            }
            .monospacedDigit()
            .lineLimit(1)
            .minimumScaleFactor(0.5)
        }
    }

    private func unit(_ s: String) -> some View {
        Text(s).font(.system(size: small, weight: .bold))
    }
    private func pad(_ n: Int) -> String { n < 10 ? "0\(n)" : "\(n)" }
}

/// 発車2分前からの点滅（視差効果を減らす設定なら点滅しない）
struct Blink: ViewModifier {
    let on: Bool
    let now: Date
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let dim = on && !reduceMotion && Int(now.timeIntervalSince1970) % 2 == 1
        content.opacity(dim ? 0.4 : 1)
    }
}

/// 枠線だけのボタン
struct OutlineButtonStyle: ButtonStyle {
    var color: Color = Palette.line
    /// 枠の内側の余白
    var h: CGFloat = 0
    var v: CGFloat = 0
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, h).padding(.vertical, v)
            .overlay(Rectangle().stroke(color))
            .opacity(configuration.isPressed ? 0.6 : 1)
            .contentShape(Rectangle())
    }
}
