import { SHELL_MOCKUP_SETS, isNovelOpenedRequest, markOpened, type NovelOpenedRequest, type NovelSummary } from '@shared/core';
import type { Handlers } from '../ipc';
import { listMockupJobs } from './job-progress-ticker';

type ShellChannel =
  'library:listNovels' | 'library:markNovelOpened' | 'data:libraryStats' | 'services:detect' | 'settings:assignments' | 'job:list';

const { novels: BUSY_NOVELS, stats, clis, assignments } = SHELL_MOCKUP_SETS.busy;
let novels: NovelSummary[] = BUSY_NOVELS.map((novel) => ({ ...novel }));

const isNull = (req: unknown): boolean => req === null;

function markNovelOpened({ novelId }: NovelOpenedRequest): null {
  novels = markOpened(novels, novelId);
  return null;
}

export const SHELL_MOCKUP_HANDLERS: { [C in ShellChannel]: Handlers[C] } = {
  'library:listNovels': { validate: isNull, handle: () => novels.map((novel) => ({ ...novel })) },
  'library:markNovelOpened': { validate: isNovelOpenedRequest, handle: markNovelOpened },
  'data:libraryStats': { validate: isNull, handle: () => ({ ...stats }) },
  'services:detect': { validate: isNull, handle: () => clis.map((cli) => ({ ...cli })) },
  'settings:assignments': { validate: isNull, handle: () => structuredClone(assignments) },
  'job:list': { validate: isNull, handle: listMockupJobs },
};
