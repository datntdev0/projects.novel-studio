import { test } from '@playwright/test';
import { startDevServer } from './dev-server.ts';

test('start dev server', async () => {
  test.setTimeout(150_000);
  await startDevServer();
});
