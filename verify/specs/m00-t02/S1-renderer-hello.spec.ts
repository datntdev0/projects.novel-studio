import { test, expect, saveEvidence } from '../../support/test.ts';
import { gotoFoundation } from '../../support/shell.ts';

test('S1 renderer shows the hello title (AC-5, AC-37)', async ({ page }) => {
  await gotoFoundation(page);
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await saveEvidence(page, 'hello');
});
