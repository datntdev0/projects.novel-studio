import { DEFAULT_LANGUAGE, DEFAULT_THEME, LANGUAGES, THEMES, type Language, type Theme } from './ipc-contract';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}
export type ShellLayout = Record<string, Record<string, number>>;
export interface AppSettings {
  version: 1;
  language: Language;
  theme: Theme;
  windowBounds: WindowBounds | null;
  layout: ShellLayout;
  railExpanded: boolean;
  libraryPath: string | null;
  backendPid: number | null;
}
export interface SettingsPatch {
  language?: Language;
  theme?: Theme;
  windowBounds?: WindowBounds | null;
  layout?: ShellLayout;
  railExpanded?: boolean;
}
export interface InitialSettings {
  language: Language;
  theme: Theme;
}
export interface SettingsRead {
  settings: AppSettings;
  unknown: Record<string, unknown>;
  fallback: string | null;
}

export const SETTINGS_INITIAL_CHANNEL = 'settings:initial';
export const SETTINGS_FILE = 'app-settings.json';
export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  language: DEFAULT_LANGUAGE,
  theme: DEFAULT_THEME,
  windowBounds: null,
  layout: {},
  railExpanded: false,
  libraryPath: null,
  backendPid: null,
};

type Validators = { [K in keyof AppSettings]: (value: unknown) => boolean };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value);
const isOneOf =
  (list: readonly unknown[]) =>
  (value: unknown): boolean =>
    list.includes(value);
const isNullOr =
  (check: (value: unknown) => boolean) =>
  (value: unknown): boolean =>
    value === null || check(value);
const isWindowBounds = (value: unknown): boolean =>
  isRecord(value) && ['x', 'y', 'width', 'height'].every((key) => isNumber(value[key])) && typeof value['maximized'] === 'boolean';
const isPanelSizes = (value: unknown): boolean => isRecord(value) && Object.values(value).every(isNumber);
const isLayout = (value: unknown): boolean => isRecord(value) && Object.values(value).every(isPanelSizes);

const VALIDATORS: Validators = {
  version: (value) => value === 1,
  language: isOneOf(LANGUAGES),
  theme: isOneOf(THEMES),
  windowBounds: isNullOr(isWindowBounds),
  layout: isLayout,
  railExpanded: (value) => typeof value === 'boolean',
  libraryPath: isNullOr((value) => typeof value === 'string'),
  backendPid: isNullOr(Number.isInteger),
};
const SETTINGS_KEYS = Object.keys(VALIDATORS) as (keyof AppSettings)[];
const PATCH_KEYS: string[] = ['language', 'theme', 'windowBounds', 'layout', 'railExpanded'];

const defaultSettings = (): AppSettings => ({ ...DEFAULT_SETTINGS, layout: {} });
const failed = (fallback: string): SettingsRead => ({ settings: defaultSettings(), unknown: {}, fallback });

function parseJson(text: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}

function readFields(data: Record<string, unknown>): SettingsRead {
  const defaults = defaultSettings();
  const settings: Record<string, unknown> = {};
  const invalid: string[] = [];
  for (const key of SETTINGS_KEYS) {
    const valid = Object.hasOwn(data, key) && VALIDATORS[key](data[key]);
    settings[key] = valid ? data[key] : defaults[key];
    if (!valid) invalid.push(key);
  }
  const unknown = Object.fromEntries(Object.entries(data).filter(([key]) => !Object.hasOwn(VALIDATORS, key)));
  return { settings: settings as unknown as AppSettings, unknown, fallback: invalid.length ? `fields:${invalid.join(',')}` : null };
}

export function readSettingsText(text: string | null): SettingsRead {
  if (text === null) return failed('missing');
  if (text.trim() === '') return failed('empty');
  const parsed = parseJson(text);
  if (!parsed) return failed('not-json');
  return isRecord(parsed.value) ? readFields(parsed.value) : failed('not-object');
}

export function writeSettingsText(settings: AppSettings, unknown: Record<string, unknown>): string {
  return JSON.stringify({ ...settings, ...unknown }, null, 2) + '\n';
}

export function isSettingsPatch(value: unknown): value is SettingsPatch {
  return isRecord(value) && Object.keys(value).every((key) => PATCH_KEYS.includes(key) && VALIDATORS[key as keyof AppSettings](value[key]));
}
