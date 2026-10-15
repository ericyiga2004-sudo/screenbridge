# iPhone video audit — 2026-10-15

## Evidence and limits

The starting production commit was `d2a0389a46610b13e313eac03b63efe9e3c25747` on both Vercel (READY) and `screenbridge-livekit-api` on Render (live). The current Render service targets this repository's main branch, with `npm install --omit=dev` and `npm run start -w @screenbridge/api`. No error-level Render logs were returned for the inspected window. An empty log result is not proof of successful media delivery: Render is only the approval/token service, not the video server.

The physical iPhone's failure is **not yet attributed to a proven root cause**. No actual iPhone RTP/decode trace was available. Working reactions establish the Socket.IO path only. Previous commits already disabled adaptiveStream and switched to SDK track attachment/separate audio, without real-device confirmation.

Confirmed code defects / diagnostic gaps:

* The lockfile omitted both LiveKit packages; `npm ci` failed. It is now synchronized.
* `connectLive` could overwrite a subscription/render event's status after `room.connect()` resolved. The new state transition preserves a received/rendering track.
* Viewer diagnostics did not inspect RTP, codec, publication, permission or decoder counters. The new panel uses public LiveKit `getRTCStatsReport()` and standard inbound-rtp/codec reports, with null/unavailable for absent fields.
* The video initially had display:none, and its stage sits below the room panel on small screens. Removed display:none; muted inline playback and a persistent resume control remain. WebKit documents visibility-dependent autoplay. This is a risk correction, not evidence that visibility caused this device's failure.
* Waiting/paused playback did not consistently restart the wait diagnostic timer. It now does. Frame callbacks continue through subsequent frames rather than stopping after the first callback.
* The normal fullscreen method is unavailable on some iPhone Safari versions; native video fullscreen is now used when exposed.

The current SDK defaults to VP8 and simulcast. VP8 is not automatically incompatible with iOS 15. Do not call codec the root cause without counters/comparison. Added an **opt-in Compatibility** profile: H.264, 720p, 15 FPS, single layer, 1.5 Mbps cap. Existing presets remain unchanged. Build target explicitly includes Safari 15.

## Architecture and permissions

Socket.IO creates an eight-character invitation, queues a named viewer request, and sends separate LiveKit tickets only after host approval. Both tickets use the same opaque room, with distinct identities. The host can publish only screen video/audio, cannot subscribe; the viewer can subscribe but cannot publish media or data. Tickets have a two-minute initial TTL. API secrets stay backend-only. Ending/leaving calls LiveKit room deletion. Pending/unauthorized interaction forwarding is rejected server-side; request-view is rate-limited.

Remaining security/stability audit work: in-memory sessions are lost on backend restart; pairing disconnect intentionally ends media. Room deletion is best-effort and logged on failure. The existing legacy `/api/ice-config` and `rtc:*` handlers remain but are unused by the LiveKit client. Verify media-service revocation/rejoin behavior in a separate abuse test before claiming comprehensive credential-revocation coverage. This audit did not inspect secret values or change unrelated services.

## Physical iPhone test (required)

1. Record Settings → General → About → iOS Version. Close older ScreenBridge tabs and reload both devices after deployment.
2. On iMac Chrome, open `/share`, select the existing Balanced profile, create a room. On Safari iPhone open `/watch`, request access and approve on Mac. Click **Choose screen & go live** and select a moving window (scrolling text or a clock with seconds). Keep the iPhone video stage visible.
3. After 15 seconds, tap Resume video once if needed. Copy **Live video diagnostics** at 15 seconds and again 10 seconds later. Report whether the desktop actually moves; include both snapshots even if it works. Do not send tokens or console/network dumps.
4. Rotate iPhone to landscape. Test fit/fill, rotation, fullscreen, reactions, pointer, leaving and ending. Keep the screen unlocked. Briefly background Safari, return and tap Resume if needed.
5. If blank: end the session; create a fresh one with **Compatibility** selected before capture. Repeat step 3. This compares codecs/layers/resolution without permanently reducing quality.
6. If still blank: leave the normal viewer; use `/watch/minimal` with a fresh room. This uses the same approval/room hook but a plain video-only MediaStream and independent attachment, no SDK element attachment, TV canvas or audio.
7. Repeat the working configuration with Wi-Fi disabled on iPhone (mobile data). Repeat computer → computer as regression. During testing, a network change can intentionally end the pairing session; create a fresh room if prompted.

Interpretation: no publication → host/room path; publication without subscription → permissions/subscription; subscribed but zero bytes → media transport; increasing bytes but zero decoded frames → codec/decoder; decoded frames increasing with paused/empty element → playback/attachment. Missing browser counters are unavailable, not zero. A stationary shared desktop may generate few new frames; use visibly moving content.

## Verification

Automated Node tests cover role-restricted tickets, approval, unapproved interactions, subsequent viewers, media configuration, video geometry and diagnostics selection/null handling. `npm run check` runs backend syntax checks and the production frontend build. A successful build is not evidence of actual video playback. Browser emulation cannot prove iPhone 7 hardware/Safari compatibility.

Native iOS source and an actual Xcode project are in `native/ios/`. They are unbuilt/unsigned/uninstalled in this Linux environment; see its README for Xcode, signing and device requirements. No paid infrastructure was created.

## Sources consulted

* Installed LiveKit JS source: `src/room/defaults.ts`, `RemoteTrack.ts`, `RemoteVideoTrack.ts`, `RemoteTrackPublication.ts`.
* https://docs.livekit.io/transport/media/screenshare/
* https://docs.livekit.io/transport/media/advanced/
* https://webkit.org/blog/6784/new-video-policies-for-ios/
* https://support.apple.com/en-us/100100
* https://github.com/livekit/client-sdk-swift/tree/2.9.0 (iOS 13 minimum; Swift tools 5.9; ReplayKit extension setup).
