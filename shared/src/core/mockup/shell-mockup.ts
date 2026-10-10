import type { LibraryStatus } from '../library';
import type { JobSummary } from '../jobs/job-contract';
import type { Assignments, CliStatus, LibraryStats, NovelSummary } from '../shell-contract';

export const SHELL_FIXTURES = ['none', 'empty', 'busy', 'first-run'] as const;
export type ShellFixture = (typeof SHELL_FIXTURES)[number];
export const DEFAULT_SHELL_FIXTURE: ShellFixture = 'none';

export interface ShellMockupSet {
  libraryStatus: LibraryStatus;
  novels: NovelSummary[];
  stats: LibraryStats;
  clis: CliStatus[];
  assignments: Assignments;
  jobs: JobSummary[];
}

const novel = (id: string, title: string, chapterCount: number, lastOpenedAt: string | null, lastChapter: number | null): NovelSummary => ({
  id,
  title,
  chapterCount,
  lastOpenedAt,
  lastChapter,
  coverPath: null,
});

const NOVELS: NovelSummary[] = [
  novel('novel-1', '斗破苍穹', 1648, null, null),
  novel('novel-2', '凡人修仙传', 2446, null, null),
  novel('novel-3', 'Đấu Phá Thương Khung', 1648, null, null),
  novel('novel-4', 'Tiên Nghịch', 2088, null, null),
  novel('novel-5', '诡秘之主', 1432, null, null),
  novel('novel-6', 'The Wandering Inn', 312, null, null),
  novel('novel-7', 'Lord of the Mysteries', 1432, null, null),
];

const RECENT_NOVELS: NovelSummary[] = [
  novel('novel-1', '斗破苍穹', 1648, '2026-10-08T08:30:00.000Z', 37),
  novel('novel-2', '凡人修仙传', 2446, '2026-10-07T21:10:00.000Z', 812),
  novel('novel-3', 'Đấu Phá Thương Khung', 1648, '2026-10-06T14:00:00.000Z', 120),
  ...NOVELS.slice(3),
];

const OPEN_LIBRARY: LibraryStatus = {
  state: 'open',
  root: 'C:\\DreamerStudio\\Library',
  version: 1,
  libraryId: 'mockup-library',
  error: null,
};
export const CLOSED_LIBRARY: LibraryStatus = { state: 'closed', root: null, version: null, libraryId: null, error: null };

const FREE_BYTES = 96_636_764_160;
const STATS: LibraryStats = { novels: NOVELS.length, chapters: 9604, sizeBytes: 482_344_960, freeBytes: FREE_BYTES, integrity: 'ok' };
const EMPTY_STATS: LibraryStats = { novels: 0, chapters: 0, sizeBytes: 0, freeBytes: FREE_BYTES, integrity: 'ok' };

const CLIS: CliStatus[] = [
  { name: 'claude', state: 'ready', version: '2.1.288', problemCode: null },
  { name: 'codex', state: 'warning', version: '0.160.0', problemCode: 'BACKEND_UNAUTHORIZED' },
];

const ASSIGNMENTS: Assignments = {
  byTaskType: [
    { taskType: 'translation', cli: 'codex' },
    { taskType: 'analysis', cli: 'claude' },
  ],
  parallelLimit: 1,
};

const job = (id: string, labelKey: string, novelTitle: string, fields: Partial<JobSummary>): JobSummary => ({
  id,
  type: 'translation',
  labelKey,
  novelTitle,
  state: 'completed',
  interrupted: false,
  needsAttention: false,
  completedCount: 0,
  failedCount: 0,
  totalCount: 100,
  current: null,
  backend: { id: 'codex', name: 'codex', version: '0.160.0' },
  stopReason: null,
  queuedAt: '2026-10-08T08:00:00.000Z',
  startedAt: '2026-10-08T08:00:05.000Z',
  etaAt: null,
  endedAt: null,
  ...fields,
});

const BUSY_JOBS: JobSummary[] = [
  job('job-running', 'job.translation', '斗破苍穹', {
    state: 'running',
    completedCount: 37,
    current: { label: 'Chapter 38', attempt: 1 },
    etaAt: '2026-10-08T09:00:00.000Z',
  }),
  job('job-interrupted', 'job.translation', 'Đấu Phá Thương Khung', {
    state: 'paused',
    interrupted: true,
    needsAttention: true,
    completedCount: 12,
    stopReason: { code: 'INTERNAL', text: 'The app closed while the job was running' },
  }),
  job('job-failed-items', 'job.analysis', '凡人修仙传', {
    type: 'analysis',
    needsAttention: true,
    completedCount: 94,
    failedCount: 6,
    backend: { id: 'claude', name: 'claude', version: '2.1.288' },
    endedAt: '2026-10-07T22:00:00.000Z',
  }),
];

const NONE: ShellMockupSet = { libraryStatus: OPEN_LIBRARY, novels: NOVELS, stats: STATS, clis: CLIS, assignments: ASSIGNMENTS, jobs: [] };

export const SHELL_MOCKUP_SETS: { [F in ShellFixture]: ShellMockupSet } = {
  none: NONE,
  empty: { ...NONE, novels: [], stats: EMPTY_STATS },
  busy: { ...NONE, novels: RECENT_NOVELS, jobs: BUSY_JOBS },
  'first-run': { ...NONE, libraryStatus: CLOSED_LIBRARY },
};

export const markOpened = (novels: NovelSummary[], novelId: string): NovelSummary[] => {
  const opened = novels.find((novel) => novel.id === novelId);
  if (!opened) return novels;
  return [{ ...opened, lastOpenedAt: new Date().toISOString() }, ...novels.filter((novel) => novel !== opened)];
};
