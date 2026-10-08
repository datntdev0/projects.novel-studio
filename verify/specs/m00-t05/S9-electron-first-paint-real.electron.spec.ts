import type { ElectronApplication } from '@playwright/test';
import { test, expect, withApp } from '../../support/electron.ts';
import { storedSettings } from '../../support/first-paint.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { readSettingsJson, writeSettingsFile } from '../../support/settings-file.ts';
import { setLook } from '../../support/shell.ts';
import { BACKGROUND_HEX, BACKGROUND_RGB, bodyBackground, expectHtml, htmlState, readHtml, printTokens, type Theme } from '../../support/theme.ts';
import type { Page } from '../../support/test.ts';

type Language = 'en' | 'vi';
type PageGlobals = { novelStudio: object };

const windowColor = (app: ElectronApplication): Promise<string> =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.getBackgroundColor());

const bridgeKeys = (window: Page): Promise<string[]> =>
  window.evaluate(() => Object.keys((globalThis as unknown as PageGlobals).novelStudio).sort());

async function expectFirstPaint(app: ElectronApplication, language: Language, theme: Theme): Promise<Page> {
  const window = await app.firstWindow();
  await window.waitForLoadState('load');
  expect(await readHtml(window)).toEqual(htmlState(language, theme));
  expect(await bodyBackground(window)).toBe(BACKGROUND_RGB[theme]);
  const color = (await windowColor(app)).toLowerCase();
  expect(color).toBe(BACKGROUND_HEX[theme]);
  expect(color).toBe((await printTokens())[theme]['--color-background']?.toLowerCase());
  return window;
}

const pairs: [Language, Theme][] = [
  ['vi', 'light'],
  ['en', 'dark'],
];

for (const [language, theme] of pairs) {
  test(`S9 real first paint ${language} ${theme} and after restart (AC-39)`, async ({ appRoot }) => {
    const nextLanguage: Language = language === 'vi' ? 'en' : 'vi';
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    await writeSettingsFile(appRoot, storedSettings(language, theme));

    await withApp(appRoot, async (app) => {
      const window = await expectFirstPaint(app, language, theme);
      expect(await bridgeKeys(window)).toEqual(['invoke', 'on']);
      expect(await invokeSettings(window, 'settings:initial')).toMatchObject({ ok: false, error: { code: 'IPC_UNKNOWN_CHANNEL' } });
      await setLook(window, { language: nextLanguage, theme: nextTheme });
      await expectHtml(window, nextLanguage, nextTheme);
      await expect.poll(async () => await readSettingsJson(appRoot)).toMatchObject({ language: nextLanguage, theme: nextTheme });
    });

    await withApp(appRoot, async (app) => {
      await expectFirstPaint(app, nextLanguage, nextTheme);
    });
  });
}
