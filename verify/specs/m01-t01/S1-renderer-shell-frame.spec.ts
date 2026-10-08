import { test, expect, saveEvidence } from '../../support/test.ts';
import { gotoShell } from '../../support/shell.ts';

const REGIONS = ['app-shell', 'topbar', 'rail', 'panel-left', 'workspace', 'panel-right', 'panel-bottom', 'statusbar'];
const PANELS = ['panel-left', 'panel-right', 'panel-bottom'];
const VISIBLE = ['app-shell', 'topbar', 'rail', 'workspace', 'statusbar'];
const SIZES = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
];

test('S1 renderer opens in the shell frame with every named region at both window sizes (AC-57)', async ({ page }) => {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await gotoShell(page, { fixture: 'none', hash: 'home' });
    for (const id of REGIONS) await expect(page.getByTestId(id)).toBeAttached();
    for (const id of VISIBLE) await expect(page.getByTestId(id)).toBeVisible();
    await expect(page.getByTestId('workspace').getByTestId('module-host-home')).toBeAttached();
    const overflow = await page.locator('html').evaluate((html) => html.scrollWidth - html.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await saveEvidence(page, `${size.width}x${size.height}`);
  }

  await gotoShell(page, { fixture: 'none', probe: true, hash: 'probe' });
  for (const id of PANELS) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  }
  await saveEvidence(page, 'probe-panels');
});
