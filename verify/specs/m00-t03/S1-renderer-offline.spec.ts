import { test, expect, saveEvidence } from '../../support/test.ts';
import { guardRequests } from '../../support/request-guard.ts';
import { expectAppInfo } from '../../support/app-info.ts';

test('S1 renderer works with no request leaving the dev server (AC-6)', async ({ page }) => {
  const blocked = guardRequests(page);
  await page.goto('/');
  await expect(page.getByTestId('app-hello-title')).toHaveText('Novel Studio');
  await expectAppInfo(page, { version: '0.0.0-e2e' });
  expect(blocked).toEqual([]);
  await saveEvidence(page, 'offline');
});
