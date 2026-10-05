import { build } from 'esbuild';

await build({
  entryPoints: ['src/main/main.ts'],
  outfile: 'dist/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  external: ['electron'],
  tsconfig: 'tsconfig.json',
});
