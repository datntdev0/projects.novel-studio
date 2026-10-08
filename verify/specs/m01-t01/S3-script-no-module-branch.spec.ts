import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { angularDir } from '../../support/paths.ts';
import { gotoFoundation, REGISTRY_IDS } from '../../support/shell.ts';

const shellDir = join(angularDir, 'src/app/shell');
const probeDir = join(angularDir, 'src/e2e/probe');

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? listFiles(join(dir, item.name)) : [join(dir, item.name)],
  );
}

const isRegistryFile = (file: string): boolean => /module-entries\.ts$|extra-entries[^/\\]*\.ts$/.test(file);
const idPattern = REGISTRY_IDS.join('|');
const moduleExpression = String.raw`(id|moduleId|activeModule|active\(\)|entry\.id)`;
const branchPattern = new RegExp(
  String.raw`${moduleExpression}\s*[!=]==?\s*['"](${idPattern})['"]|['"](${idPattern})['"]\s*[!=]==?\s*${moduleExpression}|case\s+['"](${idPattern})['"]`,
);

test('S3 the registry lists the 17 ids and shell code never branches on a module id (AC-58, AC-59)', async ({ page }) => {
  const entries = readFileSync(join(shellDir, 'registry/module-entries.ts'), 'utf8');
  const declared = [...entries.matchAll(/\bentry\(\s*'([a-z]+)'/g)].map((match) => match[1]);
  expect(declared).toEqual([...REGISTRY_IDS]);

  const offenders = listFiles(shellDir)
    .filter((file) => /\.(ts|html)$/.test(file) && !isRegistryFile(file))
    .filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => branchPattern.test(line)),
    );
  expect(offenders).toEqual([]);

  const probeFiles = listFiles(angularDir + '/src').filter((file) => /probe/i.test(file));
  expect(probeFiles.length).toBeGreaterThan(0);
  for (const file of probeFiles) expect(file.startsWith(probeDir) || isRegistryFile(file)).toBe(true);

  await gotoFoundation(page);
});
