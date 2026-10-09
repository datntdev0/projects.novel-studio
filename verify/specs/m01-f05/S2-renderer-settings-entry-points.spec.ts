import { expect, test, type Page } from '../../support/test.ts';
import { appearanceText } from '../../support/appearance.ts';
import { gotoShell } from '../../support/shell.ts';
import { openPalette } from '../../support/palette.ts';

const STARTS = ['home', 'library'];

const ENTRY_POINTS: Record<string, (page: Page) => Promise<void>> = {
  'rail-settings': (page) => page.getByTestId('rail-settings').click(),
  'topbar-settings': (page) => page.getByTestId('topbar-settings').click(),
  palette: async (page) => {
    await openPalette(page);
    await page.getByTestId('palette-input').fill(appearanceText('en', 'module.settings.label'));
    await page.keyboard.press('Enter');
  },
  'Ctrl+,': (page) => page.keyboard.press('Control+,'),
  'Ctrl+7': (page) => page.keyboard.press('Control+7'),
  'statusbar-cli-claude': (page) => page.getByTestId('statusbar-cli-claude').click(),
};

for (const start of STARTS) {
  for (const [name, open] of Object.entries(ENTRY_POINTS)) {
    test(`S2 ${name} opens Settings from ${start} (AC-41)`, async ({ page }) => {
      await gotoShell(page, { fixture: 'busy', hash: start });
      await open(page);
      await expect(page).toHaveURL(/#\/settings$/);
      await expect(page.getByTestId('rail-settings')).toHaveAttribute('aria-current', 'page');
    });
  }
}

test('S2 the settings gear shows its shortcut and the top bar has no tray or CLI dots (AC-41)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect(page.getByTestId('topbar-settings')).toHaveAttribute('title', /Ctrl\+,/);
  await expect(page.getByTestId('topbar-tray')).toHaveCount(0);
  await expect(page.getByTestId('topbar-cli-dots')).toHaveCount(0);
});
