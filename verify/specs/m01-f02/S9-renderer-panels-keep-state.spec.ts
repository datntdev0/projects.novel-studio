import { expect, saveEvidence, test, type Page } from '../../support/test.ts';
import { markWindow, windowKept } from '../../support/appearance.ts';
import { SIDES, KEYS, dragGutter, gotoLayout } from '../../support/layout.ts';

const TYPED = 'draft text';
const SCROLL_TOP = 400;

const scrollTop = (page: Page): Promise<number> => page.getByTestId('workspace').evaluate((element) => Math.round(element.scrollTop));

const expectKept = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('probe-input')).toHaveValue(TYPED);
  expect(await scrollTop(page)).toBe(SCROLL_TOP);
  expect(await windowKept(page)).toBe(true);
  await expect(page.getByTestId('module-host-probe')).toHaveAttribute('data-kept', 'yes');
};

test.use({ viewport: { width: 1440, height: 900 } });

test('S9 resizing, collapsing and restoring panels keep the workspace state (AC-20)', async ({ page }) => {
  await gotoLayout(page);
  await page.getByTestId('probe-input').fill(TYPED);
  await page.getByTestId('workspace').evaluate((element, top) => element.scrollTo(0, top), SCROLL_TOP);
  await expect.poll(() => scrollTop(page)).toBe(SCROLL_TOP);
  await markWindow(page);
  await page.getByTestId('module-host-probe').evaluate((element) => element.setAttribute('data-kept', 'yes'));

  for (const side of SIDES) {
    await dragGutter(page, side, 40);
    await expectKept(page);
    await page.getByTestId(`topbar-toggle-${side}`).click();
    await expect(page.getByTestId(`panel-${side}`)).toBeHidden();
    await expectKept(page);
    await page.keyboard.press(KEYS[side]);
    await expect(page.getByTestId(`panel-${side}`)).toBeVisible();
    await expectKept(page);
    await page.getByTestId(`probe-collapse-${side}`).click();
    await expect(page.getByTestId(`panel-${side}`)).toBeHidden();
    await page.getByTestId(`topbar-toggle-${side}`).click();
    await expectKept(page);
  }
  await saveEvidence(page, 'state-kept');
});
