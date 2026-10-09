import { expect, test, type Page } from '@playwright/test';
import { appearanceText } from '../../support/appearance.ts';
import { gotoProbe, openPalette, paletteRowIds } from '../../support/palette.ts';
import { openFirstNovel } from '../../support/shell.ts';

const AUDIO = ['palette-module-audiobook', 'palette-module-pronunciation', 'palette-module-sound', 'palette-module-voicelab'];

async function openWithNovel(page: Page): Promise<void> {
  await gotoProbe(page);
  await openFirstNovel(page);
  await openPalette(page);
}

test('S3 "audio" leaves exactly the four audio modules (AC-32)', async ({ page }) => {
  await openWithNovel(page);
  await page.getByTestId('palette-input').fill('audio');
  await expect.poll(async () => (await paletteRowIds(page)).sort()).toEqual(AUDIO);
});

for (const query of ['sach noi', 'sách nói', 'SACH  NOI']) {
  test(`S3 "${query}" finds the audiobook module (AC-32)`, async ({ page }) => {
    await openWithNovel(page);
    await page.getByTestId('palette-input').fill(query);
    await expect(page.getByTestId('palette-module-audiobook')).toBeVisible();
  });
}

test('S3 nonsense shows the empty state in English and Vietnamese (AC-32)', async ({ page }) => {
  await openWithNovel(page);
  await page.getByTestId('palette-input').fill('zzqxj');
  await expect(page.getByTestId('palette-empty')).toContainText(appearanceText('en', 'palette.emptyTitle'));
  await page.keyboard.press('Control+Shift+U');
  await expect(page.getByTestId('palette-empty')).toContainText(appearanceText('vi', 'palette.emptyTitle'));
});

test('S3 the novels filter shows only the novels group and clears (AC-32)', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-open-palette-novels').click();
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect(page.getByTestId('palette-filter')).toBeVisible();
  await expect(page.getByTestId('palette-group-novels')).toBeVisible();
  await expect(page.getByTestId('palette-group-commands')).toHaveCount(0);
  await expect(page.getByTestId('palette-group-module-library')).toHaveCount(0);
  await page.getByTestId('palette-filter-clear').click();
  await expect(page.getByTestId('palette-filter')).toHaveCount(0);
  await expect(page.getByTestId('palette-group-commands')).toBeVisible();
});
