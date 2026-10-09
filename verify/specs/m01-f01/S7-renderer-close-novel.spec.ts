import { expect, test, type Page } from '@playwright/test';
import { NOVEL_A, openNovelFromPalette } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';

async function expectNovelClosed(page: Page): Promise<void> {
  await expect(page.getByTestId('topbar-novel-chip')).toHaveCount(0);
  await expect(page.getByTestId('rail-group-workspace')).toHaveCount(0);
  await expect(page.getByTestId('rail-group-production')).toHaveCount(0);
}

async function openNovel(page: Page): Promise<void> {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await expect(page.getByTestId('topbar-novel-chip')).toBeVisible();
}

test('S7 the chip clear button closes the novel and goes to the library (AC-7)', async ({ page }) => {
  await openNovel(page);
  await page.getByTestId('topbar-novel-clear').click();
  await expectNovelClosed(page);
  await expect(page).toHaveURL(/#\/library$/);
});

test('S7 Ctrl+1 goes home and closes the novel; the library does not restore it (AC-7)', async ({ page }) => {
  await openNovel(page);
  await page.getByTestId('topbar-novel-clear').click();
  await openNovelFromPalette(page, NOVEL_A);
  await page.keyboard.press('Control+1');
  await expect(page).toHaveURL(/#\/home$/);
  await expectNovelClosed(page);
  await page.getByTestId('rail-library').click();
  await expect(page).toHaveURL(/#\/library$/);
  await expectNovelClosed(page);
});

test('S7 the rail home entry closes the novel (AC-7)', async ({ page }) => {
  await openNovel(page);
  await page.getByTestId('rail-home').click();
  await expect(page).toHaveURL(/#\/home$/);
  await expectNovelClosed(page);
});
