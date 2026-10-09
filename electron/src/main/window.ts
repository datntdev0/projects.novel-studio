import { BrowserWindow, session } from 'electron';
import path from 'node:path';
import { APP_NAME, THEME_BACKGROUNDS } from '@shared/core';
import { log } from './log';
import { getSettings } from './settings-store';
import { initialBounds, trackWindowState } from './window-state';

const REMOTE_URLS = ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'];

let mainWindow: BrowserWindow | null = null;

function blockNavigation(event: { preventDefault(): void }, url: string): void {
  event.preventDefault();
  log.warn(`blocked navigation ${url}`);
}

export function applySessionGuards(): void {
  const { defaultSession } = session;
  defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    log.warn(`blocked permission ${permission}`);
    callback(false);
  });
  defaultSession.webRequest.onBeforeRequest({ urls: REMOTE_URLS }, (details, callback) => {
    log.warn(`blocked request ${details.url}`);
    callback({ cancel: true });
  });
}

function applyWindowGuards(window: BrowserWindow): void {
  window.webContents.on('will-navigate', blockNavigation);
  window.webContents.on('will-redirect', blockNavigation);
  window.webContents.setWindowOpenHandler(({ url }) => {
    log.warn(`blocked window-open ${url}`);
    return { action: 'deny' };
  });
  window.webContents.on('render-process-gone', (_event, details) => log.error(`render-process-gone ${details.reason}`));
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...initialBounds(),
    minWidth: 1280,
    minHeight: 720,
    title: APP_NAME,
    backgroundColor: THEME_BACKGROUNDS[getSettings().theme],
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  trackWindowState(window);
  applyWindowGuards(window);
  window.on('closed', () => (mainWindow = null));
  void window.loadFile(path.join(__dirname, 'renderer/index.html'));
  mainWindow = window;
  return window;
}

export function focusMainWindow(): void {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}
