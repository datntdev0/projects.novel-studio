import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { appDir } from '../../support/paths.ts';

const rendererDir = join(appDir, 'renderer');
const FORBIDDEN = ['probe-', 'app-hello-title', 'root-app-name', 'ns-probe', 'probe.component', 'probe=1'];

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );

test('S7 the app build contains no probe, route or M00 root view text (AC-61)', () => {
  expect(existsSync(rendererDir), `${rendererDir} is missing: run pnpm build first`).toBe(true);
  const files = listFiles(rendererDir).filter((file) => /\.(js|html|css|json|mjs)$/.test(file));
  expect(files.length).toBeGreaterThan(0);
  const found = files.flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return FORBIDDEN.filter((word) => text.includes(word)).map((word) => `${file}: ${word}`);
  });
  expect(found).toEqual([]);
});
