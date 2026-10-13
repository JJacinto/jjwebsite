---
name: dev
description: Start (or reuse) the local Astro dev server for joaojacinto.com with the Retune visual-editing overlay connected, and open it in the browser. Use when the user says /dev, "run my local env", "start the dev server", "open the site locally", or wants to tweak the site visually with Retune. Optional argument is a page path to open, e.g. "about" or "case-studies".
---

# Run the local dev environment

One command does the whole setup. Run it from the repo root:

```bash
node scripts/dev-up.mjs $ARGUMENTS
```

What it does, in order:

1. Runs `npm install` only if `node_modules` is missing or older than `package-lock.json`.
2. Reuses an Astro dev server that's already running; otherwise starts `npm run dev` in the background (the `predev` hook rebuilds design tokens). The server keeps running after the command returns.
3. Waits until the page actually responds, reading the real URL from Astro's output (it may be `:4322` if `:4321` is taken).
4. Checks the Retune MCP bridge (WebSocket on ports 9223–9232).
5. Opens the default browser on `http://localhost:<port>/<path>`.

Arguments are passed straight through:

| Argument | Effect |
|---|---|
| `about`, `contact`, `case-studies/<slug>` | Open that page instead of the home page |
| `--no-open` | Don't open a browser; just print the URL |
| `--restart` | Stop the server this script started, then start fresh |
| `--stop` | Stop the server and exit |

## After running

Report to the user in 2–3 lines: the URL, whether the Retune bridge is listening, and how to toggle edit mode (Alt+D on Windows, Option+D on macOS; the overlay is hidden below 768 px wide).

## If the Retune bridge is NOT running

The overlay always loads in dev (`src/layouts/Base.astro`), but changes reach Claude only through the `retune` MCP server declared in `.mcp.json`, which Claude Code itself launches.

1. Call the `retune_status` MCP tool. If the tool doesn't exist, the server isn't loaded: ask the user to run `/mcp`, enable `retune`, and restart Claude Code in this repo.
2. If the tool exists but reports the overlay isn't connected, have the user reload the browser tab. The overlay connects on page load.

## If startup fails

The script prints the last 25 lines of the server log. Common causes:
- **Port in use by a stale server:** `node scripts/dev-up.mjs --restart`.
- **Token build error:** the failure comes from `design-system/scripts/build-tokens.js`; fix the token JSON it names.

Do not run `npm run dev` directly in the foreground; it blocks the session. Always use the script.
