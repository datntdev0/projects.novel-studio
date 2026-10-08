import type { NsError } from './errors';

export const FFMPEG_STATES = ['ok', 'missing', 'broken'] as const;

export type FfmpegState = (typeof FFMPEG_STATES)[number];

export interface FfmpegStatus {
  state: FfmpegState;
  version: string | null;
  error: NsError | null;
}

export interface SystemStatus {
  ffmpeg: FfmpegStatus;
}
