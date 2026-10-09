import { expect, saveEvidence, test } from '../../support/test.ts';
import { SIDES, gotoLayout, PANEL_DEFAULTS, panelSize } from '../../support/layout.ts';

test.use({ viewport: { width: 1440, height: 900 } });

test('S1 a first visit shows the three panels at their default sizes with 4px gutters (AC-12)', async ({ page }) => {
  await gotoLayout(page);
  for (const side of SIDES) expect(await panelSize(page, side)).toBe(PANEL_DEFAULTS[side]);
  for (const side of SIDES) {
    const box = await page.getByTestId(`resizer-${side}`).boundingBox();
    expect(Math.round(side === 'bottom' ? (box?.height ?? 0) : (box?.width ?? 0))).toBe(4);
  }
  for (const side of SIDES) await expect(page.getByTestId(`topbar-toggle-${side}`)).toBeVisible();
  await saveEvidence(page, 'probe-defaults');
});

test('S1 a screen with only a left panel shows no other panel and no other toggle (AC-12)', async ({ page }) => {
  await gotoLayout(page, { hash: 'probe-alt' });
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
  await expect(page.getByTestId('panel-right')).toBeHidden();
  await expect(page.getByTestId('panel-bottom')).toBeHidden();
  await expect(page.getByTestId('topbar-toggle-left')).toBeVisible();
  await expect(page.getByTestId('topbar-toggle-right')).toHaveCount(0);
  await expect(page.getByTestId('topbar-toggle-bottom')).toHaveCount(0);
  await saveEvidence(page, 'probe-alt-left-only');
});

test('S1 a screen without panels shows no panel, no gutter and no toggle (AC-12)', async ({ page }) => {
  await gotoLayout(page, { hash: 'home' });
  for (const side of SIDES) {
    await expect(page.getByTestId(`panel-${side}`)).toBeHidden();
    await expect(page.getByTestId(`resizer-${side}`)).toBeHidden();
    await expect(page.getByTestId(`topbar-toggle-${side}`)).toHaveCount(0);
  }
  await saveEvidence(page, 'home-no-panels');
});
