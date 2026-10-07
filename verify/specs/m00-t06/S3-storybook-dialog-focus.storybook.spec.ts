import { test, expect, type Page } from '../../support/test.ts';
import { DIALOG_IDS, openKit } from '../../support/kit.ts';

const names = ['default', 'wide', 'confirm'] as const;
const closers = ['Escape', 'close button', 'scrim click'] as const;

const open = async (page: Page, name: (typeof names)[number]): Promise<void> => {
  await page.getByTestId(DIALOG_IDS[name].opener).click();
  await expect(page.getByTestId(DIALOG_IDS[name].dialog)).toBeVisible();
};

const close = async (page: Page, name: (typeof names)[number], how: (typeof closers)[number]): Promise<void> => {
  if (how === 'Escape') await page.keyboard.press('Escape');
  if (how === 'close button') await page.getByTestId(DIALOG_IDS[name].close).click();
  if (how === 'scrim click') await page.getByTestId(DIALOG_IDS[name].scrim).click({ position: { x: 4, y: 4 } });
};

for (const name of names) {
  test.describe(`S3 storybook ${name} dialog focus (AC-17)`, () => {
    test.beforeEach(async ({ page }) => {
      await openKit(page, 'light');
      await open(page, name);
    });

    test(`S3 ${name} dialog moves focus inside on open (AC-17)`, async ({ page }) => {
      await expect(page.getByTestId(DIALOG_IDS[name].initial)).toBeFocused();
    });

    test(`S3 ${name} dialog traps Tab and Shift+Tab (AC-17)`, async ({ page }) => {
      const focused = page.getByTestId(DIALOG_IDS[name].dialog).locator(':focus');
      for (const key of ['Tab', 'Shift+Tab']) {
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press(key);
          await expect(focused).toHaveCount(1);
        }
      }
    });

    for (const how of closers) {
      test(`S3 ${name} dialog closes by ${how} and returns focus to the opener (AC-17)`, async ({ page }) => {
        await close(page, name, how);
        await expect(page.getByTestId(DIALOG_IDS[name].dialog)).toBeHidden();
        await expect(page.getByTestId(DIALOG_IDS[name].opener)).toBeFocused();
      });
    }

    test(`S3 ${name} dialog stays open on a click inside (AC-17)`, async ({ page }) => {
      await page.getByTestId(DIALOG_IDS[name].dialog).click({ position: { x: 8, y: 8 } });
      await expect(page.getByTestId(DIALOG_IDS[name].dialog)).toBeVisible();
    });
  });
}
