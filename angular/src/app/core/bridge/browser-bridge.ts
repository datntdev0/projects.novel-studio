import { AREA_CHANNELS, FAIL_ERROR, SLOW_MS, readFixture, readFixtureMode, type FixtureMode } from './fixtures/shell-fixtures';
import { APP_NAME, CLOSED_LIBRARY, isLibraryOpenRequest, isLibraryReadRequest, isLibraryWriteRequest, isNovelOpenedRequest, isSettingsPatch, nsError, markOpened, readSettingsText, toLibraryPath, writeSettingsText, type BackendStatus, type Bridge, type IpcContract, type LibraryStatus, type LogEntry, type NovelSummary, type SettingsRead, type ShellMockupSet, type SystemStatus } from '@shared/core';

type Handlers = { [C in keyof IpcContract]: (req: IpcContract[C]['req']) => IpcContract[C]['res'] };

const SETTINGS_KEY = 'novel-studio.settings';
const READY_BACKEND: BackendStatus = { state: 'ready', port: null, pid: null, restarts: 0, error: null };
const OK_SYSTEM: SystemStatus = { ffmpeg: { state: 'ok', version: null, error: null } };
const invalidRequest = () => nsError('IPC_INVALID_REQUEST', 'Invalid request');

export class BrowserBridge implements Bridge {
  readonly logEntries: LogEntry[] = [];
  private readonly fixture: ShellMockupSet;
  private readonly mode: FixtureMode;
  private libraryStatus: LibraryStatus;
  private novels: NovelSummary[];
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
      this.libraryStatus = CLOSED_LIBRARY;
      return this.libraryStatus;
    },
    'library:status': () => this.libraryStatus,
    'library:listNovels': () => this.novels,
    'library:markNovelOpened': (req) => {
      if (!isNovelOpenedRequest(req)) throw invalidRequest();
      this.novels = markOpened(this.novels, req.novelId);
      return null;
    },
    'data:libraryStats': () => this.fixture.stats,
    'services:detect': () => this.fixture.clis,
    'settings:assignments': () => this.fixture.assignments,
    'job:list': () => this.fixture.jobs,
    'backend:getStatus': () => READY_BACKEND,
    'system:status': () => OK_SYSTEM,
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

  constructor(search: string = window.location.search) {
    this.fixture = readFixture(search);
    this.mode = readFixtureMode(search);
    this.libraryStatus = this.fixture.libraryStatus;
    this.novels = [...this.fixture.novels];
  }

  on: Bridge['on'] = () => () => undefined;

  async invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']> {
    await this.applyMode(channel);
    return this.handlers[channel](req);
  }

  private async applyMode(channel: keyof IpcContract): Promise<void> {
    if (!AREA_CHANNELS.includes(channel)) return;
    if (this.mode === 'fail') throw FAIL_ERROR;
    if (this.mode === 'slow') await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
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
