import { test, expect, saveEvidence, launchLibraryApp, probeOutput } from '../../support/library.ts';
import { readAppLog } from '../../support/app-log.ts';

const WARNING = /SQLite|ExperimentalWarning/i;

test('S5 a create run emits no SQLite warning on output, window or app.log (AC-25)', async ({ appRoot, library }) => {
  const { app, output } = await launchLibraryApp(appRoot, library);
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('root-library-state')).toHaveText('open');
    await expect(window.getByTestId('root-library-version')).toHaveText('1');
    await probeOutput(app, output);
    expect(output.stdout()).not.toMatch(WARNING);
    expect(output.stderr()).not.toMatch(WARNING);
    expect(
      await window.evaluate(() => (globalThis as unknown as { document: { body: { innerText: string } } }).document.body.innerText),
    ).not.toMatch(WARNING);
    await saveEvidence(window, 'no-warning');
  } finally {
    await app.close().catch(() => undefined);
  }
  const sqliteLines = (await readAppLog(appRoot)).split('\n').filter((line) => /sqlite/i.test(line));
  expect(sqliteLines.length).toBeLessThanOrEqual(1);
});
