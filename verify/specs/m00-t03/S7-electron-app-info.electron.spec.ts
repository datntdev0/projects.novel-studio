import { test } from '../../support/electron.ts';
import { expectAppInfoInvoke } from '../../support/app-info.ts';

test('S7 electron shows app info from main (AC-11)', async ({ window }) => {
  await expectAppInfoInvoke(window, { version: '0.0.0' });
});
