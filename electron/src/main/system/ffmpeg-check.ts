import { app } from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { nsError, type FfmpegStatus, type SystemStatus } from '@shared/core';
import { log } from '../log';
import { devRepoRoot } from '../paths';

const CHECK_TIMEOUT_MS = 10_000;
const VERSION_PATTERN = /^ffmpeg version (\S+)/;

let check: Promise<SystemStatus> | null = null;

export function resolveFfmpegPath(): string {
  if (app.isPackaged) return path.join(process.resourcesPath, 'bin', 'ffmpeg.exe');
  return path.join(devRepoRoot(), 'vendor', 'ffmpeg', 'bin', 'ffmpeg.exe');
}

function missing(): FfmpegStatus {
  log.warn('ffmpeg failed FFMPEG_MISSING');
  return { state: 'missing', version: null, error: nsError('FFMPEG_MISSING', 'ffmpeg is missing') };
}

function broken(reason: string): FfmpegStatus {
  log.warn(`ffmpeg failed FFMPEG_BROKEN ${reason}`);
  return { state: 'broken', version: null, error: nsError('FFMPEG_BROKEN', 'ffmpeg is broken') };
}

function runVersion(file: string): Promise<FfmpegStatus> {
  const started = Date.now();
  return new Promise((resolve) => {
    execFile(file, ['-version'], { windowsHide: true, timeout: CHECK_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') resolve(missing());
        else if (error.killed) resolve(broken('timeout'));
        else resolve(broken(typeof code === 'number' ? `exit=${code}` : 'spawn-error'));
        return;
      }
      const version = VERSION_PATTERN.exec(stdout)?.[1];
      if (!version) {
        resolve(broken('no-version'));
        return;
      }
      log.info(`ffmpeg ok ${version} ${Date.now() - started}ms`);
      resolve({ state: 'ok', version, error: null });
    });
  });
}

async function checkFfmpeg(): Promise<SystemStatus> {
  const file = resolveFfmpegPath();
  try {
    return { ffmpeg: fs.existsSync(file) ? await runVersion(file) : missing() };
  } catch {
    return { ffmpeg: broken('spawn-error') };
  }
}

export function getSystemStatus(): Promise<SystemStatus> {
  check ??= checkFfmpeg();
  return check;
}

export function startFfmpegCheck(): void {
  void getSystemStatus();
}
