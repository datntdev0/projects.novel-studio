import { access } from 'node:fs/promises';
import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { setLook } from '../../support/shell.ts';
import { expectHtml } from '../../support/theme.ts';
import { pythonLogPath } from '../../support/python-log.ts';

test('S1a window shows starting, language switches, then ready (AC-26)', async ({ appRoot }) => {
  await withApp(
    appRoot,
    async (app) => {
      const window = await app.firstWindow();
      await waitForBackend(window, 'starting', 10_000);
      await saveEvidence(window, 'backend-starting');
      await setLook(window, { language: 'vi' });
      await expectHtml(window, 'vi', 'dark');
      expect((await invokeBackendStatus(window)).value?.state).toBe('starting');
      await waitForBackend(window, 'ready');
      expect((await invokeBackendStatus(window)).value?.restarts).toBe(0);
      await saveEvidence(window, 'backend-ready');
      await expectAppLog(appRoot, /backend starting[\s\S]*backend ready/);
      await access(pythonLogPath(appRoot));
    },
    { env: { NS_TEST_BACKEND_START_DELAY_MS: '8000' } },
  );
});

test('S1b a run without the delay also reaches ready (AC-26)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    expect((await invokeBackendStatus(window)).value?.restarts).toBe(0);
    expect(await readAppLog(appRoot)).toContain('backend ready');
    await access(pythonLogPath(appRoot));
    await saveEvidence(window, 'backend-ready-no-delay');
  });
});
