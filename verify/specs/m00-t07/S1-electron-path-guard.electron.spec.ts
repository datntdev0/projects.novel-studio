import { mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect, saveEvidence, launchLibraryApp, withApp } from '../../support/library.ts';
import { invokeLibrary, waitForLibrary } from '../../support/library-bridge.ts';
import { type Page } from '../../support/test.ts';

const SENTINEL_TEXT = 'outside sentinel';
const outsidePaths = [
  '../x',
  String.raw`D:\x`,
  String.raw`\\server\share\x`,
  String.raw`\\?\C:\x`,
  String.raw`C:\Windows\win.ini`,
  'CON',
  'a:b',
  'library.sqlite',
];

const expectRefused = async (...args: Parameters<typeof invokeLibrary>): Promise<void> => {
  expect(await invokeLibrary(...args)).toMatchObject({ ok: false, error: { code: 'LIBRARY_PATH_OUTSIDE' } });
};

const expectOutsideUntouched = async (outside: string): Promise<void> => {
  expect(await readFile(join(outside, 'x'), 'utf8')).toBe(SENTINEL_TEXT);
  expect((await readdir(outside)).sort()).toEqual(['lib', 'x']);
};

const expectOutsidePathsRefused = async (window: Page): Promise<void> => {
  for (const path of outsidePaths) {
    const result = await invokeLibrary(window, 'library:readText', { path });
    expect({ path, ok: result.ok, code: result.error?.code }).toEqual({ path, ok: false, code: 'LIBRARY_PATH_OUTSIDE' });
  }
};

const checkOutsideUntouchedAfter = async (appRoot: string, outside: string, body: (window: Page) => Promise<void>): Promise<void> => {
  const { app } = await launchLibraryApp(appRoot, join(outside, 'lib'));
  try {
    const window = await app.firstWindow();
    await waitForLibrary(window, { state: 'open' });
    await body(window);
  } finally {
    await app.close().catch(() => undefined);
  }
  await expectOutsideUntouched(outside);
};

test.describe('path guard', () => {
  let outside = '';

  test.beforeEach(async ({ library }) => {
    outside = library;
    await mkdir(join(outside, 'lib'));
    await writeFile(join(outside, 'x'), SENTINEL_TEXT, 'utf8');
  });

  test('S1a outside paths are refused and nothing outside is touched (AC-13)', async ({ appRoot }) => {
    await checkOutsideUntouchedAfter(appRoot, outside, async (window) => {
      await expectOutsidePathsRefused(window);
      await expectRefused(window, 'library:writeText', { path: '../y', text: 'z' });
      expect(await invokeLibrary(window, 'library:writeText', { path: 'a.txt', text: 'good' })).toMatchObject({ ok: true });
      expect(await invokeLibrary(window, 'library:readText', { path: 'a.txt' })).toMatchObject({ ok: true, value: 'good' });
      await saveEvidence(window, 'outside-refused');
    });
  });

  test('S1b a junction inside the library pointing outside is refused (AC-13)', async ({ appRoot }) => {
    try {
      await symlink(outside, join(outside, 'lib', 'link'), 'junction');
    } catch {
      test.skip(true, 'OS refused to create the junction');
    }
    await checkOutsideUntouchedAfter(appRoot, outside, async (window) => {
      await expectRefused(window, 'library:readText', { path: 'link/x' });
      await expectRefused(window, 'library:writeText', { path: 'link/new.txt', text: 'z' });
      await saveEvidence(window, 'junction-refused');
    });
  });
});

test('S1c with no library open the code is LIBRARY_NOT_OPEN (AC-13)', async ({ appRoot }) => {
  await withApp(appRoot, async (app) => {
    const window = await app.firstWindow();
    await expect(window.getByTestId('app-shell')).toBeVisible();
    expect(await invokeLibrary(window, 'library:readText', { path: 'a.txt' })).toMatchObject({
      ok: false,
      error: { code: 'LIBRARY_NOT_OPEN' },
    });
    await saveEvidence(window, 'not-open');
  });
});
