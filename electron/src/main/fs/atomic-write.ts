import { closeSync, fsyncSync, openSync, renameSync, writeSync } from 'node:fs';

export function writeFileAtomic(filePath: string, text: string): void {
  const tmpPath = `${filePath}.tmp`;
  const fd = openSync(tmpPath, 'w');
  try {
    writeSync(fd, text);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmpPath, filePath);
}
