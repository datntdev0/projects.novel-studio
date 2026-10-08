import type { NsError } from './errors';

export const BACKEND_STATES = ['starting', 'ready', 'restarting', 'failed', 'stopped'] as const;

export type BackendState = (typeof BACKEND_STATES)[number];

export interface BackendStatus {
  state: BackendState;
  port: number | null;
  pid: number | null;
  restarts: number;
  error: NsError | null;
}
