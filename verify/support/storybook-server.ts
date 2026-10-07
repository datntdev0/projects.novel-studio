import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startBackgroundProcess, stopBackgroundProcess } from './background-process.ts';
import { repoRoot } from './paths.ts';

export const storybookUrl = 'http://127.0.0.1:4320';
const name = 'storybook-server';
const storybookDir = join(repoRoot, 'dist', 'storybook');

export const buildStorybook = (): Promise<void> =>
  new Promise((resolve, reject) => {
    let tail = '';
    const child = spawn('pnpm build-storybook', { cwd: repoRoot, shell: true });
    const collect = (chunk: Buffer): void => {
      tail = `${tail}${chunk}`.slice(-2000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`build-storybook failed with code ${code}
${tail}`),
          ),
    );
  });

export const stopStorybookServer = (): void => stopBackgroundProcess(name);

export async function startStorybookServer(): Promise<void> {
  const script = fileURLToPath(new URL('./static-server.ts', import.meta.url));
  const args = [storybookDir, new URL(storybookUrl).port];
  await startBackgroundProcess({ name, url: storybookUrl, script, args, cwd: repoRoot, startTimeoutMs: 30_000 });
}
