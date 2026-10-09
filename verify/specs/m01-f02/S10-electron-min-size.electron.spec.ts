import { test, expect } from '../../support/electron.ts';

const TOLERANCE = 8;

test('S10 the window cannot shrink below 1280 x 720 (AC-17)', async ({ app, window }) => {
  await expect(window.getByTestId('app-shell')).toBeVisible();
  const minimum = await app.evaluate(({ BrowserWindow }) => {
    const [main] = BrowserWindow.getAllWindows();
    if (!main) throw new Error('no window');
    main.setSize(600, 400);
    return main.getMinimumSize();
  });
  expect(minimum).toEqual([1280, 720]);
  const readSize = () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getSize() ?? [0, 0]);
  await expect.poll(async () => (await readSize())[0]).toBeGreaterThanOrEqual(1280 - TOLERANCE);
  await expect.poll(async () => (await readSize())[1]).toBeGreaterThanOrEqual(720 - TOLERANCE);
});
