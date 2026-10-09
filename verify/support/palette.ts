import { expect, type Page } from '@playwright/test';
import { gotoShell } from './shell.ts';

export async function gotoProbe(page: Page): Promise<void> {
  await gotoShell(page, { fixture: 'busy', probe: true, hash: 'probe' });
}

export async function openPalette(page: Page): Promise<void> {
  await page.keyboard.press('Control+K');
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect(page.getByTestId('palette-input')).toBeFocused();
}

export async function paletteRowIds(page: Page): Promise<string[]> {
  const rows = page
    .getByTestId('palette')
    .locator('[data-testid^="palette-module-"], [data-testid^="palette-cmd-"], [data-testid^="palette-novel-"]');
  return rows.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid') ?? ''));
}

export async function openSheet(page: Page): Promise<void> {
  await page.keyboard.press('Control+/');
  await expect(page.getByTestId('shortcuts')).toBeVisible();
}

export async function registerProbeCommand(page: Page): Promise<void> {
  await page.getByTestId('probe-register-module-command').click();
  await expect(page.getByTestId('probe-module-runs')).toHaveText('0');
}
