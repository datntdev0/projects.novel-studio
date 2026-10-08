import { readdir } from 'node:fs/promises';
import { test, expect } from '../../support/test.ts';
import { ensurePackage, listZip, packageDir } from '../../support/package.ts';

const required = [
  'novel-studio.exe',
  'resources/app.asar',
  'resources/backend/novel-studio-backend.exe',
  'resources/backend/_internal',
  'resources/bin/ffmpeg.exe',
  'resources/bin/LICENSE-ffmpeg.txt',
];

test.setTimeout(600_000);

test('S30 package folder holds exactly one zip with the portable layout (AC-30)', async () => {
  const { zipPath } = await ensurePackage();
  const names = await readdir(packageDir);
  expect(names.filter((name) => name.endsWith('.zip'))).toHaveLength(1);
  for (const name of names) expect(name).not.toMatch(/\.exe$|\.blockmap$|^latest\.yml$/);

  const entries = listZip(zipPath).map((entry) => entry.replace(/^\.\//, ''));
  for (const path of required) expect(entries).toContain(path);
  expect(entries.some((entry) => entry.startsWith('resources/backend/_internal/'))).toBe(true);
  expect(entries).not.toContain('resources/app-update.yml');
  expect(entries.filter((entry) => /uninstall/i.test(entry))).toEqual([]);
});

test('S35 package output ends with the three size lines (AC-35)', async () => {
  const { sizeLines } = await ensurePackage();
  expect(sizeLines).toHaveLength(3);
  expect(sizeLines[0]).toMatch(/^size zip \d+(\.\d+)? MB /);
  expect(sizeLines[1]).toMatch(/^size backend \d+(\.\d+)? MB /);
  expect(sizeLines[2]).toMatch(/^size ffmpeg \d+(\.\d+)? MB /);
});
