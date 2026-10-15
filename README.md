# ScreenBridge v1.1 — One screen. Anywhere.

Lightweight, responsive screen sharing built with **React JSX + Vite + Tailwind CSS + Express + Socket.IO + WebRTC**.

## What's new in v1.1

- **TV canvas**: a portrait broadcast appears **centered** on a widescreen display, with unobtrusive ambient side panels instead of empty edge space. No stretching.
- **Fit / Fill**, **Rotate 90°**, **Fullscreen**, and an optional clean canvas mode. Fill crops; Rotate changes the viewer orientation only.
- **Collaborative pointer**: approved viewers can point at the incoming video. The sender sees a matching position over their preview; no remote mouse/keyboard control.
- **Quick reactions**: 👍 👏 ❤️ 💡 ✨ travel only between approved participants, with rate limiting; nothing is persisted.
- **Vercel/Render preparation**: frontend `VITE_API_URL`, strict production backend origin configuration, `render.yaml`, Vercel deep-link rewrites, health checks and deployment guide.
- Optional MongoDB driver is loaded only when `MONGODB_URI` is configured; no database required for mirroring.
- A real SVG favicon and clearer screen-permission error.

## Setup on your Mac

Use **Node.js 20.19+ or 22+**. Stop any other dev servers using ports 5173 and 4000.

```bash
cd ~/Downloads/screenbridge
npm install
cp -n apps/api/.env.example apps/api/.env
npm run dev
```

Open http://localhost:5173/share on the laptop and http://localhost:5173/watch in a second browser. API health: http://localhost:4000/api/health.

**Existing v1 users:** Apply the v1.1 upgrade ZIP over `~/Downloads/screenbridge` (it does **not** include or replace `apps/api/.env`), then run `npm install && npm run dev`.

To view on a phone over the same Wi-Fi, use your Mac's local IP on the phone, **not** `localhost`. HTTPS via a deployed Vercel website is preferable for real multi-device testing.

## Frontend + backend deployment

**[Read: Vercel + Render Deployment Guide](docs/DEPLOY_VERCEL_RENDER.md)**. Render hosts Express + Socket.IO, Vercel hosts the compiled React SPA. For public use and restrictive NATs, add an external TURN server. In a deployed frontend set `VITE_API_URL=https://YOUR-API.onrender.com`; in the Render service set `WEB_ORIGIN=https://YOUR-WEB.vercel.app`.

## Commands

```bash
npm run dev                  # both apps, one Terminal
npm run build                # Vite production frontend build
npm test                     # pairing, authorization, pointer, portrait geometry
npm run check                # backend syntax and frontend build
```

## Project layout

```text
screenbridge/
  apps/
    api/
      src/                  Express, Socket.IO, WebRTC signaling, optional MongoDB
      test/                 Backend authorization tests
      .env.example          Local/Render configuration reference
    web/
      src/pages/            Home.jsx, Share.jsx, Watch.jsx, How.jsx
      src/hooks/useBridge.js
      src/components/       PointerSpot.jsx, ReactionToast.jsx, and UI
      src/lib/              Socket client, portrait video geometry
      public/favicon.svg
      vercel.json            Vercel SPA fallback
      .env.example          VITE_API_URL example
  render.yaml               Render Blueprint (single API instance)
  docs/DEPLOY_VERCEL_RENDER.md
```

## Scope and limitations

- Working design supports **browser desktop capture → browser viewer**, with explicit approval.
- Mobile devices can receive video where supported; **full iPhone/Android screen sending is not implemented yet**. Native mobile capture is a future milestone.
- One approved viewer per room, session codes expire after 12 minutes without an active viewer.
- TV canvas styles any received portrait source, but cannot change the actual sender orientation. Rotate only changes the picture shown by the viewer.
- WebRTC media prefers peer-to-peer; for cross-network reliability configure TURN. MongoDB is optional; it does not carry screen frames.
- No remote keyboard/mouse control or recording. The pointer is an ephemeral overlay and reactions are temporary.
- No claim of finished production-grade uptime: test on your browsers/devices, configure TURN, security/abuse protections and monitoring.

See `docs/ARCHITECTURE.md` and `docs/NEXT_STEPS.md` for implementation notes and future work.
