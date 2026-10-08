import { expect, test, type Page } from '../../support/test.ts';
import { collectWarnings } from '../../support/shortcuts.ts';
import { appearanceText, DELETE_NAME, expectLook, markWindow, SAMPLE_NUMBER, toggleLanguage, windowKept, type Language, gotoProbe } from '../../support/appearance.ts';

type ScrollGlobals = { document: { querySelector(selector: string): { scrollTop: number } } };

const SCROLL = '[data-testid="probe-scroll"]';
const SCROLL_TO = 40;

const scrollTop = (page: Page): Promise<number> =>
  page.evaluate((selector) => (globalThis as unknown as ScrollGlobals).document.querySelector(selector).scrollTop, SCROLL);

const expectTexts = async (page: Page, language: Language): Promise<void> => {
  await expect(page.getByTestId('probe-sample-text')).toHaveText(appearanceText(language, 'ui.cancel'));
  await expect(page.getByTestId('probe-sample-number')).toHaveText(SAMPLE_NUMBER[language]);
  await expect(page.getByTestId('dlg-confirm')).toContainText(appearanceText(language, 'dev.probe.deleteTitle', { name: DELETE_NAME }));
  await expect(page.getByTestId('dlg-confirm')).toContainText(appearanceText(language, 'dev.probe.deleteMessage'));
  await expect(page.getByTestId('dlg-confirm-confirm')).toHaveText(appearanceText(language, 'dev.probe.deleteConfirm'));
  await expect(page.getByTestId('dlg-confirm-cancel')).toHaveText(appearanceText(language, 'ui.cancel'));
};

test('S2 the language switches in place and keeps input, scroll and the open dialog (AC-22)', async ({ page }) => {
  const warnings = collectWarnings(page);
  await gotoProbe(page);
  await expectLook(page, 'en', 'dark');
  await page.getByTestId('probe-input').fill('keep me');
  await page.evaluate(
    ([selector, top]) => {
      (globalThis as unknown as ScrollGlobals).document.querySelector(selector as string).scrollTop = top as number;
    },
    [SCROLL, SCROLL_TO],
  );
  expect(await scrollTop(page)).toBe(SCROLL_TO);
  await page.getByTestId('probe-delete').click();
  await expect(page.getByTestId('dlg-confirm')).toBeVisible();
  await markWindow(page);
  await expectTexts(page, 'en');

  await toggleLanguage(page);
  await expectLook(page, 'vi', 'dark');
  await expectTexts(page, 'vi');
  await expect(page.getByTestId('dlg-confirm')).toBeVisible();
  await expect(page.getByTestId('probe-input')).toHaveValue('keep me');
  expect(await scrollTop(page)).toBe(SCROLL_TO);
  expect(await windowKept(page)).toBe(true);

  await page.getByTestId('dlg-confirm-cancel').click();
  await expect(page.getByTestId('dlg-confirm')).toBeHidden();
  await page.getByTestId('topbar-lang').click();
  await expectLook(page, 'en', 'dark');
  await expect(page.getByTestId('probe-sample-text')).toHaveText(appearanceText('en', 'ui.cancel'));
  await expect(page.getByTestId('probe-input')).toHaveValue('keep me');
  expect(await windowKept(page)).toBe(true);
  expect(warnings.has('Ctrl+Shift+U')).toBe(false);
  expect(warnings.has('appearance.toggle-language')).toBe(false);
});
