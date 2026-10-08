import { expect, type Page } from './test.ts';
import { invokeSettings } from './settings-bridge.ts';
import type { InvokeResult } from './renderer-globals.ts';

export type BackendState = 'starting' | 'ready' | 'restarting' | 'failed' | 'stopped';

export type BackendStatus = {
  state: BackendState;
  port: number | null;
  pid: number | null;
  restarts: number;
  error: { code: string; message: string } | null;
};

export type BackendStatusResult = InvokeResult & { value?: BackendStatus };

export const invokeBackendStatus = async (window: Page): Promise<BackendStatusResult> =>
  (await invokeSettings(window, 'backend:getStatus', null)) as BackendStatusResult;

export const waitForBackend = (window: Page, state: BackendState, timeout = 30_000): Promise<void> =>
  expect.poll(async () => (await invokeBackendStatus(window)).value?.state, { timeout }).toBe(state);
