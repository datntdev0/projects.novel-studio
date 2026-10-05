import { test, expect } from '../../support/electron.ts';

test('S2 electron window shows the hello title (AC-5)', async ({ window }) => {
  await expect(window.getByTestId('app-hello-title')).toHaveText('Novel Studio');
});
