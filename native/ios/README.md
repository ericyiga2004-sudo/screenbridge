# ScreenBridge iPhone transmitter (unbuilt / physical-device validation required)

Open `ScreenBridge.xcodeproj`. This is a native SwiftUI app plus an embedded ReplayKit Broadcast Upload Extension, not a Safari capture workaround. Deployment target: iOS 15.0 (iPhone 7 runs iOS 15). LiveKit is pinned to 2.9.0, whose Package.swift declares iOS 13 and Swift tools 5.9; Socket.IO Swift is pinned to 16.1.1.

## Build and install

1. Use a Mac supporting **Xcode 15 or newer**. This package requires Swift 5.9; macOS Monterey alone cannot run Xcode 15. Use a compatible Mac/macOS installation. No Apple build/signing tools are available in the Linux implementation environment.
2. Open the project and let Swift Package Manager resolve dependencies. Choose your Apple signing team for **both targets**. Set the project build setting `SCREENBRIDGE_BUNDLE_ID` to a unique identifier you own. `SCREENBRIDGE_APP_GROUP` defaults to `group.$(SCREENBRIDGE_BUNDLE_ID)`.
3. Register/enable that exact App Group for both app identifiers in Signing & Capabilities. The extension bundle ID must be `<app-id>.broadcast`. Ensure provisioning profiles contain the matching App Group. Apple account/program eligibility controls this capability; no membership or paid account was purchased as part of this work.
4. Connect the iPhone 7, trust the Mac, select it as the run destination, and Run. Sign the app and extension with the same team. Do not ship a simulator build to the device.
5. An unsigned compile check on a suitable Mac: `xcodebuild -project ScreenBridge.xcodeproj -scheme ScreenBridge -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build`. This does not prove installation or broadcast operation.

## Real-device flow

Create a room in the app. Enter its invitation code at https://screenbridge-smoky.vercel.app/watch on the computer. Approve the named viewer in the app. Wait for the media room to connect, then tap **Open system broadcast permission** and **Start Broadcast** in Apple's UI. Move to another permitted app and confirm a moving screen on the computer. Stop using the app's stop button or the red system broadcast indicator.

The existing server creates the opaque room and issues a two-minute, host-only screen-publish token after approval. The app never contains the LiveKit API secret. Tokens remain in process memory. The extension uses the official LiveKit sample-buffer transport over the shared App Group. No microphone or application audio is published in this initial implementation. System-protected/DRM content may be blank.

## Required validation before release

This source has **not been compiled, signed, installed or tested**. Validate package resolution, extension embedding/signing, the system permission dialog, portrait/landscape rotation, pause/stop from Control Center, background continuation for at least five minutes, and mobile-data/Wi-Fi switching. Verify that pairing Socket.IO remains active while backgrounded: a disconnect intentionally ends the session, preventing an abandoned publisher. Background execution and ReplayKit memory behavior must be checked on the real iPhone 7, not inferred from a simulator. Verify viewer departure stops broadcast and old sessions cannot regain approved access. Do not label the native app production-ready until these checks pass.

References: LiveKit 2.9.0 `Docs/ios-screen-sharing.md` and `Package.swift` in https://github.com/livekit/client-sdk-swift/tree/2.9.0 ; Apple ReplayKit https://developer.apple.com/documentation/replaykit .
