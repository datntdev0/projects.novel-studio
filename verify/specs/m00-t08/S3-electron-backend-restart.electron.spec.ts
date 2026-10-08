import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { type Page } from '../../support/test.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { killPid, isPidAlive } from '../../support/processes.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';

const EN_ERROR = 'The background service failed to start.';
const VI_ERROR = 'Dịch vụ nền không khởi động được.';

const servingEndpoint = async (window: Page): Promise<{ port: number; pid: number }> => {
  const { port, pid } = (await invokeBackendStatus(window)).value!;
  return { port: port!, pid: pid! };
};

test('S3 a killed backend restarts once, then fails with a localized error (AC-28)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    const first = await servingEndpoint(window);

    killPid(first.pid);
    await expectAppLog(appRoot, /backend exited[\s\S]*backend restarting[\s\S]*backend ready/);
    await expect(window.getByTestId('root-backend-restarts')).toHaveText('1');
    await waitForBackend(window, 'ready');
    const second = await servingEndpoint(window);
    expect(second.pid).not.toBe(first.pid);
    expect(second.port).not.toBe(first.port);
    expect(isPidAlive(first.pid)).toBe(false);
    await saveEvidence(window, 'restarted');

    killPid(second.pid);
    await waitForBackend(window, 'failed');
    await expect(window.getByTestId('root-backend-error-code')).toHaveText('BACKEND_FAILED');
    await expect(window.getByTestId('root-backend-error-text')).toHaveText(EN_ERROR);
    await window.getByTestId('root-set-language-vi').click();
    await expect(window.getByTestId('root-backend-error-text')).toHaveText(VI_ERROR);
    await window.getByTestId('root-set-language-en').click();
    await expect(window.getByTestId('root-backend-error-text')).toHaveText(EN_ERROR);
    await expect(window.getByTestId('root-app-language')).toHaveText('en');
    expect(await invokeSettings(window, 'settings:get', null)).toMatchObject({ ok: true });
    await saveEvidence(window, 'failed');

    await expectAppLog(appRoot, /backend restart limit reached[\s\S]*backend failed BACKEND_FAILED exited/);
    await expect
      .poll(async () => (await readAppLog(appRoot)).split('backend restart limit reached')[1] ?? '')
      .not.toContain('backend starting');
    expect((await readAppLog(appRoot)).match(/backend starting/g)).toHaveLength(2);
  });
});
