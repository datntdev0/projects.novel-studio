import { expect, test } from '@playwright/test';
import { gotoShell } from '../../support/shell.ts';
import { openPalette } from '../../support/palette.ts';

test('S10 Esc closes the palette first and then the confirm dialog', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await page.getByTestId('probe-delete').click();
  await expect(page.getByTestId('dlg-confirm')).toBeVisible();
  await openPalette(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toHaveCount(0);
  await expect(page.getByTestId('dlg-confirm')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('dlg-confirm')).toHaveCount(0);
  await expect(page.getByTestId('probe-delete-result')).toHaveText('cancelled');
});

test('S10 further Esc presses empty the probe layers top first', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  const layers = page.getByTestId('probe-layers');
  await page.getByTestId('probe-push-layers').click();
  await expect(layers).toHaveText('a b');
  await page.getByTestId('probe-delete').click();
  await openPalette(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('dlg-confirm')).toHaveCount(0);
  await expect(layers).toHaveText('a b');
  await page.keyboard.press('Escape');
  await expect(layers).toHaveText('a');
  await page.keyboard.press('Escape');
  await expect(layers).toHaveText('none');
});
