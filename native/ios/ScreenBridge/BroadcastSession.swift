import Foundation
import Combine
import LiveKit
import SocketIO

struct ViewerRequest: Identifiable {
    let id: String
    let name: String
}

// Credentials exist only in memory. The extension receives samples through LiveKit's
// app-group transport; no API secret or media JWT is persisted in shared defaults.
@MainActor
final class BroadcastSession: ObservableObject {
    @Published var online = false
    @Published var ready = false
    @Published var code = ""
    @Published var status = "Connecting to pairing server…"
    @Published var requests: [ViewerRequest] = []
    private let manager = SocketManager(socketURL: URL(string: "https://screenbridge-livekit-api.onrender.com")!, config: [.log(false), .compress, .forceWebsockets(true), .reconnects(true)])
    private var socket: SocketIOClient { manager.defaultSocket }
    private var room: Room?
    private var generation = 0
    private var installedHandlers = false
    private var broadcastState: AnyCancellable?

    func connectPairing() {
        guard !installedHandlers else { return }
        installedHandlers = true
        BroadcastManager.shared.shouldPublishTrack = true
        broadcastState = BroadcastManager.shared.isBroadcastingPublisher.receive(on: DispatchQueue.main).sink { [weak self] active in
            guard let self else { return }
            if active && !self.ready { BroadcastManager.shared.requestStop(); return }
            if active { self.status = "Broadcast started. Confirm moving video on your computer." }
            else if self.ready { self.status = "Approved. Ready for system broadcast permission." }
        }
        socket.on(clientEvent: .connect) { [weak self] _, _ in
            Task { @MainActor in self?.online = true; self?.status = "Pairing connected. Create a room." }
        }
        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            Task { @MainActor in self?.online = false; self?.clearSession(); self?.status = "Pairing disconnected. Reconnect and create a new room." }
        }
        socket.on("session:viewer-request") { [weak self] data, _ in
            guard let p = data.first as? [String: Any], let id = p["requestId"] as? String else { return }
            let name = p["name"] as? String ?? "Viewer"
            Task { @MainActor in self?.requests.removeAll { $0.id == id }; self?.requests.append(ViewerRequest(id: id, name: name)) }
        }
        socket.on("session:request-removed") { [weak self] data, _ in
            guard let p = data.first as? [String: Any], let id = p["requestId"] as? String else { return }
            Task { @MainActor in self?.requests.removeAll { $0.id == id } }
        }
        socket.on("session:approved") { [weak self] data, _ in
            guard let p = data.first as? [String: Any], p["role"] as? String == "host",
                  let media = p["media"] as? [String: Any], let url = media["url"] as? String,
                  let token = media["token"] as? String, URL(string: url)?.scheme == "wss" else { return }
            Task { @MainActor in await self?.connectMedia(url: url, token: token) }
        }
        for event in ["session:ended", "session:viewer-left"] {
            socket.on(event) { [weak self] _, _ in
                Task { @MainActor in self?.endSession(); self?.status = "Session ended. Create a new room." }
            }
        }
        socket.connect()
    }
    func createRoom() {
        guard online, code.isEmpty else { return }
        socket.emitWithAck("session:create", [:]).timingOut(after: 15) { [weak self] data in
            Task { @MainActor in
                guard let self else { return }
                guard let p = data.first as? [String: Any], p["ok"] as? Bool == true, let code = p["code"] as? String else {
                    self.status = "Room creation failed. Check pairing and LiveKit configuration."; return
                }
                self.code = code; self.status = "Waiting for viewer request."
            }
        }
    }
    func approve(_ id: String) {
        socket.emitWithAck("session:approve", ["requestId": id]).timingOut(after: 15) { [weak self] data in
            Task { @MainActor in
                guard let p = data.first as? [String: Any], p["ok"] as? Bool == true else {
                    self?.status = "Approval failed or expired. End this session and create another."; return
                }
            }
        }
    }
    func decline(_ id: String) {
        socket.emit("session:decline", ["requestId": id]); requests.removeAll { $0.id == id }
    }
    private func connectMedia(url: String, token: String) async {
        generation += 1
        let current = generation
        ready = false; requests = []; status = "Connecting approved media room…"
        let next = Room()
        room = next
        do {
            let options = RoomOptions(
                defaultScreenShareCaptureOptions: ScreenShareCaptureOptions(dimensions: .h720_169, fps: 15, appAudio: false, useBroadcastExtension: true),
                defaultVideoPublishOptions: VideoPublishOptions(simulcast: false, preferredCodec: .h264))
            try await next.connect(url: url, token: token, roomOptions: options)
            guard current == generation else { await next.disconnect(); return }
            ready = true; status = "Approved. Ready for system broadcast permission."
        } catch {
            guard current == generation else { return }
            status = "Media connection failed. End the session and retry."
            await next.disconnect(); room = nil
        }
    }
    func startBroadcast() {
        guard ready, room?.connectionState == .connected else { return }
        // Apple displays the actual consent interface; publication begins only after consent.
        BroadcastManager.shared.requestActivation()
    }
    func endSession() {
        socket.emit("session:leave"); clearSession(); status = "Session ended."
    }
    private func clearSession() {
        generation += 1; ready = false; code = ""; requests = []
        BroadcastManager.shared.requestStop()
        let previous = room; room = nil
        Task { await previous?.disconnect() }
    }
}
