import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '../../support/test.ts';
import { repoRoot } from '../../support/paths.ts';
import { withTempFolder } from '../../support/theme.ts';

const cachedArchive = join(repoRoot, 'vendor', 'ffmpeg', 'ffmpeg-7.1.1-essentials_build.zip');
const script = join(repoRoot, 'tools', 'fetch-ffmpeg.mjs');

test('S42 fetch-ffmpeg rejects an archive with a wrong checksum (AC-42)', async () => {
  test.setTimeout(120_000);
  expect(existsSync(cachedArchive)).toBe(true);
  await withTempFolder(async (folder) => {
    const tampered = join(folder, 'tampered.zip');
    const out = join(folder, 'out');
    await copyFile(cachedArchive, tampered);
    const bytes = await readFile(tampered);
    const middle = bytes.length >> 1;
    bytes.writeUInt8(bytes.readUInt8(middle) ^ 0xff, middle);
    await writeFile(tampered, bytes);

    const result = spawnSync(process.execPath, [script, '--archive', tampered, '--out', out], {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ffmpeg archive checksum mismatch');
    expect(existsSync(join(out, 'bin'))).toBe(false);
    expect(existsSync(tampered)).toBe(true);
  });
});
