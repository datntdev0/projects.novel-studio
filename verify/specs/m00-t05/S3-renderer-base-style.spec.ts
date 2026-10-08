import { test, expect, saveEvidence, type Page } from '../../support/test.ts';
import { gotoFoundation } from '../../support/shell.ts';
import { BACKGROUND_RGB, bodyStyle, computedVars, expectHtml, testIdFamily, type Theme } from '../../support/theme.ts';

type Style = {
  backgroundColor: string;
  fontSize: string;
  fontFamily: string;
  outlineWidth: string;
  outlineStyle: string;
  outlineColor: string;
  color: string;
  getPropertyValue(name: string): string;
};
type StyleGlobals = {
  document: {
    body: { appendChild(node: unknown): void };
    createElement(tag: string): { style: { color: string }; remove(): void };
    querySelector(selector: string): unknown;
  };
  getComputedStyle(element: unknown): Style;
};

const themes: Theme[] = ['dark', 'light'];

const focusedOutline = (page: Page): Promise<{ width: string; style: string; color: string; expected: string }> =>
  page.evaluate(() => {
    const { document, getComputedStyle } = globalThis as unknown as StyleGlobals;
    const outline = getComputedStyle(document.querySelector('[data-testid="root-set-language-en"]'));
    const probe = document.createElement('div');
    probe.style.color = getComputedStyle(document.body).getPropertyValue('--color-focus');
    document.body.appendChild(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return { width: outline.outlineWidth, style: outline.outlineStyle, color: outline.outlineColor, expected };
  });

test('S3 renderer applies the base style and Bootstrap mapping in both themes (AC-14, AC-15)', async ({ page }) => {
  await gotoFoundation(page);
  await expectHtml(page, 'en', 'dark');
  const target = page.getByTestId('root-set-language-en');
  for (let i = 0; i < 30 && !(await target.evaluate((el) => el.matches(':focus'))); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
  const outline = await focusedOutline(page);
  expect(outline.width).toBe('2px');
  expect(outline.style).toBe('solid');
  expect(outline.color).toBe(outline.expected);
  const stable: Record<string, string>[] = [];
  for (const theme of themes) {
    await page.getByTestId(`root-set-theme-${theme}`).click();
    await expectHtml(page, 'en', theme);
    const body = await bodyStyle(page);
    expect(body.background).toBe(BACKGROUND_RGB[theme]);
    expect(body.fontSize).toBe('13px');
    expect(body.fontFamily.startsWith('Inter')).toBe(true);
    const vars = await computedVars(page, [
      '--bs-body-bg',
      '--color-background',
      '--bs-body-color',
      '--color-text',
      '--sp-md',
      '--color-primary',
    ]);
    expect(vars['--bs-body-bg']).toBe(vars['--color-background']);
    expect(vars['--bs-body-color']).toBe(vars['--color-text']);
    expect(vars['--sp-md']).toBe('12px');
    expect(vars['--color-primary']).toBe('#3ecf8e');
    stable.push({ '--sp-md': vars['--sp-md'] ?? '', '--color-primary': vars['--color-primary'] ?? '' });
    expect((await testIdFamily(page, 'root-sample-serif')).startsWith('Source Serif 4')).toBe(true);
    await saveEvidence(page, theme);
  }
  expect(stable[0]).toEqual(stable[1]);
});
