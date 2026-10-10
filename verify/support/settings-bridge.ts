import type { Page } from './test.ts';
import type { InvokeResult, RendererGlobals } from './renderer-globals.ts';

export const invokeSettings = (window: Page, channel: string, req?: unknown): Promise<InvokeResult> =>
  window.evaluate(
    ([name, payload]) => (globalThis as unknown as RendererGlobals).dreamerStudio.invoke(name as string, payload),
    [channel, req],
  );
