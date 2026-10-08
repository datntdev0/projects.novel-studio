import { randomBytes } from 'node:crypto';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { app } from 'electron';
import { isNsError, nsError, type BackendStatus } from '@shared/core';
import { log } from '../log';
import { getSettings, updateSettings } from '../settings-store';
import { backendRequest, type BackendEndpoint } from './backend-client';
import { backendEnv, killProcessTree, resolveBackendCommand, spawnBackend, stopStaleBackend, type BackendCommand } from './backend-process';
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
let faultRaised = false;
let rootDir = '';

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

function handleFailure(proc: ChildProcess, reason: string): void {
  if (stopping || proc !== child) return;
  child = null;
  if (status.restarts >= 1) {
    log.error('backend restart limit reached');
    return fail(reason);
  }
  log.info('backend restarting');
  setStatus({ state: 'restarting', port: null, pid: null, restarts: 1 });
  void launch();
}

async function killQuietly(proc: ChildProcess): Promise<void> {
  if (!isAlive(proc) || !proc.pid) return;
  await killProcessTree(proc.pid).catch((error) => log.error(`backend kill error ${String(error)}`));
}

async function raiseTestFault(target: BackendEndpoint): Promise<void> {
  if (app.isPackaged || process.env.NS_TEST_BACKEND_RAISE !== '1' || faultRaised) return;
  faultRaised = true;
  try {
    await backendRequest(target, 'GET', '/test/raise', HEALTH_TIMEOUT_MS);
  } catch (error) {
    log.info(`backend error ${isNsError(error) ? error.code : 'UNKNOWN'}`);
  }
}

async function pollHealth(proc: ChildProcess, target: BackendEndpoint): Promise<void> {
  const startedAt = Date.now();
  const isStarting = (): boolean => child === proc && !stopping && status.state === 'starting';
  while (isStarting() && Date.now() - startedAt < START_TIMEOUT_MS) {
    try {
      const body = await backendRequest<HealthBody>(target, 'GET', '/health', HEALTH_TIMEOUT_MS);
      if (!isStarting()) return;
      setStatus({ state: 'ready', port: target.port, pid: body.pid });
      log.info(`backend ready pid=${body.pid} ${Date.now() - startedAt}ms`);
      return await raiseTestFault(target);
    } catch {
      await sleep(POLL_INTERVAL_MS);
    }
  }
  if (isStarting()) {
    handleFailure(proc, 'start-timeout');
    await killQuietly(proc);
  }
}

function watchChild(proc: ChildProcess): void {
  proc.on('error', () => handleFailure(proc, 'spawn-error'));
  proc.on('exit', (code) => {
    log.info(`backend exited code=${code}`);
    handleFailure(proc, status.state === 'ready' ? 'exited' : 'exit-before-ready');
  });
}

async function stopStalePid(): Promise<void> {
  const stalePid = getSettings().backendPid;
  if (!stalePid) return;
  const killed = await stopStaleBackend(stalePid);
  log.info(`backend stale pid ${stalePid} ${killed ? 'stopped' : 'not running'}`);
}

async function spawnAndPoll(command: BackendCommand): Promise<void> {
  const target = { port: await findFreePort(), token: randomBytes(32).toString('base64url') };
  if (stopping) return;
  endpoint = target;
  const proc = spawnBackend(command, backendEnv(target, path.join(rootDir, 'data', 'logs')));
  child = proc;
  updateSettings({ backendPid: proc.pid ?? null });
  setStatus({ state: 'starting', port: null, pid: null, error: null });
  log.info(`backend starting port=${target.port} spawn=${proc.pid}`);
  watchChild(proc);
  await pollHealth(proc, target);
}

async function launch(): Promise<void> {
  const command = resolveBackendCommand();
  if (!command) return fail('no-command');
  try {
    await spawnAndPoll(command);
  } catch (error) {
    log.error(`backend start error ${isNsError(error) ? error.code : String(error)}`);
    const proc = child;
    if (!proc) return fail('start-error');
    handleFailure(proc, 'start-error');
    await killQuietly(proc);
  }
}

export async function startBackend(appRoot: string): Promise<void> {
  stopping = false;
  faultRaised = false;
  rootDir = appRoot;
  setStatus({ state: 'stopped', port: null, pid: null, restarts: 0, error: null });
  await stopStalePid().catch((error) => log.error(`backend stale pid error ${String(error)}`));
  await launch();
}

async function waitExit(proc: ChildProcess, ms: number): Promise<void> {
  await Promise.race([new Promise((resolve) => proc.once('exit', resolve)), sleep(ms)]);
}

async function shutdownChild(proc: ChildProcess, target: BackendEndpoint): Promise<void> {
  const exited = waitExit(proc, EXIT_WAIT_MS);
  await backendRequest(target, 'POST', '/shutdown', SHUTDOWN_TIMEOUT_MS).catch(() => undefined);
  await exited;
  await killQuietly(proc);
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
