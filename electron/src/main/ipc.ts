import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { APP_NAME, DEFAULT_LANGUAGE, DEFAULT_THEME, IPC_CHANNELS, isNsError, nsError, type IpcContract, type IpcResult, type LogEntry, type LogLevel, type NsError } from '@shared/core';
import { log } from './log';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_DETAIL_LENGTH = 20000;
const LOG_LEVELS: readonly unknown[] = ['info', 'warn', 'error'] satisfies LogLevel[];
const RENDERER_URL = pathToFileURL(path.join(__dirname, 'renderer')).href + '/';

type Handlers = {
  [C in keyof IpcContract]: { validate(req: unknown): boolean; handle(req: IpcContract[C]['req']): IpcContract[C]['res'] };
};
type AnyHandler = { validate(req: unknown): boolean; handle(req: unknown): unknown };

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

const handlers: Handlers = {
  'app:getInfo': {
    validate: (req) => req === null,
    handle: () => ({ name: APP_NAME, version: app.getVersion(), language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME }),
  },
  'log:write': {
    validate: isLogEntry,
    handle: ({ level, message, detail }) => {
      const text = `[renderer] ${message.slice(0, MAX_MESSAGE_LENGTH)}`;
      log[level](detail === undefined ? text : `${text}\n${detail.slice(0, MAX_DETAIL_LENGTH)}`);
      return null;
    },
  },
};

function logFailure(channel: string, error: unknown, failure: NsError): void {
  const text = `ipc ${channel} ${failure.code} ${failure.message}`;
  if (failure.code.startsWith('IPC_')) log.warn(text);
  else log.error(failure === error ? text : `${text}\n${error instanceof Error ? error.stack : String(error)}`);
}

function run(channel: string, handler: AnyHandler, event: IpcMainInvokeEvent, req: unknown): IpcResult<unknown> {
  try {
    if (!event.senderFrame?.url.startsWith(RENDERER_URL)) throw nsError('IPC_INVALID_REQUEST', 'Untrusted sender');
    if (!handler.validate(req)) throw nsError('IPC_INVALID_REQUEST', 'Invalid request');
    return { ok: true, value: handler.handle(req) };
  } catch (error) {
    const failure = isNsError(error) ? error : nsError('INTERNAL', 'Internal error');
    logFailure(channel, error, failure);
    return { ok: false, error: failure };
  }
}

export function registerIpc(): void {
  for (const channel of Object.keys(IPC_CHANNELS) as (keyof IpcContract)[]) {
    ipcMain.handle(channel, (event, req) => run(channel, handlers[channel] as AnyHandler, event, req));
  }
}
