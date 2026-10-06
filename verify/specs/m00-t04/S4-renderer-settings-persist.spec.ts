import { test, expect, type Page } from '../../support/test.ts';
import { expectRootLanguage } from '../../support/i18n-texts.ts';

type StorageGlobals = { localStorage: { getItem(key: string): string | null; setItem(key: string, value: string): void } };

const KEY = 'novel-studio.settings';

const seedAndReload = async (page: Page, text: string): Promise<void> => {
  await page.evaluate(([key, value]) => (globalThis as unknown as StorageGlobals).localStorage.setItem(key, value), [KEY, text] as const);
  await page.reload();
};

const expectFallback = async (page: Page, language: 'en' | 'vi', theme: string): Promise<void> => {
  await expectRootLanguage(page, language);
  await expect(page.getByTestId('root-app-theme')).toHaveText(theme);
  await expect(page.getByTestId('root-error-code')).toHaveCount(0);
};

test('S4 renderer persists settings and falls back on a broken store (AC-21)', async ({ page }) => {
  await page.goto('/');
  await expectFallback(page, 'en', 'dark');

  await page.getByTestId('root-set-language-vi').click();
  await expectRootLanguage(page, 'vi');
  await page.reload();
  await expectFallback(page, 'vi', 'dark');

  const stored = await page.evaluate((key) => (globalThis as unknown as StorageGlobals).localStorage.getItem(key), KEY);
  expect(JSON.parse(stored ?? '')).toMatchObject({ language: 'vi', version: 1 });

  await seedAndReload(page, '{oops');
  await expectFallback(page, 'en', 'dark');

  await seedAndReload(page, '[]');
  await expectFallback(page, 'en', 'dark');

  await seedAndReload(page, '{"language":"fr","theme":"light"}');
  await expectFallback(page, 'en', 'light');
});
