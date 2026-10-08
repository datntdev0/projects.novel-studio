import { existsSync } from 'node:fs';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';
import { readSettingsJson, settingsText, settingsTmpPath, writeSettingsFile } from '../../support/settings-file.ts';
import { expectHtml } from '../../support/theme.ts';

const ROUNDS = 5;
const SETS_PER_ROUND = 30;
const validText = settingsText({ language: 'vi' });

test('S7a leftover tmp file is ignored and the next save leaves no tmp (AC-21)', async ({ appRoot }) => {
  await writeSettingsFile(appRoot, validText);
  await writeFile(settingsTmpPath(appRoot), '{"version":1,"language":"fr', 'utf8');

  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expect(window.getByTestId('app-shell')).toBeVisible();
    await expectHtml(window, 'vi', 'dark');
    expect(await invokeSettings(window, 'settings:set', { theme: 'light' })).toMatchObject({
      ok: true,
      value: { language: 'vi', theme: 'light' },
    });
    expect(await readSettingsJson(appRoot)).toMatchObject({ version: 1, language: 'vi', theme: 'light' });
    await saveEvidence(window, 'tmp-ignored');
  });
  expect(existsSync(settingsTmpPath(appRoot))).toBe(false);
});

test('S7b a kill during saves never leaves an empty or partial file (AC-21)', async ({ appRoot }) => {
  await writeSettingsFile(appRoot, validText);
  for (let round = 0; round < ROUNDS; round++) {
    await withApp(appRoot, async (app) => {
      const window = await app.firstWindow();
      await expect(window.getByTestId('app-shell')).toBeVisible();
      await window.evaluate((count) => {
        const { invoke } = (globalThis as unknown as RendererGlobals).novelStudio;
        for (let i = 0; i < count; i++) void invoke('settings:set', { language: i % 2 === 0 ? 'vi' : 'en' });
      }, SETS_PER_ROUND);
      const child = app.process();
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    });
    const settings = await readSettingsJson(appRoot);
    expect(settings.version).toBe(1);
    expect(['en', 'vi']).toContain(settings.language);
  }

  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expect(window.getByTestId('app-shell')).toBeVisible();
    await saveEvidence(window, 'after-kills');
  });
});
