import { randomBytes } from 'node:crypto';
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron, type ElectronApplication } from '@playwright/test';
import { test as base } from './test.ts';
import { ensurePackage, systemRoot } from './package.ts';
import { killPid, spawnSleeper } from './processes.ts';
import { settingsText, writeSettingsFile } from './settings-file.ts';

export { expect, saveEvidence } from './test.ts';

export interface PackagedOptions {
  unicode?: boolean;
  minimalPath?: boolean;
}

export interface PackagedLaunchOptions {
  args?: string[];
  env?: Record<string, string>;
}

export interface PackagedApp {
  appRoot: string;
  exePath: string;
  libraryDir: string;
  backendExePath: string;
  ffmpegPath: string;
  launch: (options?: PackagedLaunchOptions) => Promise<ElectronApplication>;
  dispose: () => Promise<void>;
}

export interface ScratchBackend {
  pid: number;
  kill: () => void;
}

const minimalPath = `${join(systemRoot, 'System32')};${systemRoot}`;

const childEnv = (minimal: boolean, extra: Record<string, string>): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    const name = key.toUpperCase();
    if (value === undefined || name === 'NS_APP_ROOT' || (minimal && name === 'PATH')) continue;
    env[key] = value;
  }
  if (minimal) env.PATH = minimalPath;
  return { ...env, ...extra };
};

export async function createPackagedApp(options: PackagedOptions = {}): Promise<PackagedApp> {
  const { extractedDir } = await ensurePackage();
  const baseDir = await mkdtemp(join(tmpdir(), 'ns-packaged-'));
  const appRoot = options.unicode ? join(baseDir, 'Thư mục', '小说 Studio') : join(baseDir, 'app');
  const libraryDir = join(baseDir, 'library');
  await mkdir(libraryDir, { recursive: true });
  await cp(extractedDir, appRoot, { recursive: true });
  const exePath = join(appRoot, 'novel-studio.exe');
  const launched: ElectronApplication[] = [];
  return {
    appRoot,
    exePath,
    libraryDir,
    backendExePath: join(appRoot, 'resources', 'backend', 'novel-studio-backend.exe'),
    ffmpegPath: join(appRoot, 'resources', 'bin', 'ffmpeg.exe'),
    launch: async (launchOptions = {}) => {
      const app = await _electron.launch({
        executablePath: exePath,
        args: launchOptions.args ?? ['--library', libraryDir],
        env: childEnv(options.minimalPath ?? false, launchOptions.env ?? {}),
      });
      launched.push(app);
      return app;
    },
    dispose: async () => {
      for (const app of launched) await app.close().catch(() => undefined);
      await rm(baseDir, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}

export async function withPackagedApp(options: PackagedOptions, body: (packaged: PackagedApp) => Promise<void>): Promise<void> {
  const packaged = await createPackagedApp(options);
  try {
    await body(packaged);
  } finally {
    await packaged.dispose();
  }
}

const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });

export async function startScratchBackend(packaged: PackagedApp): Promise<ScratchBackend> {
  const parent = spawnSleeper('node');
  const logDir = await mkdtemp(join(tmpdir(), 'ns-scratch-log-'));
  const env = {
    ...process.env,
    NS_BACKEND_PORT: String(await freePort()),
    NS_BACKEND_TOKEN: randomBytes(24).toString('hex'),
    NS_PARENT_PID: String(parent.pid),
    NS_LOG_DIR: logDir,
  };
  const child = spawn(packaged.backendExePath, [], { env, detached: true, windowsHide: true, stdio: 'ignore' });
  child.unref();
  const pid = child.pid!;
  return {
    pid,
    kill: () => {
      killPid(pid);
      parent.kill();
      void rm(logDir, { recursive: true, force: true }).catch(() => undefined);
    },
  };
}

export const writeBackendPid = (packaged: PackagedApp, backendPid: number): Promise<void> =>
  writeSettingsFile(packaged.appRoot, settingsText({ backendPid }));

export const test = base.extend<{ packaged: PackagedApp }>({
  packaged: [
    async ({}, use) => {
      const packaged = await createPackagedApp();
      await use(packaged);
      await packaged.dispose();
    },
    { timeout: 600_000 },
  ],
});
