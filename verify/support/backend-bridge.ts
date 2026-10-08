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
  expect(window.getByTestId('root-backend-state')).toHaveText(state, { timeout });
