import { once } from 'node:events';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect, saveEvidence, withApp, libraryArgs } from '../../support/library.ts';
import { invokeLibrary, waitForLibrary } from '../../support/library-bridge.ts';
import { type RendererGlobals } from '../../support/renderer-globals.ts';
import { type ElectronApplication } from '@playwright/test';

const ROUNDS = 5;
const FILE = 'chapter.txt';
const TEMP = `${FILE}.tmp`;
const TEXT_A = 'A'.repeat(1024 * 1024);
const BIG_SIZE = 100 * 1024 * 1024;

const isOnly = (content: Buffer, char: string, size: number): boolean =>
  content.length === size && content.equals(Buffer.alloc(size, char));

const exists = (path: string): Promise<boolean> =>
  stat(path).then(
    () => true,
    () => false,
  );

const waitForTemp = async (library: string): Promise<void> => {
  await expect
    .poll(() => exists(join(library, TEMP)), { intervals: [2], timeout: 10_000 })
    .toBe(true)
    .catch(() => undefined);
};

const expectLibraryOpen = async (app: ElectronApplication) => {
  const window = await app.firstWindow();
  await waitForLibrary(window, { state: 'open' });
  return window;
};

const killDuringWrite = async (app: ElectronApplication, library: string): Promise<void> => {
  const window = await expectLibraryOpen(app);
  expect(await invokeLibrary(window, 'library:writeText', { path: FILE, text: TEXT_A })).toMatchObject({ ok: true });
  const mainPid = await app.evaluate(() => process.pid);
  const fired = window
    .evaluate(
      ({ size, file }) => {
        const { invoke } = (globalThis as unknown as RendererGlobals).dreamerStudio;
        void invoke('library:writeText', { path: file, text: 'B'.repeat(size) });
      },
      { size: BIG_SIZE, file: FILE },
    )
    .catch(() => undefined);
  await waitForTemp(library);
  const exited = once(app.process(), 'exit');
  process.kill(mainPid);
  await exited;
  await fired;
};

test('S6 a kill during a large library write leaves exactly the old or the new text (AC-40)', async ({ appRoot, library }) => {
  let interrupted = 0;
  for (let round = 0; round < ROUNDS; round++) {
    await withApp(appRoot, (app) => killDuringWrite(app, library), { args: libraryArgs(library) });
    const content = await readFile(join(library, FILE));
    const isOld = isOnly(content, 'A', TEXT_A.length);
    expect(isOld || isOnly(content, 'B', BIG_SIZE)).toBe(true);
    if (isOld && (await exists(join(library, TEMP)))) interrupted++;
  }
  expect(interrupted, 'no round was interrupted mid-write').toBeGreaterThan(0);
  await withApp(
    appRoot,
    async (app) => {
      const window = await expectLibraryOpen(app);
      await saveEvidence(window, 'after-kills');
    },
    { args: libraryArgs(library) },
  );
});
