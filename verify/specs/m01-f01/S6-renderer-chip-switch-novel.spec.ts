import { expect, test } from '@playwright/test';
import { NOVEL_A, NOVEL_C, openNovelFromPalette, pickNovel } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';

test('S6 the chip opens the novels filter only (AC-6)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await page.getByTestId('topbar-novel-switch').click();
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect(page.getByTestId('palette-filter')).toBeVisible();
  await expect(page.getByTestId('palette-group-novels')).toBeVisible();
  await expect(page.getByTestId('palette').locator('[data-testid^="palette-group-"]')).toHaveCount(1);
});

test('S6 picking another novel updates the chip and closes the palette (AC-6)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await expect(page.getByTestId('topbar-novel-chip')).toContainText(NOVEL_A);
  await page.getByTestId('topbar-novel-switch').click();
  await pickNovel(page, NOVEL_C);
  await expect(page.getByTestId('topbar-novel-chip')).toContainText(NOVEL_C);
  await expect(page.getByTestId('topbar-novel-chip')).not.toContainText(NOVEL_A);
});

test('S6 Esc returns focus to the chip (AC-6)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await page.getByTestId('topbar-novel-switch').click();
  await expect(page.getByTestId('palette')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect(page.getByTestId('topbar-novel-switch')).toBeFocused();
});
