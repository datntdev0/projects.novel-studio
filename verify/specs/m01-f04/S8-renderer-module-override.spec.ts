import { expect, test } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';
import { expectHtml } from '../../support/theme.ts';
import { openSheet, registerProbeCommand } from '../../support/palette.ts';

test('S8 the module key runs on its screen and the global key elsewhere (AC-37)', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await registerProbeCommand(page);
  await page.keyboard.press('Control+Shift+L');
  await expect(page.getByTestId('probe-module-runs')).toHaveText('1');
  await expectHtml(page, 'en', 'dark');
  await page.evaluate("location.hash = '#/home'");
  await expect(page).toHaveURL(/#\/home$/);
  await page.keyboard.press('Control+Shift+L');
  await expectHtml(page, 'en', 'light');
  await page.evaluate("location.hash = '#/probe'");
  await expect(page.getByTestId('probe-module-runs')).toHaveText('1');
});

test('S8 the sheet marks the module row active on its screen only (AC-37)', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await registerProbeCommand(page);
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-group-probe-here')).toBeVisible();
  await expect(page.getByTestId('shortcuts-row-probe.module-action')).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('shortcuts-row-appearance.toggle-theme')).toHaveAttribute('data-active', 'false');
  await page.keyboard.press('Escape');
  await page.evaluate("location.hash = '#/home'");
  await expect(page).toHaveURL(/#\/home$/);
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-group-probe-here')).toHaveCount(0);
  await expect(page.getByTestId('shortcuts-row-probe.module-action')).toHaveAttribute('data-active', 'false');
  await expect(page.getByTestId('shortcuts-row-appearance.toggle-theme')).toHaveAttribute('data-active', 'true');
});
