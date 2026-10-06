import { APP_NAME, isSettingsPatch, nsError, readSettingsText, writeSettingsText, type Bridge, type IpcContract, type LogEntry, type SettingsRead } from '@shared/core';

type Handlers = { [C in keyof IpcContract]: (req: IpcContract[C]['req']) => IpcContract[C]['res'] };

const SETTINGS_KEY = 'novel-studio.settings';

export class BrowserBridge implements Bridge {
  readonly logEntries: LogEntry[] = [];

  private readonly handlers: Handlers = {
    'app:getInfo': () => {
      const { language, theme } = this.readSettings().settings;
      return { name: APP_NAME, version: '0.0.0-e2e', language, theme };
    },
    'settings:get': () => this.readSettings().settings,
    'settings:set': (patch) => {
      if (!isSettingsPatch(patch)) throw nsError('IPC_INVALID_REQUEST', 'Invalid request');
      const { settings, unknown } = this.readSettings();
      const next = { ...settings, ...patch };
      localStorage.setItem(SETTINGS_KEY, writeSettingsText(next, unknown));
      return next;
    },
    'log:write': (entry) => {
      this.logEntries.push(entry);
      return null;
    },
  };

  on: Bridge['on'] = () => () => undefined;

  async invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']> {
    return this.handlers[channel](req);
  }

  private readSettings(): SettingsRead {
    return readSettingsText(localStorage.getItem(SETTINGS_KEY));
  }
}
