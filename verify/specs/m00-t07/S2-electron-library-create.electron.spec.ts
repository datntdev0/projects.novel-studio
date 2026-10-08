import { test, expect, saveEvidence, launchLibraryApp } from '../../support/library.ts';
import { waitForLibrary } from '../../support/library-bridge.ts';
import { inspectLibrary } from '../../support/library-db.ts';

test('S2 an empty folder becomes a WAL library with only library_meta (AC-22)', async ({ appRoot, library }) => {
  const { app } = await launchLibraryApp(appRoot, library);
  try {
    const window = await app.firstWindow();
    await waitForLibrary(window, { state: 'open', version: 1 });
    await saveEvidence(window, 'library-created');
  } finally {
    await app.close().catch(() => undefined);
  }
  const info = inspectLibrary(library);
  expect(info.journalMode).toBe('wal');
  expect(info.userVersion).toBe(1);
  expect(info.tables).toEqual(['library_meta']);
  expect(Object.keys(info.meta).sort()).toEqual(['created_at', 'created_by_version', 'library_id']);
});
