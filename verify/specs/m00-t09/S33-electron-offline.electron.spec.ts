import { test, expect, saveEvidence } from '../../support/packaged-app.ts';
import { waitForPackagedReady } from '../../support/ffmpeg-state.ts';
import { readAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus } from '../../support/backend-bridge.ts';
import { mainPid, remoteAddresses, treePids } from '../../support/processes.ts';

const localProtocols = ['file:', 'devtools:', 'data:', 'blob:'];

const isLocalRequest = (url: string): boolean => {
  const parsed = new URL(url);
  return localProtocols.includes(parsed.protocol) || (parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1');
};

const allowedRemote = (remote: string): boolean => remote.startsWith('127.0.0.1:') || remote.startsWith('[::1]:');

test('S33 packaged app makes no request outside the machine (AC-33)', async ({ packaged }) => {
  test.setTimeout(600_000);
  const app = await packaged.launch();
  const window = await app.firstWindow();
  const requests: string[] = [];
  window.on('request', (request) => requests.push(request.url()));
  await waitForPackagedReady(window);
  await window.reload();
  await waitForPackagedReady(window);
  await saveEvidence(window, 'offline');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((url) => !isLocalRequest(url))).toEqual([]);
  const backendPid = (await invokeBackendStatus(window)).value!.pid!;
  const pids = treePids(await mainPid(app));
  expect(pids.has(backendPid)).toBe(true);
  expect(pids.size).toBeGreaterThan(2);
  const remotes = remoteAddresses(pids);
  expect(remotes.length).toBeGreaterThan(0);
  expect(remotes.filter((remote) => !allowedRemote(remote))).toEqual([]);
  expect(await readAppLog(packaged.appRoot)).not.toContain('blocked request');
});
