import { expect, type Page } from './test.ts';
import { waitForBackend } from './backend-bridge.ts';
import { waitForLibrary } from './library-bridge.ts';
import { invokeSettings } from './settings-bridge.ts';

export type FfmpegState = 'ok' | 'missing' | 'broken';

export interface FfmpegError {
  code: string;
  text: string;
}

type FfmpegStatus = { state: FfmpegState; version: string | null; error: { code: string; message: string } | null };

const readFfmpeg = async (window: Page): Promise<FfmpegStatus> => {
  const result = await invokeSettings(window, 'system:status', null);
  return (result.value as { ffmpeg: FfmpegStatus }).ffmpeg;
};

export const readFfmpegVersion = async (window: Page): Promise<string> => (await readFfmpeg(window)).version ?? '';

export const waitForFfmpeg = (window: Page, state: FfmpegState, timeout = 30_000): Promise<void> =>
  expect.poll(async () => (await readFfmpeg(window)).state, { timeout }).toBe(state);

export async function readFfmpegError(window: Page): Promise<FfmpegError> {
  const error = (await readFfmpeg(window)).error;
  return { code: error?.code ?? '', text: error?.message ?? '' };
}

export async function waitForPackagedReady(window: Page, timeout = 60_000): Promise<void> {
  await waitForBackend(window, 'ready', timeout);
  await waitForFfmpeg(window, 'ok', timeout);
  await waitForLibrary(window, { state: 'open' }, timeout);
}
