import { expect, test } from '@playwright/test';
import { gotoShell, openFirstNovel } from '../../support/shell.ts';
import { NAV_KEYS } from '../../support/shortcuts.ts';

const SCREENS = ['home', 'probe', 'reader', 'settings'];

for (const screen of SCREENS) {
  test(`S1 every navigation key opens its module from ${screen} (AC-62)`, async ({ page }) => {
    await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
    await openFirstNovel(page);
    for (const { chord, moduleId } of NAV_KEYS) {
      await page.evaluate(`location.hash = '#/${screen}'`);
      await expect(page).toHaveURL(new RegExp(`#/${screen}$`));
      await page.keyboard.press(chord);
      await expect(page.getByTestId(`module-host-${moduleId}`)).toBeAttached();
      await expect(page).toHaveURL(new RegExp(`#/${moduleId}$`));
    }
  });
}
