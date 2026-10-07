import { test, expect, saveEvidence, type Page } from '../../support/test.ts';
import { KIT_SECTIONS, KIT_DEMOS, sectionId, openKit } from '../../support/kit.ts';
import type { Theme } from '../../support/theme.ts';

type ScrollGlobals = { document: { documentElement: { scrollWidth: number; clientWidth: number } } };

const THEMES: Theme[] = ['dark', 'light'];

const expectNoHorizontalScroll = async (page: Page): Promise<void> => {
  const overflow = await page.evaluate(() => {
    const { scrollWidth, clientWidth } = (globalThis as unknown as ScrollGlobals).document.documentElement;
    return scrollWidth - clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
};

const expectSectionsInOrder = async (page: Page): Promise<void> => {
  let previousTop = -1;
  for (const name of KIT_SECTIONS) {
    const section = page.getByTestId(sectionId(name));
    await expect(section).toBeVisible();
    const box = await section.boundingBox();
    expect(box?.y ?? -1).toBeGreaterThan(previousTop);
    previousTop = box?.y ?? -1;
    for (const demo of KIT_DEMOS[name]) {
      await expect(section.getByTestId(demo).first()).toBeAttached();
    }
  }
};

for (const theme of THEMES) {
  test(`S1 renderer kit page shows every section and demo in ${theme} (AC-16)`, async ({ page }) => {
    await openKit(page, theme);
    await expectSectionsInOrder(page);
    await expectNoHorizontalScroll(page);
    await saveEvidence(page, theme, { fullPage: true });
  });
}
