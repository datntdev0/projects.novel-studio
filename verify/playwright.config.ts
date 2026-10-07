import { defineConfig } from '@playwright/test';
import { devServerUrl } from './support/dev-server.ts';
import { storybookUrl } from './support/storybook-server.ts';

export default defineConfig({
  testDir: 'specs',
  outputDir: 'test-results',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  reporter: 'list',
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'renderer-server', testDir: 'support', testMatch: 'serve.setup.ts', teardown: 'renderer-server-stop' },
    { name: 'renderer-server-stop', testDir: 'support', testMatch: 'serve.teardown.ts' },
    {
      name: 'renderer',
      testIgnore: /\.(electron|storybook)\.spec\.ts$/,
      dependencies: ['renderer-server'],
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, baseURL: devServerUrl },
    },
    { name: 'storybook-server', testDir: 'support', testMatch: 'storybook.setup.ts', teardown: 'storybook-server-stop' },
    { name: 'storybook-server-stop', testDir: 'support', testMatch: 'storybook.teardown.ts' },
    {
      name: 'storybook',
      testMatch: /\.storybook\.spec\.ts$/,
      dependencies: ['storybook-server'],
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, baseURL: storybookUrl },
    },
    { name: 'electron', testMatch: /\.electron\.spec\.ts$/ },
  ],
});
