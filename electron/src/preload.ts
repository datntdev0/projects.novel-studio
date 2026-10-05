import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS, nsError, type NovelStudioApi } from '@shared/core';

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
