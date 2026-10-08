import { BrowserWindow } from 'electron';
import type { IpcEvents } from '@shared/core';

export function emitEvent<E extends keyof IpcEvents>(event: E, payload: IpcEvents[E]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(event, payload);
  }
}
