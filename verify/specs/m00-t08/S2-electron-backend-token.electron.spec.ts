import { networkInterfaces } from 'node:os';
import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { readAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { fetchBackend } from '../../support/backend-http.ts';
import { listeningAddresses } from '../../support/processes.ts';
import { readPythonLog } from '../../support/python-log.ts';
import { readSettingsFile } from '../../support/settings-file.ts';
import { type Page } from '../../support/test.ts';

const TOKEN_PATTERN = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/;
const TOKEN_HEADER_PATTERN = /X-Session-Token\W{0,5}[A-Za-z0-9_-]{43}/i;

const backendPort = async (window: Page): Promise<number> => {
  await waitForBackend(window, 'ready');
  const status = await invokeBackendStatus(window);
  return status.value!.port!;
};

const nonLoopbackAddress = (): string | undefined =>
  Object.values(networkInterfaces())
    .flat()
    .find((info) => info?.family === 'IPv4' && !info.internal)?.address;

const expectUnauthorized = async (port: number, route: string, headers: Record<string, string> = {}): Promise<void> => {
  expect(await fetchBackend(port, route, headers)).toEqual({
    status: 401,
    body: { code: 'BACKEND_UNAUTHORIZED', message: 'Unauthorized' },
  });
};

test('S2a requests without a valid token get 401 and reach no handler (AC-27)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    const port = await backendPort(window);
    await expectUnauthorized(port, '/health');
    await expectUnauthorized(port, '/health', { 'X-Session-Token': 'wrong-token' });
    await expectUnauthorized(port, '/nope');
    expect(await fetchBackend(port, '/shutdown', {}, 'POST')).toMatchObject({ status: 401 });
    expect(await fetchBackend(port, '/health')).toMatchObject({ status: 401 });
    expect((await invokeBackendStatus(window)).value?.state).toBe('ready');
    await expect(window.getByTestId('root-backend-state')).toHaveText('ready');
    await saveEvidence(window, 'token-required');
  });
});

test('S2b the backend listens on loopback only (AC-27)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    const port = await backendPort(window);
    expect(listeningAddresses(port)).toEqual([`127.0.0.1:${port}`]);
    const address = nonLoopbackAddress();
    test.skip(!address, 'machine has no non-loopback IPv4 address');
    await expect(fetch(`http://${address}:${port}/health`)).rejects.toThrow();
  });
});

test('S2c the token is not written to any log or settings file (AC-27)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await backendPort(window);
    await fetchBackend((await invokeBackendStatus(window)).value!.port!, '/health');
    const files = [await readAppLog(appRoot), await readPythonLog(appRoot), (await readSettingsFile(appRoot)) ?? ''];
    for (const text of files) {
      expect(TOKEN_HEADER_PATTERN.test(text)).toBe(false);
      expect(TOKEN_PATTERN.test(text)).toBe(false);
    }
  });
});
