# ScreenBridge — GitHub / Render / Vercel public test

This is a **test** deployment, not a verified production launch. The code was packaged from ScreenBridge v1.1; if your local source has newer edits, do not overwrite them with the full ZIP.

## 1. Make an empty GitHub repo

Open https://github.com/new and create `screenbridge` under the GitHub account that will host it. Choose **Private** for an initial test (you'll need GitHub app access for Render/Vercel), and do not pre-populate with README, license or .gitignore.

## 2. Push source from Mac

Copy this kit's files into your existing `~/Downloads/screenbridge` folder, preserving its `.env` and code files. Then run:

```bash
cd ~/Downloads/screenbridge
bash scripts/publish-github.sh ericyiga2004-sudo/screenbridge
```

If Git needs identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
```

GitHub password authentication is not supported for git over HTTPS. Sign in via the system GitHub credential helper or GitHub CLI `gh auth login` if push requests authentication.

## 3. Render (API first)

Render web service connected to repository:

- Root directory: repository root `.`
- Region: closest available to testing devices (e.g. Frankfurt)
- Runtime: Node
- Build: `npm ci --omit=dev`
- Start: `npm start -w @screenbridge/api`
- Plan: Free for initial test (can sleep)
- Health: `/api/health`
- Environment: `NODE_ENV=production`, `WEB_ORIGIN=https://your-real-vercel-domain.vercel.app`

The repo also includes a `render.yaml` Blueprint with the same settings. Do not deploy your backend to Vercel; it needs a persistent WebSocket service.

## 4. Vercel (React website)

- Import the same GitHub repo
- Root Directory: `apps/web`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment: `VITE_API_URL=https://YOUR-RENDER-API.onrender.com`
- Note: `apps/web/vercel.json` enables SPA routes like `/share` and `/watch`.

After Vercel deploys, edit Render `WEB_ORIGIN` to exactly match the production Vercel URL (no path/trailing slash), and redeploy/restart the backend if necessary.

## 5. Test

- Check `https://RENDER-SERVICE.onrender.com/api/health` returns JSON with `ok:true`.
- On a laptop browser open the Vercel `/share`, create code, approve viewer, authorize browser screen capture.
- On another device use `/watch` and enter the code.
- Test while devices are on different networks; pairing might work without actual video if TURN is not configured.
- For restricted networks provide TURN_URLS, TURN_USERNAME, TURN_CREDENTIAL on Render. Production use temporary TURN credentials; static secrets exposed to browsers are not suitable for an open public service.

## Limitations

The browser build captures laptop/desktop screens, not the full system screen of an iPhone or Android phone. On phones you can receive video; a native capture app is necessary for transmitting the entire phone screen. Current app is one sharer/one viewer and rooms are in memory, so deploy only one backend instance during this test.
