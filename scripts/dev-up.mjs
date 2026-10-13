#!/usr/bin/env node
/* One-shot local dev bootstrap.
 *
 *   node scripts/dev-up.mjs [path] [--no-open] [--restart] [--stop]
 *
 * 1. Installs deps if node_modules is missing or older than package-lock.
 * 2. Reuses a running Astro dev server, or starts one in the background
 *    (detached, so it outlives this script / the terminal that ran it).
 * 3. Waits until the site actually answers, using the URL Astro prints
 *    (so a port bump from 4321 to 4322 is picked up automatically).
 * 4. Checks the Retune MCP bridge (WebSocket, ports 9223-9232).
 * 5. Opens the browser on the page.
 *
 * Works on Windows, macOS and Linux. Logs + PID live in the OS temp dir.
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { existsSync, statSync, readFileSync, writeFileSync, openSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const pagePath = '/' + (args.find((a) => !a.startsWith('--')) ?? '').replace(/^\/+/, '');

const id = createHash('sha1').update(ROOT).digest('hex').slice(0, 8);
const LOG = join(tmpdir(), `jjwebsite-dev-${id}.log`);
const PIDFILE = join(tmpdir(), `jjwebsite-dev-${id}.pid`);
const DEFAULT_URL = 'http://localhost:4321';
const RETUNE_PORTS = Array.from({ length: 10 }, (_, i) => 9223 + i);

const log = (m) => console.log(`[dev-up] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    s.setTimeout(500);
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

function urlFromLog() {
  if (!existsSync(LOG)) return null;
  // Strip ANSI colour codes before matching "Local  http://localhost:4321/"
  const text = readFileSync(LOG, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const m = [...text.matchAll(/Local\s+(http:\/\/localhost:\d+)/g)].pop();
  return m ? m[1] : null;
}

function readPid() {
  try { return parseInt(readFileSync(PIDFILE, 'utf8'), 10) || null; } catch { return null; }
}

function stopServer() {
  const pid = readPid();
  if (!pid) { log('No dev server started by this script is on record.'); return; }
  try {
    if (isWin) execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    else process.kill(-pid, 'SIGTERM'); // negative = whole process group
    log(`Stopped dev server (pid ${pid}).`);
  } catch {
    log(`Dev server (pid ${pid}) was not running.`);
  }
  rmSync(PIDFILE, { force: true });
}

function ensureDeps() {
  const marker = join(ROOT, 'node_modules', '.package-lock.json');
  const lock = join(ROOT, 'package-lock.json');
  if (existsSync(marker) && statSync(marker).mtimeMs >= statSync(lock).mtimeMs) return;
  log('Installing dependencies (npm install)…');
  const r = spawnSync('npm', ['install'], { cwd: ROOT, stdio: 'inherit', shell: isWin });
  if (r.status !== 0) { console.error('[dev-up] npm install failed.'); process.exit(1); }
}

function startServer() {
  const out = openSync(LOG, 'w');
  const child = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    detached: true,       // own process group, survives this script exiting
    stdio: ['ignore', out, out],
    shell: isWin,         // npm is npm.cmd on Windows
    windowsHide: true,
  });
  writeFileSync(PIDFILE, String(child.pid));
  child.unref();
  log(`Starting Astro dev server (pid ${child.pid}), log: ${LOG}`);
}

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = urlFromLog();
    if (url && (await isUp(url))) return url;
    await sleep(500);
  }
  return null;
}

function openBrowser(url) {
  const cmd = isWin ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const cmdArgs = isWin ? ['/c', 'start', '""', url] : [url];
  try {
    const p = spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true, windowsVerbatimArguments: isWin });
    p.once('spawn', () => log(`Opened ${url}`));
    p.once('error', () => log(`Could not open a browser — go to ${url}`));
    p.unref();
  } catch {
    log(`Could not open a browser — go to ${url}`);
  }
}

// ── main ────────────────────────────────────────────────────────────
if (flag('--stop')) { stopServer(); process.exit(0); }
if (flag('--restart')) { stopServer(); await sleep(1000); }

ensureDeps();

let base = null;
for (const candidate of [urlFromLog(), DEFAULT_URL].filter(Boolean)) {
  if (await isUp(candidate)) { base = candidate; break; }
}

if (base) {
  log(`Dev server already running at ${base} — reusing it.`);
} else {
  startServer();
  base = await waitForServer();
  if (!base) {
    console.error(`[dev-up] Dev server did not come up within 60 s. Last log lines:\n`);
    console.error(readFileSync(LOG, 'utf8').split('\n').slice(-25).join('\n'));
    process.exit(1);
  }
  log(`Dev server ready at ${base}`);
}

// Retune: the overlay is mounted by src/layouts/Base.astro in dev; the
// bridge it talks to is the Retune MCP server Claude Code launches from
// .mcp.json. Report whether it's listening.
let bridgePort = null;
for (const p of RETUNE_PORTS) if (await portOpen(p)) { bridgePort = p; break; }
if (bridgePort) {
  log(`Retune bridge listening on ws://localhost:${bridgePort} — Alt+D in the page toggles edit mode.`);
} else {
  log('Retune overlay will load, but the MCP bridge is NOT running (changes can\'t reach Claude).');
  log('  Fix: start Claude Code in this repo and approve the "retune" server in /mcp.');
}

const url = base.replace(/\/$/, '') + pagePath;
if (flag('--no-open')) log(`Open ${url}`);
else openBrowser(url);
