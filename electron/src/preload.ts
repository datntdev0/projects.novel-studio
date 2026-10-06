import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS, SETTINGS_INITIAL_CHANNEL, applyTheme, nsError, type InitialSettings, type NovelStudioApi } from '@shared/core';

const initial: InitialSettings = ipcRenderer.sendSync(SETTINGS_INITIAL_CHANNEL);

function applyInitial(): void {
  document.documentElement.lang = initial.language;
  applyTheme(document.documentElement, initial.theme);
}

if (document.documentElement) applyInitial();
else document.addEventListener('readystatechange', applyInitial, { once: true });

const api: NovelStudioApi = {
  invoke: (channel, req) =>
    Object.hasOwn(IPC_CHANNELS, channel)
      ? ipcRenderer.invoke(channel, req)
      : Promise.resolve({ ok: false, error: nsError('IPC_UNKNOWN_CHANNEL', `Unknown channel ${channel}`) }),
  on: (event, handler) => {
    if (!Object.hasOwn(IPC_EVENTS, event)) return () => undefined;
    const listener: Parameters<typeof ipcRenderer.on>[1] = (_event, payload) => handler(payload);
    ipcRenderer.on(event, listener);
    return () => ipcRenderer.removeListener(event, listener);
  },
};

contextBridge.exposeInMainWorld('novelStudio', api);
