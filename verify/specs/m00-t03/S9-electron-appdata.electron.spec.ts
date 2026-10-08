import { test, expect, launchApp } from '../../support/electron.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { snapshotAppData } from '../../support/appdata.ts';

test('S9 electron run leaves %APPDATA% unchanged and logs under appRoot (AC-38)', async ({ appRoot }) => {
  const before = await snapshotAppData();
  const app = await launchApp(appRoot);
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('app-shell')).toBeVisible();
    await window.reload();
    await expect(window.getByTestId('app-shell')).toBeVisible();
  } finally {
    await app.close();
  }
  expect(await snapshotAppData()).toEqual(before);
  const escaped = appRoot.replace(/[\\^$.*+?()[\]{}|]/g, (char) => `\\${char}`);
  await expectAppLog(appRoot, new RegExp(`app started .*appRoot=${escaped}`));
});
