import { expect, test } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';
import { openPalette, openSheet, registerProbeCommand } from '../../support/palette.ts';

const KEYS = 'Ctrl+Shift+L';

test('S7 a module command is absent from the palette and sheet before registering (AC-36)', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await openPalette(page);
  await expect(page.getByTestId('palette-cmd-probe.module-action')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await openSheet(page);
  await expect(page.getByTestId('shortcuts-row-probe.module-action')).toHaveCount(0);
});

test('S7 a registered module command shows in the palette and the sheet with the same keys (AC-36)', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await registerProbeCommand(page);
  await openPalette(page);
  const paletteRow = page.getByTestId('palette-cmd-probe.module-action');
  await expect(paletteRow).toBeVisible();
  const paletteKeys = await paletteRow.locator('kbd').allTextContents();
  expect(paletteKeys.join('+')).toBe(KEYS);
  await page.keyboard.press('Escape');
  await openSheet(page);
  const sheetRow = page.getByTestId('shortcuts-row-probe.module-action');
  await expect(sheetRow).toBeVisible();
  expect((await sheetRow.locator('kbd').allTextContents()).join('+')).toBe(KEYS);
  expect(await sheetRow.locator('kbd').allTextContents()).toEqual(paletteKeys);
});
