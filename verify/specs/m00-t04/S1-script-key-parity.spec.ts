import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test, expect } from '../../support/test.ts';
import { repoRoot } from '../../support/paths.ts';

type Tree = Record<string, unknown>;
type Dictionaries = { en: Tree; vi: Tree };
type Outcome = { code: number; stdout: string };

const run = promisify(execFile);
const script = join(repoRoot, 'tools', 'check-i18n-keys.mjs');
const dictionary = (language: string): string => join(repoRoot, 'shared', 'src', 'core', 'i18n', `${language}.json`);
const readText = (language: string): Promise<string> => readFile(dictionary(language), 'utf8');
const readBoth = (): Promise<[string, string]> => Promise.all([readText('en'), readText('vi')]);

const check = async (enText: string, viText: string): Promise<Outcome> => {
  const folder = await mkdtemp(join(tmpdir(), 'ns-i18n-'));
  try {
    const en = join(folder, 'en.json');
    const vi = join(folder, 'vi.json');
    await writeFile(en, enText);
    await writeFile(vi, viText);
    try {
      const { stdout } = await run(process.execPath, [script, en, vi]);
      return { code: 0, stdout };
    } catch (error) {
      const failure = error as { code: number; stdout: string };
      return { code: failure.code, stdout: failure.stdout };
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
};

const checkTrees = async (change: (trees: Dictionaries) => void): Promise<Outcome> => {
  const [enText, viText] = await readBoth();
  const trees = { en: JSON.parse(enText) as Tree, vi: JSON.parse(viText) as Tree };
  change(trees);
  return check(JSON.stringify(trees.en), JSON.stringify(trees.vi));
};

const dev = (tree: Tree): Tree => tree.dev as Tree;
const root = (tree: Tree): Tree => dev(tree).root as Tree;

const swapPluralShapes = ({ en, vi }: Dictionaries): void => {
  root(en).chapters = '{count} chapters';
  root(vi).chapters = { one: '{count} chương', other: '{count} chương' };
};

test('S1 key-parity script reports missing, mistyped and broken dictionaries (AC-18)', async () => {
  const before = await readBoth();

  expect(await check(before[0], before[1])).toEqual({ code: 0, stdout: '' });

  const enOnly = await checkTrees(({ en }) => {
    dev(en).plant = 'x';
  });
  expect(enOnly.code).toBe(1);
  expect(enOnly.stdout).toContain('vi.json · dev.plant · missing (present in en.json)');

  const viOnly = await checkTrees(({ vi }) => {
    dev(vi).plant = 'x';
  });
  expect(viOnly.code).toBe(1);
  expect(viOnly.stdout).toContain('en.json · dev.plant · missing (present in vi.json)');

  const nested = await checkTrees(({ vi }) => {
    delete root(vi).date;
  });
  expect(nested.code).toBe(1);
  expect(nested.stdout).toContain('vi.json · dev.root.date · missing (present in en.json)');

  const plural = await checkTrees(swapPluralShapes);
  expect(plural).toEqual({ code: 0, stdout: '' });

  const notString = await checkTrees(({ vi }) => {
    root(vi).date = 42;
  });
  expect(notString.code).toBe(1);
  expect(notString.stdout).toContain('vi.json · dev.root.date · not a string');

  const invalid = await check(before[0], '{oops');
  expect(invalid.code).toBe(1);
  expect(invalid.stdout).toMatch(/vi\.json · · \S/);

  expect(await readBoth()).toEqual(before);
});
