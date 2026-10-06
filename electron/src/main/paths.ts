import { app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { APP_NAME, en } from '@shared/core';

export function resolveAppRoot(): string {
  if (process.env.NS_APP_ROOT) return process.env.NS_APP_ROOT;
  if (app.isPackaged) return path.dirname(app.getPath('exe'));
  return path.join(app.getAppPath(), '..', '..', '.dev-data');
}

export function applyAppPaths(appRoot: string): boolean {
  const dataDir = path.join(appRoot, 'data');
  const logsDir = path.join(dataDir, 'logs');
  const crashesDir = path.join(dataDir, 'crashes');
  try {
    for (const dir of [dataDir, logsDir, crashesDir]) {
      fs.mkdirSync(dir, { recursive: true });
      fs.rmSync(fs.mkdtempSync(path.join(dir, '.write-')), { recursive: true });
    }
  } catch {
    dialog.showErrorBox(APP_NAME, en.error.APP_DIR_NOT_WRITABLE);
    app.exit(1);
    return false;
  }
  app.setPath('userData', dataDir);
  app.setPath('sessionData', dataDir);
  app.setPath('logs', logsDir);
  app.setPath('crashDumps', crashesDir);
  return true;
}
