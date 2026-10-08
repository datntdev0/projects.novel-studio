import { test, expect, saveEvidence, type Page } from '../../support/test.ts';
import { gotoFoundation } from '../../support/shell.ts';
import { expectHtml, computedVars, markNode, nodeKept, BACKGROUND_HEX, LOOK_TEXTS, SETTINGS_KEY, type Theme } from '../../support/theme.ts';

type StorageGlobals = { localStorage: { getItem(key: string): string | null } };

const expectTheme = async (page: Page, theme: Theme): Promise<void> => {
  await expectHtml(page, 'en', theme);
  await expect(page.getByTestId('root-app-theme')).toHaveText(theme);
  const vars = await computedVars(page, ['--color-background']);
  expect((vars['--color-background'] ?? '').trim()).toBe(BACKGROUND_HEX[theme]);
};

const expectButtons = async (page: Page, language: 'en' | 'vi'): Promise<void> => {
  await expect(page.getByTestId('root-set-theme-dark')).toHaveText(LOOK_TEXTS[language]['root-set-theme-dark']);
  await expect(page.getByTestId('root-set-theme-light')).toHaveText(LOOK_TEXTS[language]['root-set-theme-light']);
};

const checkIndependentLanguage = async (page: Page): Promise<void> => {
  await page.getByTestId('root-set-language-vi').click();
  await expectHtml(page, 'vi', 'dark');
  await expectButtons(page, 'vi');
  await page.getByTestId('root-set-theme-light').click();
  await expectHtml(page, 'vi', 'light');
  await page.getByTestId('root-set-language-en').click();
  await expectTheme(page, 'light');
  await expectButtons(page, 'en');
};

test('S6 renderer switches theme at run time without a reload (AC-15)', async ({ page }) => {
  await gotoFoundation(page);
  await expectTheme(page, 'dark');
  await expectButtons(page, 'en');
  await markNode(page);
  await saveEvidence(page, 'dark');
  await page.getByTestId('root-set-theme-light').click();
  await expectTheme(page, 'light');
  await saveEvidence(page, 'light');
  await page.getByTestId('root-set-theme-dark').click();
  await expectTheme(page, 'dark');
  expect(await nodeKept(page)).toBe(true);
  await checkIndependentLanguage(page);
  await page.reload();
  await expectTheme(page, 'light');
  const stored = await page.evaluate((key) => (globalThis as unknown as StorageGlobals).localStorage.getItem(key), SETTINGS_KEY);
  expect(JSON.parse(stored ?? '')).toMatchObject({ theme: 'light' });
});
