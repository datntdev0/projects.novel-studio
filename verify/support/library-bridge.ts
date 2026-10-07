import type { Page } from './test.ts';
import type { InvokeResult, RendererGlobals } from './renderer-globals.ts';

type LibraryChannels = {
  'library:open': { root: string };
  'library:close': null;
  'library:status': null;
  'library:readText': { path: string };
  'library:writeText': { path: string; text: string };
};

export type LibraryChannel = keyof LibraryChannels;

export const invokeLibrary = <C extends LibraryChannel>(
  window: Page,
  channel: C,
  req: LibraryChannels[C] = null as LibraryChannels[C],
): Promise<InvokeResult> =>
  window.evaluate(
    ([name, payload]) => (globalThis as unknown as RendererGlobals).novelStudio.invoke(name as string, payload),
    [channel, req],
  );
