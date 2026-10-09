import { expect, test } from '../../support/test.ts';
import { expectHtml, SETTINGS_KEY } from '../../support/theme.ts';
import { expectLook, htmlWrites, recordHtmlWrites, toggleLanguage, toggleTheme, gotoProbe } from '../../support/appearance.ts';

type StorageGlobals = { localStorage: { getItem(key: string): string | null } };

test('S4 renderer keeps the chosen language and theme after a restart from the first frame (AC-24)', async ({ page }) => {
  await gotoProbe(page);
  await expectLook(page, 'en', 'dark');
  await toggleLanguage(page);
  await toggleTheme(page);
  await expectLook(page, 'vi', 'light');

  await recordHtmlWrites(page);
  await page.reload();
  await expectLook(page, 'vi', 'light');

  const writes = await htmlWrites(page);
  expect(writes.length).toBeGreaterThan(0);
  for (const bad of [
    { name: 'data-theme', value: 'dark' },
    { name: 'lang', value: 'en' },
  ])
    expect(writes).not.toContainEqual(bad);

  const stored = await page.evaluate((key) => (globalThis as unknown as StorageGlobals).localStorage.getItem(key), SETTINGS_KEY);
  expect(JSON.parse(stored ?? '')).toMatchObject({ language: 'vi', theme: 'light' });
  await expectHtml(page, 'vi', 'light');
});
