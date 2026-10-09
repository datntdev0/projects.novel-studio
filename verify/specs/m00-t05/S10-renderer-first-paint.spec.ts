import { test, expect } from '../../support/test.ts';
import { expectHtml, SETTINGS_KEY, type Theme } from '../../support/theme.ts';
import { htmlWrites, recordHtmlWrites, type HtmlWrite } from '../../support/appearance.ts';
import { storedSettings } from '../../support/first-paint.ts';

type StorageGlobals = { localStorage: { setItem(key: string, value: string): void } };

const cases: { language: 'en' | 'vi'; theme: Theme; forbidden: HtmlWrite[] }[] = [
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
  await recordHtmlWrites(page);
  for (const { language, theme, forbidden } of cases) {
    await page.evaluate(([key, value]) => (globalThis as unknown as StorageGlobals).localStorage.setItem(key, value), [
      SETTINGS_KEY,
      storedSettings(language, theme),
    ] as const);
    await page.reload();
    await expectHtml(page, language, theme);
    const writes = await htmlWrites(page);
    expect(writes.length).toBeGreaterThan(0);
    for (const bad of forbidden) expect(writes).not.toContainEqual(bad);
  }
});
