import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron, type ElectronApplication } from '@playwright/test';
import { executablePath } from './electron.ts';
import { appDir } from './paths.ts';
import { settingsText } from './settings-file.ts';
import { expect } from './test.ts';

const MODULE_SCRIPT = /<script\b[^>]*\btype="module"[^>]*><\/script>/g;

export async function copyAppWithoutAngular(): Promise<string> {
  const copyDir = await mkdtemp(join(tmpdir(), 'ns-copy-'));
  try {
    await cp(appDir, copyDir, { recursive: true });
    const indexPath = join(copyDir, 'renderer', 'index.html');
    const html = await readFile(indexPath, 'utf8');
    const stripped = html.replace(MODULE_SCRIPT, '');
    expect(stripped.length).toBeLessThan(html.length);
    await writeFile(indexPath, stripped, 'utf8');
  } catch (error) {
    await rm(copyDir, { recursive: true, force: true });
    throw error;
  }
  return copyDir;
}

export const launchCopy = (copyDir: string, appRoot: string): Promise<ElectronApplication> =>
  _electron.launch({ executablePath, args: [copyDir], env: { ...process.env, NS_APP_ROOT: appRoot } });

export const storedSettings = (language: string, theme: string): string => settingsText({ language, theme });
