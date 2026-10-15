# ScreenBridge — technical architecture

## Signal and media flow

```text
Sender browser                         Viewer browser
  Create room -> Socket.IO -> Node API
                                    <- Request join (room code)
  Approve   -> Socket.IO -> Node API -> Session approved
  Click Start; system getDisplayMedia() permission dialog
  RTCPeerConnection: offer -> Node signaling -> answer
  ICE candidates exchanged via authorization-checked signaling
  Video / audio: encrypted WebRTC media DIRECT if possible, via TURN if necessary
  Click End -> media tracks stopped; peer closed; room invalidated
```

**WebRTC video does not pass through Node.js, Express or MongoDB.** Socket.IO relays only session signaling; the server verifies the socket is the approved party. Access requires both an unguessable invitation *and* host approval.

## Backend security rules

- Session IDs are random UUIDs; human-facing codes are eight characters from a 32-character alphabet.
- One approved viewer and up to five pending requests; each socket allows up to ten code guesses in a rolling minute.
- Host permissions come from the socket that created the room, not client-provided role fields.
- An unapproved user cannot relay SDP or ICE. The backend limits message sizes and validates offer/answer types.
- Rooms expire after 12 minutes if no viewer is active, or when their host ends/disconnects. Viewer disconnect revokes that viewer and forces host capture to stop.
- Temporary session state is in memory; restarting the API invalidates every code and active connection.
- Optional audit data stores ONLY sessionId, created/approved/ended event name, and time; TTL 30 days.
- Production still needs global/IP-based abuse protection, rate limits across multiple instances, HTTPS/WSS, security monitoring, ephemeral TURN credentials, explicit retention disclosures, and load testing.

## Browser media limitations

`getDisplayMedia()` is a browser API, not a Node service. It must be called by the sender in a secure context via user gesture. A browser always shows its own choice/permission dialog. Audio capture support varies by browser, OS, and the selected window/tab.

Browser WebRTC peer connection selects supported codecs (often H.264, VP8 or VP9). Hardware encoding availability depends on device and driver. The app provides capture quality *targets*, not guarantees. It samples WebRTC statistics instead of inventing low latency values.

## TURN

Sample STUN endpoints help public address discovery but don't relay media. coturn or a hosted TURN provider is required for robust across-network connections. TURN endpoints may be `turn:` or `turns:`; TLS, firewall and UDP port configuration matter. This demo exposes configured relay credentials through `/api/ice-config`, as required for clients to authenticate; for a production service use temporary credentials rather than long-lived shared values.

## Native roadmap

Android: build a foreground media-projection service, obtain per-session user consent, feed native video frames into a supported WebRTC track, keep background behavior and foreground service requirements in mind.

iOS: implement ReplayKit broadcast extension / platform-native capture and compatible WebRTC transport. A Capacitor wrapper by itself cannot supply system-wide broadcast functionality.

## UX principles

A calm, editorial interface with clear hierarchy and no fake analytics: charcoal panels, acid-lime primary actions, readable status and error messaging, device-friendly controls, explicit consent, obvious Stop sharing and minimal setup. Dark aesthetic is not a substitute for usability and truthful states.

## v1.1 deployment and TV viewing extension

- Vercel serves static React and history-route fallback (`apps/web/vercel.json`). It does not terminate Socket.IO or carry the WebRTC media stream.
- Render serves the Node API and WebSocket signaling at a separate HTTPS origin; the browser uses `VITE_API_URL` for the API and Socket.IO endpoint. `WEB_ORIGIN` restricts production browser origins. Keep a single Render server instance while room state is in memory.
- Portrait source frames are shown in an auto-centered TV canvas. Side treatments are pure CSS; **there is no second decoder, server transcoding or background stream duplication**. Fit retains source aspect ratio; Fill crops; Rotate changes viewer presentation only.
- The collaborative laser pointer maps positions to the actual contained video rectangle, then transfers normalized positions via authorized Socket.IO messages to a temporary overlay on the sharer's preview. The screen video itself is not edited.
- Emojis are whitelisted and rate-limited, peer-to-peer via Socket.IO approved sessions, and never saved.
- See `DEPLOY_VERCEL_RENDER.md` for HTTPS, TURN and cross-origin configuration.
