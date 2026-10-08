import { isStringFields } from './library';
export interface NovelSummary {
  id: string;
  title: string;
  chapterCount: number;
  lastOpenedAt: string | null;
  lastChapter: number | null;
  coverPath: string | null;
}
export interface LibraryStats {
  novels: number;
  chapters: number;
  sizeBytes: number;
  freeBytes: number;
  integrity: 'ok' | 'warning' | 'unknown';
}
export interface CliStatus {
  name: 'claude' | 'codex';
  state: 'ready' | 'warning' | 'missing' | 'unknown';
  version: string | null;
  problemCode: string | null;
}
export interface Assignments {
  byTaskType: { taskType: string; cli: 'claude' | 'codex' | null }[];
  parallelLimit: number;
}
export interface NovelOpenedRequest {
  novelId: string;
}
export const isNovelOpenedRequest = (value: unknown): value is NovelOpenedRequest => isStringFields(value, ['novelId']);
