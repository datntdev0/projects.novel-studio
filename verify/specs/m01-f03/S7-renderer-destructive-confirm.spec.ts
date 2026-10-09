import { expect, test, type Page } from '../../support/test.ts';
import { appearanceText, DELETE_NAME, gotoProbe } from '../../support/appearance.ts';

async function openDelete(page: Page): Promise<void> {
  await gotoProbe(page);
  await expect(page.getByTestId('probe-delete-result')).toHaveText('none');
  await page.getByTestId('probe-delete').click();
  await expect(page.getByTestId('dlg-confirm')).toBeVisible();
}

test('S7 the confirm names the item and the loss, with Cancel focused', async ({ page }) => {
  await openDelete(page);
  const dialog = page.getByTestId('dlg-confirm');
  await expect(dialog).toContainText(appearanceText('en', 'dev.probe.deleteTitle', { name: DELETE_NAME }));
  await expect(dialog).toContainText(appearanceText('en', 'dev.probe.deleteMessage'));
  await expect(page.getByTestId('dlg-confirm-confirm')).toHaveText(appearanceText('en', 'dev.probe.deleteConfirm'));
  await expect(page.getByTestId('dlg-confirm-cancel')).toBeFocused();
});

test('S7 Tab stays inside the dialog', async ({ page }) => {
  await openDelete(page);
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('dlg-confirm').locator(':focus')).toHaveCount(1);
  }
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('dlg-confirm').locator(':focus')).toHaveCount(1);
  }
});

test('S7 Esc cancels', async ({ page }) => {
  await openDelete(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('dlg-confirm')).toBeHidden();
  await expect(page.getByTestId('probe-delete-result')).toHaveText('cancelled');
});

test('S7 Cancel cancels', async ({ page }) => {
  await openDelete(page);
  await page.getByTestId('dlg-confirm-cancel').click();
  await expect(page.getByTestId('dlg-confirm')).toBeHidden();
  await expect(page.getByTestId('probe-delete-result')).toHaveText('cancelled');
});

test('S7 the confirm button confirms', async ({ page }) => {
  await openDelete(page);
  await page.getByTestId('dlg-confirm-confirm').click();
  await expect(page.getByTestId('dlg-confirm')).toBeHidden();
  await expect(page.getByTestId('probe-delete-result')).toHaveText('confirmed');
});
