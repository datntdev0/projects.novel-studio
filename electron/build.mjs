import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../dist/app/', import.meta.url));
const { name, version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

await build({
  entryPoints: ['src/main/main.ts'],
  outfile: `${appDir}main.cjs`,
  bundle: true,
  sourcemap: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  external: ['electron'],
  tsconfig: 'tsconfig.json',
});

await writeFile(`${appDir}package.json`, `${JSON.stringify({ name, version, private: true, main: 'main.cjs' }, null, 2)}\n`);
