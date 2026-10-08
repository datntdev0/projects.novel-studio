import { writeFile, rm } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect, saveEvidence, withPackagedApp } from '../../support/packaged-app.ts';
import { setLook } from '../../support/shell.ts';
import { expectHtml } from '../../support/theme.ts';
import { expectAppLog } from '../../support/app-log.ts';
import { waitForBackend } from '../../support/backend-bridge.ts';
import { readFfmpegError, waitForFfmpeg } from '../../support/ffmpeg-state.ts';

type Code = 'FFMPEG_MISSING' | 'FFMPEG_BROKEN';

async function expectErrorInBothLanguages(window: Page, code: Code): Promise<void> {
  expect((await readFfmpegError(window)).code).toBe(code);
  await setLook(window, { language: 'vi' });
  await expectHtml(window, 'vi', 'dark');
  expect((await readFfmpegError(window)).code).toBe(code);
  await saveEvidence(window, `${code.toLowerCase()}-vi`);
  await setLook(window, { language: 'en' });
  await expectHtml(window, 'en', 'dark');
  expect((await readFfmpegError(window)).code).toBe(code);
}

test('S32 a missing or broken ffmpeg reports an error and the backend stays ready (AC-32)', async () => {
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
