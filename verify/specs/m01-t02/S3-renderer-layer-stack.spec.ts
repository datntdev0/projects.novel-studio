import { expect, test } from '@playwright/test';
import { gotoShell } from '../../support/shell.ts';

test('S3 Esc closes the layers one at a time from the top and then does nothing', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  const layers = page.getByTestId('probe-layers');
  await expect(layers).toHaveText('none');
  await page.getByTestId('probe-push-layers').click();
  await expect(layers).toHaveText('a b');
  await page.keyboard.press('Escape');
  await expect(layers).toHaveText('a');
  await page.keyboard.press('Escape');
  await expect(layers).toHaveText('none');
  await page.keyboard.press('Escape');
  await expect(layers).toHaveText('none');
  await expect(page.getByTestId('module-host-probe')).toBeAttached();
});
