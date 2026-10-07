import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export interface BackgroundProcess {
  name: string;
  url: string;
  script: string;
  args: string[];
  cwd: string;
  startTimeoutMs: number;
}

const pidFileOf = (name: string): string => join(tmpdir(), `ns-verify-${name}.pid`);
const logFileOf = (name: string): string => join(tmpdir(), `ns-verify-${name}.log`);

const isUp = async (url: string): Promise<boolean> => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

const logTail = (name: string): string => (existsSync(logFileOf(name)) ? readFileSync(logFileOf(name), 'utf8').slice(-2000) : '');

export function stopBackgroundProcess(name: string): void {
  const pidFile = pidFileOf(name);
  if (!existsSync(pidFile)) return;
  spawnSync('taskkill', ['/PID', readFileSync(pidFile, 'utf8').trim(), '/T', '/F'], { stdio: 'ignore' });
  rmSync(pidFile, { force: true });
}

export async function startBackgroundProcess({ name, url, script, args, cwd, startTimeoutMs }: BackgroundProcess): Promise<void> {
  if (await isUp(url)) stopBackgroundProcess(name);
  if (await isUp(url)) throw new Error(`${url} is already in use`);
  const log = openSync(logFileOf(name), 'w');
  const child = spawn(process.execPath, [script, ...args], { cwd, detached: true, windowsHide: true, stdio: ['ignore', log, log] });
  closeSync(log);
  child.unref();
  writeFileSync(pidFileOf(name), String(child.pid));
  const deadline = Date.now() + startTimeoutMs;
  while (!(await isUp(url))) {
    const failure =
      child.exitCode !== null
        ? `exited with code ${child.exitCode}`
        : Date.now() > deadline
          ? `did not start within ${startTimeoutMs / 1000} s`
          : '';
    if (failure) {
      stopBackgroundProcess(name);
      throw new Error(`${name} ${failure}\n${logTail(name)}`);
    }
    await sleep(500);
  }
}
