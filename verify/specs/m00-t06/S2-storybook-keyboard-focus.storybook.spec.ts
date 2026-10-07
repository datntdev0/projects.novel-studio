import { test, expect, type Page } from '../../support/test.ts';
import { TAB_ORDER, SKIPPED_TABS, FOCUS_RGB, openKit, hasFocusRing, focusStyle } from '../../support/kit.ts';
import type { Theme } from '../../support/theme.ts';

type FocusGlobals = { document: { activeElement: { getAttribute(name: string): string | null } } };

const THEMES: Theme[] = ['dark', 'light'];

const focusedId = (page: Page): Promise<string | null> =>
  page.evaluate(() => (globalThis as unknown as FocusGlobals).document.activeElement.getAttribute('data-testid'));

const walkTabs = async (page: Page, theme: Theme): Promise<string[]> => {
  const [first = '', ...rest] = TAB_ORDER;
  await page.getByTestId(first).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const visited: string[] = [];
  for (const expected of [first, ...rest]) {
    await expect.poll(() => focusedId(page)).toBe(expected);
    expect(await hasFocusRing(page), `focus ring on ${expected}`).toBe(true);
    expect((await focusStyle(page)).token).toBe(FOCUS_RGB[theme]);
    visited.push(expected);
    await page.keyboard.press('Tab');
  }
  return visited;
};

for (const theme of THEMES) {
  test(`S2 storybook keyboard Tab order and focus ring in ${theme} (AC-17)`, async ({ page }) => {
    await openKit(page, theme);
    expect(await walkTabs(page, theme)).toEqual(TAB_ORDER);
    const next = await focusedId(page);
    expect(SKIPPED_TABS).not.toContain(next);
    expect(TAB_ORDER).not.toContain(next);
  });
}
