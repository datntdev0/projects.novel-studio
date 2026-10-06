import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS, SETTINGS_FILE, readSettingsText, writeSettingsText, type AppSettings, type SettingsPatch, type SettingsRead } from '@shared/core';
import { writeFileAtomic } from './fs/atomic-write';
import { log } from './log';

export interface MainSettingsPatch extends SettingsPatch {
  libraryPath?: string | null;
  backendPid?: number | null;
}

let settingsPath = SETTINGS_FILE;
let current: AppSettings = DEFAULT_SETTINGS;
let unknownKeys: Record<string, unknown> = {};

function readSettingsFile(filePath: string): SettingsRead {
  try {
    return readSettingsText(readFileSync(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return readSettingsText(null);
    return { ...readSettingsText(''), fallback: 'unreadable' };
  }
}

export function loadSettings(appRoot: string): void {
  settingsPath = path.join(appRoot, SETTINGS_FILE);
  const { settings, unknown, fallback } = readSettingsFile(settingsPath);
  current = settings;
  unknownKeys = unknown;
  if (fallback !== null) log.warn(`settings fallback ${fallback} ${settingsPath}`);
}

export function getSettings(): AppSettings {
  return current;
}

export function updateSettings(patch: MainSettingsPatch): AppSettings {
  const next: AppSettings = { ...current, ...patch };
  writeFileAtomic(settingsPath, writeSettingsText(next, unknownKeys));
  current = next;
  return next;
}
