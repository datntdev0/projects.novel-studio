import { expect, test } from '../../support/test.ts';
import { appearanceText, gotoProbe, toggleLanguage } from '../../support/appearance.ts';
import { gotoShell } from '../../support/shell.ts';
import { dotState } from '../../support/status.ts';

test('S4 with no running job the item reads idle with a neutral dot and no percent (AC-43)', async ({ page }) => {
  await gotoShell(page, { fixture: 'none' });
  await expect(page.getByTestId('statusbar-job-text')).toHaveText(appearanceText('en', 'status.job.idle'));
  await expect(page.getByTestId('statusbar-job-text')).not.toContainText('%');
  await expect(page.getByTestId('statusbar-job-attention')).toHaveCount(0);
  expect(await dotState(page, 'statusbar-job-dot')).toBe('neutral');
});

test('S4 the idle text follows the language (AC-43)', async ({ page }) => {
  await gotoShell(page, { fixture: 'none' });
  await toggleLanguage(page);
  await expect(page.getByTestId('statusbar-job-text')).toHaveText(appearanceText('vi', 'status.job.idle'));
});

test('S4 the item stays visible with an empty library (AC-43)', async ({ page }) => {
  await gotoShell(page, { fixture: 'first-run' });
  await expect(page.getByTestId('statusbar-job')).toBeVisible();
  await expect(page.getByTestId('statusbar-job-text')).toHaveText(appearanceText('en', 'status.job.idle'));
});

test('S4 a finished job returns the item to the idle text (AC-43)', async ({ page }) => {
  await gotoProbe(page, 'busy');
  await expect(page.getByTestId('statusbar-job-text')).toContainText('37/100');
  await page.getByTestId('probe-finish-job').click();
  await expect(page.getByTestId('statusbar-job-text')).toHaveText(appearanceText('en', 'status.job.idle'));
});
