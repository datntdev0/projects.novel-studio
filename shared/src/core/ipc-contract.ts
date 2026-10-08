import type { BackendStatus } from './backend';
import type { LibraryOpenRequest, LibraryReadRequest, LibraryStatus, LibraryWriteRequest } from './library';
import type { AppSettings, SettingsPatch } from './settings';

export const LANGUAGES = ['en', 'vi'] as const;
export const THEMES = ['dark', 'light'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Theme = (typeof THEMES)[number];
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
  'settings:get': { req: null; res: AppSettings };
  'settings:set': { req: SettingsPatch; res: AppSettings };
  'library:open': { req: LibraryOpenRequest; res: LibraryStatus };
  'library:close': { req: null; res: LibraryStatus };
  'library:status': { req: null; res: LibraryStatus };
  'library:readText': { req: LibraryReadRequest; res: string | null };
  'library:writeText': { req: LibraryWriteRequest; res: null };
  'backend:getStatus': { req: null; res: BackendStatus };
}

export interface IpcEvents {
  'backend:status': BackendStatus;
}

export const IPC_CHANNELS: { [C in keyof IpcContract]: true } = {
  'app:getInfo': true,
  'log:write': true,
  'settings:get': true,
  'settings:set': true,
  'library:open': true,
  'library:close': true,
  'library:status': true,
  'library:readText': true,
  'library:writeText': true,
  'backend:getStatus': true,
};
export const IPC_EVENTS: { [E in keyof IpcEvents]: true } = { 'backend:status': true };
