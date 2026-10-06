import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const appFolders = ['novel-studio', 'Electron', '@novel-studio'];

const listDir = async (dir: string): Promise<string[]> => {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
};

async function describeFiles(root: string, dir: string): Promise<string[]> {
  const lines: string[] = [];
  for (const name of await listDir(dir)) {
    const path = join(dir, name);
    const info = await stat(path).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) lines.push(...(await describeFiles(root, path)));
    else lines.push(`${path.slice(root.length + 1)} ${info.size} ${info.mtimeMs}`);
  }
  return lines;
}

export async function snapshotAppData(): Promise<string[]> {
  const root = process.env.APPDATA ?? '';
  const lines = await listDir(root);
  for (const folder of appFolders) lines.push(...(await describeFiles(root, join(root, folder))));
  return lines.sort();
}
