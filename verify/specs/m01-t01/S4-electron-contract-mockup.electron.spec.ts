import { test, expect } from '../../support/electron.ts';
import { invokeSettings } from '../../support/settings-bridge.ts';

type Item = Record<string, unknown>;

const invalid = { ok: false, error: { code: 'IPC_INVALID_REQUEST', message: expect.any(String) } };

type ProgressPayload = { id: string; completedCount: number };

const nextProgress = (window: Parameters<typeof invokeSettings>[0]): Promise<ProgressPayload> =>
  window.evaluate(
    () =>
      new Promise<ProgressPayload>((resolve) => {
        const api = (
          globalThis as unknown as { dreamerStudio: { on(event: string, handler: (payload: ProgressPayload) => void): () => void } }
        ).dreamerStudio;
        const off = api.on('job:progress', (payload) => {
          off();
          resolve(payload);
        });
      }),
  );

const runningCount = async (window: Parameters<typeof invokeSettings>[0]): Promise<number> => {
  const jobs = (await value(window, 'job:list')) as Item[];
  return jobs.find((job) => job.id === 'job-running')?.completedCount as number;
};

const value = async (window: Parameters<typeof invokeSettings>[0], channel: string, req: unknown = null): Promise<unknown> => {
  const result = await invokeSettings(window, channel, req);
  expect(result.ok).toBe(true);
  return result.value;
};

test('S4 main answers the six shell channels with the busy mockup through the contract (AC-60)', async ({ window }) => {
  await expect(window.getByTestId('app-shell')).toBeVisible();

  const novels = (await value(window, 'library:listNovels')) as Item[];
  expect(novels).toHaveLength(7);
  expect(novels[0]).toMatchObject({ id: 'novel-1', title: '斗破苍穹', chapterCount: 1648 });
  expect(novels.map((novel) => novel.title)).toContain('Đấu Phá Thương Khung');

  expect(await value(window, 'data:libraryStats')).toMatchObject({ novels: 7, chapters: 9604, integrity: 'ok' });
  const clis = (await value(window, 'services:detect')) as Item[];
  expect(clis.map((cli) => cli.name)).toEqual(['claude', 'codex']);
  expect(await value(window, 'settings:assignments')).toMatchObject({ parallelLimit: 1 });
  const jobs = (await value(window, 'job:list')) as Item[];
  expect(jobs.map((job) => job.id)).toEqual(['job-running', 'job-interrupted', 'job-failed-items']);

  const before = await runningCount(window);
  const progress = await nextProgress(window);
  expect(progress.id).toBe('job-running');
  expect(progress.completedCount).toBeGreaterThan(before);
  await expect.poll(() => runningCount(window)).toBeGreaterThan(before);

  expect(await value(window, 'library:markNovelOpened', { novelId: 'novel-5' })).toBeNull();
  const reordered = (await value(window, 'library:listNovels')) as Item[];
  expect(reordered[0]).toMatchObject({ id: 'novel-5' });
  expect(reordered[0]?.lastOpenedAt).toEqual(expect.any(String));

  expect(await invokeSettings(window, 'library:listNovels', { x: 1 })).toEqual(invalid);
  expect(await invokeSettings(window, 'library:markNovelOpened', { novelId: 5 })).toEqual(invalid);
  expect(await invokeSettings(window, 'job:list', 'x')).toEqual(invalid);
});
