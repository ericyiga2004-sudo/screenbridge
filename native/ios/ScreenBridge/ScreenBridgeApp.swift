import SwiftUI

@main
struct ScreenBridgeApp: App {
    @StateObject private var bridge = BroadcastSession()
    var body: some Scene {
        WindowGroup {
            NavigationView {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text("Share your iPhone screen").font(.title)
                        Text(bridge.status).accessibilityIdentifier("status")
                        if !bridge.code.isEmpty {
                            Text(bridge.code).font(.largeTitle.monospaced()).textSelection(.enabled)
                            Text("On your computer, open screenbridge-smoky.vercel.app/watch and enter this code.")
                        }
                        Button("Create sharing room") { bridge.createRoom() }
                            .disabled(!bridge.online || !bridge.code.isEmpty)
                        ForEach(bridge.requests) { request in
                            VStack(alignment: .leading) {
                                Text("\(request.name) wants to watch")
                                HStack {
                                    Button("Approve") { bridge.approve(request.id) }
                                    Button("Decline") { bridge.decline(request.id) }
                                }
                            }
                        }
                        if bridge.ready {
                            Text("Only your approved viewer can watch. Other apps and notifications may be visible. Tap below, then Start Broadcast in Apple's interface.")
                            Button("Open system broadcast permission") { bridge.startBroadcast() }
                        }
                        Button("Stop broadcast and end session", role: .destructive) { bridge.endSession() }
                            .disabled(bridge.code.isEmpty)
                        Text("Video only. Protected content may be blank. You can also stop from the red iOS broadcast indicator.").font(.footnote)
                    }.padding()
                }.navigationTitle("ScreenBridge")
            }.navigationViewStyle(.stack)
                .onAppear { bridge.connectPairing() }
        }
    }
}
