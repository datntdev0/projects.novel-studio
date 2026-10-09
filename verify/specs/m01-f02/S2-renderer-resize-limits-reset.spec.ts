import { expect, saveEvidence, test } from '../../support/test.ts';
import { SIDES, dragGutter, gotoLayout, PANEL_DEFAULTS, PANEL_LIMITS, panelSize } from '../../support/layout.ts';

test.use({ viewport: { width: 1440, height: 900 } });

for (const side of SIDES) {
  test(`S2 dragging the ${side} gutter stops at its limits (AC-13)`, async ({ page }) => {
    await gotoLayout(page);
    await dragGutter(page, side, 400);
    expect(await panelSize(page, side)).toBe(PANEL_LIMITS[side].max);
    await dragGutter(page, side, -800);
    expect(await panelSize(page, side)).toBe(PANEL_LIMITS[side].min);
    await saveEvidence(page, `${side}-at-min`);
  });
}

test('S2 double-clicking a gutter resets only that panel and a dragged size survives a restart (AC-13)', async ({ page }) => {
  await gotoLayout(page);
  await dragGutter(page, 'left', 28);
  await dragGutter(page, 'right', 96);
  expect(await panelSize(page, 'left')).toBe(300);
  expect(await panelSize(page, 'right')).toBe(400);

  await page.getByTestId('resizer-left').dblclick();
  await expect.poll(() => panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
  expect(await panelSize(page, 'right')).toBe(400);

  await page.reload();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  expect(await panelSize(page, 'left')).toBe(PANEL_DEFAULTS.left);
  expect(await panelSize(page, 'right')).toBe(400);
  await saveEvidence(page, 'after-reset-and-reload');
});
