import type { Page } from '@playwright/test';
import { expect, saveEvidence, test } from '../../support/test.ts';
import { openPalette } from '../../support/palette.ts';
import { appearanceText, expectLook, toggleLanguage, toggleTheme } from '../../support/appearance.ts';
import { PANEL_DEFAULTS, dragGutter, gotoLayout, panelSize } from '../../support/layout.ts';

const arrangeLayout = async (page: Page) => {
  await dragGutter(page, 'left', 60);
  await page.getByTestId('topbar-toggle-bottom').click();
  await expect(page.getByTestId('panel-bottom')).toBeHidden();
  await page.getByTestId('topbar-brand').click();
  await expect(page.getByTestId('topbar-brand')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate("location.hash = '#/probe-alt'");
  await expect(page.getByTestId('module-host-probe-alt')).toBeAttached();
  await dragGutter(page, 'left', 80);
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left + 80);
  await page.evaluate("location.hash = '#/probe'");
  await expect(page.getByTestId('module-host-probe')).toBeAttached();
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left + 60);
};

test.use({ viewport: { width: 1440, height: 900 } });

test('S5 Reset layout restores every default, collapses the rail and keeps language and theme (AC-16)', async ({ page }) => {
  await gotoLayout(page);
  await toggleLanguage(page);
  await toggleTheme(page);
  await expectLook(page, 'vi', 'light');
  const langTheme = await page.getByTestId('statusbar-lang-theme').innerText();

  await arrangeLayout(page);
  await saveEvidence(page, 'before-reset');

  await page.keyboard.press('Shift+F');
  await expect(page.getByTestId('rail')).toBeHidden();
  await openPalette(page);
  await page.getByTestId('palette-input').fill(appearanceText('vi', 'command.resetLayout'));
  await page.keyboard.press('Enter');
  for (const id of ['rail', 'topbar', 'statusbar', 'panel-left', 'panel-right', 'panel-bottom'])
    await expect(page.getByTestId(id)).toBeVisible();
  await expect(page.getByTestId('toasts')).toContainText(appearanceText('vi', 'layout.resetDone'));
  await expect(page.getByTestId('topbar-brand')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
  expect(await panelSize(page, 'right')).toBe(PANEL_DEFAULTS.right);
  expect(await panelSize(page, 'bottom')).toBe(PANEL_DEFAULTS.bottom);
  await saveEvidence(page, 'after-reset');

  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectLook(page, 'vi', 'light');
  await expect(page.getByTestId('statusbar-lang-theme')).toHaveText(langTheme);
  await expect(page.getByTestId('topbar-brand')).toHaveAttribute('aria-pressed', 'false');
  expect(await panelSize(page, 'bottom')).toBe(PANEL_DEFAULTS.bottom);
  await page.evaluate("location.hash = '#/probe-alt'");
  await expect(page.getByTestId('module-host-probe-alt')).toBeAttached();
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
});
