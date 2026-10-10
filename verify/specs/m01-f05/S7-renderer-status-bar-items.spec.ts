import { expect, test, type Page } from '../../support/test.ts';
import { appearanceText, toggleLanguage, toggleTheme } from '../../support/appearance.ts';
import { gotoShell } from '../../support/shell.ts';
import { statusText } from '../../support/status.ts';

type PageGlobals = { document: { documentElement: { scrollWidth: number; clientWidth: number } } };

const LIBRARY = 'C:\\DreamerStudio\\Library';
const SAMPLE = { en: '3,208', vi: '3.208' };
const look = (language: 'en' | 'vi', theme: 'dark' | 'light'): string =>
  `${language.toUpperCase()} · ${appearanceText(language, `status.theme.${theme}`)}`;
const chapter = (language: 'en' | 'vi'): string => appearanceText(language, 'status.chapter', { number: '0012', chars: SAMPLE[language] });

const pageFits = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const { scrollWidth, clientWidth } = (globalThis as unknown as PageGlobals).document.documentElement;
    return scrollWidth <= clientWidth;
  });

test('S7 the status bar shows library, hints, language and theme, and the chapter (AC-46)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await gotoShell(page, { fixture: 'busy', probe: true });
  await expect(page.getByTestId('statusbar-library')).toHaveText(LIBRARY);
  await expect(page.getByTestId('statusbar-library')).toHaveAttribute('title', LIBRARY);
  await expect(page.getByTestId('statusbar-hint-palette')).toContainText(/Ctrl\s*K/);
  await expect(page.getByTestId('statusbar-hint-palette')).toContainText(appearanceText('en', 'status.hint.palette'));
  await expect(page.getByTestId('statusbar-hint-shortcuts')).toContainText(/Ctrl\s*\//);
  await expect(page.getByTestId('statusbar-hint-shortcuts')).toContainText(appearanceText('en', 'status.hint.shortcuts'));
  await expect(page.getByTestId('statusbar-lang-theme')).toHaveText(look('en', 'dark'));
  await expect(page.getByTestId('statusbar-chapter')).toHaveCount(0);
  const height = (await page.getByTestId('statusbar').boundingBox())?.height;

  await toggleLanguage(page);
  await toggleTheme(page);
  await expect(page.getByTestId('statusbar-lang-theme')).toHaveText(look('vi', 'light'));
  await toggleLanguage(page);
  await toggleTheme(page);
  await expect(page.getByTestId('statusbar-lang-theme')).toHaveText(look('en', 'dark'));

  await page.evaluate("location.hash = '#/probe'");
  await page.getByTestId('probe-open-first-novel').click();
  await page.getByTestId('probe-open-chapter').click();
  await expect(page.getByTestId('statusbar-chapter')).toHaveText(chapter('en'));
  await toggleLanguage(page);
  await expect(page.getByTestId('statusbar-chapter')).toHaveText(chapter('vi'));
  await toggleLanguage(page);
  await expect(page.getByTestId('statusbar-chapter')).toHaveText(chapter('en'));

  expect((await page.getByTestId('statusbar').boundingBox())?.height).toBe(height);
  const statusbarFits = await page.getByTestId('statusbar').evaluate((element) => element.scrollWidth <= element.clientWidth);
  expect(statusbarFits).toBe(true);
  expect(await pageFits(page)).toBe(true);

  await page.getByTestId('topbar-novel-clear').click();
  await expect(page.getByTestId('statusbar-chapter')).toHaveCount(0);
  expect(await statusText(page, 'statusbar-library')).toBe(LIBRARY);
});

test('S7 the library item says no library on first run (AC-46)', async ({ page }) => {
  await gotoShell(page, { fixture: 'first-run' });
  await expect(page.getByTestId('statusbar-library')).toHaveText(appearanceText('en', 'status.noLibrary'));
});
