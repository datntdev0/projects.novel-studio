import { test, expect } from '../../support/test.ts';
import { expectHtml, SETTINGS_KEY, type Theme } from '../../support/theme.ts';
import { storedSettings } from '../../support/first-paint.ts';

type Write = { name: string; value: string };
type Mutation = { attributeName: string; target: { getAttribute(name: string): string } };
type PaintGlobals = {
  __writes: Write[];
  localStorage: { setItem(key: string, value: string): void };
  document: unknown;
  MutationObserver: new (callback: (records: Mutation[]) => void) => { observe(target: unknown, options: object): void };
};

const cases: { language: 'en' | 'vi'; theme: Theme; forbidden: Write[] }[] = [
  {
    language: 'vi',
    theme: 'light',
    forbidden: [
      { name: 'data-theme', value: 'dark' },
      { name: 'lang', value: 'en' },
    ],
  },
  {
    language: 'en',
    theme: 'dark',
    forbidden: [
      { name: 'data-theme', value: 'light' },
      { name: 'lang', value: 'vi' },
    ],
  },
];

test('S10 renderer never writes the default language or theme over stored settings (AC-39)', async ({ page }) => {
  await page.goto('/');
  await page.addInitScript(() => {
    const g = globalThis as unknown as PaintGlobals;
    g.__writes = [];
    const record = (r: Mutation): number => g.__writes.push({ name: r.attributeName, value: r.target.getAttribute(r.attributeName) });
    new g.MutationObserver((records) => records.forEach(record)).observe(g.document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['lang', 'data-theme'],
    });
  });
  for (const { language, theme, forbidden } of cases) {
    await page.evaluate(([key, value]) => (globalThis as unknown as PaintGlobals).localStorage.setItem(key, value), [
      SETTINGS_KEY,
      storedSettings(language, theme),
    ] as const);
    await page.reload();
    await expectHtml(page, language, theme);
    const writes = await page.evaluate(() => (globalThis as unknown as PaintGlobals).__writes);
    expect(writes.length).toBeGreaterThan(0);
    for (const bad of forbidden) expect(writes).not.toContainEqual(bad);
  }
});
