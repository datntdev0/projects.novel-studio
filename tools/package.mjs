import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Cannot run node: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function buildBackend() {
  rmSync(`${root}dist/backend`, { recursive: true, force: true });
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

buildBackend();
