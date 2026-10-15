#!/usr/bin/env bash
# Usage: bash scripts/publish-github.sh OWNER/REPOSITORY
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPO="${1:-}"
if [[ ! "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Usage: bash scripts/publish-github.sh YOUR-GITHUB-USERNAME/screenbridge"
  exit 2
fi
for tool in git node npm; do command -v "$tool" >/dev/null || { echo "$tool must be installed"; exit 1; }; done
if [[ -n "$(find apps -type f \( -name '.env' -o -name '.env.production' -o -name '.env.local' \) -print -quit)" ]]; then
  echo "Found local environment files. They are excluded from Git by .gitignore."
fi
echo 'Installing project dependencies and creating the lockfile…'
npm install --no-audit --no-fund
echo 'Running checks…'
npm test
npm run build
if [[ ! -d .git ]]; then git init; fi
if git remote get-url origin >/dev/null 2>&1; then
  CURRENT="$(git remote get-url origin)"
  case "$CURRENT" in
    "https://github.com/$REPO"|"https://github.com/$REPO.git"|"git@github.com:$REPO.git") ;;
    *) echo "Existing origin differs: $CURRENT. Aborting to avoid pushing to a wrong repository."; exit 1 ;;
  esac
else
  git remote add origin "https://github.com/$REPO.git"
fi
git add .
if ! git diff --cached --quiet; then git commit -m "Prepare ScreenBridge public test deployment"; fi
git branch -M main
echo "Pushing to https://github.com/$REPO"
git push -u origin main
echo 'Upload complete. Do not share any .env files or TURN credentials.'
