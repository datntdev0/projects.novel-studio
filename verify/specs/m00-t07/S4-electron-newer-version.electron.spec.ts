import { test, expect, saveEvidence, launchLibraryApp } from '../../support/library.ts';
import { waitForLibrary } from '../../support/library-bridge.ts';
import { inspectLibrary, seedLibrary, sha256 } from '../../support/library-db.ts';

test('S4 a library with a newer user_version is refused and left untouched (AC-24)', async ({ appRoot, library }) => {
  const path = seedLibrary(library, 99);
  const hash = sha256(path);
  const { app } = await launchLibraryApp(appRoot, library);
  try {
    const window = await app.firstWindow();
    await waitForLibrary(window, { state: 'failed', error: { code: 'LIBRARY_NEWER_VERSION' } });
    await saveEvidence(window, 'newer-version');
  } finally {
    await app.close();
  }
  expect(sha256(path)).toBe(hash);
  expect(inspectLibrary(library).userVersion).toBe(99);
});
