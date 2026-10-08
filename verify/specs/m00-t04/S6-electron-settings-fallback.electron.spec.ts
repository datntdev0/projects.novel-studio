import { test, expect, withApp } from '../../support/electron.ts';
import { expectHtml } from '../../support/theme.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';

const languageOnlyInvalid = settingsText({ language: 'fr', theme: 'light' });

const cases = [
  { reason: 'missing', text: null, theme: 'dark' },
  { reason: 'empty', text: '  \n', theme: 'dark' },
  { reason: 'not-json', text: '{oops', theme: 'dark' },
  { reason: 'not-object', text: '[1]', theme: 'dark' },
  { reason: 'fields:language', text: languageOnlyInvalid, theme: 'light' },
] as const;

for (const { reason, text, theme } of cases) {
  test(`S6 settings fallback ${reason} starts with defaults and recovers on change (AC-21)`, async ({ appRoot }) => {
    if (text !== null) await writeSettingsFile(appRoot, text);
    await withApp(appRoot, async (app) => {
      const window = await app.firstWindow();
      await expect(window.getByTestId('app-shell')).toBeVisible();
      await expectHtml(window, 'en', theme);
      await expectAppLog(appRoot, new RegExp(`settings fallback ${reason} .*app-settings\\.json`));
      await expectAppLog(appRoot, /backend ready/);
      expect(await readSettingsJson(appRoot)).toMatchObject({ language: 'en', theme });
      expect(await invokeSettings(window, 'settings:set', { language: 'vi' })).toMatchObject({ ok: true });
      expect(await readSettingsJson(appRoot)).toMatchObject({ version: 1, language: 'vi' });
    });
  });
}
