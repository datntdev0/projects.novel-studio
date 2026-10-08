import { test, expect, saveEvidence } from '../../support/test.ts';
import { expectRootLanguage } from '../../support/i18n-texts.ts';
import { gotoFoundation } from '../../support/shell.ts';

type MarkerGlobals = { __marker?: string };

test('S2 renderer switches language at run time without a reload (AC-19)', async ({ page }) => {
  await gotoFoundation(page);
  await page.evaluate(() => ((globalThis as unknown as MarkerGlobals).__marker = 'kept'));
  await expectRootLanguage(page, 'en');
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await saveEvidence(page, 'en');
  await page.getByTestId('root-set-language-vi').click();
  await expectRootLanguage(page, 'vi');
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await saveEvidence(page, 'vi');
  await page.getByTestId('root-set-language-en').click();
  await expectRootLanguage(page, 'en');
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await saveEvidence(page, 'en-again');
  expect(await page.evaluate(() => (globalThis as unknown as MarkerGlobals).__marker)).toBe('kept');
});
