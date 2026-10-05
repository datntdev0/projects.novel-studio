import { ipcMain } from 'electron';
import log from 'electron-log/main';
import path from 'node:path';

function logUncaught(reason: unknown): void {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  log.error(`[main] uncaught ${error.message}\n${error.stack ?? ''}`);
}

export function initLog(appRoot: string): void {
  ipcMain.removeAllListeners('__ELECTRON_LOG__');
  ipcMain.removeHandler('__ELECTRON_LOG__');
  log.transports.file.resolvePathFn = () => path.join(appRoot, 'data', 'logs', 'app.log');
  log.transports.file.maxSize = 1024 * 1024;
  process.on('uncaughtException', logUncaught);
  process.on('unhandledRejection', logUncaught);
}

export { log };
