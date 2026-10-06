import { build } from 'esbuild';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../dist/app/', import.meta.url));
const { name, version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

const common = {
  bundle: true,
  sourcemap: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  external: ['electron'],
  tsconfig: 'tsconfig.json',
};

await build({ ...common, entryPoints: ['src/main/main.ts'], outfile: `${appDir}main.cjs` });
await build({ ...common, entryPoints: ['src/preload.ts'], outfile: `${appDir}preload.cjs` });

await copyFile('assets/icon.ico', `${appDir}icon.ico`);
await writeFile(`${appDir}package.json`, `${JSON.stringify({ name, version, private: true, main: 'main.cjs' }, null, 2)}\n`);
