import { test } from '@playwright/test';
import { stopDevServer } from './dev-server.ts';

test('stop dev server', () => {
  stopDevServer();
});
