import { expect, test } from '../../support/test.ts';
import { SAMPLE_NUMBER, SAMPLE_RELATIVE, toggleLanguage, gotoProbe } from '../../support/appearance.ts';

test('S5 renderer formats numbers and relative time for the current language (AC-25)', async ({ page }) => {
  await gotoProbe(page);
  await expect(page.getByTestId('probe-sample-number')).toHaveText(SAMPLE_NUMBER.en);
  await expect(page.getByTestId('probe-sample-relative')).toHaveText(SAMPLE_RELATIVE.en);

  await toggleLanguage(page);
  await expect(page.getByTestId('probe-sample-number')).toHaveText(SAMPLE_NUMBER.vi);
  await expect(page.getByTestId('probe-sample-relative')).toHaveText(SAMPLE_RELATIVE.vi);

  await toggleLanguage(page);
  await expect(page.getByTestId('probe-sample-number')).toHaveText(SAMPLE_NUMBER.en);
  await expect(page.getByTestId('probe-sample-relative')).toHaveText(SAMPLE_RELATIVE.en);
});
