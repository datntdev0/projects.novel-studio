import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_SETTINGS_FILE = {
  version: 1,
  language: 'en',
  theme: 'dark',
  windowBounds: null,
  layout: {},
  libraryPath: null,
  backendPid: null,
};

export const settingsText = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({ ...DEFAULT_SETTINGS_FILE, ...overrides }, null, 2) + '\n';

export const settingsPath = (appRoot: string): string => join(appRoot, 'app-settings.json');

export const settingsTmpPath = (appRoot: string): string => `${settingsPath(appRoot)}.tmp`;

export const writeSettingsFile = (appRoot: string, text: string): Promise<void> => writeFile(settingsPath(appRoot), text, 'utf8');

export async function readSettingsJson(appRoot: string): Promise<Record<string, unknown>> {
  return JSON.parse((await readSettingsFile(appRoot)) ?? '');
}

export async function readSettingsFile(appRoot: string): Promise<string | null> {
  try {
    return await readFile(settingsPath(appRoot), 'utf8');
  } catch {
    return null;
  }
}
