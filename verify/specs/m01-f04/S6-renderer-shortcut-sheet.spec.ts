import { expect, test } from '../../support/test.ts';
import { appearanceText } from '../../support/appearance.ts';
import { expectHtml } from '../../support/theme.ts';
import { gotoProbe, openPalette, openSheet, registerProbeCommand } from '../../support/palette.ts';

const GLOBAL_ROWS = ['overlay.palette', 'overlay.shortcuts', 'appearance.toggle-language', 'appearance.toggle-theme', 'nav.home', 'escape'];

test('S6 Ctrl+/ opens the sheet and ? opens it again after Esc (AC-35)', async ({ page }) => {
  await gotoProbe(page);
  await openSheet(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('shortcuts')).toBeHidden();
  await page.keyboard.press('Shift+?');
  await expect(page.getByTestId('shortcuts')).toBeVisible();
});

test('S6 the palette row opens the sheet and closes the palette (AC-35)', async ({ page }) => {
  await gotoProbe(page);
  await openPalette(page);
  await page.getByTestId('palette-cmd-overlay.shortcuts').click();
  await expect(page.getByTestId('shortcuts')).toBeVisible();
  await expect(page.getByTestId('palette')).toBeHidden();
});

test('S6 the global group comes first with the global rows (AC-35)', async ({ page }) => {
  await gotoProbe(page);
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-group-global')).toBeVisible();
  const groups = page.getByTestId('shortcuts').locator('[data-testid^="shortcuts-group-"]:not([data-testid$="-here"])');
  await expect(groups.first()).toHaveAttribute('data-testid', 'shortcuts-group-global');
  for (const row of GLOBAL_ROWS) await expect(page.getByTestId('shortcuts-group-global').getByTestId(`shortcuts-row-${row}`)).toBeVisible();
  await expect(page.getByTestId('shortcuts-group-global')).toContainText(appearanceText('en', 'shortcuts.global'));
  await expect(page.getByTestId('shortcuts-row-escape')).toContainText(appearanceText('en', 'shortcuts.escape'));
});

test('S6 the current screen group is marked here (AC-35)', async ({ page }) => {
  await gotoProbe(page);
  await registerProbeCommand(page);
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-group-probe-here')).toBeVisible();
  await expect(page.getByTestId('shortcuts-group-probe-here')).toContainText(appearanceText('en', 'shortcuts.here'));
});

test('S6 Ctrl+Shift+U turns the open sheet Vietnamese (AC-35)', async ({ page }) => {
  await gotoProbe(page);
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-group-global')).toContainText(appearanceText('en', 'shortcuts.global'));
  await page.keyboard.press('Control+Shift+U');
  await expectHtml(page, 'vi', 'dark');
  await expect(page.getByTestId('shortcuts')).toBeVisible();
  await expect(page.getByTestId('shortcuts-group-global')).toContainText(appearanceText('vi', 'shortcuts.global'));
  await expect(page.getByTestId('shortcuts-row-escape')).toContainText(appearanceText('vi', 'shortcuts.escape'));
});

test('S6 Ctrl+K while the sheet is open swaps to the palette and focus returns after it closes (R3.1)', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-input').focus();
  await page.getByTestId('probe-input').press('Control+/');
  await expect(page.getByTestId('shortcuts')).toBeVisible();
  await page.keyboard.press('Control+K');
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect(page.getByTestId('shortcuts')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect(page.getByTestId('probe-input')).toBeFocused();
});
