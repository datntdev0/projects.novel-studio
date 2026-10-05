export const ERROR_CODES = [
  'INTERNAL',
  'IPC_INVALID_REQUEST',
  'IPC_UNKNOWN_CHANNEL',
  'APP_DIR_NOT_WRITABLE',
  'LIBRARY_NOT_OPEN',
  'LIBRARY_PATH_OUTSIDE',
  'LIBRARY_NEWER_VERSION',
  'LIBRARY_MIGRATION_FAILED',
  'BACKEND_FAILED',
  'BACKEND_UNAUTHORIZED',
  'FFMPEG_MISSING',
  'FFMPEG_BROKEN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface NsError {
  code: ErrorCode;
  message: string;
  detail?: string;
}
export type IpcResult<T> = { ok: true; value: T } | { ok: false; error: NsError };

export const nsError = (code: ErrorCode, message: string, detail?: string): NsError => ({ code, message, detail });

export const isNsError = (value: unknown): value is NsError =>
  typeof value === 'object' &&
  value !== null &&
  (ERROR_CODES as readonly unknown[]).includes((value as NsError).code) &&
  typeof (value as NsError).message === 'string';
