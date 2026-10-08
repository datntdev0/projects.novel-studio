import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const VERSION = '7.1.1';
const ARCHIVE = 'ffmpeg-7.1.1-essentials_build.zip';
const URL = 'https://github.com/GyanD/codexffmpeg/releases/download/7.1.1/ffmpeg-7.1.1-essentials_build.zip';
const SHA256 = '04861d3339c5ebe38b56c19a15cf2c0cc97f5de4fa8910e4d47e5e6404e4a2d4';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const argValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};

const hashFile = async (file) => {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
};

const download = async (target) => {
  const response = await fetch(URL);
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
  const partial = `${target}.download`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
  renameSync(partial, target);
};

const unpack = (archive, out) => {
  const temp = mkdtempSync(join(tmpdir(), 'ffmpeg-'));
  try {
    const tar = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
    const result = spawnSync(tar, ['-xf', archive, '-C', temp], { windowsHide: true });
    if (result.status !== 0) throw new Error(`unpack failed: ${result.error?.message ?? result.stderr}`);
    const source = join(temp, `ffmpeg-${VERSION}-essentials_build`);
    mkdirSync(join(out, 'bin'), { recursive: true });
    copyFileSync(join(source, 'bin', 'ffmpeg.exe'), join(out, 'bin', 'ffmpeg.exe'));
    copyFileSync(join(source, 'LICENSE'), join(out, 'LICENSE'));
    writeFileSync(join(out, '.sha256'), SHA256);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
};

const isReady = (out) =>
  existsSync(join(out, 'bin', 'ffmpeg.exe')) &&
  existsSync(join(out, '.sha256')) &&
  readFileSync(join(out, '.sha256'), 'utf8').trim() === SHA256;

const main = async () => {
  const out = resolve(argValue('--out') ?? join(repoRoot, 'vendor', 'ffmpeg'));
  const given = argValue('--archive');
  const cached = join(out, ARCHIVE);
  const archive = given ? resolve(given) : cached;
  let downloaded = false;
  if (!given && !existsSync(cached)) {
    if (isReady(out)) {
      console.log(`ffmpeg ${VERSION} ready ${out}`);
      return;
    }
    mkdirSync(out, { recursive: true });
    await download(cached);
    downloaded = true;
  }
  const actual = await hashFile(archive);
  if (actual !== SHA256) {
    if (downloaded) rmSync(archive, { force: true });
    throw new Error(`ffmpeg archive checksum mismatch: expected ${SHA256} got ${actual}`);
  }
  if (!isReady(out)) unpack(archive, out);
  console.log(`ffmpeg ${VERSION} ready ${out}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
