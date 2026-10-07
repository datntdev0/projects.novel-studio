import { test, expect, saveEvidence, launchLibraryApp } from '../../support/library.ts';
import { inspectLibrary, seedLibrary, sha256 } from '../../support/library-db.ts';

test('S4 a library with a newer user_version is refused and left untouched (AC-24)', async ({ appRoot, library }) => {
  const path = seedLibrary(library, 99);
  const hash = sha256(path);
  const { app } = await launchLibraryApp(appRoot, library);
  try {
    const window = await app.firstWindow();
    await expect(window.getByTestId('root-library-state')).toHaveText('failed');
    await expect(window.getByTestId('root-library-error-code')).toHaveText('LIBRARY_NEWER_VERSION');
    await expect(window.getByTestId('root-library-error-text')).toHaveText(
      'This library was created by a newer version of the app. Update the app to open it.',
    );
    await saveEvidence(window, 'newer-version-en');
    await window.getByTestId('root-set-language-vi').click();
    await expect(window.getByTestId('root-library-error-text')).toHaveText(
      'Thư viện này được tạo bởi phiên bản ứng dụng mới hơn. Hãy cập nhật ứng dụng để mở.',
    );
    await expect(window.getByTestId('root-library-error-code')).toHaveText('LIBRARY_NEWER_VERSION');
    await saveEvidence(window, 'newer-version-vi');
  } finally {
    await app.close();
  }
  expect(sha256(path)).toBe(hash);
  expect(inspectLibrary(library).userVersion).toBe(99);
});
