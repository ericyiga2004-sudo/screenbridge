# ScreenBridge v2 · LiveKit Cloud setup

The React website is deployed on Vercel. The Express + Socket.IO pairing backend runs on Render.
LiveKit Cloud will carry the screen video between devices over its managed SFU.

## 1. Create LiveKit project
Open https://cloud.livekit.io and create a project named ScreenBridge.
In the project dashboard open **Settings → Keys** to create an API key/secret pair.
Copy the project's secure server URL (starts with `wss://`) from the project settings.

## 2. Configure Render (not Vercel)
Open the ScreenBridge v2 backend: https://dashboard.render.com/web/srv-db8atf6q1p3s73a7krb0
In Environment add:
```env
LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud
LIVEKIT_API_KEY=YOUR_API_KEY
LIVEKIT_API_SECRET=YOUR_API_SECRET
```
Keep API secrets out of GitHub, browsers, Vercel and messages.
Save and wait for a successful Render deployment.

## 3. Verify without leaking secrets
Visit https://screenbridge-livekit-api.onrender.com/api/media-status
Expected: `{"provider":"LiveKit Cloud","configured":true,...}`.
If configured is false, revisit the variables in **the new v2 backend**, not the old
`screenbridge-api` service.

## 4. Real-world test
- Open https://screenbridge-smoky.vercel.app/share on a Mac/Windows desktop.
- Open https://screenbridge-smoky.vercel.app/watch on the iPhone.
- Approve pairing on the Mac. Choose a screen when prompted.
- Test over mobile data with the iPhone. If it fails, check LiveKit project
  traffic limits, Safari compatibility, and React/Render logs.
- Display name and invitation codes are temporary; each new viewer must be approved.

## Important limitations
Full iPhone broadcasting **is not included in this website**. Safari's mobile browser
cannot provide system-wide screen capture. A native iOS application using ReplayKit
Broadcast Upload Extension and LiveKit Swift is a separate future deliverable.
The Mac/Windows desktop browser can transmit; iPhone Safari can receive.
No payment information or personal account is required to create a screen room.
The v2 web frontend and backend can be deployed before LiveKit credentials exist;
until you add them, room creation is deliberately disabled.
