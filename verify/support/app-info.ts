import { expect, type Page } from '@playwright/test';

export async function expectAppInfo(page: Page, { version }: { version: string }): Promise<void> {
  await expect(page.getByTestId('root-app-name')).toHaveText('Novel Studio');
  await expect(page.getByTestId('root-app-version')).toHaveText(version);
  await expect(page.getByTestId('root-app-language')).toHaveText('en');
  await expect(page.getByTestId('root-app-theme')).toHaveText('dark');
}
