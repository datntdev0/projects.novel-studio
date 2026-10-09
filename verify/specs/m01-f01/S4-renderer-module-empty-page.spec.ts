import { expect, test, type Page } from '@playwright/test';
import { appearanceText, toggleLanguage } from '../../support/appearance.ts';
import { openPalette } from '../../support/palette.ts';
import { NOVEL_A, openNovelFromPalette } from '../../support/rail.ts';
import { gotoFoundation, gotoShell } from '../../support/shell.ts';

const FORBIDDEN = /release|coming later|soon|sắp có/i;

async function expectVoiceLabPage(page: Page): Promise<void> {
  await expect(page.getByTestId('module-empty')).toBeVisible();
  await expect(page.getByTestId('module-empty-title')).toHaveText(appearanceText('en', 'module.voicelab.label'));
  await expect(page.getByTestId('module-empty-description')).toContainText(appearanceText('en', 'module.voicelab.description'));
  await expect(page.getByTestId('rail-voicelab')).not.toHaveAttribute('disabled');
  await expect(page.getByTestId('rail-voicelab')).not.toHaveAttribute('aria-disabled');
  await expect(page.getByTestId('app-shell')).not.toContainText(FORBIDDEN);
}

test('S4 the Voice Lab URL shows the module page in English and Vietnamese (AC-4)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy', hash: 'voicelab' });
  await expectVoiceLabPage(page);
  await toggleLanguage(page);
  await expect(page.getByTestId('module-empty-title')).toHaveText(appearanceText('vi', 'module.voicelab.label'));
  await expect(page.getByTestId('module-empty-description')).toContainText(appearanceText('vi', 'module.voicelab.description'));
  await expect(page.getByTestId('app-shell')).not.toContainText(FORBIDDEN);
});

test('S4 the rail entry opens the module page (AC-4)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await page.getByTestId('rail-voicelab').click();
  await expectVoiceLabPage(page);
});

test('S4 the palette row opens the module page (AC-4)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openPalette(page);
  await page.getByTestId('palette-input').fill(appearanceText('en', 'module.voicelab.label'));
  await page.getByTestId('palette-module-voicelab').click();
  await expectVoiceLabPage(page);
});

test('S4 with a novel open Ctrl+3 shows the Content module page (AC-4)', async ({ page }) => {
  await gotoShell(page, { fixture: 'busy' });
  await openNovelFromPalette(page, NOVEL_A);
  await page.keyboard.press('Control+2');
  await expect(page).toHaveURL(/#\/library$/);
  await page.keyboard.press('Control+3');
  await expect(page).toHaveURL(/#\/reader$/);
  await expect(page.getByTestId('module-empty-title')).toHaveText(appearanceText('en', 'module.reader.label'));
  await expect(page.getByTestId('module-empty-description')).toContainText(appearanceText('en', 'module.reader.description'));
});

test('S4 a built module is unaffected by the module page (AC-4)', async ({ page }) => {
  await gotoFoundation(page);
  await expect(page.getByTestId('app-hello-title')).toBeVisible();
  await expect(page.getByTestId('module-empty')).toHaveCount(0);
});
