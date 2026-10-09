import { expect, test } from '@playwright/test';
import { appearanceText, toggleLanguage } from '../../support/appearance.ts';
import { openPalette, paletteRowIds } from '../../support/palette.ts';
import { NOVEL_B, openNovelFromPalette } from '../../support/rail.ts';
import { gotoShell } from '../../support/shell.ts';

const OPENED = ['novel-1', 'novel-2', 'novel-3'];
const UNOPENED = ['novel-7', 'novel-6', 'novel-4', 'novel-5'];
const novelRowIds = (list: string[]): string[] => list.map((id) => `palette-novel-${id}`);

test('S8 opened novels come first newest first, then never-opened by title (AC-8)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openPalette(page);
  await expect
    .poll(async () => (await paletteRowIds(page)).filter((id) => id.startsWith('palette-novel-')))
    .toEqual(novelRowIds([...OPENED, ...UNOPENED]));
});

test('S8 a newly opened novel moves to the top (AC-8)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_B);
  await page.getByTestId('topbar-novel-switch').click();
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect.poll(async () => (await paletteRowIds(page))[0]).toBe('palette-novel-novel-6');
});

test('S8 no novels shows the empty text in English and Vietnamese (AC-8)', async ({ page }) => {
  await gotoShell(page, { fixture: 'empty', probe: true, hash: 'probe' });
  await page.getByTestId('probe-open-palette-novels').click();
  await expect(page.getByTestId('palette-empty')).toHaveText(appearanceText('en', 'palette.noNovels'));
  await toggleLanguage(page);
  await expect(page.getByTestId('palette-empty')).toHaveText(appearanceText('vi', 'palette.noNovels'));
});
