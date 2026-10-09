import SwiftUI

@main
struct NextBusApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(model)
                // ウィジェット・ライブアクティビティをタップしたら乗るバスの画面を開く
                .onOpenURL { url in
                    if url.host == "ride" { model.rideOpen = model.ride != nil }
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { model.refresh() }
                }
        }
    }
}
