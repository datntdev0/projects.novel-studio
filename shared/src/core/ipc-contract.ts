export type Language = 'en' | 'vi';
export type Theme = 'dark' | 'light';
export const DEFAULT_LANGUAGE: Language = 'en';
export const DEFAULT_THEME: Theme = 'dark';

export interface AppInfo {
  name: string;
  version: string;
  language: Language;
  theme: Theme;
}
export type LogLevel = 'info' | 'warn' | 'error';
export interface LogEntry {
  level: LogLevel;
  message: string;
  detail?: string;
}

export interface IpcContract {
  'app:getInfo': { req: null; res: AppInfo };
  'log:write': { req: LogEntry; res: null };
}

export type IpcEvents = Record<never, never>;

export const IPC_CHANNELS: { [C in keyof IpcContract]: true } = { 'app:getInfo': true, 'log:write': true };
export const IPC_EVENTS: { [E in keyof IpcEvents]: true } = {};
