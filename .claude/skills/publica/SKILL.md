---
name: publica
description: Publish joaojacinto.com - commit the change, put it on main, and follow the GitHub Actions deploy to the NAS until the live site shows it. No SSH and no Cloudflare login on João's side. Use when João asks to publish ("publica", "põe no ar", "faz deploy", "publish", "ship it"), from the PC or from the phone.
---

# Publica

Pushing to `main` is the deploy. `.github/workflows/deploy.yml` builds the site, reaches the NAS through the Cloudflare tunnel with a service token, copies `dist/`, and purges the Cloudflare cache. Nobody approves anything along the way, so João's request in the chat is the only go-ahead.

## 1. Go-ahead

- "Publica" (or similar) for a change you just made: go ahead.
- João asked for a change but not to publish: make it, show it (preview screenshot, or a short summary when on the phone) and ask "Publico?". Publish only on yes.

## 2. Check what will go out

- `git status` and `git diff --stat`. Other sessions may be editing this folder: commit only the files this session changed. If there are changes you did not make, list them and ask before including them.
- `npm run build` must pass. A broken build never reaches the NAS anyway, but catching it here is faster.

## 3. Put it on main

Never switch branches in `C:\Users\joaoj\jjwebsite` (another session may be using it), never force-push.

1. Commit on the current branch with a plain message saying what changed on the site.
2. `git fetch origin`, then bring main in if needed: `git merge --no-edit origin/main`. If that conflicts, stop and tell João.
3. `git push origin HEAD:main`. Also push the branch itself (`git push origin HEAD`) so the two stay in step.

## 4. Follow the deploy

```bash
node scripts/watch-deploy.mjs $(git rev-parse HEAD)
```

Run it in the background; it takes about 2 minutes. Exit 0 = deployed, 1 = failed (it prints the failed step and the error), 2 = no deploy because no site files changed, 3 = timed out.

## 5. Check the live site and report

- Fetch the page that changed on https://joaojacinto.com and confirm the new text or markup is there.
- Report in two lines: what changed and the page link, plus the run link.

## When it fails

- **"Cloudflare Access recusou o token"**: the service token expired or lost its policy. Do not try to SSH to the NAS or log in to Cloudflare yourself. Give João the fix from `docs/deploy.md` (about 3 minutes in the Cloudflare and GitHub dashboards), then re-run with an empty commit or "Re-run jobs" on the run page.
- **Build failed**: fix it locally, `npm run build`, then publish again.
- **Anything else**: show the failed step and the error lines, and propose a fix.
