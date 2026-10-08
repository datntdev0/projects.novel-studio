import { expect, type Page } from './test.ts';
import { waitForBackend } from './backend-bridge.ts';

export type FfmpegState = 'ok' | 'missing' | 'broken';

export interface FfmpegError {
  code: string;
  text: string;
}

export const readFfmpegVersion = (window: Page): Promise<string> => window.getByTestId('root-ffmpeg-version').innerText();

export const waitForFfmpeg = (window: Page, state: FfmpegState, timeout = 30_000): Promise<void> =>
  expect(window.getByTestId('root-ffmpeg-state')).toHaveText(state, { timeout });

export async function readFfmpegError(window: Page): Promise<FfmpegError> {
  const code = await window.getByTestId('root-ffmpeg-error-code').innerText();
  const text = await window.getByTestId('root-ffmpeg-error-text').innerText();
  return { code, text };
}

export async function waitForPackagedReady(window: Page, timeout = 60_000): Promise<void> {
  await waitForBackend(window, 'ready', timeout);
  await waitForFfmpeg(window, 'ok', timeout);
  await expect(window.getByTestId('root-library-state')).toHaveText('open', { timeout });
}
