import { randomBytes } from 'node:crypto';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { nsError, type BackendStatus } from '@shared/core';
import { log } from '../log';
import { updateSettings } from '../settings-store';
import { backendRequest, type BackendEndpoint } from './backend-client';
import { backendEnv, killProcessTree, resolveBackendCommand, spawnBackend } from './backend-process';
import { findFreePort } from './free-port';

interface HealthBody {
  status: string;
  pid: number;
}

const POLL_INTERVAL_MS = 250;
const HEALTH_TIMEOUT_MS = 2000;
const START_TIMEOUT_MS = 20_000;
const SHUTDOWN_TIMEOUT_MS = 1000;
const EXIT_WAIT_MS = 3000;

let status: BackendStatus = { state: 'stopped', port: null, pid: null, restarts: 0, error: null };
let listener: ((status: BackendStatus) => void) | null = null;
let child: ChildProcess | null = null;
let endpoint: BackendEndpoint | null = null;
let stopping = false;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function setStatus(patch: Partial<BackendStatus>): void {
  status = { ...status, ...patch };
  listener?.(status);
}

function isAlive(proc: ChildProcess | null): proc is ChildProcess {
  return proc !== null && proc.exitCode === null && proc.signalCode === null;
}

function fail(reason: string): void {
  if (stopping || status.state === 'failed') return;
  const error = nsError('BACKEND_FAILED', 'Backend failed', reason);
  log.error(`backend failed ${error.code} ${reason}`);
  setStatus({ state: 'failed', error });
}

async function pollHealth(proc: ChildProcess, target: BackendEndpoint): Promise<void> {
  const startedAt = Date.now();
  while (child === proc && status.state === 'starting' && Date.now() - startedAt < START_TIMEOUT_MS) {
    try {
      const body = await backendRequest<HealthBody>(target, 'GET', '/health', HEALTH_TIMEOUT_MS);
      if (child !== proc || status.state !== 'starting') return;
      setStatus({ state: 'ready', port: target.port, pid: body.pid });
      log.info(`backend ready pid=${body.pid} ${Date.now() - startedAt}ms`);
      return;
    } catch {
      await sleep(POLL_INTERVAL_MS);
    }
  }
  if (child === proc && status.state === 'starting') {
    fail('start-timeout');
    await killProcessTree(proc.pid as number);
  }
}

function watchChild(proc: ChildProcess): void {
  proc.on('error', () => fail('spawn-error'));
  proc.on('exit', (code) => {
    log.info(`backend exited code=${code}`);
    fail(status.state === 'ready' ? 'exited' : 'exit-before-ready');
  });
}

export async function startBackend(appRoot: string): Promise<void> {
  const command = resolveBackendCommand();
  if (!command) return fail('no-command');
  stopping = false;
  endpoint = { port: await findFreePort(), token: randomBytes(32).toString('base64url') };
  child = spawnBackend(command, backendEnv(endpoint, path.join(appRoot, 'data', 'logs')));
  const proc = child;
  updateSettings({ backendPid: proc.pid ?? null });
  setStatus({ state: 'starting', port: null, pid: null, error: null });
  log.info(`backend starting port=${endpoint.port} spawn=${proc.pid}`);
  watchChild(proc);
  await pollHealth(proc, endpoint);
}

async function waitExit(proc: ChildProcess, ms: number): Promise<void> {
  await Promise.race([new Promise((resolve) => proc.once('exit', resolve)), sleep(ms)]);
}

async function shutdownChild(proc: ChildProcess, target: BackendEndpoint): Promise<void> {
  await backendRequest(target, 'POST', '/shutdown', SHUTDOWN_TIMEOUT_MS).catch(() => undefined);
  await waitExit(proc, EXIT_WAIT_MS);
  if (isAlive(proc) && proc.pid) await killProcessTree(proc.pid);
}

export async function stopBackend(): Promise<void> {
  stopping = true;
  if (isAlive(child) && endpoint) await shutdownChild(child, endpoint);
  child = null;
  updateSettings({ backendPid: null });
  setStatus({ state: 'stopped', port: null, pid: null, error: null });
  log.info('backend stopped');
}

export function getBackendStatus(): BackendStatus {
  return status;
}

export function setBackendStatusListener(next: (status: BackendStatus) => void): void {
  listener = next;
}
