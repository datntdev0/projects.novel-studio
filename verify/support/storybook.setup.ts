import { test } from '@playwright/test';
import { buildStorybook, startStorybookServer } from './storybook-server.ts';

test('build and start storybook', async () => {
  test.setTimeout(300_000);
  await buildStorybook();
  await startStorybookServer();
});
