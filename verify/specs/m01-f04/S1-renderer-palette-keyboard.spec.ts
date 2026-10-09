import { expect, test } from '@playwright/test';
import { gotoProbe, openPalette, paletteRowIds } from '../../support/palette.ts';
import { readHtml } from '../../support/theme.ts';

test('S1 Ctrl+K from a text field opens the palette with focus in the input (AC-30)', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-input').focus();
  await openPalette(page);
});

test('S1 the top-bar button opens the palette with focus in the input (AC-30)', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('topbar-palette').click();
  await expect(page.getByTestId('palette')).toBeVisible();
  await expect(page.getByTestId('palette-input')).toBeFocused();
});

test('S1 arrow keys move the selection and wrap around (AC-30)', async ({ page }) => {
  await gotoProbe(page);
  await openPalette(page);
  const ids = await paletteRowIds(page);
  expect(ids.length).toBeGreaterThan(2);
  const first = page.getByTestId(ids[0] ?? '');
  const second = page.getByTestId(ids[1] ?? '');
  const last = page.getByTestId(ids[ids.length - 1] ?? '');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(first).not.toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(last).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(first).toHaveAttribute('aria-selected', 'true');
});

test('S1 Enter on the theme command flips the theme and closes the palette (AC-30)', async ({ page }) => {
  await gotoProbe(page);
  const before = (await readHtml(page)).dataTheme;
  await openPalette(page);
  await page.getByTestId('palette-input').fill('theme');
  await expect(page.getByTestId('palette-cmd-appearance.toggle-theme')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect.poll(async () => (await readHtml(page)).dataTheme).not.toBe(before);
});

test('S1 Esc closes the palette and returns focus to the opener (AC-30)', async ({ page }) => {
  await gotoProbe(page);
  await page.getByTestId('probe-input').focus();
  await openPalette(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect(page.getByTestId('probe-input')).toBeFocused();
});
