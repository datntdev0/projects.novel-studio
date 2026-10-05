import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { APP_NAME } from '@shared/core';

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    title: APP_NAME,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  void window.loadFile(path.join(__dirname, 'renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
