import { readdir } from 'node:fs/promises';
import { test, expect } from '../../support/packaged-app.ts';
import { waitForPackagedReady } from '../../support/ffmpeg-state.ts';
import { snapshotAppData, snapshotLocalAppData } from '../../support/appdata.ts';

test('S34 packaged app writes only beside the exe (AC-34)', async ({ packaged }) => {
  test.setTimeout(600_000);
  const before = await readdir(packaged.appRoot);
  const appDataBefore = await snapshotAppData();
  const localBefore = await snapshotLocalAppData();
  const app = await packaged.launch();
  await waitForPackagedReady(await app.firstWindow());
  await app.close();
  expect(await snapshotAppData()).toEqual(appDataBefore);
  expect(await snapshotLocalAppData()).toEqual(localBefore);
  const added = (await readdir(packaged.appRoot)).filter((name) => !before.includes(name)).sort();
  expect(added).toEqual(['app-settings.json', 'data']);
});
