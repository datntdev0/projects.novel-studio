import { test } from '@playwright/test';
import { stopStorybookServer } from './storybook-server.ts';

test('stop storybook server', () => {
  stopStorybookServer();
});
