import { expect, test } from '../../support/test.ts';
import { appearanceText, gotoProbe, toggleLanguage } from '../../support/appearance.ts';
import { gotoShell } from '../../support/shell.ts';
import { dotState, statusText } from '../../support/status.ts';

const PROGRESS = { done: 37, total: 100, percent: 37 };

test('S3 a running job shows its label, count and percent with the warn dot while attention remains (AC-42)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  const label = appearanceText('en', 'job.translation');
  await expect.poll(() => statusText(page, 'statusbar-job-text')).toBe(appearanceText('en', 'status.job.progress', { label, ...PROGRESS }));
  expect(await dotState(page, 'statusbar-job-dot')).toBe('warn');
});

test('S3 the job dot turns run once attention is cleared (AC-42)', async ({ page }) => {
  await gotoProbe(page, 'busy');
  await expect.poll(() => dotState(page, 'statusbar-job-dot')).toBe('warn');
  await page.getByTestId('probe-clear-attention').click();
  await expect.poll(() => dotState(page, 'statusbar-job-dot')).toBe('run');
});

test('S3 the job text follows the language (AC-42)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await toggleLanguage(page);
  const label = appearanceText('vi', 'job.translation');
  await expect(page.getByTestId('statusbar-job-text')).toHaveText(appearanceText('vi', 'status.job.progress', { label, ...PROGRESS }));
});
