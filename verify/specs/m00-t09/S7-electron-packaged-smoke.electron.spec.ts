import { test, expect, saveEvidence } from '../../support/packaged-app.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus } from '../../support/backend-bridge.ts';
import { fetchBackend } from '../../support/backend-http.ts';
import { listeningAddresses } from '../../support/processes.ts';
import { readFfmpegVersion, waitForPackagedReady } from '../../support/ffmpeg-state.ts';

test('S7 the packaged exe starts the backend, ffmpeg and the library (AC-7)', async ({ packaged }) => {
  const app = await packaged.launch();
  const window = await app.firstWindow();
  await waitForPackagedReady(window);
  expect(await readFfmpegVersion(window)).toMatch(/^7\.1\.1/);
  const { port } = (await invokeBackendStatus(window)).value!;
  expect(listeningAddresses(port!).length).toBeGreaterThan(0);
  expect(await fetchBackend(port!, '/health')).toMatchObject({ status: 401 });
  await expectAppLog(packaged.appRoot, /backend ready/);
  await saveEvidence(window, 'packaged-ready');
});
