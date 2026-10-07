import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ElectronApplication } from '@playwright/test';
import { expect, launchApp, test as base, type LaunchOptions } from './electron.ts';

export { expect, saveEvidence, withApp, type LaunchOptions } from './electron.ts';

export interface ProcessOutput {
  stdout: () => string;
  stderr: () => string;
  all: () => string;
}

export const libraryArgs = (library: string): string[] => ['--library', library];

export function captureOutput(app: ElectronApplication): ProcessOutput {
  let stdout = '';
  let stderr = '';
  const child = app.process();
  child.stdout?.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  return { stdout: () => stdout, stderr: () => stderr, all: () => stdout + stderr };
}

export async function probeOutput(app: ElectronApplication, output: ProcessOutput): Promise<void> {
  const marker = `probe-${Date.now()}`;
  await app.evaluate((_, text) => {
    process.stdout.write(`${text}-out
`);
    process.stderr.write(`${text}-err
`);
  }, marker);
  await expect.poll(output.stdout).toContain(`${marker}-out`);
  await expect.poll(output.stderr).toContain(`${marker}-err`);
}

export async function launchLibraryApp(
  appRoot: string,
  library: string,
  options: LaunchOptions = {},
): Promise<{ app: ElectronApplication; output: ProcessOutput }> {
  const app = await launchApp(appRoot, { env: options.env, args: [...libraryArgs(library), ...(options.args ?? [])] });
  return { app, output: captureOutput(app) };
}

export const test = base.extend<{ library: string }>({
  library: async ({}, use) => {
    const library = await mkdtemp(join(tmpdir(), 'ns-lib-'));
    await use(library);
    await rm(library, { recursive: true, force: true, maxRetries: 5 });
  },
});
