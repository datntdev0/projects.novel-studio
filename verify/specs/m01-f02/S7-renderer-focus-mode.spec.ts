import { expect, saveEvidence, test, type Page } from '../../support/test.ts';
import { openPalette } from '../../support/palette.ts';
import { appearanceText } from '../../support/appearance.ts';
import { PANEL_DEFAULTS, dragGutter, gotoLayout, panelSize } from '../../support/layout.ts';

const CHROME = [
  'rail',
  'topbar',
  'statusbar',
  'panel-left',
  'panel-right',
  'panel-bottom',
  'resizer-left',
  'resizer-right',
  'resizer-bottom',
];
const LEFT_SIZE = 300;

const expectChrome = async (page: Page, visible: boolean): Promise<void> => {
  for (const testId of CHROME) {
    if (visible) await expect(page.getByTestId(testId)).toBeVisible();
    else await expect(page.getByTestId(testId)).toBeHidden();
  }
};

const gotoBusy = async (page: Page): Promise<void> => {
  await gotoLayout(page, { fixture: 'busy' });
  await dragGutter(page, 'left', LEFT_SIZE - PANEL_DEFAULTS.left);
  expect(await panelSize(page, 'left')).toBe(LEFT_SIZE);
};

const enterFocus = async (page: Page): Promise<void> => {
  await page.keyboard.press('Shift+F');
  await expectChrome(page, false);
};

test.use({ viewport: { width: 1440, height: 900 } });

test('S7 Shift+F shows only the workspace with a 2px job bar and Esc restores the exact layout (AC-19)', async ({ page }) => {
  await gotoBusy(page);
  await enterFocus(page);
  await expect(page.getByTestId('module-host-probe')).toBeVisible();
  await expect(page.getByTestId('toasts')).toContainText(appearanceText('en', 'layout.focusHint'));
  await expect(page.getByTestId('zen-progress')).toBeVisible();
  expect(Math.round((await page.getByTestId('zen-progress').boundingBox())?.height ?? 0)).toBe(2);
  await saveEvidence(page, 'focus');

  await page.keyboard.press('Escape');
  await expectChrome(page, true);
  await expect(page.getByTestId('zen-progress')).toBeHidden();
  expect(await panelSize(page, 'left')).toBe(LEFT_SIZE);
  expect(await panelSize(page, 'right')).toBe(PANEL_DEFAULTS.right);
  expect(await panelSize(page, 'bottom')).toBe(PANEL_DEFAULTS.bottom);
  await saveEvidence(page, 'restored');
});

test('S7 Shift+F typed in the input only types (AC-19)', async ({ page }) => {
  await gotoBusy(page);
  const input = page.getByTestId('probe-input');
  await input.click();
  await page.keyboard.press('Shift+F');
  await expect(input).toHaveValue('F');
  await expect(page.getByTestId('rail')).toBeVisible();
});

test('S7 Shift+F twice leaves focus mode (AC-19)', async ({ page }) => {
  await gotoBusy(page);
  await enterFocus(page);
  await page.keyboard.press('Shift+F');
  await expectChrome(page, true);
  expect(await panelSize(page, 'left')).toBe(LEFT_SIZE);
});

test('S7 Esc closes an open palette first and focus mode stays on (AC-19)', async ({ page }) => {
  await gotoBusy(page);
  await enterFocus(page);
  await openPalette(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expectChrome(page, false);
  await page.keyboard.press('Escape');
  await expectChrome(page, true);
});

test('S7 focus mode without a running job shows no job bar (AC-19)', async ({ page }) => {
  await gotoLayout(page, { fixture: 'none' });
  await enterFocus(page);
  await expect(page.getByTestId('zen-progress')).toBeHidden();
});

test('S7 focus mode is not kept after a reload (AC-19)', async ({ page }) => {
  await gotoBusy(page);
  await enterFocus(page);
  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectChrome(page, true);
  expect(await panelSize(page, 'left')).toBe(LEFT_SIZE);
});
