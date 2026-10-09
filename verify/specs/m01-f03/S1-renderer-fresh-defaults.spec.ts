import { expect, test } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';
import { expectLook } from '../../support/appearance.ts';

test('S1 a fresh start shows English and the dark theme (AC-21)', async ({ page }) => {
  await gotoShell(page);
  await expectLook(page, 'en', 'dark');
  await expect(page.getByTestId('topbar-lang')).toHaveText('EN');
});
