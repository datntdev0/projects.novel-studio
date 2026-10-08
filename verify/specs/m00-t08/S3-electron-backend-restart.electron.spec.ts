import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { type Page } from '../../support/test.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { killPid, isPidAlive } from '../../support/processes.ts';
import { setLook } from '../../support/shell.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';
import { expectHtml } from '../../support/theme.ts';

const servingEndpoint = async (window: Page): Promise<{ port: number; pid: number }> => {
  const { port, pid } = (await invokeBackendStatus(window)).value!;
  return { port: port!, pid: pid! };
};

test('S3 a killed backend restarts once, then fails with an error (AC-28)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    const first = await servingEndpoint(window);

    killPid(first.pid);
    await expectAppLog(appRoot, /backend exited[\s\S]*backend restarting[\s\S]*backend ready/);
    await waitForBackend(window, 'ready');
    expect((await invokeBackendStatus(window)).value?.restarts).toBe(1);
    const second = await servingEndpoint(window);
    expect(second.pid).not.toBe(first.pid);
    expect(second.port).not.toBe(first.port);
    expect(isPidAlive(first.pid)).toBe(false);
    await saveEvidence(window, 'restarted');

    killPid(second.pid);
    await waitForBackend(window, 'failed');
    expect((await invokeBackendStatus(window)).value?.error?.code).toBe('BACKEND_FAILED');
    await setLook(window, { language: 'vi' });
    await expectHtml(window, 'vi', 'dark');
    expect((await invokeBackendStatus(window)).value?.error?.code).toBe('BACKEND_FAILED');
    await setLook(window, { language: 'en' });
    await expectHtml(window, 'en', 'dark');
    expect((await invokeBackendStatus(window)).value?.error?.code).toBe('BACKEND_FAILED');
    expect(await invokeSettings(window, 'settings:get', null)).toMatchObject({ ok: true });
    await saveEvidence(window, 'failed');

    await expectAppLog(appRoot, /backend restart limit reached[\s\S]*backend failed BACKEND_FAILED exited/);
    await expect
      .poll(async () => (await readAppLog(appRoot)).split('backend restart limit reached')[1] ?? '')
      .not.toContain('backend starting');
    expect((await readAppLog(appRoot)).match(/backend starting/g)).toHaveLength(2);
  });
});
