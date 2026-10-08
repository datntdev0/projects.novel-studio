import { app, ipcMain, type IpcMainInvokeEvent, type WebFrameMain } from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { APP_NAME, DEFAULT_SETTINGS, IPC_CHANNELS, SETTINGS_INITIAL_CHANNEL, isLibraryOpenRequest, isLibraryReadRequest, isLibraryWriteRequest, isNsError, isSettingsPatch, nsError, type InitialSettings, type IpcContract, type IpcResult, type LogEntry, type LogLevel, type NsError } from '@shared/core';
import type { Migration } from '@shared/data';
import { log } from './log';
import { closeLibrary, getLibraryStatus, openLibrary, readLibraryText, writeLibraryText } from './library/library-service';
import { getBackendStatus } from './backend/backend-supervisor';
import { getSystemStatus } from './system/ffmpeg-check';
import { getSettings, updateSettings } from './settings-store';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_DETAIL_LENGTH = 20000;
const LOG_LEVELS: readonly unknown[] = ['info', 'warn', 'error'] satisfies LogLevel[];
const RENDERER_URL = pathToFileURL(path.join(__dirname, 'renderer')).href + '/';

type Handlers = {
  [C in keyof IpcContract]: {
    validate(req: unknown): boolean;
    handle(req: IpcContract[C]['req']): IpcContract[C]['res'] | Promise<IpcContract[C]['res']>;
  };
};
type AnyHandler = { validate(req: unknown): boolean; handle(req: unknown): unknown | Promise<unknown> };

const isNull = (req: unknown): boolean => req === null;

const isLogEntry = (req: unknown): req is LogEntry => {
  const entry = req as LogEntry | null;
  return (
    typeof entry === 'object' &&
    entry !== null &&
    LOG_LEVELS.includes(entry.level) &&
    typeof entry.message === 'string' &&
    (entry.detail === undefined || typeof entry.detail === 'string')
  );
};

const createHandlers = (loadMigrations: () => Migration[]): Handlers => ({
  'app:getInfo': {
    validate: isNull,
    handle: () => {
      const { language, theme } = getSettings();
      return { name: APP_NAME, version: app.getVersion(), language, theme };
    },
  },
  'log:write': {
    validate: isLogEntry,
    handle: ({ level, message, detail }) => {
      const text = `[renderer] ${message.slice(0, MAX_MESSAGE_LENGTH)}`;
      log[level](detail === undefined ? text : `${text}\n${detail.slice(0, MAX_DETAIL_LENGTH)}`);
      return null;
    },
  },
  'settings:get': { validate: isNull, handle: getSettings },
  'settings:set': { validate: isSettingsPatch, handle: updateSettings },
  'backend:getStatus': { validate: isNull, handle: getBackendStatus },
  'system:status': { validate: isNull, handle: getSystemStatus },
  'library:open': { validate: isLibraryOpenRequest, handle: ({ root }) => openLibrary(root, loadMigrations) },
  'library:close': { validate: isNull, handle: closeLibrary },
  'library:status': { validate: isNull, handle: getLibraryStatus },
  'library:readText': { validate: isLibraryReadRequest, handle: ({ path: file }) => readLibraryText(file) },
  'library:writeText': {
    validate: isLibraryWriteRequest,
    handle: ({ path: file, text }) => {
      writeLibraryText(file, text);
      return null;
    },
  },
});

function logFailure(channel: string, error: unknown, failure: NsError): void {
  const text = `ipc ${channel} ${failure.code} ${failure.message}`;
  if (failure.code.startsWith('IPC_')) log.warn(text);
  else log.error(failure === error ? text : `${text}\n${error instanceof Error ? error.stack : String(error)}`);
}

function isTrustedSender(frame: WebFrameMain | null): boolean {
  return frame?.url.startsWith(RENDERER_URL) ?? false;
}

async function run(channel: string, handler: AnyHandler, event: IpcMainInvokeEvent, req: unknown): Promise<IpcResult<unknown>> {
  try {
    if (!isTrustedSender(event.senderFrame)) throw nsError('IPC_INVALID_REQUEST', 'Untrusted sender');
    if (!handler.validate(req)) throw nsError('IPC_INVALID_REQUEST', 'Invalid request');
    return { ok: true, value: await handler.handle(req) };
  } catch (error) {
    const failure = isNsError(error) ? error : nsError('INTERNAL', 'Internal error');
    logFailure(channel, error, failure);
    return { ok: false, error: failure };
  }
}

export function registerIpc(loadMigrations: () => Migration[]): void {
  const handlers = createHandlers(loadMigrations);
  for (const channel of Object.keys(IPC_CHANNELS) as (keyof IpcContract)[]) {
    ipcMain.handle(channel, (event, req) => run(channel, handlers[channel] as AnyHandler, event, req));
  }
  ipcMain.on(SETTINGS_INITIAL_CHANNEL, (event) => {
    let initial: InitialSettings = { language: DEFAULT_SETTINGS.language, theme: DEFAULT_SETTINGS.theme };
    try {
      if (isTrustedSender(event.senderFrame)) {
        const { language, theme } = getSettings();
        initial = { language, theme };
      } else logFailure(SETTINGS_INITIAL_CHANNEL, null, nsError('IPC_INVALID_REQUEST', 'Untrusted sender'));
    } finally {
      event.returnValue = initial;
    }
  });
}
