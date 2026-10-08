import type { ErrorCode } from '../errors';

export type JobState = 'queued' | 'running' | 'paused' | 'completed' | 'cancelled';
export type JobType = 'sample' | 'sample-backend' | 'import' | 'export' | 'analysis' | 'translation';
export interface BackendLock {
  id: string;
  name: string;
  version: string | null;
}
export interface StopReason {
  code: ErrorCode;
  text: string;
}
export interface JobSummary {
  id: string;
  type: JobType;
  labelKey: string;
  novelTitle: string | null;
  state: JobState;
  interrupted: boolean;
  needsAttention: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  current: { label: string; attempt: number } | null;
  backend: BackendLock | null;
  stopReason: StopReason | null;
  queuedAt: string;
  startedAt: string | null;
  etaAt: string | null;
  endedAt: string | null;
}
