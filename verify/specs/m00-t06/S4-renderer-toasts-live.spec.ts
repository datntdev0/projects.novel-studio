import { test, expect } from '../../support/test.ts';
import { openKit, toastIds, TOAST_SHOW } from '../../support/kit.ts';

test('S4 toasts host is a polite live region on load (AC-17)', async ({ page }) => {
  await openKit(page, 'light');
  const host = page.getByTestId('kit-toasts');
  await expect(host).toHaveAttribute('aria-live', 'polite');
  for (const id of ['info', 'success', 'warning', 'danger']) await expect(host.getByTestId(toastIds(id).toast)).toBeVisible();
});

test('S4 Show toast adds a toast inside the host and its close removes it (AC-17)', async ({ page }) => {
  await openKit(page, 'light');
  const host = page.getByTestId('kit-toasts');
  const added = toastIds('new-1');
  await expect(host.getByTestId(added.toast)).toHaveCount(0);
  await page.getByTestId(TOAST_SHOW).click();
  await expect(host.getByTestId(added.toast)).toBeVisible();
  await host.getByTestId(added.close).click();
  await expect(host.getByTestId(added.toast)).toHaveCount(0);
});
