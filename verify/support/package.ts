import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appDir, repoRoot } from './paths.ts';

export interface PackageInfo {
  zipPath: string;
  extractedDir: string;
  output: string;
  sizeLines: string[];
}

export const packageDir = join(repoRoot, 'dist', 'package');
export const systemRoot = process.env.SystemRoot ?? 'C:\\Windows';
export const tarPath = join(systemRoot, 'System32', 'tar.exe');
const outputLogPath = join(repoRoot, 'dist', 'package-output.log');
const mainBundlePath = join(appDir, 'main.cjs');

const mtime = (path: string): number => (existsSync(path) ? statSync(path).mtimeMs : 0);

const findZip = async (): Promise<string | null> => {
  const names = existsSync(packageDir) ? await readdir(packageDir) : [];
  const zips = names.filter((name) => name.endsWith('.zip'));
  return zips.length === 1 ? join(packageDir, zips[0]!) : null;
};

const isFresh = (zipPath: string | null): boolean =>
  zipPath !== null && existsSync(outputLogPath) && mtime(zipPath) >= mtime(mainBundlePath) && mtime(outputLogPath) >= mtime(zipPath);

async function runPackage(): Promise<string> {
  const result = spawnSync('pnpm package', {
    cwd: repoRoot,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) throw new Error(`pnpm package failed with exit code ${result.status}\n${output.slice(-4000)}`);
  await writeFile(outputLogPath, output, 'utf8');
  return output;
}

export const listZip = (zipPath: string): string[] =>
  spawnSync(tarPath, ['-tf', zipPath], { encoding: 'utf8', windowsHide: true })
    .stdout.split(/\r?\n/)
    .map((line) => line.trim().replace(/\/$/, ''))
    .filter((line) => line.length > 0);

async function extractOnce(zipPath: string): Promise<string> {
  const targetName = `ns-package-${Math.floor(mtime(zipPath))}`;
  const target = join(tmpdir(), targetName);
  for (const name of await readdir(tmpdir())) {
    if (name.startsWith('ns-package-') && name !== targetName)
      await rm(join(tmpdir(), name), { recursive: true, force: true, maxRetries: 5 });
  }
  if (existsSync(join(target, 'dreamer-studio.exe'))) return target;
  const partial = `${target}.partial`;
  await rm(partial, { recursive: true, force: true });
  await mkdir(partial, { recursive: true });
  const result = spawnSync(tarPath, ['-xf', zipPath], { cwd: partial, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`tar extract failed: ${result.stderr}`);
  await rm(target, { recursive: true, force: true });
  await rename(partial, target);
  return target;
}

export async function ensurePackage(): Promise<PackageInfo> {
  let zipPath = await findZip();
  const output = isFresh(zipPath) ? await readFile(outputLogPath, 'utf8') : await runPackage();
  zipPath = await findZip();
  if (!zipPath) throw new Error(`expected exactly one zip in ${packageDir}`);
  const sizeLines = output.split(/\r?\n/).filter((line) => /^size (zip|backend|ffmpeg) /.test(line));
  return { zipPath, extractedDir: await extractOnce(zipPath), output, sizeLines };
}
