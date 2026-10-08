import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ElectronApplication } from '@playwright/test';
import { repoRoot } from './paths.ts';

export type SleeperKind = 'venv-python' | 'base-python' | 'node';

export interface Sleeper {
  pid: number;
  kill: () => void;
}

const venvDir = join(repoRoot, 'python', '.venv');
const pythonSleep = ['-c', 'import time; time.sleep(600)'];

const run = (command: string, args: string[]): string => spawnSync(command, args, { encoding: 'utf8', windowsHide: true }).stdout;

const basePython = (): string =>
  join(/^home\s*=\s*(.+)$/m.exec(readFileSync(join(venvDir, 'pyvenv.cfg'), 'utf8'))![1]!.trim(), 'python.exe');

const sleeperCommand = (kind: SleeperKind): { command: string; args: string[] } => {
  if (kind === 'venv-python') return { command: join(venvDir, 'Scripts', 'python.exe'), args: pythonSleep };
  if (kind === 'base-python') return { command: basePython(), args: pythonSleep };
  return { command: process.execPath, args: ['-e', 'setTimeout(() => {}, 600000)'] };
};

export const isPidAlive = (pid: number): boolean => run('tasklist', ['/FI', `PID eq ${pid}`, '/NH', '/FO', 'CSV']).includes(`"${pid}"`);

export function listeningAddresses(port: number): string[] {
  const rows = run('netstat', ['-ano'])
    .split('\n')
    .map((line) => line.trim().split(/\s+/));
  return rows.flatMap(([protocol, local = '', , state]) =>
    protocol === 'TCP' && state === 'LISTENING' && local.endsWith(`:${port}`) ? [local] : [],
  );
}

export const killPid = (pid: number, tree = true): void => {
  if (pid <= 0) return;
  const args = tree ? ['/PID', String(pid), '/T', '/F'] : ['/PID', String(pid), '/F'];
  spawnSync('taskkill', args, { stdio: 'ignore', windowsHide: true });
};

export function spawnPidFromLog(log: string): number {
  const matches = [...log.matchAll(/backend starting .*?spawn=(\d+)/g)];
  if (matches.length === 0) throw new Error('no "backend starting" line with spawn= in app.log');
  return Number(matches[matches.length - 1]![1]);
}

export function spawnSleeper(kind: SleeperKind): Sleeper {
  const { command, args } = sleeperCommand(kind);
  const child = spawn(command, args, { detached: true, windowsHide: true, stdio: 'ignore' });
  child.unref();
  const pid = child.pid!;
  let exited = false;
  child.on('exit', () => {
    exited = true;
  });
  return {
    pid,
    kill: () => {
      if (!exited) killPid(pid);
    },
  };
}

export const mainPid = (app: ElectronApplication): Promise<number> => app.evaluate(() => process.pid);
