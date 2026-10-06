import { test, expect } from '../../support/test.ts';

test('S3 renderer formats count, date and number per language (AC-20)', async ({ page }) => {
  await page.goto('/');
  const date = page.getByTestId('root-sample-date');
  await expect(page.getByTestId('root-sample-count-one')).toHaveText('1 chapter');
  await expect(page.getByTestId('root-sample-count-other')).toHaveText('5 chapters');
  await expect(date).toHaveText('March 5, 2026');
  await expect(page.getByTestId('root-sample-number')).toHaveText('1,234,567.89');
  await page.getByTestId('root-set-language-vi').click();
  await expect(page.getByTestId('root-sample-count-one')).toHaveText('1 chương');
  await expect(page.getByTestId('root-sample-count-other')).toHaveText('5 chương');
  await expect(page.getByTestId('root-sample-number')).toHaveText('1.234.567,89');
  await expect(date).toHaveText(/5.*3.*2026/);
  await expect(date).not.toHaveText('March 5, 2026');
});
