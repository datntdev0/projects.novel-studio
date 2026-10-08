import { test, expect, saveEvidence, withPackagedApp, startScratchBackend, writeBackendPid } from '../../support/packaged-app.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus } from '../../support/backend-bridge.ts';
import { waitForPackagedReady } from '../../support/ffmpeg-state.ts';
import { isPidAlive } from '../../support/processes.ts';

test('S31 the unicode copy starts on a minimal PATH and stops a stale backend (AC-31)', async () => {
  test.setTimeout(600_000);
  await withPackagedApp({ unicode: true, minimalPath: true }, async (packaged) => {
    expect(packaged.appRoot).toContain('小说 Studio');
    const scratch = await startScratchBackend(packaged);
    try {
      await expect.poll(() => isPidAlive(scratch.pid)).toBe(true);
      await writeBackendPid(packaged, scratch.pid);
      const app = await packaged.launch();
      const window = await app.firstWindow();
      await waitForPackagedReady(window);
      await expectAppLog(packaged.appRoot, new RegExp(`backend stale pid ${scratch.pid} stopped`));
      await expect.poll(() => isPidAlive(scratch.pid), { timeout: 10_000 }).toBe(false);
      const { pid } = (await invokeBackendStatus(window)).value!;
      expect(pid).not.toBe(scratch.pid);
      await saveEvidence(window, 'unicode-minimal-path');
      await app.close();
      await expectAppLog(packaged.appRoot, /backend stopped/);
      await expect.poll(() => isPidAlive(pid!), { timeout: 10_000 }).toBe(false);
    } finally {
      scratch.kill();
    }
  });
});
