import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron, type ElectronApplication, type Page } from '@playwright/test';
import { test as base } from './test.ts';
import { appDir, electronDir } from './paths.ts';

export { expect, saveEvidence } from './test.ts';

export const executablePath: string = createRequire(join(electronDir, 'package.json'))('electron');

export const launchApp = (appRoot: string): Promise<ElectronApplication> =>
  _electron.launch({ executablePath, args: [appDir], env: { ...process.env, NS_APP_ROOT: appRoot } });

export async function withApp(appRoot: string, body: (app: ElectronApplication) => Promise<void>): Promise<void> {
  const app = await launchApp(appRoot);
  try {
    await body(app);
  } finally {
    await app.close().catch(() => undefined);
  }
}

export const test = base.extend<{ appRoot: string; app: ElectronApplication; window: Page }>({
  appRoot: async ({}, use) => {
    const appRoot = await mkdtemp(join(tmpdir(), 'ns-app-'));
    await use(appRoot);
    await rm(appRoot, { recursive: true, force: true, maxRetries: 5 });
  },
  app: async ({ appRoot }, use) => {
    const app = await launchApp(appRoot);
    await use(app);
    await app.close();
  },
  window: async ({ app }, use) => {
    await use(await app.firstWindow());
  },
});
