import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const backendDir = path.join(root, 'dist', 'backend');
const packageDir = path.join(root, 'dist', 'package');
const ffmpegPath = path.join(root, 'vendor', 'ffmpeg', 'bin', 'ffmpeg.exe');

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Cannot run node: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function buildBackend() {
  rmSync(backendDir, { recursive: true, force: true });
  runNode([
    'tools/python.mjs',
    '-m',
    'PyInstaller',
    'python/pyinstaller.spec',
    '--distpath',
    'dist/backend',
    '--workpath',
    'dist/pyinstaller',
    '--noconfirm',
  ]);
}

async function buildApp() {
  const electronDir = path.join(root, 'electron');
  const { build, Platform, Arch } = createRequire(path.join(electronDir, 'package.json'))('electron-builder');
  await build({
    projectDir: electronDir,
    config: path.join(electronDir, 'electron-builder.yml'),
    targets: Platform.WINDOWS.createTarget('zip', Arch.x64),
    publish: 'never',
  });
}

function findZip() {
  const zips = readdirSync(packageDir).filter((file) => file.endsWith('.zip'));
  if (zips.length !== 1) {
    console.error(`Expected exactly one zip in dist/package, found ${zips.length}`);
    process.exit(1);
  }
  return zips[0];
}

function folderSize(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const full = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? folderSize(full) : statSync(full).size);
  }, 0);
}

function megabytes(bytes) {
  return (bytes / 1048576).toFixed(1);
}

function reportSizes(zip) {
  console.log(`size zip ${megabytes(statSync(path.join(packageDir, zip)).size)} MB dist/package/${zip}`);
  console.log(`size backend ${megabytes(folderSize(path.join(backendDir, 'novel-studio-backend')))} MB dist/backend/novel-studio-backend`);
  console.log(`size ffmpeg ${megabytes(statSync(ffmpegPath).size)} MB vendor/ffmpeg/bin/ffmpeg.exe`);
}

rmSync(packageDir, { recursive: true, force: true });
runNode(['tools/fetch-ffmpeg.mjs']);
buildBackend();
await buildApp();
reportSizes(findZip());
