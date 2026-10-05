import { test, expect, saveEvidence } from '../../support/test.ts';

test('S1 renderer shows the hello title (AC-5, AC-37)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await saveEvidence(page, 'hello');
});
