import { app } from 'electron';
import { applyAppPaths, resolveAppRoot } from './paths';
import { initLog, log } from './log';
import { applySessionGuards, createMainWindow, focusMainWindow } from './window';

function start(): void {
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
  app.on('window-all-closed', () => app.quit());
  void app.whenReady().then(() => {
    log.info(`app started ${app.getVersion()} appRoot=${appRoot}`);
    applySessionGuards();
    createMainWindow();
  });
}

start();
