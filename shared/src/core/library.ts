import type { NsError } from './errors';

export const LIBRARY_DB_FILE = 'library.sqlite';

export type LibraryState = 'closed' | 'open' | 'failed';

export interface LibraryStatus {
  state: LibraryState;
  root: string | null;
  version: number | null;
  libraryId: string | null;
  error: NsError | null;
}

const MAX_PATH_LENGTH = 1024;
const DB_FILES = [LIBRARY_DB_FILE, `${LIBRARY_DB_FILE}-wal`, `${LIBRARY_DB_FILE}-shm`];
const DEVICE_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const INVALID_SEGMENT_CHARS = /[:<>"|?*]/;

const hasControlChar = (text: string): boolean => [...text].some((char) => char.charCodeAt(0) < 32);

const isInvalidSegment = (segment: string): boolean =>
  segment === '..' || INVALID_SEGMENT_CHARS.test(segment) || DEVICE_NAME.test(segment.split('.', 1)[0]?.trim() ?? '');

export const toLibraryPath = (input: unknown): string | null => {
  if (typeof input !== 'string' || input.length === 0 || input.length > MAX_PATH_LENGTH) return null;
  if (hasControlChar(input) || input.startsWith('/') || input.startsWith('\\')) return null;
  const segments = input.split(/[\\/]/).filter((segment) => segment !== '' && segment !== '.');
  if (segments.length === 0 || segments.some(isInvalidSegment)) return null;
  const path = segments.join('/');
  return DB_FILES.includes(path.toLowerCase()) ? null : path;
};
