import { expect, test, type Page } from '@playwright/test';
import { openFirstNovel } from '../../support/shell.ts';
import { NAV_KEYS } from '../../support/shortcuts.ts';
import { gotoProbe, openPalette, openSheet } from '../../support/palette.ts';
import { readHtml } from '../../support/theme.ts';

const SCREENS = ['home', 'library', 'probe'];

const goTo = async (page: Page, screen: string): Promise<void> => {
  await page.evaluate(`location.hash = '#/${screen}'`);
  await expect(page).toHaveURL(new RegExp(`#/${screen}$`));
};

for (const screen of SCREENS) {
  test(`S4 every global shortcut works on ${screen} (AC-33)`, async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => warnings.push(message.type() === 'warning' ? message.text() : ''));
    await gotoProbe(page);
    await openFirstNovel(page);
    await goTo(page, screen);

    await openPalette(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('palette')).toBeHidden();

    await openSheet(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts')).toBeHidden();

    await page.keyboard.press('?');
    await expect(page.getByTestId('shortcuts')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts')).toBeHidden();

    const before = await readHtml(page);
    await page.keyboard.press('Control+Shift+L');
    await expect.poll(async () => (await readHtml(page)).dataTheme).not.toBe(before.dataTheme);
    await page.keyboard.press('Control+Shift+U');
    await expect.poll(async () => (await readHtml(page)).lang).not.toBe(before.lang);
    await page.keyboard.press('Control+Shift+L');
    await expect.poll(async () => (await readHtml(page)).dataTheme).toBe(before.dataTheme);
    await page.keyboard.press('Control+Shift+U');
    await expect.poll(async () => (await readHtml(page)).lang).toBe(before.lang);

    for (const { chord, moduleId } of NAV_KEYS) {
      await goTo(page, screen);
      await page.keyboard.press(chord);
      await expect(page).toHaveURL(new RegExp(`#/${moduleId}$`));
      await expect(page.getByTestId(`module-host-${moduleId}`)).toBeAttached();
    }

    expect(warnings.filter((text) => text.includes('refused') && !text.includes('refused for probe.'))).toEqual([]);
  });
}
