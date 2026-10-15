# ScreenBridge v1.1 — Deployment: Vercel + Render

The code is deployment-configured; **it is not deployed by this ZIP**. You need your own GitHub repository, Render service and Vercel project.

## Deployment architecture

```
Laptop browser (capture) ──────┐
                               ├── HTTPS Vercel (React static frontend)
Phone/browser (receive) ───────┘              │
                                              │ HTTPS API + WSS Socket.IO
                                        Render Express API
                                              │
                                         peer signaling
                                              │
                                 WebRTC media P2P when possible
                                     │              │
                                   STUN       external TURN relay
                                               (recommended)
```

**Streaming media is not relayed through Vercel/Render** in the normal WebRTC design. They serve frontend and exchange signaling. For restrictive networks, configure a reachable **external TURN service** (including UDP support). MongoDB is optional and stores only limited audit events.

## 1. Publish the source to GitHub

From the extracted `screenbridge` folder, run `npm install` (this generates `package-lock.json`), then commit the code and lockfile to your own repository. `.env` files must never be committed. You can use a private GitHub repo.

The monorepo contains separate `apps/web` and `apps/api` directories. They deploy independently, and each host can use the same GitHub repository.

## 2. Render — backend first

Recommended: open Render → New → Blueprint → select the ScreenBridge GitHub repo. Render reads the repo-root `render.yaml` and creates a **Node web service**, using:

| Field | Value |
|---|---|
| Service | `screenbridge-api` |
| Root directory | `apps/api` |
| Build | `npm install --omit=dev` |
| Start | `npm start` |
| Health check | `/api/health` |
| Instance | `starter` in `render.yaml` (paid; avoids free-instance spin-down) |

The **`WEB_ORIGIN` environment variable is required** in Render for production browser requests. Set it to your **actual** Vercel production frontend origin. Example:

```
NODE_ENV=production
WEB_ORIGIN=https://your-screenbridge.vercel.app
```

For multiple explicit origins (e.g., an additional custom domain), separate them with commas; don't include paths or trailing slashes:

```
WEB_ORIGIN=https://your-screenbridge.vercel.app,https://mirror.example.com
```

The Blueprint prompts for `WEB_ORIGIN` (`sync: false`). You can set a planned Vercel origin first and correct it after creating Vercel. Changing an environment variable on Render may trigger a redeploy.

Do **not** put your actual local `.env` file into Git. `PORT` is supplied automatically by Render. API already listens on `0.0.0.0`.

When deployment finishes, note your API HTTPS origin, such as `https://screenbridge-api.onrender.com`. Visit `https://YOUR-API.onrender.com/api/health` to check for `ok: true`.

If you prefer a no-cost test deployment, change `plan: starter` to `plan: free` (subject to Render's current terms). Free services may spin down when idle, adding startup delays and interrupted sessions. For a live mirroring app, an always-on web service is preferable.

## 3. Vercel — frontend

In Vercel choose **Add New Project**, import the same GitHub repo and configure:

| Field | Value |
|---|---|
| Framework | `Vite` |
| Root directory | `apps/web` |
| Build command | `npm run build` (default) |
| Output directory | `dist` |

Set this **build-time environment variable** in Vercel Project Settings:

```
VITE_API_URL=https://YOUR-API.onrender.com
```

No trailing slash, no `/api` suffix. `VITE_API_URL` is a public backend *origin*, not a secret. Redeploy the frontend after changing a Vite variable: Vite embeds it at build time.

The file `apps/web/vercel.json` provides SPA route fallback. Directly visiting `/share` or `/watch?code=...` should load the app instead of returning 404.

After Vercel assigns its URL, **double-check Render's `WEB_ORIGIN` matches exactly**, including HTTPS. Browser Socket.IO connections cross from `*.vercel.app` to `*.onrender.com` over `wss://`. Never set permissive `*` origins just to mask a configuration error.

## 4. TURN for reliable cross-network mirroring

TURN is often necessary between different Wi-Fi/mobile networks. Run coturn on a suitable VM or choose a managed TURN provider. Vercel's static frontend is not a TURN server; Render's HTTP web service does not replace a TURN relay.

In Render add (optional for same-network early testing, **strongly recommended** in production):

```
TURN_URLS=turn:YOUR-RELAY:3478,turns:YOUR-RELAY:5349
TURN_USERNAME=YOUR_USERNAME
TURN_CREDENTIAL=YOUR_CREDENTIAL
```

The current `/api/ice-config` returns these TURN credentials to a connected browser. They are **not private once returned**. This static-credential mechanism is for controlled testing only; before an open public launch, use short-lived, per-session TURN credentials with rate/usage limits. Provision appropriate relay bandwidth and verify UDP/TCP and certificates.

## 5. Smoke test in production

1. On the Mac or Windows laptop open `https://YOUR-WEB.vercel.app/share`, create a room.
2. On another browser/device open `https://YOUR-WEB.vercel.app/watch?code=...`, request access.
3. Approve the viewer on the sharer device, then click **Choose screen & go live** and approve the browser screen picker.
4. Test widescreen viewer with a portrait source or portrait test capture. It should stay centered in the **TV canvas**. Try **Rotate**, **Fit / Fill**, **Fullscreen**.
5. Enable **Point** from the viewer and check that it appears on the sharer's preview. Send a reaction both ways.
6. Test with devices on **different networks**. If pairing works but video doesn't, investigate ICE/TURN and firewall rules.
7. Check browser developer console for CORS errors, Socket.IO reconnect loops, ICE connection state, and codec/video playback support.

## Important limitations

- The current app **cannot transmit an entire iPhone or Android system screen from a mobile browser**. This requires native capture support (iOS ReplayKit, Android MediaProjection) in a later mobile build. The new TV view correctly handles any *received* portrait stream.
- Smart TV browser WebRTC support varies. For reliable large-screen viewing, use a compatible desktop browser connected to a TV by HDMI, or test an available casting path.
- The current room registry is **in memory**. Keep Render at **one API instance**. Redeploys/restarts terminate active rooms; horizontal scaling needs shared session state and signaling coordination.
- Current implementation supports **one viewer** per host. No recording, remote device control, audio calling or native background capture.
- Google Fonts are external. The interface has system fallbacks but needs internet to load those exact fonts.
- Do not deploy with test TURN secrets, unbounded public traffic, or without monitoring/abuse controls. Production reliability needs actual device/network testing.

## Diagnosing errors

| Symptom | Check |
|---|---|
| UI loads, offline indicator | `VITE_API_URL`, Render health, WebSocket, CORS `WEB_ORIGIN` |
| GET `/watch` returns 404 | Vercel Root Directory and `vercel.json` rewrite |
| Viewer approved but black screen | Browser screen permissions, autoplay, codecs, ICE/TURN |
| Works on Wi-Fi but not mobile data | TURN relay reachability and credentials |
| Session drops after idle | Render instance sleep, deploy/restart, network connection |
| TV shows side panels without video | Is the source actually portrait? Check video metadata and autoplay |
| Screen selection cancelled | macOS/Windows browser screen-recording permission and picker |

Official references: [Vercel Vite deployments](https://vercel.com/docs/frameworks/frontend/vite), [Render WebSockets](https://render.com/docs/websocket), [Render monorepos](https://render.com/docs/monorepo-support).
