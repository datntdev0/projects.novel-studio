import { SHELL_MOCKUP_SETS, type JobSummary } from '@shared/core';
import { emitEvent } from '../events';

const TICK_MS = 1000;

const jobs: JobSummary[] = SHELL_MOCKUP_SETS.busy.jobs.map((job) => ({ ...job }));
let timer: NodeJS.Timeout | null = null;

export const listMockupJobs = (): JobSummary[] => jobs.map((job) => ({ ...job }));

function tick(): void {
  const running = jobs.find((job) => job.state === 'running');
  if (!running) {
    stopJobProgressTicker();
    return;
  }
  running.completedCount += 1;
  if (running.completedCount >= running.totalCount) {
    running.state = 'completed';
    running.current = null;
    running.etaAt = null;
    running.endedAt = new Date().toISOString();
  } else running.current = { label: `Chapter ${running.completedCount + 1}`, attempt: 1 };
  emitEvent('job:progress', { ...running });
}

export function startJobProgressTicker(): void {
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
}

export function stopJobProgressTicker(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
