import { test, expect, saveEvidence, launchLibraryApp } from '../../support/library.ts';
import { failingMigrationsDir, inspectLibrary, seedLibrary, validMigrationsDir } from '../../support/library-db.ts';
import { expectAppLog } from '../../support/app-log.ts';

test('S3a valid migrations apply in order up to version 3 (AC-23)', async ({ appRoot, library }) => {
  seedLibrary(library, 1);
  const { app } = await launchLibraryApp(appRoot, library, { env: { NS_TEST_MIGRATIONS: validMigrationsDir } });
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('root-library-state')).toHaveText('open');
    await expect(window.getByTestId('root-library-version')).toHaveText('3');
    await expect(window.getByTestId('root-library-error')).toHaveCount(0);
    await saveEvidence(window, 'valid-migrations');
  } finally {
    await app.close();
  }
  const info = inspectLibrary(library);
  expect(info.userVersion).toBe(3);
  expect(info.tables).toEqual(expect.arrayContaining(['alpha', 'beta', 'library_meta']));
});

test('S3b a failing migration rolls back and reports a typed code (AC-23)', async ({ appRoot, library }) => {
  seedLibrary(library, 1);
  const before = inspectLibrary(library);
  const { app } = await launchLibraryApp(appRoot, library, { env: { NS_TEST_MIGRATIONS: failingMigrationsDir } });
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('root-library-state')).toHaveText('failed');
    await expect(window.getByTestId('root-library-error-code')).toHaveText('LIBRARY_MIGRATION_FAILED');
    await expect(window.getByTestId('root-library-error-text')).toHaveText(
      'The library could not be upgraded. Your files were not changed.',
    );
    await saveEvidence(window, 'failing-migration');
  } finally {
    await app.close();
  }
  await expectAppLog(appRoot, /0003_broken/);
  const after = inspectLibrary(library);
  expect(after.userVersion).toBe(1);
  expect(after.tables).toEqual(before.tables);
  expect(after.tables).not.toContain('alpha');
  expect(after.tables).not.toContain('gamma');
});
