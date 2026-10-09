import { expect, test } from '@playwright/test';
import { gotoShell } from '../../support/shell.ts';
import { openPalette } from '../../support/palette.ts';

test('S9 typing ? and F in a text field keeps the characters and opens nothing', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  const input = page.getByTestId('probe-input');
  await input.focus();
  await page.keyboard.type('?');
  await page.keyboard.press('Shift+F');
  await expect(input).toHaveValue('?F');
  await expect(page.getByTestId('shortcuts')).toHaveCount(0);
  await expect(page.getByTestId('palette')).toHaveCount(0);
});

test('S9 Ctrl+K from the text field still opens the palette', async ({ page }) => {
  await gotoShell(page, { probe: true, hash: 'probe' });
  await page.getByTestId('probe-input').focus();
  await openPalette(page);
});
