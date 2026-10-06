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
}

export type IpcEvents = Record<never, never>;

export const IPC_CHANNELS: { [C in keyof IpcContract]: true } = {
  'app:getInfo': true,
  'log:write': true,
  'settings:get': true,
  'settings:set': true,
};
export const IPC_EVENTS: { [E in keyof IpcEvents]: true } = {};
