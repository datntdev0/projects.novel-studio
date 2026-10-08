import { expect, test } from '@playwright/test';
import { gotoShell, openFirstNovel } from '../../support/shell.ts';

for (const hash of ['home', 'probe']) {
  test(`S4 Ctrl+3 does nothing from ${hash} while no novel is open`, async ({ page }) => {
    await gotoShell(page, { fixture: 'busy', probe: true, hash });
    await page.keyboard.press('Control+3');
    await page.keyboard.press('Control+2');
    await expect(page.getByTestId('module-host-library')).toBeAttached();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#/${hash}$`));
  });
}

test('S4 Ctrl+3 opens the Reader once a novel is open', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
  await openFirstNovel(page);
  await page.keyboard.press('Control+3');
  await expect(page.getByTestId('module-host-reader')).toBeAttached();
});
