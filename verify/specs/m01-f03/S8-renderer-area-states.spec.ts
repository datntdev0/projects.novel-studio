import { expect, test } from '../../support/test.ts';
import { appearanceText, gotoProbe } from '../../support/appearance.ts';

test('S8 slow shows loading, then the data', async ({ page }) => {
  await gotoProbe(page, 'slow');
  await expect(page.getByTestId('probe-area-loading')).toBeVisible();
  await expect(page.getByTestId('probe-area-loading')).toContainText(appearanceText('en', 'ui.loading'));
  await expect(page.getByTestId('probe-area-ready')).toBeVisible();
  await expect(page.getByTestId('probe-area-loading')).toHaveCount(0);
});

test('S8 empty shows the empty state with its action', async ({ page }) => {
  await gotoProbe(page, 'empty');
  const empty = page.getByTestId('probe-area-empty');
  await expect(empty).toBeVisible();
  await expect(empty).toContainText(appearanceText('en', 'dev.probe.areaEmptyTitle'));
  await expect(page.getByTestId('probe-area-reload')).toBeVisible();
  await expect(page.getByTestId('probe-area-loading')).toHaveCount(0);
  await expect(page.getByTestId('probe-area-error')).toHaveCount(0);
});

test('S8 fail shows the translated error and nothing else', async ({ page }) => {
  await gotoProbe(page, 'fail');
  await expect(page.getByTestId('probe-area-error')).toContainText(appearanceText('en', 'error.INTERNAL'));
  await expect(page.getByTestId('probe-area-loading')).toHaveCount(0);
  await expect(page.getByTestId('probe-area-empty')).toHaveCount(0);
  await expect(page.getByTestId('probe-area-ready')).toHaveCount(0);
});
