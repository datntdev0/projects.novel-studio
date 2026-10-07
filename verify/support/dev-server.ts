import { createRequire } from 'node:module';
import { join } from 'node:path';
import { startBackgroundProcess, stopBackgroundProcess } from './background-process.ts';
import { angularDir } from './paths.ts';

export const devServerUrl = 'http://127.0.0.1:4310';
const name = 'dev-server';

export const stopDevServer = (): void => stopBackgroundProcess(name);

export async function startDevServer(): Promise<void> {
  const { hostname, port } = new URL(devServerUrl);
  const ng = createRequire(join(angularDir, 'package.json')).resolve('@angular/cli/bin/ng.js');
  const args = ['serve', '--configuration', 'e2e', '--host', hostname, '--port', port];
  await startBackgroundProcess({ name, url: devServerUrl, script: ng, args, cwd: angularDir, startTimeoutMs: 120_000 });
}
