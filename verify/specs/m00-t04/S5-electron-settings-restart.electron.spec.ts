import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { expectRootLanguage } from '../../support/i18n-texts.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { readSettingsFile, readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';

const changes = {
  language: 'vi',
  theme: 'light',
  windowBounds: { x: 10, y: 20, width: 1300, height: 800, maximized: false },
  layout: { home: { left: 240 } },
};

test('S5 settings survive an app restart (AC-21)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    const result = await invokeSettings(window, 'settings:set', changes);
    expect(result).toEqual({ ok: true, value: JSON.parse(settingsText(changes)) });
  });
  const text = await readSettingsFile(appRoot);
  expect(text).toBe(settingsText(changes));

  await writeSettingsFile(appRoot, JSON.stringify({ ...(await readSettingsJson(appRoot)), futureKey: 42 }));
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    expect(await invokeSettings(window, 'settings:get', null)).toMatchObject({ ok: true, value: changes });
    await expectRootLanguage(window, 'vi');
    await expect(window.getByTestId('root-app-theme')).toHaveText('light');
    await saveEvidence(window, 'restarted');
    expect(await invokeSettings(window, 'settings:set', { theme: 'dark' })).toMatchObject({ ok: true });
  });
  expect(await readSettingsJson(appRoot)).toMatchObject({ futureKey: 42, theme: 'dark', language: 'vi' });
});
