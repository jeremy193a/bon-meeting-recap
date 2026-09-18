#!/usr/bin/env node
/**
 * Host-side CD worker. It polls origin/main and rebuilds the local Docker
 * deployment only after a new commit has been pushed to GitHub.
 */
import { spawnSync } from 'node:child_process';

const repository = process.env.DEPLOY_REPO_DIR ?? process.cwd();
const branch = process.env.DEPLOY_BRANCH ?? 'main';
const intervalMs = Math.max(Number(process.env.DEPLOY_POLL_INTERVAL_MS ?? 60_000), 15_000);
let deploying = false;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repository,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout.trim();
}

function waitForHealthyContainer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      if (run('docker', ['inspect', '--format', '{{.State.Health.Status}}', 'bon-meeting-recap']) === 'healthy') {
        return;
      }
    } catch {
      // The container can be unavailable briefly while Compose recreates it.
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3_000);
  }
  throw new Error('bon-meeting-recap did not become healthy within two minutes.');
}

async function checkAndDeploy() {
  if (deploying) return;
  deploying = true;
  try {
    run('git', ['fetch', '--quiet', 'origin', branch]);
    const local = run('git', ['rev-parse', 'HEAD']);
    const remote = run('git', ['rev-parse', `origin/${branch}`]);
    if (local === remote) return;

    console.log(`[deploy] New commit ${remote.slice(0, 12)} found. Rebuilding...`);
    run('git', ['reset', '--hard', `origin/${branch}`]);
    run('docker', ['compose', 'up', '-d', '--build', '--remove-orphans']);
    waitForHealthyContainer();
    console.log(`[deploy] ${remote.slice(0, 12)} deployed successfully.`);
  } catch (error) {
    console.error(`[deploy] ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    deploying = false;
  }
}

console.log(`[deploy] Watching origin/${branch} every ${Math.round(intervalMs / 1000)}s in ${repository}`);
await checkAndDeploy();
setInterval(() => { void checkAndDeploy(); }, intervalMs);
