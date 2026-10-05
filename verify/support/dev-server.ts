import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { angularDir } from './paths.ts';

export const devServerUrl = 'http://127.0.0.1:4310';
const pidFile = join(tmpdir(), 'ns-verify-dev-server.pid');
const logFile = join(tmpdir(), 'ns-verify-dev-server.log');

const isUp = async (): Promise<boolean> => {
  try {
    return (await fetch(devServerUrl, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

const logTail = (): string => (existsSync(logFile) ? readFileSync(logFile, 'utf8').slice(-2000) : '');

export function stopDevServer(): void {
  if (!existsSync(pidFile)) return;
  spawnSync('taskkill', ['/pid', readFileSync(pidFile, 'utf8').trim(), '/T', '/F'], { stdio: 'ignore' });
  rmSync(pidFile, { force: true });
}

export async function startDevServer(): Promise<void> {
  if (await isUp()) stopDevServer();
  if (await isUp()) throw new Error(`${devServerUrl} is already in use`);
  const { hostname, port } = new URL(devServerUrl);
  const ng = createRequire(join(angularDir, 'package.json')).resolve('@angular/cli/bin/ng.js');
  const log = openSync(logFile, 'w');
  const child = spawn(process.execPath, [ng, 'serve', '--configuration', 'e2e', '--host', hostname, '--port', port], {
    cwd: angularDir,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
  });
  closeSync(log);
  child.unref();
  writeFileSync(pidFile, String(child.pid));
  const deadline = Date.now() + 120_000;
  while (!(await isUp())) {
    const failure =
      child.exitCode !== null ? `exited with code ${child.exitCode}` : Date.now() > deadline ? 'did not start within 120 s' : '';
    if (failure) {
      stopDevServer();
      throw new Error(`dev server ${failure}\n${logTail()}`);
    }
    await sleep(500);
  }
}
