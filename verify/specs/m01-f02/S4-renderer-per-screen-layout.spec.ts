import { expect, saveEvidence, test } from '../../support/test.ts';
import { dragGutter, gotoLayout, PANEL_DEFAULTS, panelSize, seedLayout } from '../../support/layout.ts';

test.use({ viewport: { width: 1440, height: 900 } });

test('S4 each screen keeps its own layout, also after a restart (AC-15)', async ({ page }) => {
  await gotoLayout(page);
  await dragGutter(page, 'left', 68);
  await page.getByTestId('topbar-toggle-right').click();
  await expect(page.getByTestId('panel-right')).toBeHidden();
  expect(await panelSize(page, 'left')).toBe(340);

  await page.evaluate("location.hash = '#/probe-alt'");
  await expect(page.getByTestId('module-host-probe-alt')).toBeAttached();
  await expect.poll(() => panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);

  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);

  await page.evaluate("location.hash = '#/probe'");
  await expect(page.getByTestId('module-host-probe')).toBeAttached();
  await expect.poll(() => panelSize(page, 'left')).toBe(340);
  await expect(page.getByTestId('panel-right')).toBeHidden();
  await expect(page.getByTestId('panel-bottom')).toBeVisible();
  await saveEvidence(page, 'probe-after-restart');
});

test('S4 a numbers-only layout saved by an older version does not break the shell (AC-15)', async ({ page }) => {
  await gotoLayout(page, { hash: 'home' });
  await seedLayout(page, { home: { left: 240 } });
  await expect(page.getByTestId('module-host-home')).toBeVisible();
  await page.evaluate("location.hash = '#/probe'");
  await expect(page.getByTestId('module-host-probe')).toBeAttached();
  await expect.poll(() => panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
});
