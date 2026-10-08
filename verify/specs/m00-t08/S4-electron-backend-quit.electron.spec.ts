import { test, expect, saveEvidence, withApp } from '../../support/electron.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { invokeBackendStatus, waitForBackend } from '../../support/backend-bridge.ts';
import { isPidAlive, listeningAddresses, spawnPidFromLog } from '../../support/processes.ts';
import { readSettingsJson } from '../../support/settings-file.ts';

test('S4 a normal quit stops the backend and clears backendPid (AC-29)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await waitForBackend(window, 'ready');
    const { port, pid: servingPid } = (await invokeBackendStatus(window)).value!;
    const spawnPid = spawnPidFromLog(await readAppLog(appRoot));
    expect((await readSettingsJson(appRoot)).backendPid).toBe(spawnPid);
    expect(isPidAlive(servingPid!)).toBe(true);
    expect(listeningAddresses(port!).length).toBeGreaterThan(0);
    await saveEvidence(window, 'backend-running');

    await app.close();
    await expectAppLog(appRoot, /backend stopped/);
    await expect.poll(() => isPidAlive(spawnPid) || isPidAlive(servingPid!)).toBe(false);
    expect(listeningAddresses(port!)).toEqual([]);
    expect((await readSettingsJson(appRoot)).backendPid).toBeNull();
  });
});
