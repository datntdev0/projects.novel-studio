import { test, expect } from '../../support/electron.ts';
import { expectAppInfoInvoke } from '../../support/app-info.ts';

test('S2 electron window shows the hello title (AC-5)', async ({ window }) => {
  await expect(window.getByTestId('app-shell')).toBeVisible();
  await expectAppInfoInvoke(window, { version: '0.0.0' });
});
