import { APP_NAME, isLibraryOpenRequest, isLibraryReadRequest, isLibraryWriteRequest, isSettingsPatch, nsError, readSettingsText, toLibraryPath, writeSettingsText, type Bridge, type IpcContract, type LibraryStatus, type LogEntry, type SettingsRead } from '@shared/core';

type Handlers = { [C in keyof IpcContract]: (req: IpcContract[C]['req']) => IpcContract[C]['res'] };

const SETTINGS_KEY = 'novel-studio.settings';
const CLOSED: LibraryStatus = { state: 'closed', root: null, version: null, libraryId: null, error: null };
const invalidRequest = () => nsError('IPC_INVALID_REQUEST', 'Invalid request');

export class BrowserBridge implements Bridge {
  readonly logEntries: LogEntry[] = [];
  private libraryStatus: LibraryStatus = CLOSED;
  private readonly libraryFiles = new Map<string, string>();

  private readonly handlers: Handlers = {
    'app:getInfo': () => {
      const { language, theme } = this.readSettings().settings;
      return { name: APP_NAME, version: '0.0.0-e2e', language, theme };
    },
    'settings:get': () => this.readSettings().settings,
    'settings:set': (patch) => {
      if (!isSettingsPatch(patch)) throw invalidRequest();
      const { settings, unknown } = this.readSettings();
      const next = { ...settings, ...patch };
      localStorage.setItem(SETTINGS_KEY, writeSettingsText(next, unknown));
      return next;
    },
    'log:write': (entry) => {
      this.logEntries.push(entry);
      return null;
    },
    'library:open': (req) => {
      if (!isLibraryOpenRequest(req)) throw invalidRequest();
      this.libraryStatus = { state: 'open', root: req.root, version: 1, libraryId: 'e2e-library', error: null };
      return this.libraryStatus;
    },
    'library:close': () => {
      this.libraryStatus = CLOSED;
      return this.libraryStatus;
    },
    'library:status': () => this.libraryStatus,
    'library:readText': (req) => {
      if (!isLibraryReadRequest(req)) throw invalidRequest();
      return this.libraryFiles.get(this.libraryKey(req.path)) ?? null;
    },
    'library:writeText': (req) => {
      if (!isLibraryWriteRequest(req)) throw invalidRequest();
      this.libraryFiles.set(this.libraryKey(req.path), req.text);
      return null;
    },
  };

  on: Bridge['on'] = () => () => undefined;

  async invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']> {
    return this.handlers[channel](req);
  }

  private libraryKey(input: string): string {
    if (this.libraryStatus.state !== 'open') throw nsError('LIBRARY_NOT_OPEN', 'No library is open');
    const key = toLibraryPath(input);
    if (key === null) throw nsError('LIBRARY_PATH_OUTSIDE', 'Path is outside the library');
    return key;
  }

  private readSettings(): SettingsRead {
    return readSettingsText(localStorage.getItem(SETTINGS_KEY));
  }
}
