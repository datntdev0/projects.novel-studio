import { test, expect } from '../../support/electron.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';

type WebContentsPrefs = { getLastWebPreferences(): { contextIsolation: boolean; nodeIntegration: boolean; sandbox: boolean } };

test('S4 renderer is isolated and exposes only the bridge (AC-9)', async ({ app, window }) => {
  await expect(window.getByTestId('app-shell')).toBeVisible();
  const globals = await window.evaluate(() => [typeof require, typeof process, typeof module]);
  expect(globals).toEqual(['undefined', 'undefined', 'undefined']);
  const members = await window.evaluate(() => Object.keys((globalThis as unknown as RendererGlobals).dreamerStudio).sort());
  expect(members).toEqual(['invoke', 'on']);
  const unknown = await window.evaluate(() => (globalThis as unknown as RendererGlobals).dreamerStudio.invoke('nope:channel'));
  expect(unknown.ok).toBe(false);
  expect(unknown.error.code).toBe('IPC_UNKNOWN_CHANNEL');
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const [first] = BrowserWindow.getAllWindows();
    const { contextIsolation, nodeIntegration, sandbox } = (first?.webContents as unknown as WebContentsPrefs).getLastWebPreferences();
    return { contextIsolation, nodeIntegration, sandbox };
  });
  expect(prefs).toEqual({ contextIsolation: true, nodeIntegration: false, sandbox: true });
});
