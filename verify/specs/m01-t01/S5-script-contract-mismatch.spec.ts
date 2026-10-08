import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { test, expect } from '../../support/test.ts';
import { repoRoot } from '../../support/paths.ts';

const run = promisify(execFile);
const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const IPC_CONTRACT = join('shared', 'src', 'core', 'ipc-contract.ts');
const MAIN_HANDLERS = join('electron', 'src', 'main', 'mockup', 'shell-mockup-handlers.ts');
const MOCKUP_SET = join('shared', 'src', 'core', 'mockup', 'shell-mockup.ts');

const copyInputs = async (folder: string): Promise<void> => {
  await cp(join(repoRoot, 'shared', 'src'), join(folder, 'shared', 'src'), { recursive: true });
  await cp(join(repoRoot, 'electron', 'src'), join(folder, 'electron', 'src'), { recursive: true });
  await cp(join(repoRoot, 'tsconfig.base.json'), join(folder, 'tsconfig.base.json'));
  await cp(join(repoRoot, 'electron', 'tsconfig.json'), join(folder, 'electron', 'tsconfig.json'));
  await symlink(join(repoRoot, 'node_modules'), join(folder, 'node_modules'), 'junction');
  await symlink(join(repoRoot, 'electron', 'node_modules'), join(folder, 'electron', 'node_modules'), 'junction');
};

const typecheck = async (folder: string): Promise<number> => {
  try {
    await run(process.execPath, [tsc, '--noEmit', '-p', join(folder, 'electron')]);
    return 0;
  } catch (error) {
    return (error as { code: number }).code;
  }
};

const removeText = async (folder: string, file: string, text: string): Promise<void> => {
  const path = join(folder, file);
  const content = await readFile(path, 'utf8');
  expect(content).toContain(text);
  await writeFile(path, content.replace(text, ''));
};

const mismatches: [string, string][] = [
  [IPC_CONTRACT, "  'job:list': true,\n"],
  [MAIN_HANDLERS, "  'job:list': { validate: isNull, handle: listMockupJobs },\n"],
  [MOCKUP_SET, ', jobs: []'],
];

test('S5 build fails when a contract key is missing from channels, main handlers or a mockup set (AC-60)', async () => {
  test.setTimeout(180_000);
  const folder = await mkdtemp(join(tmpdir(), 'ns-contract-'));
  try {
    await copyInputs(folder);
    expect(await typecheck(folder)).toBe(0);

    for (const [file, text] of mismatches) {
      const original = await readFile(join(folder, file), 'utf8');
      await removeText(folder, file, text);
      expect(await typecheck(folder)).not.toBe(0);
      await writeFile(join(folder, file), original);
      expect(await typecheck(folder)).toBe(0);
    }
  } finally {
    await unlink(join(folder, 'node_modules')).catch(() => undefined);
    await unlink(join(folder, 'electron', 'node_modules')).catch(() => undefined);
    await rm(folder, { recursive: true, force: true });
  }
});
