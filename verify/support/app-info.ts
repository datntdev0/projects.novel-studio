import { expect, type Page } from '@playwright/test';
import { invokeSettings } from './settings-bridge.ts';
import { expectHtml } from './theme.ts';

export async function expectAppInfo(page: Page, { version }: { version: string }): Promise<void> {
  await expect(page.getByTestId('root-app-name')).toHaveText('Dreamer Studio');
  await expect(page.getByTestId('root-app-version')).toHaveText(version);
  await expect(page.getByTestId('root-app-language')).toHaveText('en');
  await expect(page.getByTestId('root-app-theme')).toHaveText('dark');
}

export async function expectAppInfoInvoke(window: Page, { version }: { version: string }): Promise<void> {
  const result = await invokeSettings(window, 'app:getInfo', null);
  expect(result.value).toMatchObject({ name: 'Dreamer Studio', version });
  await expectHtml(window, 'en', 'dark');
}
