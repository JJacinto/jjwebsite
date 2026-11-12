// Waits for the "Deploy to NAS" GitHub Actions run of a commit and reports it.
// Uses the public GitHub API (the repo is public), so it needs no token.
//
//   node scripts/watch-deploy.mjs <commit-sha> [timeout-minutes]
//
// Exit codes: 0 deployed, 1 deploy failed, 2 no deploy for this commit
// (no site files changed), 3 timed out.

const [sha, minutes = '12'] = process.argv.slice(2);
if (!sha) {
  console.error('Usage: node scripts/watch-deploy.mjs <commit-sha> [timeout-minutes]');
  process.exit(64);
}

const REPO = 'JJacinto/jjwebsite';
const API = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'jjwebsite-deploy-watch' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
};

// Return a code instead of calling process.exit() mid-fetch: on Windows that
// trips a libuv assertion and mangles the exit code.
async function watch() {
const started = Date.now();
const deadline = started + Number(minutes) * 60_000;
let announced = false;

while (Date.now() < deadline) {
  try {
    const { workflow_runs: runs = [] } = await get(
      `/repos/${REPO}/actions/workflows/deploy.yml/runs?head_sha=${sha}&per_page=5`,
    );
    const run = runs[0];
    if (!run) {
      if (Date.now() - started > 90_000) {
        console.log('No deploy run for this commit: nothing under src/, public/, design-system/ or the build config changed.');
        return 2;
      }
    } else {
      if (!announced) {
        console.log(`Deploy run: ${run.html_url}`);
        announced = true;
      }
      if (run.status === 'completed') {
        const secs = Math.round((new Date(run.updated_at) - new Date(run.run_started_at)) / 1000);
        console.log(`Result: ${run.conclusion} (${secs}s)`);
        if (run.conclusion !== 'success') {
          const { jobs = [] } = await get(`/repos/${REPO}/actions/runs/${run.id}/jobs`);
          for (const job of jobs) {
            for (const step of job.steps ?? []) {
              if (step.conclusion === 'failure') console.log(`Failed step: ${step.name}`);
            }
            const notes = await get(`/repos/${REPO}/check-runs/${job.id}/annotations`).catch(() => []);
            for (const n of notes) console.log(`${n.annotation_level}: ${n.title ? n.title + ' - ' : ''}${n.message}`);
          }
        }
        return run.conclusion === 'success' ? 0 : 1;
      }
    }
  } catch (err) {
    console.log(String(err.message ?? err));
  }
  await sleep(20_000);
}

console.log('Timed out waiting for the deploy run.');
return 3;
}

process.exitCode = await watch();
