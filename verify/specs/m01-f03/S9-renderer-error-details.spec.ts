import { expect, test } from '../../support/test.ts';
import { appearanceText, detailsText, ERROR_TOAST_DETAILS, FAIL_DETAILS, NSERROR_DETAILS, toggleLanguage, gotoProbe } from '../../support/appearance.ts';

test('S9 the area error shows its message from the code and the raw details in both languages', async ({ page }) => {
  await gotoProbe(page, 'fail');
  const error = page.getByTestId('probe-area-error');
  await expect(error).toContainText(appearanceText('en', 'error.INTERNAL'));
  await expect(page.getByTestId('probe-area-error-details')).toContainText(appearanceText('en', 'ui.details'));
  await expect(detailsText(page, 'probe-area-error')).toHaveText(FAIL_DETAILS);
  await toggleLanguage(page);
  await expect(error).toContainText(appearanceText('vi', 'error.INTERNAL'));
  await expect(page.getByTestId('probe-area-error-details')).toContainText(appearanceText('vi', 'ui.details'));
  await expect(detailsText(page, 'probe-area-error')).toHaveText(FAIL_DETAILS);
});

test('S9 the error toast shows its message from the code and the raw details in both languages', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-toast-nserror').click();
  const toast = page.getByTestId('toast-1');
  await expect(toast).toContainText(appearanceText('en', 'error.BACKEND_FAILED'));
  await expect(detailsText(page, 'toast-1')).toHaveText(NSERROR_DETAILS);
  await toggleLanguage(page);
  await expect(toast).toContainText(appearanceText('vi', 'error.BACKEND_FAILED'));
  await expect(detailsText(page, 'toast-1')).toHaveText(NSERROR_DETAILS);
});

test('S9 the generic error toast keeps its raw details untranslated', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-toast-error').click();
  await expect(detailsText(page, 'toast-1')).toHaveText(ERROR_TOAST_DETAILS);
  await toggleLanguage(page);
  await expect(detailsText(page, 'toast-1')).toHaveText(ERROR_TOAST_DETAILS);
});
