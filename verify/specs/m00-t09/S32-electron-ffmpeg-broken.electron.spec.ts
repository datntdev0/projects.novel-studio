import { writeFile, rm } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect, saveEvidence, withPackagedApp } from '../../support/packaged-app.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { waitForBackend } from '../../support/backend-bridge.ts';
import { readFfmpegError, waitForFfmpeg } from '../../support/ffmpeg-state.ts';

const TEXTS = {
  FFMPEG_MISSING: {
    en: 'FFmpeg was not found. Install it or choose its location in the settings.',
    vi: 'Không tìm thấy FFmpeg. Hãy cài đặt hoặc chọn vị trí của nó trong phần cài đặt.',
  },
  FFMPEG_BROKEN: {
    en: 'FFmpeg was found but does not work. Reinstall it or choose another copy.',
    vi: 'Đã tìm thấy FFmpeg nhưng không chạy được. Hãy cài lại hoặc chọn bản khác.',
  },
};

type Code = keyof typeof TEXTS;

async function expectErrorInBothLanguages(window: Page, code: Code): Promise<void> {
  await window.getByTestId('root-set-language-en').click();
  await expect(window.getByTestId('root-ffmpeg-error-text')).toHaveText(TEXTS[code].en);
  expect((await readFfmpegError(window)).code).toBe(code);
  await window.getByTestId('root-set-language-vi').click();
  await expect(window.getByTestId('root-ffmpeg-error-text')).toHaveText(TEXTS[code].vi);
  await saveEvidence(window, `${code.toLowerCase()}-vi`);
  await window.getByTestId('root-set-language-en').click();
  await expect(window.getByTestId('root-ffmpeg-error-text')).toHaveText(TEXTS[code].en);
}

test('S32 a missing or broken ffmpeg shows a localized error and the backend stays ready (AC-32)', async () => {
  test.setTimeout(600_000);
  await withPackagedApp({}, async (packaged) => {
    await rm(packaged.ffmpegPath);
    const missingApp = await packaged.launch();
    const missingWindow = await missingApp.firstWindow();
    await waitForFfmpeg(missingWindow, 'missing');
    await waitForBackend(missingWindow, 'ready');
    await expectErrorInBothLanguages(missingWindow, 'FFMPEG_MISSING');
    await expectAppLog(packaged.appRoot, /ffmpeg failed FFMPEG_MISSING/);
    await missingApp.close();

    await writeFile(packaged.ffmpegPath, 'this is not an executable');
    const brokenApp = await packaged.launch();
    const brokenWindow = await brokenApp.firstWindow();
    await waitForFfmpeg(brokenWindow, 'broken');
    await waitForBackend(brokenWindow, 'ready');
    await expectErrorInBothLanguages(brokenWindow, 'FFMPEG_BROKEN');
    await expectAppLog(packaged.appRoot, /ffmpeg failed FFMPEG_BROKEN/);
  });
});
