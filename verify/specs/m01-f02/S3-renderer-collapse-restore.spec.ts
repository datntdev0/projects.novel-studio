import { expect, saveEvidence, test, type Page } from '../../support/test.ts';
import { openPalette } from '../../support/palette.ts';
import { appearanceText } from '../../support/appearance.ts';
import { SIDES, KEYS, dragGutter, gotoLayout, panelSize, type Side } from '../../support/layout.ts';

const toggleFromTopBar = (page: Page, side: Side): Promise<void> => page.getByTestId(`topbar-toggle-${side}`).click();
const PATHS: Record<string, { collapse: (page: Page, side: Side) => Promise<void>; restore: (page: Page, side: Side) => Promise<void> }> = {
  'panel header button': { collapse: (page, side) => page.getByTestId(`probe-collapse-${side}`).click(), restore: toggleFromTopBar },
  'top bar toggle': { collapse: toggleFromTopBar, restore: toggleFromTopBar },
  'keyboard shortcut': {
    collapse: (page, side) => page.keyboard.press(KEYS[side]),
    restore: (page, side) => page.keyboard.press(KEYS[side]),
  },
};

test.use({ viewport: { width: 1440, height: 900 } });

for (const side of SIDES) {
  for (const [name, { collapse, restore }] of Object.entries(PATHS)) {
    test(`S3 the ${name} collapses the ${side} panel and restores it at its dragged size (AC-14)`, async ({ page }) => {
      await gotoLayout(page);
      await dragGutter(page, side, 30);
      const dragged = await panelSize(page, side);
      const toggle = page.getByTestId(`topbar-toggle-${side}`);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');

      await collapse(page, side);
      await expect(page.getByTestId(`panel-${side}`)).toBeHidden();
      await expect(page.getByTestId(`resizer-${side}`)).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await saveEvidence(page, `${side}-collapsed-${name.replaceAll(' ', '-')}`);

      await restore(page, side);
      await expect(page.getByTestId(`panel-${side}`)).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => panelSize(page, side)).toBe(dragged);
    });
  }
}

test('S3 the palette command Toggle left panel collapses and restores the left panel (AC-14)', async ({ page }) => {
  await gotoLayout(page);
  const title = appearanceText('en', 'command.toggleLeft');
  await openPalette(page);
  await page.getByTestId('palette-input').fill(title);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('palette')).toBeHidden();
  await expect(page.getByTestId('panel-left')).toBeHidden();

  await openPalette(page);
  await page.getByTestId('palette-input').fill(title);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('panel-left')).toBeVisible();
});
