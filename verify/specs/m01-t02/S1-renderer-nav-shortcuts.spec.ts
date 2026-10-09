import { test } from '@playwright/test';
import { expectNavTarget, gotoShell, goWithNovel } from '../../support/shell.ts';
import { NAV_KEYS } from '../../support/shortcuts.ts';

const SCREENS = ['home', 'probe', 'reader', 'settings'];

for (const screen of SCREENS) {
  test(`S1 every navigation key opens its module from ${screen} (AC-62)`, async ({ page }) => {
    await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
    for (const { chord, moduleId } of NAV_KEYS) {
      await goWithNovel(page, screen);
      await page.keyboard.press(chord);
      await expectNavTarget(page, screen, moduleId);
    }
  });
}
