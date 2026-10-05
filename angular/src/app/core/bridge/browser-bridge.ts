import { APP_NAME, DEFAULT_LANGUAGE, DEFAULT_THEME, type Bridge, type IpcContract, type LogEntry } from '@shared/core';

type Handlers = { [C in keyof IpcContract]: (req: IpcContract[C]['req']) => IpcContract[C]['res'] };

export class BrowserBridge implements Bridge {
  readonly logEntries: LogEntry[] = [];

  private readonly handlers: Handlers = {
    'app:getInfo': () => ({ name: APP_NAME, version: '0.0.0-e2e', language: DEFAULT_LANGUAGE, theme: DEFAULT_THEME }),
    'log:write': (entry) => {
      this.logEntries.push(entry);
      return null;
    },
  };

  on: Bridge['on'] = () => () => undefined;

  async invoke<C extends keyof IpcContract>(channel: C, req: IpcContract[C]['req']): Promise<IpcContract[C]['res']> {
    return this.handlers[channel](req);
  }
}
