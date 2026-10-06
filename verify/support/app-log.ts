import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';

export const appLogPath = (appRoot: string): string => join(appRoot, 'data', 'logs', 'app.log');

export async function readAppLog(appRoot: string): Promise<string> {
  try {
    return await readFile(appLogPath(appRoot), 'utf8');
  } catch {
    return '';
  }
}

export const expectAppLog = (appRoot: string, pattern: RegExp): Promise<void> => expect.poll(() => readAppLog(appRoot)).toMatch(pattern);
