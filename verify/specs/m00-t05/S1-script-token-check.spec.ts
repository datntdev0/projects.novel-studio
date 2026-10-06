import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '../../support/test.ts';
import { repoRoot } from '../../support/paths.ts';
import { printTokens, runCheckTokens, withTempFolder, type CheckOutcome, type Theme, type TokenTables } from '../../support/theme.ts';

type Actual = Record<Theme, Record<string, string>>;

const mockupFile = join(repoRoot, '.claude', 'mockups', 'styles.css');
const lightRule = /^:root\[data-theme="light"\] \{/m;

const expand = (tables: TokenTables, theme: Theme): Record<string, string> => {
  const merged = { ...tables.root, ...tables[theme] };
  return { ...merged, '--gl': '4px', '--gr': '4px', '--gb': '4px' };
};

const expandAll = (tables: TokenTables): Actual => ({ dark: expand(tables, 'dark'), light: expand(tables, 'light') });

const compare = (text: string, mockup?: string): Promise<CheckOutcome> =>
  withTempFolder(async (folder) => {
    const actual = join(folder, 'actual.json');
    await writeFile(actual, text);
    if (!mockup) return runCheckTokens([actual]);
    const copy = join(folder, 'mockup.css');
    await writeFile(copy, mockup);
    return runCheckTokens([actual, copy]);
  });

const compareActual = (change: (actual: Actual) => void, tables: TokenTables): Promise<CheckOutcome> => {
  const actual = expandAll(tables);
  change(actual);
  return compare(JSON.stringify(actual));
};

const expectFinding = (outcome: CheckOutcome, line: string): void => {
  expect(outcome.code).toBe(1);
  expect(outcome.stdout).toContain(line);
};

test('S1 token-check script prints the mockup tables and detects real differences (AC-14)', async () => {
  const tables = await printTokens();
  for (const table of [tables.root, tables.dark, tables.light]) expect(Object.keys(table).length).toBeGreaterThan(0);
  expect(tables.dark['--color-background']).toBe('#101211');
  expect(tables.light['--color-background']).toBe('#ffffff');
  expect(tables.root['--gl']).toBe('var(--gutter)');

  expect(await compare(JSON.stringify(expandAll(tables)))).toEqual({ code: 0, stdout: '' });

  const darker = await compareActual((actual) => (actual.dark['--color-background'] = '#000000'), tables);
  expectFinding(darker, 'dark · --color-background · differs (app #000000 · mockup #101211)');

  const nearby = await compareActual((actual) => (actual.dark['--color-background'] = '#101212'), tables);
  expectFinding(nearby, 'dark · --color-background · differs (app #101212 · mockup #101211)');

  const missing = await compareActual((actual) => delete actual.light['--scrim'], tables);
  expectFinding(missing, 'light · --scrim · missing');

  const empty = await compareActual((actual) => (actual.light['--scrim'] = ''), tables);
  expectFinding(empty, 'light · --scrim · missing');

  const formatting = await compareActual((actual) => {
    actual.dark['--scrim'] = 'rgba( 0, 0, 0, .62 )';
    actual.dark['--font-serif'] = tables.root['--font-serif']?.replaceAll('"', "'") ?? '';
  }, tables);
  expect(formatting).toEqual({ code: 0, stdout: '' });

  const invalid = await compare('{oops');
  expect(invalid.code).toBe(1);
  expect(invalid.stdout).toMatch(/actual\.json · · \S/);

  const mockup = await readFile(mockupFile, 'utf8');
  expect(mockup).toMatch(lightRule);
  const noLight = await compare(JSON.stringify(expandAll(tables)), mockup.replace(lightRule, ':root[data-theme="none"] {'));
  expect(noLight.code).toBe(1);
  expect(noLight.stdout).toMatch(/mockup\.css · · \S/);
  expect(noLight.stdout.trim().split('\n')).toHaveLength(1);
});
