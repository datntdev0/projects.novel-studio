import { expect, test } from '../../support/test.ts';
import { appearanceText, gotoProbe, toggleLanguage } from '../../support/appearance.ts';
import { dotState } from '../../support/status.ts';

test('S9 the backend item shows only while starting or failed (AC-48)', async ({ page }) => {
  await gotoProbe(page, 'busy');
  await expect(page.getByTestId('statusbar-backend')).toHaveCount(0);

  await page.getByTestId('probe-backend-starting').click();
  await expect(page.getByTestId('statusbar-backend')).toContainText(appearanceText('en', 'status.backend.starting'));
  expect(await dotState(page, 'statusbar-backend-dot')).toBe('run');

  await page.getByTestId('probe-backend-failed').click();
  await expect(page.getByTestId('statusbar-backend')).toContainText(appearanceText('en', 'status.backend.failed', { reason: '' }).trim());
  await expect(page.getByTestId('statusbar-backend')).toHaveAttribute('title', /python exited with code 1 \(probe\)/);
  expect(await dotState(page, 'statusbar-backend-dot')).toBe('warn');

  await toggleLanguage(page);
  await expect(page.getByTestId('statusbar-backend')).toContainText(appearanceText('vi', 'status.backend.failed', { reason: '' }).trim());

  await page.getByTestId('probe-backend-ready').click();
  await expect(page.getByTestId('statusbar-backend')).toHaveCount(0);
});
