import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';

export const pythonLogPath = (appRoot: string): string => join(appRoot, 'data', 'logs', 'python.log');

export async function readPythonLog(appRoot: string): Promise<string> {
  try {
    return await readFile(pythonLogPath(appRoot), 'utf8');
  } catch {
    return '';
  }
}

export const expectPythonLog = (appRoot: string, pattern: RegExp): Promise<void> =>
  expect.poll(() => readPythonLog(appRoot)).toMatch(pattern);
