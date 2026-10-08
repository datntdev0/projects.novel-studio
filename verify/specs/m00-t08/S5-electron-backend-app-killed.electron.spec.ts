import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { readAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { isPidAlive, killPid, mainPid, spawnPidFromLog } from '../../support/processes.ts';
import { readSettingsJson } from '../../support/settings-file.ts';

test('S5 a killed app leaves no backend behind within the watchdog bound (AC-29)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    const servingPid = (await invokeBackendStatus(window)).value!.pid!;
    const spawnPid = spawnPidFromLog(await readAppLog(appRoot));
    await saveEvidence(window, 'backend-running');

    killPid(await mainPid(app), false);
    let gone = false;
    try {
      await expect.poll(() => isPidAlive(spawnPid) || isPidAlive(servingPid), { timeout: 5_000 }).toBe(false);
      gone = true;
    } finally {
      if (!gone) {
        killPid(spawnPid);
        killPid(servingPid);
      }
    }
    expect((await readSettingsJson(appRoot)).backendPid).toBe(spawnPid);
  });
});
