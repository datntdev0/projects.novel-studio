import { expect, test } from '@playwright/test';
import { appearanceText, toggleLanguage, type Language } from '../../support/appearance.ts';
import { NOVEL_A, openNovelFromPalette } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';

const COUNT: Record<Language, string> = { en: '2,446', vi: '2.446' };

test.use({ viewport: { width: 1600, height: 900 } });

test('S5 no chip at start, then the opened novel shows title and count and the novel groups (AC-5)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await expect(page.getByTestId('topbar-novel-chip')).toHaveCount(0);
  await expect(page.getByTestId('rail-group-workspace')).toHaveCount(0);
  await expect(page.getByTestId('rail-group-production')).toHaveCount(0);
  await openNovelFromPalette(page, NOVEL_A);
  await expect(page.getByTestId('topbar-novel-chip')).toBeVisible();
  await expect(page.getByTestId('topbar-novel-chip')).toContainText(NOVEL_A);
  await expect(page.getByTestId('topbar-novel-count')).toHaveText(appearanceText('en', 'topbar.chapters', { count: COUNT.en }));
  await expect(page.getByTestId('rail-group-workspace')).toBeVisible();
  await expect(page.getByTestId('rail-group-production')).toBeVisible();
  await toggleLanguage(page);
  await expect(page.getByTestId('topbar-novel-count')).toHaveText(appearanceText('vi', 'topbar.chapters', { count: COUNT.vi }));
});

test('S5 opening a novel from home lands on the reader (AC-5, Q1)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy', hash: 'home' });
  await openNovelFromPalette(page, NOVEL_A);
  await expect(page).toHaveURL(/#\/reader$/);
  await expect(page.getByTestId('module-host-reader')).toBeAttached();
});
