import { spawn, type ChildProcess } from 'node:child_process';
import { appDir } from '../../support/paths.ts';
import { test, expect, executablePath, launchApp } from '../../support/electron.ts';
import { expectAppLog } from '../../support/app-log.ts';

test('S3 second instance focuses the existing window (AC-8)', async ({ appRoot }) => {
  const app = await launchApp(appRoot);
  let child: ChildProcess | undefined;
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('app-shell')).toBeVisible();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.minimize());
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isMinimized())).toBe(true);
    child = spawn(executablePath, [appDir], { env: { ...process.env, NS_APP_ROOT: appRoot }, stdio: 'ignore' });
    await new Promise<void>((resolve) => child?.once('exit', () => resolve()));
    await expectAppLog(appRoot, /second-instance focused/);
    const readState = () =>
      app.evaluate(({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        return { count: windows.length, minimized: windows[0]?.isMinimized(), focused: windows[0]?.isFocused() };
      });
    await expect.poll(readState).toEqual({ count: 1, minimized: false, focused: true });
  } finally {
    child?.kill();
    await app.close();
  }
});
