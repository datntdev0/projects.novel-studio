import type { Bridge, LogEntry } from '@shared/core';

export const writeLog = (bridge: Bridge, entry: LogEntry): void => {
  bridge.invoke('log:write', entry).catch((error: unknown) => console.error('log:write failed', error));
};
