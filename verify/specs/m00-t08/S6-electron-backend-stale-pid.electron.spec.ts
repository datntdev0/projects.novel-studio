import { test, expect, withApp } from '../../support/electron.ts';
import { expectAppLog, readAppLog } from '../../support/app-log.ts';
import { waitForBackend } from '../../support/backend-bridge.ts';
import { isPidAlive, spawnPidFromLog, spawnSleeper, type SleeperKind } from '../../support/processes.ts';
import { readSettingsJson, settingsText, writeSettingsFile } from '../../support/settings-file.ts';

const startWithStalePid = async (appRoot: string, kind: SleeperKind, expectKilled: boolean): Promise<void> => {
  const sleeper = spawnSleeper(kind);
  try {
    expect(isPidAlive(sleeper.pid)).toBe(true);
    await writeSettingsFile(appRoot, settingsText({ backendPid: sleeper.pid }));
    await withApp(appRoot, async (app) => {
      const window = await app.firstWindow();
      await waitForBackend(window, 'ready');
      const outcome = expectKilled ? 'stopped' : 'not running';
      await expectAppLog(appRoot, new RegExp(`backend stale pid ${sleeper.pid} ${outcome}`));
      const spawnPid = spawnPidFromLog(await readAppLog(appRoot));
      expect((await readSettingsJson(appRoot)).backendPid).toBe(spawnPid);
      expect(spawnPid).not.toBe(sleeper.pid);
    });
    await expect.poll(() => isPidAlive(sleeper.pid), { timeout: 5_000 }).toBe(!expectKilled);
  } finally {
    sleeper.kill();
  }
};

test('S6a a stale venv python backendPid is stopped at the next start (AC-29)', async ({ appRoot }) => {
  await startWithStalePid(appRoot, 'venv-python', true);
});

test('S6b a stale backendPid of a node process is left alone (AC-29)', async ({ appRoot }) => {
  await startWithStalePid(appRoot, 'node', false);
});

test('S6c a stale backendPid of a base-interpreter python is left alone (AC-29)', async ({ appRoot }) => {
  await startWithStalePid(appRoot, 'base-python', false);
});
