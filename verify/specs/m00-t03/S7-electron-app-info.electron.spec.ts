import { test } from '../../support/electron.ts';
import { expectAppInfo } from '../../support/app-info.ts';

test('S7 electron shows app info from main (AC-11)', async ({ window }) => {
  await expectAppInfo(window, { version: '0.0.0' });
});
