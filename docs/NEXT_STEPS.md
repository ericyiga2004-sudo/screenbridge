# Honest delivery status and roadmap

## Implemented in this package

React + Tailwind interface, share/watch pages, consent-based one-to-one room pairing, Socket.IO backend and role-scoped signaling, browser WebRTC transport, simple stats, sender preview and viewer fullscreen/fit settings, optional MongoDB audit, and TURN configuration via environment.

## Needs testing on your devices

Browser capture permissions, signaling stability across laptop + phone, iPhone Safari playback, audio capture variations, fullscreen behavior, and actual connection quality under your router/mobile connection. Browser support and OS settings vary.

## Not implemented yet

- Native Android sender via MediaProjection.
- Native iPhone sender via ReplayKit broadcast extension.
- Real QR scanning, group viewing, co-annotations/ghost touch, multi-monitor extension mode.
- Identity-based account system and trusted-device management.
- TURN temporary credentials service, cross-instance scaling, telemetry dashboards, observability.
- Accessibility audit, automated frontend E2E tests and production load tests.

## Recommended next slices

1. Get a real Mac → phone stream working on the same Wi-Fi, inspect WebRTC getStats and logs.
2. Deploy an HTTPS service + actual TURN relay, test on different ISPs.
3. Add rate limits by IP and short-lived TURN credentials, robust reconnect/rejoin UX.
4. Add optional consent-based voice chat and a Ghost Touch annotation data channel.
5. Build Android sender with native screen capture; test end-to-end on actual Android hardware.
6. Build iOS sender with ReplayKit and follow Apple's requirements for broadcast extensions.

## After v1.1

- Native Android MediaProjection and iOS ReplayKit for full-device screen broadcasting (cannot be added just by wrapping the React website).
- Short-lived TURN credentials, upstream health/abuse monitoring, production load tests and network adaptation.
- Confirm TV browsing support across specific display models; HDMI-connected desktop browsers are a reliable fallback.
- For a future multi-viewer version, migrate in-memory session state and evaluate a media SFU.
