import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { expectHtml } from '../../support/theme.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';

const withoutVolatile = (settings: Record<string, unknown>) => ({ ...settings, backendPid: null, windowBounds: null });

const changes = { language: 'vi', theme: 'light', layout: { home: { left: 240 } } };

test('S5 settings survive an app restart (AC-21)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expectAppLog(appRoot, /backend ready/);
    const result = await invokeSettings(window, 'settings:set', changes);
    expect(result).toMatchObject({ ok: true, value: changes });
  });
  expect(withoutVolatile(await readSettingsJson(appRoot))).toEqual(JSON.parse(settingsText(changes)));

  await writeSettingsFile(appRoot, JSON.stringify({ ...(await readSettingsJson(appRoot)), futureKey: 42 }));
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    expect(await invokeSettings(window, 'settings:get', null)).toMatchObject({ ok: true, value: changes });
    await expect(window.getByTestId('app-shell')).toBeVisible();
    await expectHtml(window, 'vi', 'light');
    await saveEvidence(window, 'restarted');
    expect(await invokeSettings(window, 'settings:set', { theme: 'dark' })).toMatchObject({ ok: true });
  });
  expect(await readSettingsJson(appRoot)).toMatchObject({ futureKey: 42, theme: 'dark', language: 'vi' });
});
