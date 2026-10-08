import { app, type Event } from 'electron';
import path from 'node:path';
import { readMigrationDir, setSqliteWarningHandler, type Migration } from '@shared/data';
import { applyAppPaths, resolveAppRoot } from './paths';
import { initLog, log } from './log';
import { registerIpc } from './ipc';
import { closeLibrary, openLibrary } from './library/library-service';
import { readLibraryArg } from './library/library-paths';
import { setBackendStatusListener, startBackend, stopBackend } from './backend/backend-supervisor';
import { emitEvent } from './events';
import { startFfmpegCheck } from './system/ffmpeg-check';
import { loadSettings } from './settings-store';
import { applySessionGuards, createMainWindow, focusMainWindow } from './window';

function loadMigrations(): Migration[] {
  const migrations = readMigrationDir(path.join(__dirname, 'migrations'));
  const testDir = process.env.NS_TEST_MIGRATIONS;
  if (app.isPackaged || !testDir) return migrations;
  return [...migrations, ...readMigrationDir(path.resolve(testDir))];
}

function openLaunchLibrary(): void {
  const libraryRoot = readLibraryArg(process.argv);
  if (!libraryRoot) return;
  try {
    openLibrary(libraryRoot, loadMigrations);
  } catch {
    return;
  }
}

let backendStopped = false;

function quitAfterBackendStop(event: Event): void {
  if (backendStopped) return;
  event.preventDefault();
  backendStopped = true;
  stopBackend()
    .catch((error: unknown) => log.error(`backend stop failed ${String(error)}`))
    .finally(() => app.quit());
}

function start(): void {
  setSqliteWarningHandler((text) => log.warn(`sqlite ${text}`));
  const appRoot = resolveAppRoot();
  if (!applyAppPaths(appRoot)) return;
  initLog(appRoot);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  app.on('second-instance', () => {
    focusMainWindow();
    log.info('second-instance focused');
  });
  app.on('will-quit', closeLibrary);
  app.on('window-all-closed', () => app.quit());
  void app.whenReady().then(() => {
    log.info(`app started ${app.getVersion()} appRoot=${appRoot}`);
    loadSettings(appRoot);
    applySessionGuards();
    registerIpc(loadMigrations);
    setBackendStatusListener((status) => emitEvent('backend:status', status));
    openLaunchLibrary();
    createMainWindow();
    void startBackend(appRoot);
    startFfmpegCheck();
  });
  app.on('before-quit', quitAfterBackendStop);
}

start();
