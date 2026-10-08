import { test, expect, saveEvidence } from '../../support/electron.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';

const stackFrame = /\bat \S.*:\d+:\d+/;

test('S8 electron errors keep the shape and log the stack (AC-12)', async ({ app, window, appRoot }) => {
  await expect(window.getByTestId('app-shell')).toBeVisible();

  const result = await window.evaluate(() => (globalThis as unknown as RendererGlobals).novelStudio.invoke('log:write', { level: 'nope' }));
  expect(result).toEqual({ ok: false, error: { code: 'IPC_INVALID_REQUEST', message: expect.any(String) } });
  await expectAppLog(appRoot, /\[warn\]\s+ipc log:write IPC_INVALID_REQUEST/);

  await window.evaluate(() =>
    (globalThis as unknown as RendererGlobals).setTimeout(() => {
      throw new Error('boom-renderer');
    }),
  );
  expect(await window.evaluate(() => (globalThis as unknown as RendererGlobals).document.body.innerText)).not.toMatch(stackFrame);
  await expectAppLog(appRoot, /\[error\]\s+\[renderer\] boom-renderer[\s\S]*?\n\s+at /);

  await app.evaluate(() =>
    setTimeout(() => {
      throw new Error('boom-main');
    }),
  );
  await expectAppLog(appRoot, /\[error\]\s+\[main\] uncaught boom-main/);
  expect(app.windows()).toHaveLength(1);
  await expect(window.getByTestId('app-shell')).toBeVisible();
  await saveEvidence(window, 'errors');
});
