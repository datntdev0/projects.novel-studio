import { test as base, expect } from '../../support/electron.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';
import { expectRootLanguage } from '../../support/i18n-texts.ts';

const validText = settingsText({ language: 'vi' });
const invalidRequests: unknown[] = [{ language: 'fr' }, { backendPid: 1 }, { libraryPath: 'x' }, { version: 2 }, 'x'];
const invalid = { ok: false, error: { code: 'IPC_INVALID_REQUEST', message: expect.any(String) } };

const test = base.extend<{ appRoot: string }>({
  appRoot: async ({ appRoot }, use) => {
    await writeSettingsFile(appRoot, validText);
    await use(appRoot);
  },
});

test('S8 settings channels reject bad requests and expose only invoke and on (AC-21)', async ({ window, appRoot }) => {
  await expectRootLanguage(window, 'vi');

  for (const req of invalidRequests) {
    expect(await invokeSettings(window, 'settings:set', req)).toEqual(invalid);
  }
  const undefinedResult = await window.evaluate(() =>
    (globalThis as unknown as RendererGlobals).novelStudio.invoke('settings:set', { language: undefined }),
  );
  expect(undefinedResult).toEqual(invalid);
  await expectAppLog(appRoot, /backend ready/);
  expect({ ...(await readSettingsJson(appRoot)), backendPid: null }).toEqual(JSON.parse(validText));
  await expectAppLog(appRoot, /\[warn\]\s+ipc settings:set IPC_INVALID_REQUEST/);

  expect(await invokeSettings(window, 'settings:get', { x: 1 })).toEqual(invalid);
  expect(await invokeSettings(window, 'settings:initial')).toEqual({
    ok: false,
    error: { code: 'IPC_UNKNOWN_CHANNEL', message: expect.any(String) },
  });
  expect(await window.evaluate(() => Object.keys((globalThis as unknown as { novelStudio: object }).novelStudio).sort())).toEqual([
    'invoke',
    'on',
  ]);
});
