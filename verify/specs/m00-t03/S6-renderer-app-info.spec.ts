import { test } from '../../support/test.ts';
import { expectAppInfo } from '../../support/app-info.ts';

test('S6 renderer shows app info from the browser bridge (AC-11)', async ({ page }) => {
  await page.goto('/');
  await expectAppInfo(page, { version: '0.0.0-e2e' });
});
