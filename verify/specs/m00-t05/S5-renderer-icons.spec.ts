import { test, expect, saveEvidence, type Page } from '../../support/test.ts';
import { bodyStyle, expectHtml, expectIconBoxes, ICON_SIZES, LOOK_TEXTS, spriteIds, spriteState, testIdColor, type Theme } from '../../support/theme.ts';

type IconNode = { getAttribute(name: string): string | null; querySelector(selector: string): IconNode };
type IconGlobals = { document: { querySelector(selector: string): IconNode } };

const themes: Theme[] = ['dark', 'light'];

const iconAttributes = (page: Page, testId: string): Promise<{ hidden: string | null; href: string | null }> =>
  page.evaluate((id) => {
    const { document } = globalThis as unknown as IconGlobals;
    const host = document.querySelector(`[data-testid="${id}"]`);
    const use = host.querySelector('use');
    return { hidden: host.getAttribute('aria-hidden'), href: use.getAttribute('href') ?? use.getAttribute('xlink:href') };
  }, testId);

test('S5 renderer shows the 92-symbol sprite and the four icon sizes (AC-14)', async ({ page }) => {
  await page.goto('/');
  await expectHtml(page, 'en', 'dark');
  const found = await spriteState(page);
  expect(found.copies).toBe(1);
  expect(found.count).toBe(92);
  expect(found.ids).toEqual(await spriteIds());
  await expectIconBoxes(page);
  for (const testId of Object.keys(ICON_SIZES)) {
    expect(await iconAttributes(page, testId)).toEqual({ hidden: 'true', href: '#i-search' });
  }
  for (const theme of themes) {
    await page.getByTestId(`root-set-theme-${theme}`).click();
    await expectHtml(page, 'en', theme);
    for (const testId of Object.keys(ICON_SIZES)) {
      expect(await testIdColor(page, testId)).toBe((await bodyStyle(page)).color);
    }
    await saveEvidence(page, theme);
  }
  await expect(page.getByTestId('root-label-look')).toHaveText(LOOK_TEXTS.en['root-label-look']);
  await page.getByTestId('root-set-language-vi').click();
  await expect(page.getByTestId('root-label-look')).toHaveText(LOOK_TEXTS.vi['root-label-look']);
});
