import { expect, test } from '../../support/test.ts';
import { appearanceText } from '../../support/appearance.ts';
import { NOVEL_B, openNovelFromPalette, railEntryIds } from '../../support/rail.ts';
import { NOVEL_SCOPED_IDS, gotoShell } from '../../support/shell.ts';

test('S9 the app starts on home without a novel and a novel-less deep link falls back to home (AC-9)', async ({ page }) => {
  await gotoShell(page);
  await openNovelFromPalette(page, NOVEL_B);
  await page.evaluate("location.hash = '#/library'");
  await expect(page).toHaveURL(/#\/library$/);
  await expect(page.getByTestId('topbar-novel-chip')).toBeVisible();

  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByTestId('module-host-home')).toBeVisible();
  await expect(page.getByTestId('topbar-novel-chip')).toHaveCount(0);
  await expect(page.getByTestId('toast-1')).toHaveCount(0);
  const entries = await railEntryIds(page);
  expect(entries).toContain('home');
  for (const id of NOVEL_SCOPED_IDS) expect(entries).not.toContain(id);

  await gotoShell(page, { hash: 'reader' });
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByTestId('module-host-home')).toBeVisible();
  await expect(page.getByTestId('toast-1')).toContainText(appearanceText('en', 'shell.openNovelFirst'));
  await expect(page.getByTestId('toast-2')).toHaveCount(0);
});
