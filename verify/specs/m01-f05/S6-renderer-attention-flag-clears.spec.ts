import { expect, test } from '../../support/test.ts';
import { appearanceText, gotoProbe } from '../../support/appearance.ts';
import { dotState, statusText } from '../../support/status.ts';

test('S6 the attention flag shows on the status bar and the rail badge and clears (AC-45)', async ({ page }) => {
  await gotoProbe(page, 'busy');
  await expect(page.getByTestId('probe-status-attention')).toHaveText('2');
  await expect(page.getByTestId('statusbar-job-attention')).toContainText(appearanceText('en', 'status.job.attention.other', { count: 2 }));
  await expect(page.getByTestId('rail-badge-tasks')).toHaveText('2');
  expect(await dotState(page, 'statusbar-job-dot')).toBe('warn');
  await expect(page.getByTestId('notification-centre')).toHaveCount(0);

  await page.getByTestId('probe-clear-attention').click();
  await expect(page.getByTestId('probe-status-attention')).toHaveText('0');
  await expect(page.getByTestId('statusbar-job-attention')).toHaveCount(0);
  await expect(page.getByTestId('rail-badge-tasks')).toHaveCount(0);
  expect(await dotState(page, 'statusbar-job-dot')).toBe('run');
  await expect(page.getByTestId('notification-centre')).toHaveCount(0);
  expect(await statusText(page, 'statusbar-job')).not.toContain(appearanceText('en', 'status.job.idle'));
});

test('S6 no badge when nothing needs attention (AC-45)', async ({ page }) => {
  await gotoProbe(page, 'none');
  await expect(page.getByTestId('statusbar-job-attention')).toHaveCount(0);
  await expect(page.getByTestId('rail-badge-tasks')).toHaveCount(0);
});
