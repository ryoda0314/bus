import SwiftUI
import UIKit

// index.html の :root の色と同じ
enum Palette {
    static let bg = Color(light: 0xffffff, dark: 0x101018)
    static let text = Color(light: 0x111122, dark: 0xe8e8f0)
    static let muted = Color(light: 0x5c5c6e, dark: 0x9a9aae)
    static let line = Color(light: 0xc9c9d6, dark: 0x34344a)
    static let row = Color(light: 0xe4e8f4, dark: 0x191926)
    static let navy = Color(light: 0x2d2a7e, dark: 0x22205e)
    static let red = Color(light: 0xc4161c, dark: 0xe0343a)
    static let sel = Color(light: 0x2d2a7e, dark: 0x9c99f2)
    /// 紺地の上の「まもなく」
    static let soonOnNavy = Color(hex: 0xff8a8f)
    /// ウィジェット・ライブアクティビティの背景（ダークでも同じ紺）
    static let widgetNavy = Color(hex: 0x2d2a7e)
}

extension Color {
    init(hex: UInt32) {
        self.init(uiColor: UIColor(hex: hex))
    }
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xff) / 255,
                  green: CGFloat((hex >> 8) & 0xff) / 255,
                  blue: CGFloat(hex & 0xff) / 255, alpha: 1)
    }
}
