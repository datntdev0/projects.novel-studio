import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { fetchBackend } from '../../support/backend-http.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { expectPythonLog, readPythonLog } from '../../support/python-log.ts';

const ERROR_THEN_TRACEBACK = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3} ERROR[^\n]*\n(?:[^\n]*\n)*?Traceback[\s\S]*RuntimeError: test raise/m;

test('S7a a backend exception is logged in python.log only and the backend stays up (AC-41)', async ({ appRoot }) => {
  await withApp(
    appRoot,
    async (app) => {
      const window = await app.firstWindow();
      await waitForBackend(window, 'ready');
      await expectAppLog(appRoot, /backend error INTERNAL/);
      await expectPythonLog(appRoot, ERROR_THEN_TRACEBACK);
      const appLog = await readAppLog(appRoot);
      expect(appLog).not.toContain('Traceback');
      expect(appLog).not.toContain('test raise');
      await waitForBackend(window, 'ready');
      const { port } = (await invokeBackendStatus(window)).value!;
      expect(await fetchBackend(port!, '/health')).toMatchObject({ status: 401 });
      await saveEvidence(window, 'raise-ready');
    },
    { env: { NS_TEST_BACKEND_RAISE: '1' } },
  );
});

test('S7b without the fault flag python.log has no traceback (AC-41)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    expect(await readPythonLog(appRoot)).not.toContain('Traceback');
    expect(await readAppLog(appRoot)).not.toContain('backend error');
  });
});
